import { BigNumber } from "ethers";
import { Message } from 'blockchat-contract-sdk';

/*
 * @Author: 33357
 * @Date: 2021-02-26 16:13:39
 * @LastEditTime: 2021-03-02 21:06:42
 * @LastEditors: 33357
 */
export enum status {
  sending,
  pending,
  success,
  error
}

export interface SendMessage extends Message {
  status: status;
  hash: string;
}

export interface Recipient {
  messageLength: BigNumber;
  messageIdList: Array<BigNumber>;
  readIndex: number;
  sendMessageIdList: Array<BigNumber>;
}

export interface AsyncMessage {
  value: Message;
}

export interface MessageMap {
  [messageId: string]: AsyncMessage;
}

export interface AsyncRecipient {
  value: Recipient;
}

export interface RecipientMap {
  [recipient: string]: AsyncRecipient;
}

export interface ChatSync {
  activeRecipientHash: string;
}

export interface ChatAsync {
  recipientMap: RecipientMap;
  messageMap: MessageMap;
}

export interface ChatState {
  sync: ChatSync;
  async: ChatAsync;
}

const chatState: ChatState = {
  sync: {
    activeRecipientHash: '',
  },
  async: {
    recipientMap: {},
    messageMap: {},
  },
};

export default chatState;
