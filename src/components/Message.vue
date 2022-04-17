<template>
  <div class="message">
    <div class="message-header">
      <div class="message-header-box">
        <span class="message-header-text">
          {{ get_message_header_text() }}
        </span>
      </div>
    </div>
    <transition name="loading">
      <div class="message-loading" v-if="status == 'load' || status == 'get'">
        <a-icon type="sync" spin class="message-loading-icon" />
      </div>
    </transition>
    <div class="message-main" :style="{ opacity: messageOpacity }">
      <div class="message-content">
        <transition name="noData">
          <div class="message-content-noData">
            {{ get_noData_text() }}
          </div>
        </transition>
        <template v-for="(message, index) in messageList">
          <div class="message-content-message" :key="index" :class="{ 'text-right': message.sender == appSync.userAddress }">
            <my-avatar
              :avatar="appSync.avatarMap[message.sender]"
              :name="utils.format.address(message.sender)"
              :time="utils.format.date(message.createDate)"
              :showName="utils.format.address(message.sender)"
              @goTo="utils.go.address(appSync.ether.getChainId(), message.sender)"
            ></my-avatar>

            <a-popover style="display: inline-block" v-if="'status' in message">
              <div slot="content" class="avatar-card">
                <a-icon :type="get_avatar_card(message).type" :class="get_avatar_card(message).class" />
                <div>{{ get_avatar_card(message).text }}</div>
                <a-button @click="utils.go.tx(appSync.ether.getChainId(), message.hash)" type="primary" :disabled="!message.hash">{{
                  $t('message.view_on_the_blockchain_browser')
                }}</a-button>
              </div>
              <a-icon :type="get_avatar_card(message).type" :class="get_avatar_card(message).class" />
            </a-popover>
            <div class="message-content-text">
              <a v-if="utils.is.url(message.content)" :href="message.content" target="_blank">{{ message.content }} </a>
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
import MyInput from '@/components/Input.vue';
import { namespace } from 'vuex-class';
import { AppStorage, AppSync, AppAsync, ChatSync, ChatAsync, SendMessage, Message, SendMessageStatus } from '@/store';
import { utils, common, BigNumber } from '@/const';

const chatModule = namespace('chat');
const appModule = namespace('app');

@Component({
  components: {
    MyAvatar,
    MyInput,
  },
})
export default class MyMessage extends Vue {
  @appModule.State('storage') appStorage: AppStorage;
  @appModule.State('sync') appSync: AppSync;
  @appModule.State('async') appAsync: AppAsync;
  @chatModule.State('sync') chatSync: ChatSync;
  @chatModule.State('async') chatAsync: ChatAsync;

  utils = utils;
  common = common;
  SendMessageStatus = SendMessageStatus;

  messageDom: HTMLElement;
  messageContentDom: HTMLElement;
  headerDom: HTMLElement;
  messageOpacity: number = 1;
  lastMessagePosition: number = 0;

  status: string = 'load';
  messageList: Array<Message | SendMessage> = [];
  that = this;

  get_message_header_text() {
    try {
      return `${this.appStorage.activeRecipientText} 消息：${this.chatAsync.recipientMap[
        this.appStorage.activeRecipientText
      ].messageIdLength.toNumber()}`;
    } catch (error) {
      return '';
    }
  }

  get_noData_text() {
    try {
      if (
        utils.have.value(this.chatAsync.recipientMap[this.appStorage.activeRecipientText]) &&
        this.chatAsync.recipientMap[this.appStorage.activeRecipientText].messageIdLength.toNumber() <=
          this.chatAsync.recipientMap[this.appStorage.activeRecipientText].messageIdList.length
      ) {
        return this.$t('message.no_more_message');
      }
      return '';
    } catch (error) {
      return '';
    }
  }

