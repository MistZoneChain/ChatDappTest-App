import { BlockChatUpgradeModel } from 'blockchat-contract-sdk';

/*
 * @Author: 33357
 * @Date: 2021-02-26 16:13:39
 * @LastEditTime: 2021-03-02 21:06:42
 * @LastEditors: 33357
 */

export { BlockChatUpgradeModel } from 'blockchat-contract-sdk';

export enum SendMessageStatus {
  prePending,
  pending,
  success,
  error,
}

export interface SendMessage extends BlockChatUpgradeModel.MessageCreatedEvent {
  status: SendMessageStatus;
  hash?: string;
}

export interface Recipient {
  messageBlockListLength: number;
  messageBlockList: Array<number>;
  recipientHash: string;
  sendMessageList: Array<SendMessage>;
  useEncrypt: boolean;
}

export interface MessageCreatedEventMap {
  [recipientText: string]: Array<BlockChatUpgradeModel.MessageCreatedEvent>;
}

export interface DataUploadedEventMap {
  [recipientData: string]: number | BlockChatUpgradeModel.DataUploadedEvent;
}

export interface RecipientMap {
  [recipientText: string]: Recipient;
}

export interface ChatSync {
  dataList: Array<string>;
}

export interface ChatAsync {
  blockSkip: number | undefined;
  recipientMap: RecipientMap;
  dataUploadedEventMap: DataUploadedEventMap;
  messageCreatedEventListMap: MessageCreatedEventMap;
}

export interface ChatState {
  sync: ChatSync;
  async: ChatAsync;
}

const chatState: ChatState = {
  sync: {
    dataList: ['publicKey'],
  },
  async: {
    blockSkip: undefined,
    recipientMap: {},
    dataUploadedEventMap: {},
    messageCreatedEventListMap: {},
  },
};

export default chatState;
