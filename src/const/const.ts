/*
 * @Author: 33357
 * @Date: 2021-02-26 16:13:39
 * @LastEditTime: 2021-03-01 20:44:56
 * @LastEditors: 33357
 */

export const CHAIN_DATA: any = {
  HECO: {
    SCAN_URL: 'https://hecoinfo.com/',
    DEFAULT_GROUP: ['0x0000000000000000000000000000000000000000', '0xD6f210FA8825Ff2C8664886803945b92AEC587f3'],
    COINERCHAT_GROUP: '0x0000000000000000000000000000000000000001',
    CHAIN_ID: 128,
    CHAIN_NAME: 'HECO主网',
  },
  HECO_TEST: {
    SCAN_URL: 'https://testnet.hecoinfo.com/',
    DEFAULT_GROUP: ['0x0000000000000000000000000000000000000000', '0xc0D78EEd0BFE1Bd3C9659F01Fc44ca2A3B629059'],
    COINERCHAT_GROUP: '0x0000000000000000000000000000000000000001',
    CHAIN_ID: 256,
    CHAIN_NAME: 'HECO测试网',
  },
};

export const BACKGROUND: any = [
  {
    url: './static/background/btc.jpg',
    text: 'BTC',
  },
  {
    url: './static/background/eth.jpg',
    text: 'ETH',
  },
  {
    url: './static/background/uniswap.jpg',
    text: 'Uniswap',
  },
  {
    url: './static/background/huobi.jpg',
    text: 'HuoBi',
  },
  {
    url: './static/background/heco.jpg',
    text: 'HECO',
  },
  {
    url: './static/background/mdex.jpg',
    text: 'MDEX',
  },
];
