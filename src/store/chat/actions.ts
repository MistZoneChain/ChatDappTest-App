import { ActionTree } from 'vuex';
import { RootState, ChatState } from '../index';
import { common, log } from '@/const';
import Vue from 'vue';
import { MessageCreatedEvent } from 'blockchat-contract-sdk';
import { Recipient } from '.';
import { BigNumberish } from 'ethers';

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
    state.sync.activeRecipientText = common.etherAddress;
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
      const messageIdLength = await rootState.app.sync.ether.getBlockChat().getRecipientMessageListLength(recipientText);
      const fullRecipient: Recipient = {
        messageIdLength: messageIdLength,
        messageIdList: [],
        readIndex: 0,
        sendMessageList: [],
      };
      Vue.set(state.async.recipientMap[recipientText], 'value', fullRecipient);
      await dispatch('getMessage', recipientText);
    }
  },

  async getMessage({ state, rootState, dispatch }, recipientText: string) {
    const recipient = state.async.recipientMap[recipientText].value;
    let getIndex = recipient.messageIdLength.toNumber() - recipient.messageIdList.length;
    let getLength = rootState.app.storage.messageLimit;
    if (getIndex < getLength) {
      getLength = getIndex;
      getIndex = 0;
    } else {
      getIndex -= getLength;
    }
    if (getLength != 0) {
      const messageIds = await rootState.app.sync.ether.getBlockChat().batchRecipientMessageId(recipientText, getIndex, getLength);
      recipient.messageIdList.push(...messageIds);
      dispatch('setMessage', recipient.messageIdList);
    }
  },

  async setMessage({ state, rootState, dispatch }, messageIdList: Array<BigNumberish>) {
    try {
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
          Vue.set(state.async.messageMap[getMessageIdList[i].toString()], 'value', messageList[i]);
          await dispatch('app/setAvatar', messageList[i].sender, { root: true });
        }
      }
    } catch (err) {
      log(err);
    }
  },

  async sendMessage({ rootState }, [recipientHash, content, callback]) {
    const message = await rootState.app.sync.ether.getBlockChat().createMessage(recipientHash, content, {}, callback);
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

  async deleteRecipient({ state, rootState, dispatch }, recipientText: string) {
    const index = rootState.app.storage.recipientTextList.indexOf(recipientText);
    if (index != -1) {
      if (state.sync.activeRecipientText == recipientText) {
        if (rootState.app.storage.recipientTextList.length > 1) {
          await dispatch('setActiveRecipient', rootState.app.storage.recipientTextList[index == 0 ? index + 1 : index - 1]);
        } else {
          await dispatch('setActiveRecipient', '');
        }
      }
      rootState.app.storage.recipientTextList.splice(index, 1);
      //Vue.set(rootState.app.storage, 'recipientHashList', rootState.app.storage.recipientHashList);
    }
  },

  async setActiveRecipient({ state, rootState, dispatch }, recipientText: string) {
    if (Object.keys(state.async.recipientMap).indexOf(recipientText) == -1) {
      if (rootState.app.storage.recipientTextList.indexOf(recipientText) == -1) {
        rootState.app.storage.recipientTextList.push(recipientText);
      }
      await dispatch('setRecipient', recipientText);
    }
    state.sync.activeRecipientText = recipientText;
  },
};

export default actions;
