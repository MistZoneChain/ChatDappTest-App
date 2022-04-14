/*
 * @Author: 33357
 * @Date: 2021-02-26 16:13:39
 * @LastEditTime: 2021-03-02 21:06:42
 * @LastEditors: 33357
 */
export interface ChatMessage {
  messageId: number;
  sender: string;
  recipientArr: Array<string>;
  content: string;
  typeNumber: number;
  createDate: Date;
  decryptContent?: string;
}

export interface ChatSendMessage extends ChatMessage {
  status: string;
  hash: string;
}

export interface ChatRecipient {
  messageIdLength: number;
  publicKey: string;
  messageIdArr: Array<number>;
  readIndex: number;
  sendMessageArr: Array<ChatSendMessage>;
  type: string;
  encrypt?: boolean;
}

export interface AsyncMessage {
  value: ChatMessage;
}

export interface ChatMessageMap {
  [messageId: number]: AsyncMessage;
}

export interface AsyncRecipient {
  value: ChatRecipient;
}

export interface ChatRecipientMap {
  [recipientAddress: string]: AsyncRecipient;
}

export interface ChatSync {
  userActiveRecipient: string;
}

export interface ChatAsync {
  chatRecipientMap: ChatRecipientMap;
  chatMessageMap: ChatMessageMap;
}

export interface ChatState {
  sync: ChatSync;
  async: ChatAsync;
}

const chatState: ChatState = {
  sync: {
    userActiveRecipient: '',
  },
  async: {
    chatRecipientMap: {},
    chatMessageMap: {},
  },
};

export default chatState;
