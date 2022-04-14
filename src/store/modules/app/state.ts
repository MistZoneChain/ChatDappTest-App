/*
 * @Author: 33357
 * @Date: 2021-02-26 16:13:39
 * @LastEditTime: 2021-03-02 21:18:09
 * @LastEditors: 33357
 */
import { web3Provider } from '@/web3/web3Provider';

export interface AppState {
  user: {
    address: string;
    messageSkip: number;
    decimals: number;
    tokens: Array<string>;
    background: string;
  };
  const: {
    chain: string;
    web3: web3Provider;
    tokenList: any;
    mobile: boolean;
  };
  load: {
    balances: any;
    avatars: any;
    tokenList: any;
  };
}

const appState: AppState = {
  user: {
    address: '',
    messageSkip: 20,
    decimals: 5,
    tokens: [],
    background: '',
  },
  const: {
    chain: '',
    web3: new web3Provider(),
    tokenList: {},
    mobile: false,
  },
  load: {
    balances: {},
    avatars: {},
    tokenList: {},
  },
};

export default appState;
