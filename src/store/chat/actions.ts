import { ActionTree } from 'vuex';
import { RootState, ChatState, ChatMessage } from '../index';
import { common, BigNumber, contractDetails, utils, etherUtils } from '@/const';
import Vue from 'vue';
import { MessageCreatedEvent } from 'blockchat-contarct-sdk';
import { MessageMap, ChatRecipient, RecipientMap } from '.';
import { BytesLike } from 'ethers';

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

  async setChatMessage({ state, rootState, dispatch }, messageId: number) {
    try {
      if (!state.async.chatMessageMap[messageId]) {
        Vue.set(state.async.chatMessageMap, messageId, {} as ChatMessageMap);
        const message = await rootState.app.sync.ether.getChatDAO().getMessage(BigNumber.from(messageId));
        const chatMessage: ChatMessage = {
          messageId,
          sender: message.sender,
          recipientArr: message.recipientArr,
          content: message.content,
          typeNumber: message.typeNumber.toNumber(),
          createDate: new Date(message.createDate.toNumber() * 1000),
        };
        Vue.set(state.async.chatMessageMap[messageId], 'value', chatMessage);
        await dispatch('app/setAddressAvatar', chatMessage.sender, { root: true });
        chatMessage.recipientArr.forEach(async (recipientAddress) => {
          try {
            if (state.async.chatRecipientMap[recipientAddress].value.type == 'erc20') {
              await dispatch('app/setTokenBalance', [recipientAddress, chatMessage.sender], { root: true });
            }
          } catch (err) {
            console.log(err);
          }
        });
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
        if (state.async.chatRecipientMap[event.recipient] && state.async.chatRecipientMap[event.recipient].value) {
          state.async.chatRecipientMap[event.recipient].value.messageIdArr.push(event.messageId.toNumber());
        }
      } catch (err) {
        console.log(err);
      }
    });
  },

  async deleteChatRecipient({ state, rootState, dispatch }, recipientAddress: string) {
    const chatRecipients = Object.keys(state.async.chatRecipientMap);
    if (chatRecipients.length != 1) {
      const setIndex = rootState.app.storage.recipientMap.setArr.indexOf(recipientAddress);
      if (setIndex != -1) {
        rootState.app.storage.recipientMap.setArr.splice(setIndex, 1);
        Vue.set(rootState.app.storage.recipientMap, 'setArr', rootState.app.storage.recipientMap.setArr);
      }
      const deleteIndex = rootState.app.storage.recipientMap.deleteArr.indexOf(recipientAddress);
      if (deleteIndex == -1) {
        rootState.app.storage.recipientMap.deleteArr.push(recipientAddress);
      }
      const chatRecipientIndex = chatRecipients.indexOf(recipientAddress);
      if (chatRecipientIndex != -1) {
        let userActiveRecipient;
        if (chatRecipientIndex == 0) {
          userActiveRecipient = chatRecipients[chatRecipientIndex + 1];
        } else {
          userActiveRecipient = chatRecipients[chatRecipientIndex - 1];
        }
        Vue.set(state.async.chatRecipientMap, recipientAddress, undefined);
        delete state.async.chatRecipientMap[recipientAddress];
        Vue.set(state.async, 'chatRecipientMap', state.async.chatRecipientMap);
        await dispatch('setUserActiveRecipient', userActiveRecipient);
      }
    }
  },

  async setUserActiveRecipient({ state, rootState, dispatch }, recipientAddress: string) {
    if (Object.keys(state.async.chatRecipientMap).indexOf(recipientAddress) == -1) {
      if (rootState.app.storage.recipientMap.setArr.indexOf(recipientAddress) == -1) {
        rootState.app.storage.recipientMap.setArr.push(recipientAddress);
      }
      const index = rootState.app.storage.recipientMap.deleteArr.indexOf(recipientAddress);
      if (index != -1) {
        rootState.app.storage.recipientMap.deleteArr.splice(index, 1);
        Vue.set(rootState.app.storage.recipientMap, 'deleteArr', rootState.app.storage.recipientMap.deleteArr);
      }
      await dispatch('setChatRecipient', recipientAddress);
    }
    state.sync.userActiveRecipient = recipientAddress;
  },
};

export default actions;
