import Vue from 'vue';
import Web3 from 'web3';
import BN from 'bn.js';
import * as CONST from '@/const/const';

export function sleep(time: number) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

export function autoRun(fun: Function, time: number) {
  setInterval(fun, time);
}

export const link: any = {
  goAddress(chain: string, address: string) {
    window.open(CONST.CHAIN_DATA[chain].SCAN_URL + 'address/' + address);
  },
  goToken(chain: string, address: string) {
    window.open(CONST.CHAIN_DATA[chain].SCAN_URL + 'token/' + address);
  },
  goTX(chain: string, tx: string) {
    window.open(CONST.CHAIN_DATA[chain].SCAN_URL + 'tx/' + tx);
  },
  goETH(chain: string) {
    window.open(CONST.CHAIN_DATA[chain].SCAN_URL + 'accounts');
  },
};

export const web3Utils: any = {
  toChecksumAddress(address: string) {
    return Web3.utils.toChecksumAddress(address);
  },
  ethAddress: '0x0000000000000000000000000000000000000000',
  isEthAddress(value: string) {
    return Web3.utils.isAddress(value);
  },
};

export const math: any = {
  BN: BN,
  getLast(arr: Array<any>) {
    return arr[arr.length - 1];
  },
  getEffectiveNumber(number: number, effNum: number) {
    if (number > Math.pow(10, effNum)) {
      return Math.floor(number);
    } else {
      if (number.toString().length > effNum) {
        return number.toFixed(effNum);
      } else {
        return number;
      }
    }
  },
  isContainStr(str1: string, str2: string) {
    return str2.indexOf(str1) >= 0;
  },
  isUrl(text: string) {
    const UrlReg = new RegExp(/http(s)?:\/\/([\w-]+\.)+[\w-]+(\/[\w- .\/?%&=]*)?/);
    return UrlReg.test(text);
  },
  formatTime(time: number) {
    let moment = Vue.prototype.$moment;
    // 大于昨天
    if (
      moment()
        .add(-1, 'days')
        .startOf('day') > time
    ) {
      return moment(time).format('M/D HH:mm');
    }
    // 昨天
    if (moment().startOf('day') > time) {
      return '昨天 ' + moment(time).format('HH:mm');
    }
    // 大于五分钟不显示秒
    if (new Date().valueOf() > time + 300000) {
      return moment(time).format('HH:mm');
    }
    return moment(time).format('HH:mm:ss');
  },
  formatDate(time: number) {
    let moment = Vue.prototype.$moment;
    return moment(time).format('Y/M/D HH:mm:ss');
  },
  formatBalance(balance: number, decimals: number, symbol: string, effNum: number) {
    if (balance === undefined) {
      return '...' + ' ' + symbol;
    } else {
      return math.getEffectiveNumber(balance / Math.pow(10, decimals), effNum) + ' ' + symbol;
    }
  },
  formatHash(hash: string) {
    return hash.substring(0, 6) + '...' + hash.substring(60);
  },
  formatName(address: string) {
    return address.substring(0, 6) + '...' + address.substring(38);
  },
};
