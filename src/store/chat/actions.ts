import { ActionTree } from 'vuex';
import { RootState, ChatState } from '../index';
import { common, log } from '@/const';
import Vue from 'vue';
import { MessageCreatedEvent } from 'blockchat-contract-sdk';
import { MessageMap, Recipient, RecipientMap } from '.';
import { BigNumberish, BytesLike } from 'ethers';

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

  async setSync({ state, dispatch }) {
    state.sync.activeRecipientHash = common.etherAddress;
    await dispatch('listenChatMessage');
  },


  async watchAsync({ rootState, dispatch }) {
    rootState.app.storage.recipientHashList.forEach(async (recipientHash: string) => {
      try {
        await dispatch('setRecipient', recipientHash);
      } catch (err) {
        log(err);
      }
    });
  },

  async setRecipient({ state, rootState, dispatch }, recipientHash: string) {
    if (!state.async.recipientMap[recipientHash]) {
      Vue.set(state.async.recipientMap, recipientHash, {});
      const messageLength = await rootState.app.sync.ether.getBlockChat().getRecipientMessageListLength(recipientHash);
      const fullRecipient: Recipient = {
        messageLength: messageLength,
        messageIdList: [],
        readIndex: 0,
        sendMessageIdList: [],
      };
      Vue.set(state.async.recipientMap[recipientHash], 'value', fullRecipient);
      await dispatch('getMessage', recipientHash);
    }
  },

  async getMessage({ state, rootState, dispatch }, recipientHash: string) {
    const recipient = state.async.recipientMap[recipientHash].value;
    let getIndex = recipient.messageLength.toNumber() - recipient.messageIdList.length;
    let getLength = rootState.app.storage.messageLimit;
    if (getIndex < getLength) {
      getLength = getIndex;
      getIndex = 0;
    } else {
      getIndex -= getLength;
    }
    if (getLength != 0) {
      const messageIds = await rootState.app.sync.ether
        .getBlockChat()
        .batchRecipientMessageId(recipientHash, getIndex, getLength);
      recipient.messageIdList.push(
        ...messageIds
      );
      dispatch('setChatMessage', recipient.messageIdList);
    }
  },

  async setMessage({ state, rootState, dispatch }, messageIdList: Array<BigNumberish>) {
    try {
      const getMessageIdList: Array<BigNumberish> = []
      messageIdList.forEach(async (messageId: BigNumberish) => {
        if (!state.async.messageMap[messageId.toString()]) {
          getMessageIdList.push(messageId)
          Vue.set(state.async.messageMap, messageId.toString(), {});
        }
      })
      if (getMessageIdList.length != 0) {
        const messageList = await rootState.app.sync.ether.getBlockChat().batchMessage(getMessageIdList);
        for (let i = 0; i < messageList.length; i++) {
          Vue.set(state.async.messageMap[getMessageIdList[i].toString()], 'value', messageList[i]);
          await dispatch('app/setAddressAvatar', messageList[i].sender, { root: true });
        }
      }
    } catch (err) {
      log(err);
    }
  },

  async sendMessage({ rootState }, [recipient, content, callback]) {
    const message = await rootState.app.sync.ether.getBlockChat().createMessage(recipient, content, {}, callback);
    return message;
  },

  async listenMessage({ state, rootState }) {
    rootState.app.sync.ether.getBlockChat().listenMessage(async (event: MessageCreatedEvent) => {
      try {
        if (state.async.recipientMap[event.recipient.toString()] && state.async.recipientMap[event.recipient.toString()].value) {
          state.async.recipientMap[event.recipient.toString()].value.messageIdList.push(event.messageId);
        }
      } catch (err) {
        log(err);
      }
    });
  },

  async deleteRecipient({ state, rootState, dispatch }, recipientHash: string) {
    const index = rootState.app.storage.recipientHashList.indexOf(recipientHash);
    if (index != -1) {
      if (state.sync.activeRecipientHash == recipientHash) {
        if (rootState.app.storage.recipientHashList.length > 1) {
          await dispatch('setActiveRecipient', rootState.app.storage.recipientHashList[index == 0 ? index + 1 : index - 1]);
        } else {
          await dispatch('setActiveRecipient', '');
        }
      }
      rootState.app.storage.recipientHashList.splice(index, 1);
      //Vue.set(rootState.app.storage, 'recipientHashList', rootState.app.storage.recipientHashList);
    }
  },

  async setActiveRecipient({ state, rootState, dispatch }, recipientHash: string) {
    if (Object.keys(state.async.recipientMap).indexOf(recipientHash) == -1) {
      if (rootState.app.storage.recipientHashList.indexOf(recipientHash) == -1) {
        rootState.app.storage.recipientHashList.push(recipientHash);
      }
      await dispatch('setChatRecipient', recipientHash);
    }
    state.sync.activeRecipientHash = recipientHash;
  },
};

export default actions;
