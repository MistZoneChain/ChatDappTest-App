<template>
  <div class="message">
    <div class="message-header">
      <div class="message-header-box">
        <span class="message-header-text" v-if="app_load.tokenList[chat_user.activeRoom] && chat_load.groups[chat_user.activeRoom]">
          {{
            app_load.tokenList[chat_user.activeRoom].name +
              (chat_user.activeRoom === CONST.CHAIN_DATA[app_const.chain].COINERCHAT_GROUP
                ? ''
                : '(' + app_load.tokenList[chat_user.activeRoom].symbol + ') ') +
              ' 成员：' +
              (chat_load.groups[chat_user.activeRoom].persons ? chat_load.groups[chat_user.activeRoom].persons.length : '')
          }}
        </span>
        <a-icon type="sync" spin class="message-header-icon" v-if="listening" />
        <my-active></my-active>
      </div>
    </div>
    <transition name="loading">
      <div class="message-loading" v-if="status === 'load' || status === 'get'">
        <a-icon type="sync" spin class="message-loading-icon" />
      </div>
    </transition>
    <div class="message-main" :style="{ opacity: messageOpacity }">
      <div class="message-content" v-if="chat_load.groups[chat_user.activeRoom]">
        <transition name="noData">
          <div
            class="message-content-noData"
            v-if="chat_load.groups[chat_user.activeRoom].messageLength <= chat_load.groups[chat_user.activeRoom].messageIds.length"
          >
            没有更多消息了~
          </div>
        </transition>
        <template v-for="(message, index) in messages">
          <div class="message-content-message" :key="index" :class="{ 'text-right': message.sAddress === app_user.address }">
            <my-avatar
              :avatar="app_load.avatars[message.sAddress]"
              :name="
                message.sAddress === app_user.address
                  ? ''
                  : message.gAddress === CONST.CHAIN_DATA[app_const.chain].COINERCHAT_GROUP
                  ? COMMON.math.formatName(message.sAddress)
                  : COMMON.math.formatBalance(
                      app_load.balances[message.gAddress][message.sAddress],
                      app_load.tokenList[message.gAddress].decimals,
                      app_load.tokenList[message.gAddress].symbol,
                      app_user.decimals
                    )
              "
              :time="COMMON.math.formatDate(message.cDate)"
              :showName="COMMON.math.formatName(message.sAddress)"
              @goTo="COMMON.link.goAddress(app_const.chain, message.sAddress)"
            ></my-avatar>
            <a-popover trigger="click" style="display:inline-block" v-if="message.block">
              <div slot="content" class="avatar-card">
                <a-icon type="loading" class="loading1-icon" v-if="message.block.status === 'loading1'" />
                <a-icon type="loading" class="loading2-icon" v-if="message.block.status === 'loading2'" />
                <a-icon type="exclamation-circle" class="error-icon" v-if="message.block.status === 'error'" />
                <a-icon type="check-circle" class="check-icon" v-if="message.block.status === 'success'" />
                <div>
                  {{ message.hash ? COMMON.math.formatHash(message.hash) : '没有发送！' }}
                </div>
                <a-button @click="COMMON.link.goTX(app_const.chain, message.hash)" type="primary" :disabled="!message.hash"
                  >在区块链浏览器上查看</a-button
                >
              </div>
              <a-icon type="loading" class="loading1-icon" v-if="message.block.status === 'loading1'" />
              <a-icon type="loading" class="loading2-icon" v-if="message.block.status === 'loading2'" />
              <a-icon type="exclamation-circle" class="error-icon" v-if="message.block.status === 'error'" />
              <a-icon type="check-circle" class="check-icon" v-if="message.block.status === 'success'" />
            </a-popover>
            <div v-if="message.type === 0" class="message-content-text">
              <a v-if="COMMON.math.isUrl(message.content)" :href="message.content" target="_blank">{{ message.content }} </a>
              <div v-else v-text="message.content"></div>
            </div>
          </div>
        </template>
      </div>
    </div>
    <my-input></my-input>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator';
import MyAvatar from '@/components/Avatar.vue';
import MyActive from '@/components/Active.vue';
import MyInput from '@/components/Input.vue';
import { namespace } from 'vuex-class';
const chatModule = namespace('chat');
const appModule = namespace('app');
import * as COMMON from '@/const/common';
import * as CONST from '@/const/const';

@Component({
  components: {
    MyActive,
    MyAvatar,
    MyInput,
  },
})
export default class MyMessage extends Vue {
  @appModule.State('user') app_user: any;
  @appModule.State('load') app_load: any;
  @appModule.State('const') app_const: any;
  @chatModule.State('user') chat_user: any;
  @chatModule.State('load') chat_load: any;

  COMMON: any = COMMON;
  CONST: any = CONST;

  messageDom: HTMLElement;
  messageContentDom: HTMLElement;
  headerDom: HTMLElement;
  messageOpacity: number = 1;
  lastMessagePosition: number = 0;
  listening: boolean = true;
  status: string = 'listen';
  messages: Array<any> = [];

