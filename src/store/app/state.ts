/*
 * @Author: 33357
 * @Date: 2021-02-26 16:13:39
 * @LastEditTime: 2021-03-02 21:18:09
 * @LastEditors: 33357
 */
import { Ether } from '@/api';
import { API } from '@/api/api';
import { COMMON } from '@/const';

export interface AppStorage {
  activeRecipientText: string;
  recipientTextList: Array<string>;
  background: string;
  decimalLimit: number;
  messageLimit: number;
}

export interface AppSync {
  userAddress: string;
  isMobile: boolean;
  avatarMap: { [address: string]: string };
  ether: Ether;
  api: API;
}

export interface AppAsync {
  USD_Value_Map: BalanceMap;
}

export interface BalanceMap {
  [address: string]: number;
}

export interface AppState {
  storage: AppStorage;
  sync: AppSync;
  async: AppAsync;
}

const appState: AppState = {
  storage: {
    activeRecipientText: 'blockchat',
    recipientTextList: ['blockchat', 'eth', 'bsc'],
    background: COMMON.BACKGROUND_LIST[0].URL,
    decimalLimit: 5,
    messageLimit: 10,
  },
  sync: {
    userAddress: COMMON.ZERO_ADDRESS,
    isMobile: false,
    avatarMap: {},
    ether: new Ether(),
    api: new API(),
  },
  async: {
    USD_Value_Map: {},
  },
};

export default appState;
