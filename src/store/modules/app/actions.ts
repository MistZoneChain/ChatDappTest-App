/*
 * @Author: 33357
 * @Date: 2021-02-26 16:13:39
 * @LastEditTime: 2021-03-02 21:40:01
 * @LastEditors: 33357
 */
import { ActionTree } from 'vuex';
import Vue from 'vue';
import { AppState } from './state';
import { RootState } from '../../index';
import * as TOKEN_LIST from '@/const/tokenList';
import * as COMMON from '@/const/common';
import * as CONST from '@/const/const';
import Identicon from 'identicon.js';

const actions: ActionTree<AppState, RootState> = {
  async addAvatar({ state }, address) {
    if (state.load.avatars[address] === undefined) {
      Vue.set(state.load.avatars, address, 'data:image/png;base64,' + new Identicon(address, 120).toString());
    }
  },

  async addBalance({ state }, [cAddress, wAddress]) {
    //console.log('addBalance', { cAddress, wAddress });
    if (state.load.balances[cAddress] === undefined) {
      Vue.set(state.load.balances, cAddress, {});
    }
    if (state.load.balances[cAddress][wAddress] === undefined) {
      Vue.set(state.load.balances[cAddress], wAddress, null);
      if (cAddress == COMMON.web3Utils.ethAddress) {
        Vue.set(state.load.balances[cAddress], wAddress, await state.const.web3.EthFunc.balance(wAddress));
      } else {
        Vue.set(state.load.balances[cAddress], wAddress, await state.const.web3.Erc20Func.balance(cAddress, wAddress));
      }
    }
  },

  async getToken({ state }, cAddress) {
    let token: any = {};
    for (const i in TOKEN_LIST.DEFAULT[state.const.chain]) {
      const element = TOKEN_LIST.DEFAULT[state.const.chain][i];
      const address = COMMON.web3Utils.toChecksumAddress(element.address);
      if (address == cAddress) {
        token = element;
      }
    }
    const res = await Promise.all([
      token.name ? token.name : await state.const.web3.Erc20Func.name(cAddress),
      token.symbol ? token.symbol : await state.const.web3.Erc20Func.symbol(cAddress),
      token.decimals ? token.decimals : await state.const.web3.Erc20Func.decimals(cAddress),
      token.totalSupply ? token.totalSupply : await state.const.web3.Erc20Func.totalSupply(cAddress),
    ]);
    return {
      address: cAddress,
      name: res[0],
      symbol: res[1],
      decimals: res[2],
      totalSupply: res[3],
      logoURI: token.logoURI ? token.logoURI : './static/token/empty-token.png',
    };
  },
};

export default actions;
