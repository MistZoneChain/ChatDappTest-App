<template>
  <div id="app">
    <router-view />
    <img class="background" v-if="app_user.background" :src="app_user.background" alt="" />
  </div>
</template>
<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import { namespace } from 'vuex-class';
import * as CONST from '@/const/const';
const appModule = namespace('app');

@Component
export default class MyChat extends Vue {
  @appModule.State('const') app_const: any;
  @appModule.State('user') app_user: any;

  mounted() {
    this.app_const.mobile = this.isMobile();
    if (!this.app_user.background || !this.app_user.background.trim().length) {
      this.app_user.background = CONST.BACKGROUND[0].url;
    }
  }

  isMobile() {
    let flag = navigator.userAgent.match(
      /(phone|pad|pod|iPhone|iPod|ios|iPad|Android|Mobile|BlackBerry|IEMobile|MQQBrowser|JUC|Fennec|wOSBrowser|BrowserNG|WebOS|Symbian|Windows Phone)/i
    );
    return flag && flag.length;
  }
}
</script>
<style lang="scss">
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
  height: 100%;
  width: 100%;
  overflow: hidden;
  background-size: cover;
  color: rgba(255, 255, 255, 0.85);
  background-color: #fff;
  .background {
    position: absolute;
    object-fit: cover;
    width: 100%;
    height: 100%;
  }
}
</style>