  get_avatar_card(message: SendMessage) {
    if (message.status == SendMessageStatus.prePending) {
      return {
        type: 'loading',
        class: 'loading1-icon',
        text: this.$t('message.not_send'),
      };
    } else if (message.status == SendMessageStatus.pending) {
      return {
        type: 'loading',
        class: 'loading2-icon',
        text: message.hash ? utils.format.hash(message.hash) : '',
      };
    } else if (message.status == SendMessageStatus.error) {
      return {
        type: 'exclamation-circle',
        class: 'error-icon',
        text: message.hash ? utils.format.hash(message.hash) : '',
      };
    } else if (message.status == SendMessageStatus.success) {
      return {
        type: 'check-circle',
        class: 'check-icon',
        text: message.hash ? utils.format.hash(message.hash) : '',
      };
    }
  }

  @Watch('chatAsync.messageMap', { deep: true })
  changeMessageMap() {
    this.setMessageList();
  }

  @Watch('chatAsync.recipientMap', { deep: true })
  changeRecipientMap() {
    this.setMessageList();
  }

  @Watch('appStorage.activeRecipientText')
  changeActiveRecipient() {
    this.status = 'load';
    this.messageList = [];
    this.messageOpacity = 0;
    if (this.headerDom) {
      this.headerDom.classList.add('transition');
      setTimeout(() => {
        this.headerDom.classList.remove('transition');
      }, 400);
    }
    this.setMessageList();
  }

  setMessageList() {
    if (utils.have.value(this.chatAsync.recipientMap[this.appStorage.activeRecipientText])) {
      let messageList: Array<Message | SendMessage> = [];
      let messageIdList: Array<BigNumber> = [];
      this.chatAsync.recipientMap[this.appStorage.activeRecipientText].sendMessageList.forEach((sendMessage) => {
        messageList.push(sendMessage);
        if (sendMessage.messageId) {
          messageIdList.push(sendMessage.messageId);
        }
      });
      this.chatAsync.recipientMap[this.appStorage.activeRecipientText].messageIdList
        .filter((messageId) => {
          return utils.have.value(this.chatAsync.messageMap[messageId.toString()]) && messageIdList.indexOf(messageId) == -1;
        })
        .forEach((messageId) => {
          messageList.push(this.chatAsync.messageMap[messageId.toString()]);
        });
      if (this.messageList.length != messageList.length) {
        messageList = messageList.sort((message_a: Message, message_b: Message) => {
          return message_a.createDate.toNumber() - message_b.createDate.toNumber();
        });
        this.messageList = messageList;
        this.checkMessageList();
      } else if (this.messageList.length == 0) {
        this.checkMessageList();
      }
    }
  }

  checkMessageList() {
    let loadAll = this.messageList.length >= this.chatAsync.recipientMap[this.appStorage.activeRecipientText].messageIdList.length;
    if (this.status == 'get') {
      this.scrollTo();
      if (loadAll) {
        this.status = 'listen';
      }
    } else if (this.status == 'load') {
      this.messageDom = document.getElementsByClassName('message-main')[0] as HTMLElement;
      this.messageContentDom = document.getElementsByClassName('message-content')[0] as HTMLElement;
      this.headerDom = document.getElementsByClassName('message-header-text')[0] as HTMLElement;
      this.messageDom.addEventListener('scroll', this.handleScroll);
      this.scrollToBottom();
      if (loadAll) {
        this.status = 'listen';
      }
    } else if (
      this.status == 'listen' &&
      this.messageDom.scrollTop + this.messageDom.offsetHeight + 100 > this.messageContentDom.scrollHeight
    ) {
      this.scrollToBottom();
    }
  }

  handleScroll(event: Event) {
    if (event.currentTarget) {
      if (this.messageDom.scrollTop == 0 && this.status == 'listen') {
        this.lastMessagePosition = this.messageContentDom.offsetHeight;
        this.getMessage();
      }
    }
  }

  getMessage() {
    this.status = 'get';
    this.$store.dispatch('chat/getMessage');
  }

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
    .message-header-icon-white-blue {
      margin-left: 5px;
      color: rgb(137, 164, 238);
    }
    .message-header-icon-red {
      margin-left: 5px;
      color: rgb(248, 7, 7);
    }
    .message-header-icon-blue {
      margin-left: 5px;
      color: rgb(11, 71, 235);
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
