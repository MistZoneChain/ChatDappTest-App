import { ActionTree } from 'vuex';
import { RootState, ChatState, ChatMessage } from '../index';
import { common, BigNumber, contractDetails, utils, etherUtils } from '@/const';
import Vue from 'vue';
import { MessageCreatedEvent } from 'chatdao-sdk';
import { ChatMessageMap, ChatRecipient, ChatRecipientMap } from '.';

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
    state.sync.userActiveRecipient = common.etherAddress;
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

  async setChatRecipient({ state, rootState, dispatch }, recipientAddress: string) {
    if (!state.async.chatRecipientMap[recipientAddress] && rootState.app.storage.recipientMap.deleteArr.indexOf(recipientAddress) == -1) {
      Vue.set(state.async.chatRecipientMap, recipientAddress, {} as ChatRecipientMap);
      const res = await Promise.all([
        rootState.app.sync.ether.getChatDAO().getRecipient(recipientAddress),
        rootState.app.sync.ether.utils.getType(recipientAddress),
      ]);
      const fullRecipient: ChatRecipient = {
        messageIdLength: res[0].messageIdLength.toNumber(),
        publicKey: res[0].ephemPublicKey,
        messageIdArr: [],
        readIndex: 0,
        sendMessageArr: [],
        type: res[1],
      };
      if (fullRecipient.type == 'wallet') {
        dispatch('app/setAddressAvatar', recipientAddress, { root: true });
        fullRecipient.encrypt = false;
      } else if (fullRecipient.type == 'erc20') {
        dispatch('app/setTokenBalance', [recipientAddress, rootState.app.sync.userAddress], { root: true });
        dispatch('app/setERC20Detail', recipientAddress, { root: true });
      }
      if (rootState.app.storage.recipientMap.encryptArr.indexOf(recipientAddress) != -1) {
        fullRecipient.encrypt = true;
      }
      Vue.set(state.async.chatRecipientMap[recipientAddress], 'value', fullRecipient);
      await dispatch('getChatMessage', recipientAddress);
    }
  },

  async getChatMessage({ state, rootState, dispatch }, recipientAddress: string) {
    const recipient = state.async.chatRecipientMap[recipientAddress].value;
    let getIndex = recipient.messageIdLength - recipient.messageIdArr.length;
    let getLength = rootState.app.storage.skipLimit;
    if (getIndex < getLength) {
      getLength = getIndex;
      getIndex = 0;
    } else {
      getIndex -= getLength;
    }
    if (getLength != 0) {
      const messageIds = await rootState.app.sync.ether
        .getChatDAO()
        .batchRecipientMessageIds(recipientAddress, BigNumber.from(getIndex), BigNumber.from(getLength));
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

  async sendChatMessage({ rootState }, [recipientArr, content, typeNumber, callback]) {
    const messageId = await rootState.app.sync.ether.getChatDAO().createMessage(recipientArr, content, typeNumber, {}, callback);
    return messageId.toNumber();
  },

  async listenChatMessage({ state, rootState }) {
    rootState.app.sync.ether.getChatDAO().listenMessage(async (event: MessageCreatedEvent) => {
      event.recipientArr.forEach(async (recipientAddress) => {
        try {
          if (state.async.chatRecipientMap[recipientAddress] && state.async.chatRecipientMap[recipientAddress].value) {
            state.async.chatRecipientMap[recipientAddress].value.messageIdArr.push(event.messageId.toNumber());
          }
        } catch (err) {
          console.log(err);
        }
      });
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

  async changeChatRecipientEncrypt({ state, rootState }) {
    if (state.async.chatRecipientMap[state.sync.userActiveRecipient].value.encrypt) {
      state.async.chatRecipientMap[state.sync.userActiveRecipient].value.encrypt = false;
      const index = rootState.app.storage.recipientMap.encryptArr.indexOf(state.sync.userActiveRecipient);
      if (index != -1) {
        rootState.app.storage.recipientMap.encryptArr.splice(index, 1);
      }
    } else {
      state.async.chatRecipientMap[state.sync.userActiveRecipient].value.encrypt = true;
      if (rootState.app.storage.recipientMap.encryptArr.indexOf(state.sync.userActiveRecipient) == -1) {
        rootState.app.storage.recipientMap.encryptArr.push(state.sync.userActiveRecipient);
      }
    }
  },

  async encryptContent({ state, rootState }, content: string) {
    const index = rootState.app.storage.recipientMap.encryptPrivateKeyArr
      .map((privateKey) => {
        return rootState.app.sync.ether.metamask.getWalletByPrivateKey(privateKey).address;
      })
      .indexOf(state.sync.userActiveRecipient);
    if (index == -1) {
      const publicKey = state.async.chatRecipientMap[state.sync.userActiveRecipient].value.publicKey;
      return rootState.app.sync.ether.P2P.encrypt(content, publicKey);
    } else {
      return rootState.app.sync.ether.P2G.encrypt(content, rootState.app.storage.recipientMap.encryptPrivateKeyArr[index]);
    }
  },

  async updatePublicKey({ state, rootState }) {
    const publicKey = await rootState.app.sync.ether.metamask.getEncryptionPublicKeyByAddress(rootState.app.sync.userAddress);
    await rootState.app.sync.ether.getChatDAO().uploadEphemPublicKey(publicKey);
    Vue.set(state.async.chatRecipientMap[rootState.app.sync.userAddress].value, 'publicKey', publicKey);
  },

  async decryptContent({ state, rootState }, messageId: number) {
    const secret = state.async.chatMessageMap[messageId].value.content;
    if (state.sync.userActiveRecipient == rootState.app.sync.userAddress) {
      const content = await rootState.app.sync.ether.P2P.decrypt(secret, rootState.app.sync.userAddress);
      Vue.set(state.async.chatMessageMap[messageId].value, 'decryptContent', content);
    } else {
      const index = rootState.app.storage.recipientMap.encryptPrivateKeyArr
        .map((privateKey) => {
          return rootState.app.sync.ether.metamask.getWalletByPrivateKey(privateKey).address;
        })
        .indexOf(state.sync.userActiveRecipient);
      if (index != -1) {
        const content = rootState.app.sync.ether.P2G.decrypt(secret, rootState.app.storage.recipientMap.encryptPrivateKeyArr[index]);
        Vue.set(state.async.chatMessageMap[messageId].value, 'decryptContent', content);
      } else {
        throw 'can not decrypt';
      }
    }
  },
};

export default actions;
