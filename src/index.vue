<template>
  <div
    class="chat"
    :style="{
      '--bg-image': `url('${app_user.background}')`,
    }"
  >
    <div class="chat-part1" v-if="visibleTool">
      <my-tool></my-tool>
    </div>
    <div class="chat-part2">
      <my-search></my-search>
      <my-room></my-room>
    </div>
    <div class="chat-part3">
      <a-icon class="chat-team" type="message" @click="toggleDrawer" />
      <div class="chat-tool">
        <a-icon type="menu-fold" @click="toggleTool" v-if="visibleTool" />
        <a-icon type="menu-unfold" @click="toggleTool" v-else />
      </div>
      <my-message></my-message>
    </div>
    <a-drawer placement="left" :closable="false" :visible="visibleDrawer" @close="toggleDrawer" style="height: 100%">
      <div class="chat-drawer">
        <my-search></my-search>
        <my-room></my-room>
      </div>
    </a-drawer>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import MyTool from '@/components/Tool.vue';
import MyRoom from '@/components/Room.vue';
import MyMessage from '@/components/Message.vue';
import MySearch from '@/components/Search.vue';
import { namespace } from 'vuex-class';
import * as TOKEN_LIST from '@/const/tokenList';
import * as COMMON from '@/const/common';
const appModule = namespace('app');

@Component({
  components: {
    MyTool,
    MyRoom,
    MyMessage,
    MySearch,
  },
})
export default class MyChat extends Vue {
  @appModule.State('user') app_user: any;
  @appModule.State('const') app_const: any;
  @appModule.State('load') app_load: any;

  visibleDrawer: boolean = false;
  visibleTool: boolean = true;

  async created() {
    if (this.app_const.mobile) {
      this.visibleDrawer = true;
      this.visibleTool = false;
    }
    window.addEventListener('load', async () => {
      try {
        await this.login();
        await this.setToken();
      } catch (err) {
        console.log(err);
        this.$message.error(err.message);
      }
    });
  }

  async login() {
    const { wAddress, chain } = await this.app_const.web3.getWeb3();
    this.app_user.address = wAddress;
    this.app_const.chain = chain;
    this.$store.dispatch('app/addAvatar', wAddress);
  }

  async setToken() {
    TOKEN_LIST.DEFAULT[this.app_const.chain].forEach(async (element: { address: any }) => {
      try {
        const address = COMMON.web3Utils.toChecksumAddress(element.address);
        if (address == COMMON.web3Utils.ethAddress || (await this.app_const.web3.Erc20Func.balance(address, this.app_user.address)) != 0) {
          const token = await this.$store.dispatch('app/getToken', address);
          this.$set(this.app_load.tokenList, address, token);
          this.app_user.tokens.push(address);
          this.$store.dispatch('app/addBalance', [address, this.app_user.address]);
        }
      } catch (err) {
        console.log(err);
        this.$message.error(err.message);
      }
    });
  }

  toggleDrawer() {
    this.visibleDrawer = !this.visibleDrawer;
  }

  toggleTool() {
    this.visibleTool = !this.visibleTool;
  }
}
</script>
<style lang="scss" scoped>
.chat {
  font-size: 16px;
  z-index: 999;
  max-width: 1000px;
  min-width: 300px;
  width: 100%;
  height: 80%;
  max-height: 900px;
  min-height: 470px;
  position: relative;
  margin: auto 20px;
  box-shadow: 10px 20px 80px rgba(0, 0, 0, 0.8);
  display: flex;
  border-radius: 5px;
  overflow: hidden;
  .chat-part1 {
    width: 74px;
    height: 100%;
    background-color: rgb(0, 0, 0, 0.7);
  }
  .chat-part2 {
    width: 230px;
    height: 100%;
    background-color: rgb(0, 0, 0, 0.3);
  }
  .chat-part3 {
    flex: 1;
    height: 100%;
    background-color: rgb(0, 0, 0, 0.2);
    overflow-y: hidden;
    position: relative;
    .chat-group {
      height: 53px;
      border-bottom: 1px solid #ccc;
      line-height: 50px;
      font-weight: bold;
    }
  }
  .chat-team {
    display: none;
  }
  .chat-tool {
    display: none;
  }
}
.chat::after {
  content: '';
  background: var(--bg-image) 0 / cover fixed;
  position: absolute;
  object-fit: cover;
  width: 100%;
  height: 100%;
  filter: blur(10px);
  transform: scale(1.08);
  z-index: -1;
}

@media screen and (max-width: 768px) {
  .chat {
    margin: 0;
    height: 100%;
    .chat-part2 {
      display: none;
    }
    .chat-team {
      display: block !important;
      position: absolute;
      font-size: 25px;
      top: 17px;
      left: 60px;
      z-index: 999;
      &:active {
        color: skyblue;
      }
    }
    .chat-tool {
      display: block !important;
      position: absolute;
      font-size: 25px;
      top: 13px;
      left: 20px;
      z-index: 999;
      &:active {
        color: skyblue;
      }
    }
  }
}
</style>
