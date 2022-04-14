<template>
  <div class="room">
    <div v-for="(cAddress, index) in chats" :key="index">
      <div class="room-card" :class="{ active: chat_user.activeRoom == cAddress }" v-if="app_load.tokenList[cAddress]">
        <a-badge class="room-card-badge" :count="chat_user.unReads[cAddress]" />
        <my-avatar
          :avatar="app_load.tokenList[cAddress].logoURI"
          :showName="COMMON.math.formatName(cAddress)"
          @goTo="
            cAddress === COMMON.web3Utils.ethAddress ? COMMON.link.goETH(app_const.chain) : COMMON.link.goToken(app_const.chain, cAddress)
          "
        ></my-avatar>
        <div class="room-card-message" @click="changeActiveRoom(cAddress)">
          <div class="room-card-name">
            {{
              cAddress === CONST.CHAIN_DATA[app_const.chain].COINERCHAT_GROUP
                ? app_load.tokenList[cAddress].name
                : app_load.tokenList[cAddress].symbol +
                  ' (' +
                  COMMON.math.formatBalance(
                    app_load.balances[cAddress][app_user.address],
                    app_load.tokenList[cAddress].decimals,
                    app_load.tokenList[cAddress].symbol,
                    app_user.decimals
                  ) +
                  ')'
            }}
          </div>
          <div
            class="room-card-new"
            v-if="
              chat_load.groups[cAddress] &&
                chat_load.groups[cAddress].messageIds.length > 0 &&
                chat_load.messages[COMMON.math.getLast(chat_load.groups[cAddress].messageIds)]
            "
          >
            <div
              class="text"
              v-text="
                '[' +
                  (cAddress === CONST.CHAIN_DATA[app_const.chain].COINERCHAT_GROUP
                    ? COMMON.math.formatName(chat_load.messages[COMMON.math.getLast(chat_load.groups[cAddress].messageIds)].sAddress)
                    : COMMON.math.formatBalance(
                        app_load.balances[chat_load.messages[COMMON.math.getLast(chat_load.groups[cAddress].messageIds)].gAddress][
                          chat_load.messages[COMMON.math.getLast(chat_load.groups[cAddress].messageIds)].sAddress
                        ],
                        app_load.tokenList[chat_load.messages[COMMON.math.getLast(chat_load.groups[cAddress].messageIds)].gAddress]
                          .decimals,
                        app_load.tokenList[chat_load.messages[COMMON.math.getLast(chat_load.groups[cAddress].messageIds)].gAddress].symbol,
                        app_user.decimals
                      ) +
                      ']：' +
                      chat_load.messages[COMMON.math.getLast(chat_load.groups[cAddress].messageIds)].content)
              "
              v-if="chat_load.messages[COMMON.math.getLast(chat_load.groups[cAddress].messageIds)].type === 0"
            ></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator';
import { namespace } from 'vuex-class';
import MyAvatar from '@/components/Avatar.vue';

const chatModule = namespace('chat');
const appModule = namespace('app');
import * as COMMON from '@/const/common';
import * as CONST from '@/const/const';

@Component({
  components: {
    MyAvatar,
  },
})
export default class MyRoom extends Vue {
  @appModule.State('user') app_user: any;
  @appModule.State('load') app_load: any;
  @appModule.State('const') app_const: any;
  @chatModule.State('user') chat_user: any;
  @chatModule.State('load') chat_load: any;

  COMMON: any = COMMON;
  CONST: any = CONST;
  chats: Array<string> = [];

  created() {
    this.setChats();
    this.chat_user.activeRoom = COMMON.web3Utils.ethAddress;
    this.sortChats();
    this.listenMessages();
  }

  @Watch('app_user.tokens', { deep: true })
  changeTokens() {
    this.setChats();
    this.sortChats();
  }

  @Watch('chat_load.groups', { deep: true })
  changeGroups() {
    this.sortChats();
    this.setMessages();
  }

  @Watch('chat_load.messages', { deep: true })
  changeMessages() {
    this.checkBalances();
    this.checkAvatars();
  }

  @Watch('chats', { deep: true })
  changeChats() {
    this.setGroups();
  }

  sortChats() {
    this.chats = this.chats.sort((a: any, b: any) => {
      if (
        this.chat_load.groups[a] &&
        this.chat_load.groups[b] &&
        this.chat_load.messages[COMMON.math.getLast(this.chat_load.groups[b].messageIds)] &&
        this.chat_load.messages[COMMON.math.getLast(this.chat_load.groups[a].messageIds)]
      ) {
        return (
          this.chat_load.messages[COMMON.math.getLast(this.chat_load.groups[b].messageIds)].cDate -
          this.chat_load.messages[COMMON.math.getLast(this.chat_load.groups[a].messageIds)].cDate
        );
      }
      if (this.chat_load.groups[a] && this.chat_load.messages[COMMON.math.getLast(this.chat_load.groups[a].messageIds)]) {
        return 1;
      }
      return -1;
    });
  }

