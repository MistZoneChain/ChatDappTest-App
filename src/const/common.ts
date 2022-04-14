/*
 * @Author: 33357
 * @Date: 2021-02-26 16:13:39
 * @LastEditTime: 2021-03-01 20:44:56
 * @LastEditors: 33357
 */

const etherAddress = '0x0000000000000000000000000000000000000001';

export interface Chain {
  scanUrl: string;
  chainId: number;
  chainName: string;
}

const chain: { [index: string]: Chain } = {
  bsc: {
    scanUrl: 'https://bscscan.com/',
    chainId: 56,
    chainName: 'bsc',
  },
  bscTest: {
    scanUrl: 'https://testnet.bscscan.com/',
    chainId: 97,
    chainName: 'bscTest',
  },
};

const backgrounds = [
  {
    url: './static/background/pancake.jpg',
    text: 'PANCAKE',
  },
  {
    url: './static/background/binance.jpg',
    text: 'BINANCE',
  },
  {
    url: './static/background/venus.png',
    text: 'VENUS',
  },
  {
    url: './static/background/autofarm.jpeg',
    text: 'AUTOFARM',
  },
  {
    url: './static/background/btc.jpg',
    text: 'BTC',
  },
  {
    url: './static/background/eth.jpg',
    text: 'ETH',
  },
];

export const common = {
  etherAddress,
  chain,
  backgrounds,
};
