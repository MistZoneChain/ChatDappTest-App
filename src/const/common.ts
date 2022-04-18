/*
 * @Author: 33357
 * @Date: 2021-02-26 16:13:39
 * @LastEditTime: 2021-03-01 20:44:56
 * @LastEditors: 33357
 */

export interface Chain {
  SCAN_URL: string;
  CHAIN_NAME: string;
}

const CHAIN: { [CHAIN_ID: string]: Chain } = {
  56: {
    SCAN_URL: 'https://bscscan.com/',
    CHAIN_NAME: 'bsc',
  },
  97: {
    SCAN_URL: 'https://testnet.bscscan.com/',
    CHAIN_NAME: 'bscTest',
  },
};

const SERVICE_URL: { [SERVICE: string]: string } = {
  DEBANK_HOME: 'https://debank.com/',
  DEBANK_API: 'https://api.debank.com',
};

const BACKGROUND_LIST = [
  {
    URL: './static/background/pancake.jpg',
    TXET: 'PANCAKE',
  },
  {
    URL: './static/background/binance.jpg',
    TXET: 'BINANCE',
  },
  {
    URL: './static/background/venus.png',
    TXET: 'VENUS',
  },
  {
    URL: './static/background/autofarm.jpeg',
    TXET: 'AUTOFARM',
  },
  {
    URL: './static/background/btc.jpg',
    TXET: 'BTC',
  },
  {
    URL: './static/background/eth.jpg',
    TXET: 'ETH',
  },
];

export const COMMON = {
  CHAIN,
  SERVICE_URL,
  BACKGROUND_LIST,
};