  checkBalances() {
    for (let key in this.chat_load.messages) {
      if (this.chat_load.messages[key]) {
        this.$store.dispatch('app/addBalance', [this.chat_load.messages[key].gAddress, this.chat_load.messages[key].sAddress]);
      }
    }
  }

  checkAvatars() {
    for (let key in this.chat_load.messages) {
      if (this.chat_load.messages[key]) {
        this.$store.dispatch('app/addAvatar', this.chat_load.messages[key].sAddress);
      }
    }
  }

  setChats() {
    this.chats = [...this.app_user.tokens];
  }

  setGroups() {
    this.chats.forEach(async (cAddress: string) => {
      if (this.chat_load.groups[cAddress] === undefined) {
        this.$set(this.chat_load.groups, cAddress, null);
        const messageLength = await this.app_const.web3.MessageFunc.getMessageIdsLengthByGroup(cAddress);
        let start = 0;
        if (messageLength > this.app_user.messageSkip) {
          start = messageLength - this.app_user.messageSkip;
        }
        const messageIds = await this.app_const.web3.MessageFunc.getLimitMessageIdsByGroup(cAddress, this.app_user.messageSkip, start);
        this.$set(this.chat_load.groups, cAddress, { messageLength, messageIds, start });
        const persons = await this.app_const.web3.MessageFunc.getGroupPersons(cAddress);
        this.$set(this.chat_load.groups[cAddress], 'persons', persons);
      }
    });
  }

  setMessages() {
    for (let key in this.chat_load.groups) {
      if (this.chat_load.groups[key]) {
        this.chat_load.groups[key].messageIds.forEach(async (messageId: number) => {
          if (this.chat_load.messages[messageId] === undefined) {
            this.$set(this.chat_load.messages, messageId, null);
            const message = await this.app_const.web3.MessageFunc.getMessageByMessageId(messageId);
            this.$set(this.chat_load.messages, messageId, message);
          }
        });
      }
    }
  }

  listenMessages() {
    this.app_const.web3.Tools.addEvent('sendMessage', (gAddress: string, pAddress: string, messageId: number) => {
      if (this.chat_load.groups[gAddress]) {
        this.$set(this.chat_load.groups[gAddress], 'messageIds', [...this.chat_load.groups[gAddress].messageIds, messageId]);
      }
    });
  }

  changeActiveRoom(cAddress: string) {
    this.chat_user.activeRoom = cAddress;
    this.$set(this.chat_user.unReads, cAddress, 0);
  }
}
</script>
<style lang="scss" scoped>
@mixin button($bcolor, $url, $x1, $y1, $bor, $col) {
  background: $bcolor;
  -webkit-mask: url($url);
  mask: url($url);
  -webkit-mask-size: $x1 $y1;
  mask-size: $x1 $y1;
  border: $bor;
  color: $col;
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

.room {
  height: calc(100% - 60px);
  overflow: auto;
  .room-card {
    position: relative;
    min-height: 70px;
    display: flex;
    align-items: center;
    background-color: rgba(0, 0, 0, 0.2);
    padding: 5px 10px;
    text-align: left;
    transition: all 0.2s linear;
    cursor: pointer;
    &:hover {
      background-color: rgb(0, 0, 0, 0.4);
    }
    &.active {
      background-color: rgb(0, 0, 0, 0.5);
      @include button(rgb(0, 0, 0, 0.5), '/static/pages/animate.png', 3000%, 100%, none, #fff);
      -webkit-animation: ani 2s steps(29) forwards;
      animation: ani 0.5s steps(29) forwards;
    }
    .room-card-badge {
      position: absolute;
      right: 10px;
      top: 10px;
      ::v-deep.ant-badge-count {
        box-shadow: none;
      }
    }
    .room-card-type {
      width: 35px;
      height: 35px;
      margin-right: 5px;
      border-radius: 50%;
      object-fit: cover;
      &.offLine {
        filter: grayscale(90%);
      }
    }
    .room-card-message {
      flex: 1;
      display: flex;
      width: 75%;
      flex-direction: column;
      .room-card-name {
        overflow: hidden; //超出的文本隐藏
        text-overflow: ellipsis; //溢出用省略号显示
        white-space: nowrap; //溢出不换行
      }
      .room-card-new {
        > * {
          display: block;
          overflow: hidden; //超出的文本隐藏
          text-overflow: ellipsis; //溢出用省略号显示
          white-space: nowrap; //溢出不换行
        }
        color: rgb(255, 255, 255, 0.6);
        font-size: 14px;
      }
    }
  }
}

@keyframes ani {
  from {
    -webkit-mask-position: 100% 0;
    mask-position: 100% 0;
  }

  to {
    -webkit-mask-position: 0 0;
    mask-position: 0 0;
  }
}
</style>
