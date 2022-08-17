/*
 * @Author: 33357
 * @Date: 2021-02-26 16:13:39
 * @LastEditTime: 2021-03-01 20:44:56
 * @LastEditors: 33357
 */

export interface Chain {
  SCAN_URL: string;
  CHAIN_NAME: string;
  NODE_URL: string;
}

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

const CHAIN: { [CHAIN_ID: string]: Chain } = {
  20220813: {
    SCAN_URL: 'https://mzcscan-testnet.seaeye.cn/',
    CHAIN_NAME: 'mzc',
    NODE_URL: 'https://mzc-testnet.seaeye.cn',
  }
};

const SERVICE_URL: { [SERVICE: string]: string } = {
  DEBANK_HOME: 'https://debank.com/',
  DEBANK_API: 'https://api.debank.com',
};

const BACKGROUND_LIST = [
  {
    URL: './static/background/background.jpg',
    TXET: 'Normal',
  }
];

export const COMMON = {
  CHAIN,
  SERVICE_URL,
  BACKGROUND_LIST,
  ZERO_ADDRESS,
};