  @Watch('chat_load.messages', { deep: true })
  changeMessages() {
    this.setMessages();
    this.checkMessages();
  }

  @Watch('chat_user.myMessages', { deep: true })
  changeMyMessages() {
    if (this.chat_user.myMessages[this.chat_user.activeRoom].length) {
      this.setMessages();
      this.scrollToBottom();
    }
  }

  @Watch('chat_user.activeRoom')
  changeActiveRoom() {
    this.messageOpacity = 0;
    if (this.headerDom) {
      this.headerDom.classList.add('transition');
      setTimeout(() => {
        this.headerDom.classList.remove('transition');
      }, 400);
    }
    this.scrollToBottom();
  }

  mounted() {
    this.status = 'load';
    if (!this.chat_user.myMessages[this.chat_user.activeRoom]) {
      this.$set(this.chat_user.myMessages, this.chat_user.activeRoom, []);
    }
    this.checkMessages();
  }

  setMessages() {
    let messages = [];
    let messageIds = [];
    for (let i in this.chat_user.myMessages[this.chat_user.activeRoom]) {
      messages.push({ ...this.chat_user.myMessages[this.chat_user.activeRoom][i], sAddress: this.app_user.address });
      if (this.chat_user.myMessages[this.chat_user.activeRoom][i].messageId) {
        messageIds.push(this.chat_user.myMessages[this.chat_user.activeRoom][i].messageId);
      }
    }
    for (let i in this.chat_load.groups[this.chat_user.activeRoom].messageIds) {
      console.log(this.chat_load.groups[this.chat_user.activeRoom].messageIds[i]);
      console.log(messageIds.indexOf(this.chat_load.groups[this.chat_user.activeRoom].messageIds[i]));
      if (
        messageIds.indexOf(this.chat_load.groups[this.chat_user.activeRoom].messageIds[i]) == -1 &&
        this.chat_load.messages[this.chat_load.groups[this.chat_user.activeRoom].messageIds[i]]
      ) {
        messages.push(this.chat_load.messages[this.chat_load.groups[this.chat_user.activeRoom].messageIds[i]]);
      }
    }
    messages = messages.sort((a: any, b: any) => {
      return a.cDate - b.cDate;
    });
    this.messages = messages;
  }

  checkMessages() {
    if (this.chat_load.groups[this.chat_user.activeRoom]) {
      let have = true;
      for (let i = 0; i < this.chat_load.groups[this.chat_user.activeRoom].messageIds.length; i++) {
        if (!this.chat_load.messages[this.chat_load.groups[this.chat_user.activeRoom].messageIds[i]]) {
          have = false;
        }
      }
      if (this.status === 'get') {
        this.scrollTo();
      }
      if (have) {
        if (this.status === 'load') {
          this.messageDom = document.getElementsByClassName('message-main')[0] as HTMLElement;
          this.messageContentDom = document.getElementsByClassName('message-content')[0] as HTMLElement;
          this.headerDom = document.getElementsByClassName('message-header-text')[0] as HTMLElement;
          this.messageDom.addEventListener('scroll', this.handleScroll);
          this.scrollToBottom();
        }
        if (
          this.status === 'listen' &&
          this.messageDom.scrollTop + this.messageDom.offsetHeight + 100 > this.messageContentDom.scrollHeight
        ) {
          this.scrollToBottom();
        }
        this.status = 'listen';
      }
    }
  }

  /**
   * 监听滚动事件
   */
  handleScroll(event: Event) {
    if (event.currentTarget) {
      if (this.messageDom.scrollTop === 0 && this.status === 'listen') {
        this.lastMessagePosition = this.messageContentDom.offsetHeight;
        this.getMoreMessage();
      }
    }
  }

  /**
   * 获取更多消息
   * @params text
   */
  async getMoreMessage() {
    if (this.chat_load.groups[this.chat_user.activeRoom].start !== 0) {
      this.status = 'get';
      let start = 0;
      if (this.chat_load.groups[this.chat_user.activeRoom].start > this.app_user.messageSkip) {
        start = this.chat_load.groups[this.chat_user.activeRoom].start - this.app_user.messageSkip;
      }
      const messageIds = await this.app_const.web3.MessageFunc.getLimitMessageIdsByGroup(
        this.chat_user.activeRoom,
        this.app_user.messageSkip,
        start
      );
      this.$set(this.chat_load.groups[this.chat_user.activeRoom], 'messageIds', [
        ...messageIds,
        ...this.chat_load.groups[this.chat_user.activeRoom].messageIds,
      ]);
      this.$set(this.chat_load.groups[this.chat_user.activeRoom], 'start', start);
    }
  }
  /**
   * 滚动到底部
   */
  scrollToBottom() {
    this.$nextTick(() => {
      this.messageDom.scrollTop = this.messageDom.scrollHeight;
      this.messageOpacity = 1;
    });
  }

