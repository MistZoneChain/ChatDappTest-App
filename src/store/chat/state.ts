import { BigNumberish, BytesLike } from "ethers";

/*
 * @Author: 33357
 * @Date: 2021-02-26 16:13:39
 * @LastEditTime: 2021-03-02 21:06:42
 * @LastEditors: 33357
 */
export enum chatStatus{
  sending,
  pending,
  success,
  error
}

export interface ChatMessage {
  messageId: BigNumberish;
  sender: string;
  recipient: BytesLike;
  content: string;
  createDate: BigNumberish;
}

export interface SendMessage extends ChatMessage {
  status: chatStatus;
  hash: string;
}

export interface ChatRecipient {
  messageLength: BigNumberish;
  messageList: Array<BigNumberish>;
  readIndex: number;
  sendMessageList: Array<SendMessage>;
}

export interface AsyncMessage {
  value: ChatMessage;
}

export interface MessageMap {
  [messageId: number]: AsyncMessage;
}

export interface AsyncRecipient {
  value: ChatRecipient;
}

export interface RecipientMap {
  [recipient: string]: AsyncRecipient;
}

export interface ChatSync {
  activeRecipient: BytesLike;
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
    activeRecipient: '',
  },
  async: {
    recipientMap: {},
    messageMap: {},
  },
};

export default chatState;
