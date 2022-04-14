/*
 * @Author: 33357
 * @Date: 2021-02-26 16:13:39
 * @LastEditTime: 2021-03-02 21:40:01
 * @LastEditors: 33357
 */
import { ActionTree } from 'vuex';
import Vue from 'vue';
import { RootState, AppState, TokenBalanceMap, ERC20Detail, AsyncBalance, AsyncERC20Detail } from '../index';
import { common, contractDetails, BigNumber, utils } from '@/const';
import { Ether } from '@/api';

const actions: ActionTree<AppState, RootState> = {
  async start({ dispatch }) {
    try {
      await dispatch('setSync');
      await dispatch('watchStorage');
      console.log('app start success!');
    } catch (err) {
      throw err;
    }
  },

  async setSync({ state, dispatch }) {
    state.sync.isMobile = utils.is.mobile();
    state.sync.ether = new Ether();
    await state.sync.ether.load();
    state.sync.userAddress = await state.sync.ether.getSinger().getAddress();
    await dispatch('setAddressAvatar', state.sync.userAddress);
  },

  async watchStorage({ state }) {
    try {
      const storage = localStorage.getItem(state.sync.userAddress);
      if (storage) {
        utils.deep.clone(state.storage, JSON.parse(storage));
      } else {
        throw '';
      }
    } catch (err) {
      localStorage.setItem(state.sync.userAddress, JSON.stringify(state.storage));
    }
    this.watch(
      (state) => state.app.storage,
      (storage) => {
        localStorage.setItem(state.sync.userAddress, JSON.stringify(storage));
      },
      {
        deep: true,
      }
    );
    if (state.storage.background.length == 0) {
      state.storage.background = common.backgrounds[0].url;
    }
    if (state.storage.recipientMap.deleteArr.indexOf(state.sync.userAddress) == -1) {
      state.storage.recipientMap.setArr.push(state.sync.userAddress);
    }
  },

  async setAddressAvatar({ state }, address: string) {
    if (!state.sync.addressAvatarMap[address]) {
      Vue.set(state.sync.addressAvatarMap, address, utils.get.avatar(address));
    }
  },

  async setTokenBalance({ state }, [tokenAddress, walletAddress]) {
    if (!state.async.tokenBalanceMap[tokenAddress]) {
      Vue.set(state.async.tokenBalanceMap, tokenAddress, {} as TokenBalanceMap);
    }
    if (!state.async.tokenBalanceMap[tokenAddress][walletAddress]) {
      Vue.set(state.async.tokenBalanceMap[tokenAddress], walletAddress, {} as AsyncBalance);
      let balance;
      if (tokenAddress == common.etherAddress) {
        balance = await state.sync.ether.metamask.getBalance(walletAddress);
      } else {
        balance = await state.sync.ether.getERC20(tokenAddress).balanceOf(walletAddress);
      }
      Vue.set(state.async.tokenBalanceMap[tokenAddress][walletAddress], 'value', balance);
    }
  },

  async setERC20Detail({ state }, erc20Address: string) {
    if (!state.async.erc20DetailMap[erc20Address]) {
      const token = contractDetails[state.sync.ether.getNetwork()].erc20.find((token) => {
        return token.address == erc20Address;
      });
      if (token) {
        const erc20Detail: ERC20Detail = {
          logoURI: token.logoURI ? token.logoURI : './static/token/empty-token.png',
          name: token.name ? token.name : '',
          symbol: token.symbol ? token.symbol : '',
          decimals: token.decimals ? token.decimals : 18,
          totalSupply: token.totalSupply ? token.totalSupply : BigNumber.from(0),
        };
        Vue.set(state.async.erc20DetailMap, erc20Address, { value: erc20Detail } as AsyncERC20Detail);
      } else {
        Vue.set(state.async.erc20DetailMap, erc20Address, {} as AsyncERC20Detail);
      }
      if (erc20Address != common.etherAddress) {
        const erc20 = state.sync.ether.getERC20(erc20Address);
        const res = await Promise.all([erc20.name(), erc20.symbol(), erc20.decimals(), erc20.totalSupply()]);
        const erc20Detail: ERC20Detail = {
          logoURI: state.async.erc20DetailMap[erc20Address].value.logoURI
            ? state.async.erc20DetailMap[erc20Address].value.logoURI
            : './static/token/empty-token.png',
          name: res[0],
          symbol: res[1],
          decimals: res[2],
          totalSupply: res[3],
        };
        Vue.set(state.async.erc20DetailMap[erc20Address], 'value', erc20Detail);
      }
    }
  },
};

export default actions;
