import { ActionTree } from 'vuex';
import { RootState, ChatState } from '../index';
import { log, utils } from '@/const';
import Vue from 'vue';
import { BlockChatUpgrade2Model } from 'blockchat-contract-sdk';
import { Recipient, SendMessage, SendMessageStatus } from '.';
import { ContractReceipt, ContractTransaction } from 'ethers';

const actions: ActionTree<ChatState, RootState> = {
  async start({ dispatch }) {
    try {
      await dispatch('setSync');
      await dispatch('watchAsync');
      log('chat message start success!');
    } catch (err) {
      log(err);
    }
  },

  async setSync({ dispatch }) {
    await dispatch('listenMessage');
  },

  async watchAsync({ rootState, dispatch }) {
    rootState.app.storage.recipientTextList.forEach(async (recipientText: string) => {
      try {
        await dispatch('setRecipient', recipientText);
      } catch (err) {
        log(err);
      }
    });
    if (rootState.app.storage.recipientTextList.indexOf(rootState.app.sync.userAddress) == -1) {
      rootState.app.storage.recipientTextList.push(rootState.app.sync.userAddress);
      await dispatch('setRecipient', rootState.app.sync.userAddress);
    }
  },

  async setRecipient({ state, rootState, dispatch }, recipientText: string) {
    if (!state.async.recipientMap[recipientText]) {
      Vue.set(state.async.recipientMap, recipientText, {});
      let recipientHash;
      if(utils.ethers.isAddress(recipientText)){
        recipientHash = recipientText.toLowerCase();
      }else{
        recipientHash = rootState.app.sync.ether.blockchat.recipientHash(recipientText).toString();
      }
      await dispatch('app/setAvatar', recipientHash, { root: true });
      const messageIdLength = await rootState.app.sync.ether.blockchat.getRecipientMessageListLength(recipientHash);
      const recipient: Recipient = {
        messageIdLength: messageIdLength,
        messageIdList: [],
        recipientHash: recipientHash,
        readIndex: 0,
        sendMessageList: [],
      };
      Vue.set(state.async.recipientMap, recipientText, recipient);
      await dispatch('getMessage', [recipientText]);
    }
  },

  async getMessage({ state, rootState, dispatch }, [recipientText, callback]) {
    if (!recipientText) {
      recipientText = rootState.app.storage.activeRecipientText;
    }
    if (state.async.recipientMap[recipientText].messageIdLength > state.async.recipientMap[recipientText].messageIdList.length) {
      if (callback) {
        callback();
      }
      const recipient = state.async.recipientMap[recipientText];
      let start = recipient.messageIdLength - recipient.messageIdList.length;
      let length = rootState.app.storage.messageLimit;
      if (start < length) {
        length = start;
        start = 0;
      } else {
        start -= length;
      }
      if (length != 0) {
        const recipientMessageIdList = await rootState.app.sync.ether.blockchat.batchRecipientMessageId(
          state.async.recipientMap[recipientText].recipientHash,
          start,
          length
        );
        recipient.messageIdList.push(...recipientMessageIdList);
        dispatch('setMessage', recipient.messageIdList);
      }
    }
  },

  async setMessage({ state, rootState, dispatch }, messageIdList: Array<number>) {
    const getMessageIdList: Array<number> = [];
    messageIdList.forEach(async (messageId: number) => {
      if (!utils.have.value(state.async.messageMap[messageId])) {
        getMessageIdList.push(messageId);
        Vue.set(state.async.messageMap, messageId.toString(), {});
      }
    });
    if (getMessageIdList.length != 0) {
      const messageList = await rootState.app.sync.ether.blockchat.batchMessage(getMessageIdList);
      messageList.forEach(async (message, index) => {
        Vue.set(state.async.messageMap, getMessageIdList[index].toString(), message);
        const messageCreatedEvent = await rootState.app.sync.ether.blockchat.getMessage(
          getMessageIdList[index],
          message.createBlock,
          message.createBlock
        );
        Vue.set(state.async.messageCreatedEventMap, getMessageIdList[index].toString(), messageCreatedEvent[0]);
        await dispatch('app/setAvatar', messageCreatedEvent[0].sender, { root: true });
        await dispatch('app/setUSD_Value', messageCreatedEvent[0].sender, { root: true });
      });
    }
  },

  async sendMessage({ state, rootState }, content) {
    const recipientText = rootState.app.storage.activeRecipientText;
    const sendMessage: SendMessage = {
      sender: rootState.app.sync.userAddress,
      messageId: 0,
      status: SendMessageStatus.prePending,
      recipientList: [state.async.recipientMap[recipientText].recipientHash],
      content,
      createDate: Number((new Date().getTime() / 1000).toFixed(0)),
    };
    const index = state.async.recipientMap[recipientText].sendMessageList.length;
    state.async.recipientMap[recipientText].sendMessageList.push(sendMessage);
    try {
      const message = await rootState.app.sync.ether.blockchat.createMessage(
        sendMessage.recipientList,
        sendMessage.content,
        {},
        (transaction: ContractTransaction | ContractReceipt) => {
          if ('hash' in transaction) {
            Vue.set(state.async.recipientMap[recipientText].sendMessageList[index], 'hash', transaction.hash);
            Vue.set(state.async.recipientMap[recipientText].sendMessageList[index], 'status', SendMessageStatus.pending);
          } else {
            Vue.set(state.async.recipientMap[recipientText].sendMessageList[index], 'status', SendMessageStatus.success);
          }
        }
      );
      Vue.set(state.async.recipientMap[recipientText].sendMessageList[index], 'messageId', message.messageId);
    } catch (error) {
      Vue.set(state.async.recipientMap[recipientText].sendMessageList[index], 'status', SendMessageStatus.error);
      throw error;
    }
  },

  async listenMessage({ state, rootState }) {
    rootState.app.sync.ether.blockchat.listenMessage(async (event: BlockChatUpgrade2Model.MessageCreatedEvent) => {
      try {
        const recipientTextList = Object.keys(state.async.recipientMap);
        for (let i = 0; i < recipientTextList.length; i++) {
          if (state.async.recipientMap[recipientTextList[i]].recipientHash == event.recipientList.toString()) {
            state.async.recipientMap[recipientTextList[i]].messageIdList.push(event.messageId);
            break;
          }
        }
      } catch (err) {
        log(err);
      }
    });
  },

  async deleteRecipient({ state, rootState, dispatch }, recipientText: string) {
    const index = rootState.app.storage.recipientTextList.indexOf(recipientText);
    if (index != -1) {
      if (rootState.app.storage.activeRecipientText == recipientText) {
        if (rootState.app.storage.recipientTextList.length > 1) {
          await dispatch('setActiveRecipient', rootState.app.storage.recipientTextList[index == 0 ? index + 1 : index - 1]);
        } else {
          throw new Error('must have one recipient');
        }
      }
      rootState.app.storage.recipientTextList.splice(index, 1);
      Vue.set(state.async.recipientMap, recipientText, {});
      delete state.async.recipientMap[recipientText];
      Vue.set(state.async, 'recipientMap', state.async.recipientMap);
    }
  },

  async setActiveRecipient({ state, rootState, dispatch }, recipientText: string) {
    if (Object.keys(state.async.recipientMap).indexOf(recipientText) == -1) {
      if (rootState.app.storage.recipientTextList.indexOf(recipientText) == -1) {
        rootState.app.storage.recipientTextList.push(recipientText);
      }
      await dispatch('setRecipient', recipientText);
    }
    rootState.app.storage.activeRecipientText = recipientText;
  },
};

export default actions;