  scrollTo() {
    this.$nextTick(() => {
      this.messageDom.scrollTop = this.messageContentDom.offsetHeight - this.lastMessagePosition;
    });
  }
}
</script>
<style lang="scss" scoped>
.message {
  overflow: hidden;
  height: 100%;
  position: relative;
  .message-header {
    height: 60px;
    line-height: 60px;
    z-index: 100;
    background-color: rgb(0, 0, 0, 0.6);
    .message-header-text {
      color: #fff;
    }
    .message-header-icon {
      margin-left: 5px;
    }
  }
  .message-loading {
    position: absolute;
    left: calc(50% - 18px);
    top: 60px;
    z-index: 99;
    .message-loading-icon {
      margin: 10px auto;
      font-size: 20px;
      padding: 8px;
      border-radius: 50%;
      background-color: rgb(0, 0, 0, 0.8);
    }
  }
  .message-main {
    height: calc(100% - 100px);
    overflow: auto;
    position: relative;
    .message-content {
      .message-content-noData {
        line-height: 50px;
      }
      .message-content-message {
        text-align: left;
        margin: 10px 20px;
        .message-content-text,
        .message-content-image {
          max-width: 600px;
          display: inline-block;
          overflow: hidden;
          margin-top: 4px;
          padding: 6px;
          background-color: rgba(0, 0, 0, 0.4);
          font-size: 16px;
          border-radius: 5px;
          text-align: left;
          word-break: break-word;
        }
        .message-content-image {
          max-height: 350px;
          max-width: 350px;
          img {
            cursor: pointer;
            max-width: 335px;
            max-height: 335px;
          }
        }
      }
      .text-right {
        text-align: right !important;
        .avatar {
          justify-content: flex-end;
        }
      }
    }
  }
  .message-input {
    display: flex;
    flex-wrap: nowrap;
    position: absolute;
    width: 100%;
    bottom: 0px;
    input {
      height: 40px;
    }
    .message-input-button {
      width: 30px;
      cursor: pointer;
      position: absolute;
      right: 10px;
      top: 4px;
    }
  }
}

//输入框样式
.ant-input {
  padding: 0 50px 0 50px;
}
// 消息工具样式
.messagte-tool-icon {
  position: absolute;
  left: 0;
  top: 0;
  width: 50px;
  height: 40px;
  text-align: center;
  line-height: 42px;
  font-size: 16px;
  cursor: pointer;
  z-index: 99;
}
.message-tool-item {
  width: 0px;
  height: 240px;
  cursor: pointer;
  .message-tool-contant {
    width: 50px;
    padding: 5px;
    border-radius: 5px;
    transition: all linear 0.2s;
    .message-tool-item-img {
      width: 40px;
    }
    .message-tool-item-text {
      text-align: center;
      font-size: 10px;
    }
    &:hover {
      background: rgba(135, 206, 235, 0.6);
    }
  }
}

// 移动端样式
@media screen and (max-width: 768px) {
  .message-main {
    .message-content-image {
      img {
        cursor: pointer;
        max-width: 138px !important;
        height: inherit !important;
      }
    }
  }
}
@media screen and (max-width: 500px) {
  .message-header-box {
    .message-header-text {
      display: block;
      width: 36%;
      margin: 0 auto;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .message-header-icon {
      position: absolute;
      top: 17px;
      right: 60px;
      font-size: 25px;
    }
  }
}
.loading-enter-active {
  transition: all 0.3s ease;
}
.loading-leave-active {
  transition: all 0.3s cubic-bezier(1, 0.5, 0.8, 1);
}
.loading-enter,
.loading-leave-to {
  transform: translateY(-30px);
  opacity: 0;
}

.noData-enter-active,
.noData-leave-active {
  transition: opacity 1s;
}
.noData-enter,
.noData-leave-to {
  opacity: 0;
}

.transition {
  display: inline-block;
  animation: transition 0.4s ease;
}
@keyframes transition {
  0% {
    transform: translateY(-40px);
    opacity: 0;
  }
  60% {
    transform: translateY(10px);
    opacity: 0.6;
  }
  100% {
    transform: translateY(0px);
    opacity: 1;
  }
}
.check-icon {
  font-size: 30px;
  color: rgb(12, 240, 115);
  cursor: pointer;
  &:hover {
    color: rgb(177, 236, 182);
  }
}
.error-icon {
  font-size: 30px;
  color: rgb(240, 12, 31);
  cursor: pointer;
  &:hover {
    color: rgb(233, 162, 168);
  }
}
.loading1-icon {
  font-size: 30px;
  color: rgb(244, 244, 250);
  cursor: pointer;
  &:hover {
    color: rgb(147, 149, 235);
  }
}

.loading2-icon {
  font-size: 30px;
  color: rgb(11, 247, 82);
  cursor: pointer;
  &:hover {
    color: rgb(150, 240, 173);
  }
}

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
