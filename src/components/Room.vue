<template>
  <div class="room">
    <div v-for="(recipientAddress, index) in chatRecipientArr" :key="index">
      <div
        class="room-card"
        :class="{ active: chatSync.userActiveRecipient == recipientAddress }"
        @click="setUserActiveRecipient(recipientAddress)"
      >
        <a-badge class="room-card-badge" />
        <my-avatar
          v-if="chatAsync.chatRecipientMap[recipientAddress].value.type == 'wallet'"
          :avatar="appSync.addressAvatarMap[recipientAddress]"
          :showName="utils.format.address(recipientAddress)"
          @goTo="
            recipientAddress == common.etherAddress
              ? utils.go.accounts(appSync.ether.getNetwork())
              : utils.go.token(appSync.ether.getNetwork(), recipientAddress)
          "
        ></my-avatar>
        <my-avatar
          v-else-if="
            chatAsync.chatRecipientMap[recipientAddress].value.type == 'erc20' &&
              utils.have.value(appAsync.erc20DetailMap[recipientAddress])
          "
          :avatar="appAsync.erc20DetailMap[recipientAddress].value.logoURI"
          :showName="utils.format.address(recipientAddress)"
          @goTo="
            recipientAddress == common.etherAddress
              ? utils.go.accounts(appSync.ether.getNetwork())
              : utils.go.token(appSync.ether.getNetwork(), recipientAddress)
          "
        ></my-avatar>

        <div class="room-card-message">
          <div class="room-card-name">
            <div
              v-if="
                chatAsync.chatRecipientMap[recipientAddress].value.type == 'erc20' &&
                  utils.have.value(appAsync.erc20DetailMap[recipientAddress]) &&
                  utils.have.value(appAsync.tokenBalanceMap[recipientAddress][appSync.userAddress])
              "
            >
              {{
                appAsync.erc20DetailMap[recipientAddress].value.symbol +
                  ' (' +
                  utils.format.balance(
                    appAsync.tokenBalanceMap[recipientAddress][appSync.userAddress].value,
                    appAsync.erc20DetailMap[recipientAddress].value.decimals,
                    appAsync.erc20DetailMap[recipientAddress].value.symbol,
                    appStorage.decimalLimit
                  ) +
                  ')'
              }}
              <a-icon
                type="close-circle-o"
                class="room-card-close"
                @click.stop="closeChatRecipient(recipientAddress)"
                v-if="chatRecipientArr.length > 1"
              />
            </div>
            <div v-else-if="chatAsync.chatRecipientMap[recipientAddress].value.type == 'wallet'">
              {{ recipientAddress == chatSync.userAddress ? 'self' : utils.format.address(recipientAddress) }}
              <a-icon
                type="close-circle-o"
                class="room-card-close"
                @click.stop="closeChatRecipient(recipientAddress)"
                v-if="chatRecipientArr.length > 1"
              />
            </div>
          </div>
          <div class="room-card-new">
            <div
              v-if="
                utils.have.value(chatAsync.chatMessageMap[utils.get.last(chatAsync.chatRecipientMap[recipientAddress].value.messageIdArr)])
              "
            >
              <div
                v-if="
                  chatAsync.chatRecipientMap[recipientAddress].value.type == 'erc20' &&
                    utils.have.value(
                      appAsync.tokenBalanceMap[recipientAddress][
                        chatAsync.chatMessageMap[utils.get.last(chatAsync.chatRecipientMap[recipientAddress].value.messageIdArr)].value
                          .sender
                      ]
                    ) &&
                    utils.have.value(appAsync.erc20DetailMap[recipientAddress])
                "
                class="text"
                v-text="
                  '[' +
                    utils.format.balance(
                      appAsync.tokenBalanceMap[recipientAddress][
                        chatAsync.chatMessageMap[utils.get.last(chatAsync.chatRecipientMap[recipientAddress].value.messageIdArr)].value
                          .sender
                      ].value,
                      appAsync.erc20DetailMap[recipientAddress].value.decimals,
                      appAsync.erc20DetailMap[recipientAddress].value.symbol,
                      appStorage.decimalLimit
                    ) +
                    ']：' +
                    chatAsync.chatMessageMap[utils.get.last(chatAsync.chatRecipientMap[recipientAddress].value.messageIdArr)].value.content
                "
              ></div>
              <div v-else-if="chatAsync.chatRecipientMap[recipientAddress].value.type == 'wallet'">
                <div
                  v-if="
                    chatAsync.chatMessageMap[utils.get.last(chatAsync.chatRecipientMap[recipientAddress].value.messageIdArr)].value
                      .typeNumber == 0
                  "
                  class="text"
                  v-text="
                    '[' +
                      utils.format.address(
                        chatAsync.chatMessageMap[utils.get.last(chatAsync.chatRecipientMap[recipientAddress].value.messageIdArr)].value
                          .sender
                      ) +
                      ']：' +
                      chatAsync.chatMessageMap[utils.get.last(chatAsync.chatRecipientMap[recipientAddress].value.messageIdArr)].value
                        .content
                  "
                ></div>
                <div
                  v-else-if="
                    chatAsync.chatMessageMap[utils.get.last(chatAsync.chatRecipientMap[recipientAddress].value.messageIdArr)].value
                      .typeNumber == 1
                  "
                  class="text"
                  v-text="
                    '[' +
                      utils.format.address(
                        chatAsync.chatMessageMap[utils.get.last(chatAsync.chatRecipientMap[recipientAddress].value.messageIdArr)].value
                          .sender
                      ) +
                      ']：' +
                      (chatAsync.chatMessageMap[utils.get.last(chatAsync.chatRecipientMap[recipientAddress].value.messageIdArr)].value
                        .decryptContent
                        ? chatAsync.chatMessageMap[utils.get.last(chatAsync.chatRecipientMap[recipientAddress].value.messageIdArr)].value
                            .decryptContent
                        : '加密消息')
                  "
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator';
import { namespace } from 'vuex-class';
import { AppSync, AppAsync, AppStorage, ChatSync, ChatAsync } from '@/store';
import { utils, common } from '@/const';
import MyAvatar from '@/components/Avatar.vue';

