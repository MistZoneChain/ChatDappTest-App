<template>
  <div class="message-input">
    <a-popover placement="topLeft" trigger="hover" class="message-popver">
      <template slot="content">
        <a-tabs default-key="1" size="small">
          <a-tab-pane key="1" tab="Emoji">
            <my-emoji @addEmoji="addEmoji"></my-emoji>
          </a-tab-pane>
        </a-tabs>
      </template>
      <div class="messagte-tool-icon">😃</div>
    </a-popover>
    <a-input
      autocomplete="off"
      type="text"
      :placeholder="$t('input.hello') + '...'"
      v-model="messageInput"
      ref="messageInput"
      autoFocus
      style="color: #000"
      @pressEnter="sendChatMessage"
    />
    <myIcon
      type="send"
      :class="
        utils.have.value(chatAsync.chatRecipientMap[chatSync.userActiveRecipient])
          ? chatAsync.chatRecipientMap[chatSync.userActiveRecipient].value.encrypt
            ? 'message-input-button2'
            : 'message-input-button1'
          : 'message-input-button1'
      "
      @click="sendChatMessage"
    />
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import MyEmoji from '@/components/Emoji.vue';
import { namespace } from 'vuex-class';
import { ContractTransaction } from '@ethersproject/contracts';
import { AppStorage, AppSync, AppAsync, ChatSync, ChatAsync, ChatSendMessage } from '@/store';
import { utils } from '@/const';

const chatModule = namespace('chat');
const appModule = namespace('app');

@Component({
  components: {
    MyEmoji,
  },
})
export default class MyInput extends Vue {
  @appModule.State('storage') appStorage: AppStorage;
  @appModule.State('sync') appSync: AppSync;
  @appModule.State('async') appAsync: AppAsync;
  @chatModule.State('sync') chatSync: ChatSync;
  @chatModule.State('async') chatAsync: ChatAsync;

  utils = utils;
  messageInput: string = '';

  /**
   * 消息发送前校验
   */
  async sendChatMessage() {
    try {
      if (!this.messageInput.trim()) {
        throw this.$t('input.cannot_send_empty_messages') as string;
      }
      if (this.messageInput.length > 220) {
        throw this.$t('input.message_is_too_long') as string;
      }
      let content;
      let message: ChatSendMessage;
      if (this.chatAsync.chatRecipientMap[this.chatSync.userActiveRecipient].value.encrypt) {
        content = await this.$store.dispatch('chat/encryptContent', this.messageInput);
        message = {
          status: 'send',
          hash: '',
          messageId: 0,
          sender: this.appSync.userAddress,
          recipientArr: [this.chatSync.userActiveRecipient],
          content,
          decryptContent: this.messageInput,
          typeNumber: 1,
          createDate: new Date(),
        };
      } else {
        content = this.messageInput;
        message = {
          status: 'send',
          hash: '',
          messageId: 0,
          sender: this.appSync.userAddress,
          recipientArr: [this.chatSync.userActiveRecipient],
          content,
          typeNumber: 0,
          createDate: new Date(),
        };
      }
      this.chatAsync.chatRecipientMap[this.chatSync.userActiveRecipient].value.sendMessageArr.push(message);
      this.messageInput = '';
      const messageId = await this.$store.dispatch('chat/sendChatMessage', [
        [this.chatSync.userActiveRecipient],
        message.content,
        message.typeNumber,
        (transaction: ContractTransaction) => {
          this.$set(
            utils.get.last(this.chatAsync.chatRecipientMap[this.chatSync.userActiveRecipient].value.sendMessageArr),
            'hash',
            transaction.hash
          );
          this.$set(
            utils.get.last(this.chatAsync.chatRecipientMap[this.chatSync.userActiveRecipient].value.sendMessageArr),
            'status',
            'pending'
          );
        },
      ]);
      this.$set(
        utils.get.last(this.chatAsync.chatRecipientMap[this.chatSync.userActiveRecipient].value.sendMessageArr),
        'messageId',
        messageId
      );
      this.$set(
        utils.get.last(this.chatAsync.chatRecipientMap[this.chatSync.userActiveRecipient].value.sendMessageArr),
        'status',
        'success'
      );
      // eslint-disable-next-line prettier/prettier
    } catch (err:any) {
      this.$set(utils.get.last(this.chatAsync.chatRecipientMap[this.chatSync.userActiveRecipient].value.sendMessageArr), 'status', 'error');
      console.log(err);
      this.$message.error(err.message);
    }
  }

  /**
   * 添加emoji到input
   */
  addEmoji(emoji: string) {
    const inputDom = (this.$refs.messageInput as Vue).$el as HTMLFormElement;
    if (inputDom.selectionStart || inputDom.selectionStart === '0') {
      // 得到光标前的位置
      const startPos = inputDom.selectionStart;
      // 得到光标后的位置
      const endPos = inputDom.selectionEnd;
      // 在加入数据之前获得滚动条的高度
      const restoreTop = inputDom.scrollTop;
      // emoji表情插入至当前光标指定位置
      this.messageInput = this.messageInput.substring(0, startPos) + emoji + this.messageInput.substring(endPos, this.messageInput.length);
      // 如果滚动条高度大于0
      if (restoreTop > 0) {
        // 返回
        inputDom.scrollTop = restoreTop;
      }
      inputDom.focus();
      // 设置光标位置至emoji表情后一位
      const position = startPos + emoji.length;
      if (inputDom.setSelectionRange) {
        inputDom.focus();
        setTimeout(() => {
          inputDom.setSelectionRange(position, position);
        }, 10);
      } else if (inputDom.createTextRange) {
        const range = inputDom.createTextRange();
        range.collapse(true);
        range.moveEnd('character', position);
        range.moveStart('character', position);
        range.select();
      }
    } else {
      this.messageInput += emoji;
      inputDom.focus();
    }
  }
}
</script>
<style lang="scss" scoped>
.message-input {
  display: flex;
  flex-wrap: nowrap;
  position: absolute;
  width: 100%;
  bottom: 0px;
  input {
    height: 40px;
  }
  .message-input-button1 {
    font-size: 35px;
    right: 10px;
    top: 4px;
    color: rgba(11, 71, 235, 0.85);
    cursor: pointer;
    position: absolute;
  }
  .message-input-button2 {
    font-size: 35px;
    right: 10px;
    top: 4px;
    color: rgba(248, 7, 7, 0.85);
    cursor: pointer;
    position: absolute;
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
</style>
