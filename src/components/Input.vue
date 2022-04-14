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
      :placeholder="'你好...'"
      v-model="messageInput"
      ref="messageInput"
      autoFocus
      style="color: #000"
      @pressEnter="sendMessage"
    />
    <img class="message-input-button" @click="sendMessage" src="/static/pages/send.png" alt="" />
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator';
import MyEmoji from '@/components/Emoji.vue';
import { namespace } from 'vuex-class';
import * as COMMON from '@/const/common';
import * as Token from '@/web3/contracts/Token';

const chatModule = namespace('chat');
const appModule = namespace('app');

@Component({
  components: {
    MyEmoji,
  },
})
export default class MyInput extends Vue {
  @appModule.State('user') app_user: any;
  @appModule.State('load') app_load: any;
  @appModule.State('const') app_const: any;
  @chatModule.State('user') chat_user: any;
  @chatModule.State('load') chat_load: any;

  messageInput: string = '';
  //lastTime: number = 0;
  //reward: number = 0;
  //tokenAddress: string = Token.address;

  async mounted() {
    //const that = this;
    // autoRun(async function() {
    //   that.reward = await that.getReward(that.activeRoomAddress);
    // }, 3000);
  }

  /**
   * 点击切换房间进入此方法
   */
  @Watch('chat_user.activeRoom')
  async changeActiveRoom() {
    //this.reward = await this.getReward(this.activeRoomAddress);
    // this.$nextTick(() => {
    //   if (!this.app_const.mobile) {
    //     this.$refs.messageInput.focus();
    //   }
    // });
  }

  /**
   * 消息发送前校验
   */
  async sendMessage() {
    try {
      if (!this.messageInput.trim()) {
        throw new Error('不能发送空消息!');
      }
      if (this.messageInput.length > 220) {
        throw new Error('消息太长!');
      }
      console.log(this.chat_user.myMessages);
      let index = this.chat_user.myMessages[this.chat_user.activeRoom].length;
      this.$set(this.chat_user.myMessages[this.chat_user.activeRoom], index, {
        type: 0,
        content: this.messageInput,
        gAddress: this.chat_user.activeRoom,
        cDate: new Date(),
        block: { status: 'loading1', message: '等待发送' },
      });
      const content = this.messageInput;
      this.messageInput = '';
      console.log(this.chat_user.myMessages[this.chat_user.activeRoom]);
      const res = await this.app_const.web3.MessageFunc.personSendMessageToGroup(this.chat_user.activeRoom, content, 0, (block: any) => {
        if (block.status === 'loading2') {
          this.$set(this.chat_user.myMessages[this.chat_user.activeRoom][index], 'hash', block.hash);
        }
        this.$set(this.chat_user.myMessages[this.chat_user.activeRoom][index], 'block', block);
      });
      this.$set(
        this.chat_user.myMessages[this.chat_user.activeRoom][index],
        'messageId',
        Number(res.events.SendMessage.returnValues.messageId)
      );
    } catch (err) {
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
  .message-input-button {
    width: 30px;
    cursor: pointer;
    position: absolute;
    right: 10px;
    top: 4px;
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
