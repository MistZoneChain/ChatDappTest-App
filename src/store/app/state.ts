/*
 * @Author: 33357
 * @Date: 2021-02-26 16:13:39
 * @LastEditTime: 2021-03-02 21:18:09
 * @LastEditors: 33357
 */
import { Ether } from '@/api';
import { common } from '@/const';

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
}

export interface AppAsync {
  balanceMap: BalanceMap;
}

export interface AsyncBalance {
  value: number;
}

export interface BalanceMap {
  [walletAddress: string]: AsyncBalance;
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
    background: common.backgrounds[0].url,
    decimalLimit: 5,
    messageLimit: 20,
  },
  sync: {
    userAddress: '',
    isMobile: false,
    avatarMap: {},
    ether: new Ether(),
  },
  async: {
    balanceMap: {},
  },
};

export default appState;
