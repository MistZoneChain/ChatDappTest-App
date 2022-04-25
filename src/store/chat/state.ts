import { BigNumber, BytesLike } from 'ethers';
import { BlockChatUpgrade2Model } from 'blockchat-contract-sdk';

/*
 * @Author: 33357
 * @Date: 2021-02-26 16:13:39
 * @LastEditTime: 2021-03-02 21:06:42
 * @LastEditors: 33357
 */
export { BlockChatUpgrade2Model } from 'blockchat-contract-sdk';

export enum SendMessageStatus {
  prePending,
  pending,
  success,
  error,
}

export interface SendMessage extends BlockChatUpgrade2Model.MessageCreatedEvent {
  status: SendMessageStatus;
  hash?: string;
}

export interface Recipient {
  messageIdLength: BigNumber;
  messageIdList: Array<BigNumber>;
  recipientHash: string;
  readIndex: number;
  sendMessageList: Array<SendMessage>;
}

export interface MessageMap {
  [messageId: string]: BlockChatUpgrade2Model.Message;
}

export interface MessageCreatedEventMap {
  [messageId: string]: BlockChatUpgrade2Model.MessageCreatedEvent;
}

export interface RecipientMap {
  [recipientText: string]: Recipient;
}

export interface ChatSync {}

export interface ChatAsync {
  recipientMap: RecipientMap;
  messageMap: MessageMap;
  messageCreatedEventMap:MessageCreatedEventMap;
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
    messageCreatedEventMap:{},
  },
};

export default chatState;
