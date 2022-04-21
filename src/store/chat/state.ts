import { BigNumber } from 'ethers';
import { Message, MessageToRecipientList } from 'blockchat-contract-sdk';

/*
 * @Author: 33357
 * @Date: 2021-02-26 16:13:39
 * @LastEditTime: 2021-03-02 21:06:42
 * @LastEditors: 33357
 */
export { Message, MessageToRecipientList } from 'blockchat-contract-sdk';

export enum SendMessageStatus {
  prePending,
  pending,
  success,
  error,
}

export interface SendMessage extends Message {
  status: SendMessageStatus;
  hash?: string;
  messageId?: BigNumber;
}

export interface Recipient {
  messageIdLength: BigNumber;
  messageIdList: Array<BigNumber>;
  recipientHash: string;
  readIndex: number;
  sendMessageList: Array<SendMessage>;
}

export interface MessageMap {
  [messageId: string]: Message | MessageToRecipientList;
}

export interface RecipientMap {
  [recipientText: string]: Recipient;
}

export interface ChatSync {}

export interface ChatAsync {
  recipientMap: RecipientMap;
  messageMap: MessageMap;
}

export interface ChatState {
  sync: ChatSync;
  async: ChatAsync;
}

const chatState: ChatState = {
  sync: {},
  async: {
    recipientMap: {},
    messageMap: {},
  },
};

export default chatState;
