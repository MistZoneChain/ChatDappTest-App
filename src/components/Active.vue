<template>
  <div class="active">
    <div>
      <a-icon type="team" @click="showGroupPerson = !showGroupPerson" class="active-button" :class="{ heightLight: showGroupPerson }" />
      <a-drawer
        placement="right"
        :closable="false"
        :visible="showGroupPerson"
        :get-container="getElement"
        @close="showGroupPerson = !showGroupPerson"
        :wrap-style="{ position: 'absolute' }"
      >
        <div class="active-content">
          <div class="actiev-content-title">群聊信息</div>
          <div class="active-content-sum">群聊成员: {{ persons.length }}</div>
          <div class="active-content-users">
            <div class="active-content-user" v-for="(address, index) in persons" :key="index">
              <my-avatar
                :avatar="app_load.avatars[address]"
                :name="
                  chat_user.activeRoom === CONST.CHAIN_DATA[app_const.chain].COINERCHAT_GROUP
                    ? COMMON.math.formatName(address)
                    : COMMON.math.formatBalance(
                        app_load.balances[chat_user.activeRoom][address],
                        app_load.tokenList[chat_user.activeRoom].decimals,
                        app_load.tokenList[chat_user.activeRoom].symbol,
                        app_user.decimals
                      )
                "
                :showName="COMMON.math.formatName(address)"
                @goTo="COMMON.link.goAddress(app_const.chain, address)"
              ></my-avatar>
            </div>
          </div>
        </div>
      </a-drawer>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator';
import MyAvatar from '@/components/Avatar.vue';
import { namespace } from 'vuex-class';
import * as COMMON from '@/const/common';
import * as CONST from '@/const/const';

const chatModule = namespace('chat');
const appModule = namespace('app');

@Component({
  components: {
    MyAvatar,
  },
})
export default class MyActive extends Vue {
  @appModule.State('user') app_user: any;
  @appModule.State('load') app_load: any;
  @appModule.State('const') app_const: any;
  @chatModule.State('user') chat_user: any;
  @chatModule.State('load') chat_load: any;

  COMMON: any = COMMON;
  CONST: any = CONST;

  persons: Array<any> = [];
  showGroupPerson: boolean = false;

  @Watch('app_load.balances', { deep: true })
  changeTokenBalanceGather() {
    if (this.showGroupPerson) {
      this.sortPersons();
    }
  }

  @Watch('chat_user.activeRoom')
  changeActiveRoom() {
    if (this.showGroupPerson) {
      this.setGroupPersons();
      this.sortPersons();
    }
  }

  @Watch('showGroupPerson')
  changeShowGroupPerson() {
    if (this.showGroupPerson) {
      this.setGroupPersons();
      this.sortPersons();
    }
  }

  async setGroupPersons() {
    if (this.chat_load.groups[this.chat_user.activeRoom].persons) {
      this.chat_load.groups[this.chat_user.activeRoom].persons.forEach((address: any) => {
        this.$store.dispatch('app/addAvatar', address);
        this.$store.dispatch('app/addBalance', [this.chat_user.activeRoom, address]);
      });
    }
  }

  sortPersons() {
    if (this.chat_user.activeRoom !== CONST.CHAIN_DATA[this.app_const.chain].COINERCHAT_GROUP) {
      this.persons = [...this.chat_load.groups[this.chat_user.activeRoom].persons];
      this.persons = this.persons.sort((a: string, b: string) => {
        if (this.app_load.balances[this.chat_user.activeRoom][a] && this.app_load.balances[this.chat_user.activeRoom][b]) {
          return this.app_load.balances[this.chat_user.activeRoom][b] - this.app_load.balances[this.chat_user.activeRoom][a];
        }
        if (this.app_load.balances[this.chat_user.activeRoom][a]) {
          return -1;
        }
        return 1;
      });
    }
  }

  getElement() {
    return document.getElementsByClassName('message')[0];
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
    width: 35px;
    height: 35px;
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
.active {
  position: absolute;
  width: 170px;
  right: 0;
  z-index: 100;
  border-radius: 0 0 5px 5px;
  .active-button {
    position: absolute;
    z-index: 999;
    top: -43px;
    right: 20px;
    font-size: 25px;
    cursor: pointer;
    &:active {
      color: skyblue;
    }
  }
  .active-button.heightLight {
    color: skyblue;
  }
}
::-webkit-scrollbar {
  display: none !important;
}
</style>
