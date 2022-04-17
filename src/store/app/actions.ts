/*
 * @Author: 33357
 * @Date: 2021-02-26 16:13:39
 * @LastEditTime: 2021-03-02 21:40:01
 * @LastEditors: 33357
 */
import { ActionTree } from 'vuex';
import Vue from 'vue';
import { RootState, AppState } from '../index';
import { utils } from '@/const';
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
    await dispatch('setAvatar', state.sync.userAddress);
  },

  async watchStorage({ state }) {
    try {
      const storage = localStorage.getItem(state.sync.userAddress);
      if (storage) {
        utils.deep.clone(state.storage, JSON.parse(storage));
      } else {
        throw new Error('localStorage is empty!');
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
  },

  async setAvatar({ state }, address: string) {
    if (!state.sync.avatarMap[address]) {
      Vue.set(state.sync.avatarMap, address, utils.get.avatar(address));
    }
  },
};

export default actions;
