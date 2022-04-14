<template>
  <div class="search">
    <div class="search-select">
      <a-select
        show-search
        placeholder="搜索"
        :default-active-first-option="false"
        :show-arrow="false"
        :filter-option="false"
        :not-found-content="null"
        @search="handleSearch"
      >
        <a-select-option v-for="(data, index) in searchData" :key="index" @click="selectChat(data.address)">
          <div v-if="data.address" class="avatar">
            <my-avatar :avatar="app_load.tokenList[data.address].logoURI" :canCheck="false"></my-avatar>
            <span class="avatar-name">{{
              app_load.tokenList[data.address].name +
                ' (' +
                COMMON.math.formatBalance(
                  app_load.balances[data.address][app_user.address],
                  app_load.tokenList[data.address].decimals,
                  app_load.tokenList[data.address].symbol,
                  app_user.decimals
                ) +
                ')'
            }}</span>
          </div>
          <div v-if="data.error">{{ data.message }}</div>
        </a-select-option>
      </a-select>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator';
import { namespace } from 'vuex-class';
import MyAvatar from '@/components/Avatar.vue';
import * as COMMON from '@/const/common';
const chatModule = namespace('chat');
const appModule = namespace('app');

@Component({
  components: {
    MyAvatar,
  },
})
export default class MySearch extends Vue {
  @appModule.State('user') app_user: any;
  @appModule.State('load') app_load: any;
  @appModule.State('const') app_const: any;
  @chatModule.State('user') chat_user: any;

  searchData: Array<any> = [];
  COMMON: any = COMMON;

  created() {}

  async handleSearch(value: string) {
    let mySearchData = [];
    if (COMMON.web3Utils.isEthAddress(value)) {
      try {
        const address = COMMON.web3Utils.toChecksumAddress(value);
        const token = await this.$store.dispatch('app/getToken', address);
        this.$set(this.app_load.tokenList, address, token);
        await this.$store.dispatch('app/addBalance', [address, this.app_user.address]);
        mySearchData.push({ token: true, address });
      } catch (error) {
        mySearchData.push({ error: true, message: error.message });
      }
    } else {
      mySearchData.push({ error: true, message: '不是ETH地址' });
    }
    this.searchData = mySearchData;
  }

  async selectChat(address: string) {
    if (this.app_user.tokens.indexOf(address) == -1) {
      this.app_user.tokens.push(address);
    }
    this.chat_user.activeRoom = address;
    this.searchData = [];
  }
}
</script>
<style lang="scss" scoped>
.avatar {
  display: flex;
  align-items: center;
  height: 37px;
  .avatar-img {
    cursor: pointer;
    width: 25px;
    height: 25px;
  }
  .avatar-name {
    margin-left: 5px;
  }
  .avatar-time {
    font-size: 12px;
    color: rgb(255, 255, 255, 0.75);
    margin-left: 3px;
  }
}
.avatar-card {
  display: flex;
  font-size: 18px;
  flex-direction: column;
  align-items: center;
  > div {
    margin: 4px;
  }
}
.search {
  position: relative;
  height: 60px;
  padding: 10px;
  display: flex;
  align-items: center;
  .search-select {
    width: 100%;
    .ant-select {
      width: 100%;
    }
  }
  .search-dropdown {
    position: absolute;
    right: 10px;
    top: 13px;
    width: 40px;
    height: 34px;
    font-size: 20px;
    cursor: pointer;
    line-height: 40px;
    color: gray;
    transition: 0.2s all linear;
    border-radius: 4px;
    &:hover {
      background-color: skyblue;
    }
  }
}
</style>
