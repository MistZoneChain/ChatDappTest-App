import { ActionTree } from 'vuex';
import { RootState, ChatState, ChatMessage } from '../index';
import { common, BigNumber, contractDetails, utils, etherUtils } from '@/const';
import Vue from 'vue';
import { MessageCreatedEvent } from 'blockchat-contarct-sdk';
import { MessageMap, ChatRecipient, RecipientMap } from '.';
import { BigNumberish, BytesLike } from 'ethers';

const actions: ActionTree<ChatState, RootState> = {
  async start({ dispatch }) {
    try {
      await dispatch('setSync');
      await dispatch('watchAsync');
      console.log('chat message start success!');
    } catch (err) {
      console.log(err);
    }
  },

  async setSync({ state, dispatch }) {
    state.sync.activeRecipient = common.etherAddress;
    await dispatch('listenChatMessage');
  },

  async watchAsync({ rootState, dispatch }) {
    rootState.app.storage.recipientMap.setArr.forEach(async (recipientAddress: string) => {
      try {
        await dispatch('setChatRecipient', recipientAddress);
      } catch (err) {
        console.log(err);
      }
    });
    Object.values(contractDetails[rootState.app.sync.ether.getNetwork()].erc20).forEach(async (token) => {
      try {
        token.address = etherUtils.getAddress(token.address);
        await dispatch('app/setTokenBalance', [token.address, rootState.app.sync.userAddress], { root: true });
        if (
          (utils.have.value(rootState.app.async.tokenBalanceMap[token.address][rootState.app.sync.userAddress]) &&
            rootState.app.async.tokenBalanceMap[token.address][rootState.app.sync.userAddress].value.gt(BigNumber.from(0))) ||
          token.address == common.etherAddress
        ) {
          await dispatch('setChatRecipient', token.address);
        }
      } catch (err) {
        console.log(err);
      }
    });
  },

  async setChatRecipient({ state, rootState, dispatch }, recipient: BytesLike) {
    if (!state.async.recipientMap[recipient.toString()] && rootState.app.storage.recipientMap.deleteArr.indexOf(recipient.toString()) == -1) {
      Vue.set(state.async.recipientMap, recipient.toString(), {} as RecipientMap);
      const res = await Promise.all([
        rootState.app.sync.ether.getBlockChat().getRecipientMessageListLength(recipient)
      ]);
      const fullRecipient: ChatRecipient = {
        messageLength: res[0],
        messageList: [],
        readIndex: 0,
        sendMessageList: [],
      };
      Vue.set(state.async.recipientMap[recipient.toString()], 'value', fullRecipient);
      await dispatch('getChatMessage', recipient.toString());
    }
  },

  async getChatMessage({ state, rootState, dispatch }, recipient: BytesLike) {
    const _recipient = state.async.recipientMap[recipient.toString()].value;
    let getIndex = _recipient.messageLength - _recipient.messageList.length;
    let getLength = rootState.app.storage.skipLimit;
    if (getIndex < getLength) {
      getLength = getIndex;
      getIndex = 0;
    } else {
      getIndex -= getLength;
    }
    if (getLength != 0) {
      const messageIds = await rootState.app.sync.ether
        .getBlockChat()
        .batchRecipientMessageIds(recipient.toString(), BigNumber.from(getIndex), BigNumber.from(getLength));
      recipient.messageIdArr.push(
        ...messageIds.map((messageId) => {
          dispatch('setChatMessage', messageId);
          return messageId.toNumber();
        })
      );
    }
  },

  async setChatMessage({ state, rootState, dispatch }, messageId: BigNumberish) {
    try {
      if (!state.async.messageMap[messageId]) {
        Vue.set(state.async.messageMap, messageId, {} as MessageMap);
        const message = await rootState.app.sync.ether.getBlockChat().batchMessage(BigNumber.from(messageId));
        const chatMessage: ChatMessage = {
          messageId,
          sender: message.sender,
          recipient: message.recipient,
          content: message.content,
          createDate: message.createDate,
        };
        Vue.set(state.async.messageMap[messageId], 'value', chatMessage);
        await dispatch('app/setAddressAvatar', chatMessage.sender, { root: true });
      }
    } catch (err) {
      console.log(err);
    }
  },

  async sendChatMessage({ rootState }, [recipient, content, callback]) {
    const message = await rootState.app.sync.ether.getBlockChat().createMessage(recipient, content, {}, callback);
    return message;
  },

  async listenChatMessage({ state, rootState }) {
    rootState.app.sync.ether.getBlockChat().listenMessage(async (event: MessageCreatedEvent) => {
      try {
        if (state.async.recipientMap[event.recipient.toString()] && state.async.recipientMap[event.recipient.toString()].value) {
          state.async.recipientMap[event.recipient.toString()].value.messageList.push(event.messageId);
        }
      } catch (err) {
        console.log(err);
      }
    });
  },

  async deleteChatRecipient({ state, rootState, dispatch }, recipient: BytesLike) {
    const chatRecipients = Object.keys(state.async.recipientMap);
    if (chatRecipients.length != 1) {
      const setIndex = rootState.app.storage.recipientMap.setArr.indexOf(recipient.toString());
      if (setIndex != -1) {
        rootState.app.storage.recipientMap.setArr.splice(setIndex, 1);
        Vue.set(rootState.app.storage.recipientMap, 'setArr', rootState.app.storage.recipientMap.setArr);
      }
      const deleteIndex = rootState.app.storage.recipientMap.deleteArr.indexOf(recipient.toString());
      if (deleteIndex == -1) {
        rootState.app.storage.recipientMap.deleteArr.push(recipient.toString());
      }
      const chatRecipientIndex = chatRecipients.indexOf(recipient.toString());
      if (chatRecipientIndex != -1) {
        let userActiveRecipient;
        if (chatRecipientIndex == 0) {
          userActiveRecipient = chatRecipients[chatRecipientIndex + 1];
        } else {
          userActiveRecipient = chatRecipients[chatRecipientIndex - 1];
        }
        Vue.set(state.async.recipientMap, recipient.toString(), undefined);
        delete state.async.recipientMap[recipient.toString()];
        Vue.set(state.async, 'chatRecipientMap', state.async.recipientMap);
        await dispatch('setUserActiveRecipient', userActiveRecipient);
      }
    }
  },

  async setUserActiveRecipient({ state, rootState, dispatch }, recipient: BytesLike) {
    if (Object.keys(state.async.recipientMap).indexOf(recipient.toString()) == -1) {
      if (rootState.app.storage.recipientMap.setArr.indexOf(recipient.toString()) == -1) {
        rootState.app.storage.recipientMap.setArr.push(recipient.toString());
      }
      const index = rootState.app.storage.recipientMap.deleteArr.indexOf(recipient.toString());
      if (index != -1) {
        rootState.app.storage.recipientMap.deleteArr.splice(index, 1);
        Vue.set(rootState.app.storage.recipientMap, 'deleteArr', rootState.app.storage.recipientMap.deleteArr);
      }
      await dispatch('setChatRecipient', recipient);
    }
    state.sync.activeRecipient = recipient;
  },
};

export default actions;
