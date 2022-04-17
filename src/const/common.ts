/*
 * @Author: 33357
 * @Date: 2021-02-26 16:13:39
 * @LastEditTime: 2021-03-01 20:44:56
 * @LastEditors: 33357
 */

const etherAddress = '0x0000000000000000000000000000000000000001';

export interface Chain {
  scanUrl: string;
  chainName: string;
}

const chain: { [chainId: string]: Chain } = {
  56: {
    scanUrl: 'https://bscscan.com/',
    chainName: 'bsc',
  },
  97: {
    scanUrl: 'https://testnet.bscscan.com/',
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

export function sleep(time: number) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

export function log(...args: any) {
  console.log(new Date().toLocaleString(), ...args);
}

export async function retry(func: Function, time: number, args?: Array<any>, callback?: Function): Promise<any> {
  try {
    let res;
    if (args) {
      res = await func(...args);
    } else {
      res = await func();
    }
    if (callback) {
      await callback(res);
    }
    return res;
  } catch (error) {
    time--;
    if (time > 0) {
      log(`retry ${time}, ${error}`);
      return await retry(func, time, args, callback);
    } else {
      throw error;
    }
  }
}

export const common = {
  etherAddress,
  chain,
  backgrounds,
  log,
  sleep,
  retry,
};
