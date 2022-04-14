<!--
 * @Author: 33357
 * @Date: 2021-02-26 16:13:39
 * @LastEditTime: 2021-03-02 19:53:00
 * @LastEditors: 33357
-->

<template>
  <div class="avatar">
    <a-popover>
      <div slot="content" class="avatar-card" v-if="canCheck">
        <a-avatar :size="60" :src="avatar" />
        <div>{{ showName }}</div>
        <a-button @click="$emit('goTo')" type="primary" :disabled="disabled">{{ $t('avatar.view_on_the_blockchain_browser') }}</a-button>
      </div>
      <a-avatar class="avatar-img" :src="avatar" />
    </a-popover>
    <div>
      <span class="avatar-name">{{ name }}</span>
      <span class="avatar-time">{{ time }}</span>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator';

@Component
export default class MyAvatar extends Vue {
  @Prop() avatar: string;
  @Prop() name: string;
  @Prop() time: string;
  @Prop() showName: string;
  @Prop({ default: false }) disabled: boolean;
  @Prop({ default: true }) canCheck: boolean;
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
</style>
