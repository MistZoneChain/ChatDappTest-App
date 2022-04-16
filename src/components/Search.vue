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
        <a-select-option v-if="searchData.recipientText" :value="searchData.recipientText">
          <div @click="selectChat(searchData.recipientText)">
            <div class="avatar">
              <my-avatar :avatar="appSync.avatarMap[searchData.recipientHash]" :canCheck="false"></my-avatar>
              <span class="avatar-name">{{ `${searchData.recipientText} 消息：${searchData.recipientMessageIdLength}` }}</span>
            </div>
          </div>
        </a-select-option>
      </a-select>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import { namespace } from 'vuex-class';
import MyAvatar from '@/components/Avatar.vue';
import { utils } from '@/const';
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

  searchData: { recipientText?: string; recipientHash?: string; recipientMessageIdLength?: number } = {};
  utils = utils;

  async handleSearch(recipientText: string) {
    const recipientHash = (await this.appSync.ether.getBlockChat().getRecipientHash(recipientText)).toString();
    await this.$store.dispatch('app/setAvatar', recipientHash);
    const recipientMessageIdLength = (await this.appSync.ether.getBlockChat().getRecipientMessageListLength(recipientHash)).toNumber();
    this.searchData = {
      recipientText,
      recipientHash,
      recipientMessageIdLength,
    };
  }

  async selectChat(recipientText: string) {
    await this.$store.dispatch('chat/setActiveRecipient', recipientText);
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
