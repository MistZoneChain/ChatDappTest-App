/*
 * @Author: 33357
 * @Date: 2021-02-26 16:13:39
 * @LastEditTime: 2021-03-02 21:18:09
 * @LastEditors: 33357
 */
import { Ether } from '@/api';
import { BigNumber } from '@/const';

export interface ERC20Detail {
  logoURI: string;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: BigNumber;
}

export interface AsyncBalance {
  value: BigNumber;
}

export interface TokenBalanceMap {
  [tokenAddress: string]: {
    [walletAddress: string]: AsyncBalance;
  };
}

export interface ERC20DetailMap {
  [tokenAddress: string]: AsyncERC20Detail;
}

export interface AsyncERC20Detail {
  value: ERC20Detail;
}

export interface AppStorage {
  recipientMap: { setArr: Array<string>; deleteArr: Array<string>; encryptArr: Array<string>; encryptPrivateKeyArr: Array<string> };
  background: string;
  decimalLimit: number;
  skipLimit: number;
}

export interface AppSync {
  userAddress: string;
  isMobile: boolean;
  addressAvatarMap: { [address: string]: string };
  ether: Ether;
}

export interface AppAsync {
  tokenBalanceMap: TokenBalanceMap;
  erc20DetailMap: ERC20DetailMap;
}

export interface AppState {
  storage: AppStorage;
  sync: AppSync;
  async: AppAsync;
}

const appState: AppState = {
  storage: {
    recipientMap: {
      setArr: [],
      deleteArr: [],
      encryptArr: [],
      encryptPrivateKeyArr: [],
    },
    background: '',
    decimalLimit: 5,
    skipLimit: 20,
  },
  sync: {
    userAddress: '',
    isMobile: false,
    addressAvatarMap: {},
    ether: new Ether(),
  },
  async: {
    tokenBalanceMap: {},
    erc20DetailMap: {},
  },
};

export default appState;
