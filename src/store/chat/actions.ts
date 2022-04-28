import { ActionTree } from 'vuex';
import { RootState, ChatState } from '../index';
import { log, utils } from '@/const';
import Vue from 'vue';
import { BlockChatUpgradeModel } from 'blockchat-contract-sdk';
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
    await dispatch('listenMessageCreatedEvent');
  },

  async watchAsync({ rootState, dispatch }) {
    rootState.app.storage.recipientTextList.forEach(async (recipientText: string) => {
      try {
        await dispatch('setRecipient', recipientText);
      } catch (err) {
        log(err);
      }
    });
    this.watch(
      (state) => state.app.storage.recipientTextList,
      (recipientTextList) => {
        recipientTextList.forEach(async (recipientText: string) => {
          try {
            await dispatch('setRecipient', recipientText);
          } catch (err) {
            log(err);
          }
        });
      },
      {
        deep: true,
      }
    );
    if (rootState.app.storage.recipientTextList.indexOf(rootState.app.sync.userAddress) == -1) {
      rootState.app.storage.recipientTextList.push(rootState.app.sync.userAddress);
    }
  },

  async setRecipient({ state, rootState, dispatch }, recipientText: string) {
    if (!state.async.recipientMap[recipientText]) {
      Vue.set(state.async.recipientMap, recipientText, {});
      let recipientHash;
      if (utils.ethers.isAddress(recipientText)) {
        recipientHash = recipientText;
      } else {
        recipientHash = rootState.app.sync.ether.blockchat.recipientHash(recipientText);
      }
      dispatch('app/setAvatar', recipientHash, { root: true });
      const messageBlockListLength = await rootState.app.sync.ether.blockchat.getRecipientMessageBlockListLength(recipientHash);
      const recipient: Recipient = {
        messageBlockListLength: messageBlockListLength,
        messageBlockList: [],
        recipientHash: recipientHash,
        sendMessageList: [],
        useEncrypt: false,
      };
      Vue.set(state.async.recipientMap, recipientText, recipient);
      dispatch('setDataUploadedEvent', recipientText);
      dispatch('setMessageBlock', [recipientText]);
    }
  },

  async setDataUploadedEvent({ state, rootState }, recipientText: string) {
    state.sync.dataList.forEach(async (data) => {
      const recipientData = state.async.recipientMap[recipientText].recipientHash + data;
      if (!state.async.dataUploadedEventMap[recipientData]) {
        const dataHash = rootState.app.sync.ether.blockchat.dataHash(state.async.recipientMap[recipientText].recipientHash, data)
        const dataBlock = await rootState.app.sync.ether.blockchat.dataBlockMap(
          dataHash
        );
        Vue.set(state.async.dataUploadedEventMap, recipientData, dataBlock);
        if (dataBlock > 0) {
          const dataUploadedEvent = await rootState.app.sync.ether.blockchat.getDataUploadedEvent(dataHash, dataBlock, dataBlock);
          Vue.set(state.async.dataUploadedEventMap, recipientData, dataUploadedEvent);
        }
      }
    });
  },

  async setMessageBlock({ state, rootState, dispatch }, recipientText: string) {
    if (state.async.recipientMap[recipientText].messageBlockListLength > state.async.recipientMap[recipientText].messageBlockList.length) {
      const recipient = state.async.recipientMap[recipientText];
      let start = recipient.messageBlockListLength - recipient.messageBlockList.length;
      let length = rootState.app.storage.messageBlockLimit;
      if (start < length) {
        length = start;
        start = 0;
      } else {
        start -= length;
      }
      if (length != 0) {
        const recipientMessageBlockList = await rootState.app.sync.ether.blockchat.batchRecipientMessageBlock(
          state.async.recipientMap[recipientText].recipientHash,
          start,
          length
        );
        recipient.messageBlockList.push(...recipientMessageBlockList);
        dispatch('setMessageCreatedEventList', recipientText);
      }
    }
  },

  async setMessageCreatedEventList({ state, rootState, dispatch }, recipientText: string) {
    if (!state.async.blockSkip) {
      state.async.blockSkip = await rootState.app.sync.ether.blockchat.blockSkip();
    }
    state.async.recipientMap[recipientText].messageBlockList.forEach(async (messageBlock) => {
      if (!state.async.messageCreatedEventListMap && state.async.blockSkip) {
        Vue.set(state.async.messageCreatedEventListMap, recipientText, {});
        const messageCreatedEventList = await rootState.app.sync.ether.blockchat.getMessageCreatedEventList(
          undefined,
          state.async.recipientMap[recipientText].recipientHash,
          messageBlock,
          messageBlock + state.async.blockSkip
        );
        Vue.set(state.async.messageCreatedEventListMap, recipientText, messageCreatedEventList);
        messageCreatedEventList.forEach(async (messageCreatedEvent) => {
          dispatch('app/setAvatar', messageCreatedEvent.sender, { root: true });
          dispatch('app/setUSD_Value', messageCreatedEvent.sender, { root: true });
        });
      }
    });
  },

  async getMessage({ rootState, dispatch }) {
    await dispatch('setMessageBlock', rootState.app.storage.activeRecipientText);
  },

  async sendMessage({ state, rootState }, content) {
    const recipientText = rootState.app.storage.activeRecipientText;
    const publicKey = state.async.dataUploadedEventMap[state.async.recipientMap[recipientText].recipientHash + 'publicKey'];
    if (state.async.recipientMap[recipientText].useEncrypt && typeof publicKey == 'string') {
      content =
        'e::' +
        rootState.app.sync.ether.P2P.encrypt(
          content,
          publicKey
        );
    }
    const sendMessage: SendMessage = {
      sender: rootState.app.sync.userAddress,
      status: SendMessageStatus.prePending,
      recipientHash: state.async.recipientMap[recipientText].recipientHash,
      content,
      createDate: Number((new Date().getTime() / 1000).toFixed(0)),
    };
    const index = state.async.recipientMap[recipientText].sendMessageList.length;
    state.async.recipientMap[recipientText].sendMessageList.push(sendMessage);
    try {
      const message = await rootState.app.sync.ether.blockchat.createMessage(
        sendMessage.recipientHash,
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
    } catch (error) {
      Vue.set(state.async.recipientMap[recipientText].sendMessageList[index], 'status', SendMessageStatus.error);
      throw error;
    }
  },

  async listenMessageCreatedEvent({ state, rootState }) {
    rootState.app.sync.ether.blockchat.listenMessageCreatedEvent(async (messageCreatedEvent: BlockChatUpgradeModel.MessageCreatedEvent) => {
      try {
        const recipientTextList = Object.keys(state.async.recipientMap);
        for (let i = 0; i < recipientTextList.length; i++) {
          if (messageCreatedEvent.recipientHash == state.async.recipientMap[recipientTextList[i]].recipientHash) {
            state.async.messageCreatedEventListMap[recipientTextList[i]].push(messageCreatedEvent);
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

  async setActiveRecipient({ rootState }, recipientText: string) {
    if (utils.ethers.isAddress(recipientText)) {
      recipientText = utils.ethers.getAddress(recipientText);
    }
    if (rootState.app.storage.recipientTextList.indexOf(recipientText) == -1) {
      rootState.app.storage.recipientTextList.push(recipientText);
    }
    rootState.app.storage.activeRecipientText = recipientText;
  },
};

export default actions;
