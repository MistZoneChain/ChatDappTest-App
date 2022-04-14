/*
 * @Author: 33357
 * @Date: 2021-02-26 16:13:39
 * @LastEditTime: 2021-03-02 21:06:42
 * @LastEditors: 33357
 */
export interface ChatState {
  user: {
    activeRoom: string;
    myMessages: any;
    unReads: any;
    setChats: any;
  };
  load: {
    groups: any;
    persons: any;
    messages: any;
  };
}

const chatState: ChatState = {
  user: {
    activeRoom: '',
    myMessages: {},
    unReads: {},
    setChats: {},
  },
  load: {
    groups: {},
    persons: {},
    messages: {},
  },
};

export default chatState;
