<template>
  <div class="search">
    <div class="search-select">
      <a-select
        show-search
        :placeholder="$t('search.search')"
        :default-active-first-option="false"
        :show-arrow="false"
        :filter-option="false"
        :not-found-content="null"
        @search="handleSearch"
      >
        <a-select-option :value="searchData.address">
          <div v-if="searchData.type == 'erc20'" @click="selectChat(searchData.address)">
            <div
              class="avatar"
            >
              <my-avatar :avatar="appAsync.erc20DetailMap[searchData.address].value.logoURI" :canCheck="false"></my-avatar>
              <span class="avatar-name">{{
                appAsync.erc20DetailMap[searchData.address].value.name +
                  ' (' +
                  utils.format.balance(
                    appAsync.tokenBalanceMap[searchData.address][appSync.userAddress].value,
                    appAsync.erc20DetailMap[searchData.address].value.decimals,
                    appAsync.erc20DetailMap[searchData.address].value.symbol,
                    appStorage.decimalLimit
                  ) +
                  ')'
              }}</span>
            </div>
          </div>
          <div v-else-if="searchData.type == 'wallet'" class="avatar" @click="selectChat(searchData.address)">
            <my-avatar :avatar="appSync.addressAvatarMap[searchData.address]" :canCheck="false"></my-avatar>
            <span class="avatar-name">{{ searchData.address }}</span>
          </div>
          <div v-else-if="searchData.err">{{ searchData.err }}</div>
          <div v-else @click="selectChat(searchData.address)">{{ $t('search.unknown_contract_address') }}</div>
        </a-select-option>
      </a-select>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import { namespace } from 'vuex-class';
import MyAvatar from '@/components/Avatar.vue';
import { utils, etherUtils } from '@/const';
import { AppStorage, AppSync, AppAsync, ChatSync } from '@/store';
const chatModule = namespace('chat');
const appModule = namespace('app');

@Component({
  components: {
    MyAvatar,
  },
})
export default class MySearch extends Vue {
  @appModule.State('storage') appStorage: AppStorage;
  @appModule.State('sync') appSync: AppSync;
  @appModule.State('async') appAsync: AppAsync;
  @chatModule.State('sync') chatSync: ChatSync;

  searchData: { address?: string; type?: string; err?: string } = {};
  utils = utils;

  async handleSearch(value: string) {
    if (etherUtils.isAddress(value)) {
      try {
        const address = etherUtils.getAddress(value);
        const type = await this.$store.state.app.sync.ether.utils.getType(address);
        if (type == 'erc20') {
          await this.$store.dispatch('app/setTokenBalance', [address, this.appSync.userAddress]);
          await this.$store.dispatch('app/setERC20Detail', address);
        } else if (type == 'wallet') {
          await this.$store.dispatch('app/setAddressAvatar', address);
        }
        this.searchData = {
          address,
          type,
        };
        // eslint-disable-next-line prettier/prettier
      } catch (err:any) {
        console.log(err);
        this.searchData = {
          err: err.message,
        };
      }
    } else {
      this.searchData = {
        err: this.$t('search.not_ether_address').toString(),
      };
    }
  }

  async selectChat(address: string) {
    await this.$store.dispatch('chat/setUserActiveRecipient', address);
    this.searchData = {};
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
