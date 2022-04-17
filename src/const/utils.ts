import Vue from 'vue';

import { common } from '.';

export { utils as etherUtils, BigNumber } from 'ethers';

import Identicon from 'identicon.js';

const have = {
  value(obj: any) {
    return obj && Object.keys(obj).length != 0;
  },
};

const deep = {
  clone(toObj: any, fromObj: any) {
    Object.keys(toObj).forEach((key) => {
      if (fromObj[key]) {
        if (Object.prototype.toString.call(fromObj[key]) != '[object Object]') {
          toObj[key] = fromObj[key];
        } else {
          deep.clone(toObj[key], fromObj[key]);
        }
      }
    });
  },
  equal(obj1: any, obj2: any) {
    return obj1.toString() == obj2.toString();
  },
};

const get = {
  last(arr: Array<any>) {
    return arr[arr.length - 1];
  },
  effectiveNumber(number: number, effNum: number) {
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
  avatar(address: string) {
    return 'data:image/png;base64,' + new Identicon(address, 120).toString();
  },
};

const is = {
  url(text: string) {
    const UrlReg = new RegExp(/http(s)?:\/\/([\w-]+\.)+[\w-]+(\/[\w- .\/?%&=]*)?/);
    return UrlReg.test(text);
  },
  mobile() {
    let flag = navigator.userAgent.match(
      /(phone|pad|pod|iPhone|iPod|ios|iPad|Android|Mobile|BlackBerry|IEMobile|MQQBrowser|JUC|Fennec|wOSBrowser|BrowserNG|WebOS|Symbian|Windows Phone)/i
    );
    if (flag && flag.length) {
      return true;
    }
    return false;
  },
};

const format = {
  time(time: number) {
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

  date(time: number) {
    let moment = Vue.prototype.$moment;
    return moment(time).format('Y/M/D HH:mm:ss');
  },

  balance(balance: number, decimals: number, symbol: string, effNum: number) {
    if (balance === undefined) {
      return '...' + ' ' + symbol;
    } else {
      return get.effectiveNumber(balance / Math.pow(10, decimals), effNum) + ' ' + symbol;
    }
  },

  hash(hash: string) {
    return hash.substring(0, 6) + '...' + hash.substring(60);
  },

  address(address: string) {
    return address.substring(0, 6) + '...' + address.substring(38);
  },
};

const go = {
  address(chainName: string, address: string) {
    window.open(common.chain[chainName].scanUrl + 'address/' + address);
  },

  token(chainName: string, address: string) {
    window.open(common.chain[chainName].scanUrl + 'token/' + address);
  },

  tx(chainName: string, tx: string) {
    window.open(common.chain[chainName].scanUrl + 'tx/' + tx);
  },

  accounts(chainName: string) {
    window.open(common.chain[chainName].scanUrl + 'accounts');
  },
};

export const utils = {
  deep,
  get,
  is,
  have,
  format,
  go,
};
