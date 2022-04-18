import { ActionTree } from 'vuex';
import { RootState, ChatState } from '../index';
import { log, utils } from '@/const';
import Vue from 'vue';
import { MessageCreatedEvent } from 'blockchat-contract-sdk';
import { Recipient, SendMessage, SendMessageStatus } from '.';
import { BigNumber, BigNumberish, ContractReceipt, ContractTransaction } from 'ethers';

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
  },

  async setRecipient({ state, rootState, dispatch }, recipientText: string) {
    if (!state.async.recipientMap[recipientText]) {
      Vue.set(state.async.recipientMap, recipientText, {});
      const recipientHash = rootState.app.sync.ether.getBlockChat().recipientHash(recipientText);
      await dispatch('app/setAvatar', recipientHash.toString(), { root: true });
      const messageIdLength = await rootState.app.sync.ether.getBlockChat().getRecipientMessageListLength(recipientHash);
      const recipient: Recipient = {
        messageIdLength: messageIdLength,
        messageIdList: [],
        recipientHash: recipientHash.toString(),
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
    if (state.async.recipientMap[recipientText].messageIdLength.toNumber() > state.async.recipientMap[recipientText].messageIdList.length) {
      if (callback) {
        callback();
      }
      const recipient = state.async.recipientMap[recipientText];
      let start = recipient.messageIdLength.toNumber() - recipient.messageIdList.length;
      let length = rootState.app.storage.messageLimit;
      if (start < length) {
        length = start;
        start = 0;
      } else {
        start -= length;
      }
      if (length != 0) {
        const recipientMessageIdList = await rootState.app.sync.ether
          .getBlockChat()
          .batchRecipientMessageId(state.async.recipientMap[recipientText].recipientHash, start, length);
        recipient.messageIdList.push(...recipientMessageIdList);
        dispatch('setMessage', recipient.messageIdList);
      }
    }
  },

  async setMessage({ state, rootState, dispatch }, messageIdList: Array<BigNumberish>) {
    const getMessageIdList: Array<BigNumberish> = [];
    messageIdList.forEach(async (messageId: BigNumberish) => {
      if (!state.async.messageMap[messageId.toString()]) {
        getMessageIdList.push(messageId);
        Vue.set(state.async.messageMap, messageId.toString(), {});
      }
    });
    if (getMessageIdList.length != 0) {
      const messageList = await rootState.app.sync.ether.getBlockChat().batchMessage(getMessageIdList);
      for (let i = 0; i < messageList.length; i++) {
        Vue.set(state.async.messageMap, getMessageIdList[i].toString(), messageList[i]);
        await dispatch('app/setAvatar', messageList[i].sender, { root: true });
        await dispatch('app/setUSD_Value', messageList[i].sender, { root: true });
      }
    }
  },

  async sendMessage({ state, rootState }, content) {
    const recipientText = rootState.app.storage.activeRecipientText;
    const sendMessage: SendMessage = {
      status: SendMessageStatus.prePending,
      sender: rootState.app.sync.userAddress,
      recipient: state.async.recipientMap[recipientText].recipientHash,
      content,
      createDate: BigNumber.from(new Date().getTime()).div(1000),
    };
    const index = state.async.recipientMap[recipientText].sendMessageList.length;
    state.async.recipientMap[recipientText].sendMessageList.push(sendMessage);
    try {
      const message = await rootState.app.sync.ether
        .getBlockChat()
        .createMessage(sendMessage.recipient, sendMessage.content, {}, (transaction: ContractTransaction | ContractReceipt) => {
          if ('hash' in transaction) {
            Vue.set(state.async.recipientMap[recipientText].sendMessageList[index], 'hash', transaction.hash);
            Vue.set(state.async.recipientMap[recipientText].sendMessageList[index], 'status', SendMessageStatus.pending);
          } else {
            Vue.set(state.async.recipientMap[recipientText].sendMessageList[index], 'status', SendMessageStatus.success);
          }
        });
      Vue.set(state.async.recipientMap[recipientText].sendMessageList[index], 'messageId', message.messageId);
    } catch (error) {
      Vue.set(state.async.recipientMap[recipientText].sendMessageList[index], 'status', SendMessageStatus.error);
      throw error;
    }
  },

  async listenMessage({ state, rootState }) {
    rootState.app.sync.ether.getBlockChat().listenMessage(async (event: MessageCreatedEvent) => {
      try {
        const recipientTextList = Object.keys(state.async.recipientMap);
        for (let i = 0; i < recipientTextList.length; i++) {
          if (state.async.recipientMap[recipientTextList[i]].recipientHash == event.recipient.toString()) {
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