const chatModule = namespace('chat');
const appModule = namespace('app');

@Component({
  components: {
    MyAvatar,
  },
})
export default class MyRoom extends Vue {
  @appModule.State('storage') appStorage: AppStorage;
  @appModule.State('sync') appSync: AppSync;
  @appModule.State('async') appAsync: AppAsync;
  @appModule.State('sync') chatSync: ChatSync;
  @chatModule.State('async') chatAsync: ChatAsync;

  common = common;
  utils = utils;
  chatRecipientArr: Array<string> = [];

  @Watch('chatAsync.chatRecipientMap', { deep: true })
  changeChatRecipientMap() {
    this.setChatRecipient();
  }

  @Watch('chatAsync.chatMessageMap', { deep: true })
  changeChatMessageMap() {
    this.setChatRecipient();
  }

  setChatRecipient() {
    let chatRecipientArr = Object.keys(this.chatAsync.chatRecipientMap).filter((recipientAddress) => {
      return utils.have.value(this.chatAsync.chatRecipientMap[recipientAddress]);
    });
    if (chatRecipientArr.length >= 2) {
      chatRecipientArr = chatRecipientArr.sort((recipientAddress_a, recipientAddress_b) => {
        if (
          utils.have.value(
            this.chatAsync.chatMessageMap[utils.get.last(this.chatAsync.chatRecipientMap[recipientAddress_a].value.messageIdArr)]
          ) &&
          utils.have.value(
            this.chatAsync.chatMessageMap[utils.get.last(this.chatAsync.chatRecipientMap[recipientAddress_b].value.messageIdArr)]
          )
        ) {
          return (
            this.chatAsync.chatMessageMap[
              utils.get.last(this.chatAsync.chatRecipientMap[recipientAddress_b].value.messageIdArr)
            ].value.createDate.getTime() -
            this.chatAsync.chatMessageMap[
              utils.get.last(this.chatAsync.chatRecipientMap[recipientAddress_a].value.messageIdArr)
            ].value.createDate.getTime()
          );
        } else {
          if (
            utils.have.value(
              this.chatAsync.chatMessageMap[utils.get.last(this.chatAsync.chatRecipientMap[recipientAddress_a].value.messageIdArr)]
            )
          ) {
            return -1;
          }
          return 1;
        }
      });
    }
    if (this.chatRecipientArr.toString() != chatRecipientArr.toString()) {
      this.chatRecipientArr = chatRecipientArr;
    }
  }

  async closeChatRecipient(recipientAddress: string) {
    await this.$store.dispatch('chat/deleteChatRecipient', recipientAddress);
  }

  async setUserActiveRecipient(recipientAddress: string) {
    await this.$store.dispatch('chat/setUserActiveRecipient', recipientAddress);
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
        .room-card-close {
          font-size: 20px;
          float: right;
          color: rgb(89, 91, 92);
        }
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
