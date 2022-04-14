<template>
  <div>
    <a-modal title="众筹建池" :visible="showModal" footer="" @cancel="$emit('cancel')">
      <div class="tool-user" v-if="CrowdFund != {}">
        <div class="tool-user-info">
          <div class="tool-user-title">众筹须知：</div>
          <div class="tool-user-input">
            {{ '众筹所得的USDT40%用于项目开发，60%与财政的4亿HCHAT一起加入MDEX资金池，归入财政管理。' }}
          </div>
        </div>
        <div class="tool-user-info">
          <div class="tool-user-title">众筹时间：</div>
          <div class="tool-user-input">
            {{ COMMON.math.formatDate(CrowdFund.startTime) + ' - ' + COMMON.math.formatDate(CrowdFund.endTime) }}
          </div>
        </div>
        <div class="tool-user-info">
          <div class="tool-user-title">众筹额度：</div>
          <div class="tool-user-input" v-if="app_load.tokenList[CrowdFund.tokenAddress]">
            {{
              COMMON.math.formatBalance(
                CrowdFund.tokenBalance,
                app_load.tokenList[CrowdFund.tokenAddress].decimals,
                app_load.tokenList[CrowdFund.tokenAddress].symbol,
                app_user.decimals
              )
            }}
          </div>
        </div>
        <div class="tool-user-info">
          <div class="tool-user-title">已筹集：</div>
          <div class="tool-user-input" v-if="app_load.tokenList[CrowdFund.crowdTokenAddress]">
            {{
              COMMON.math.formatBalance(
                CrowdFund.crowdTokenBalance,
                app_load.tokenList[CrowdFund.crowdTokenAddress].decimals,
                app_load.tokenList[CrowdFund.crowdTokenAddress].symbol,
                app_user.decimals
              )
            }}
          </div>
        </div>
        <div class="tool-user-info">
          <div class="tool-user-title">兑换率：</div>
          <div class="tool-user-input" v-if="app_load.tokenList[CrowdFund.crowdTokenAddress] && app_load.tokenList[CrowdFund.tokenAddress]">
            {{
              (CrowdFund.tokenPerCrowdToken * Math.pow(10, app_load.tokenList[CrowdFund.crowdTokenAddress].decimals)) /
                Math.pow(10, app_load.tokenList[CrowdFund.tokenAddress].decimals) +
                ' ' +
                app_load.tokenList[CrowdFund.tokenAddress].symbol +
                '/' +
                app_load.tokenList[CrowdFund.crowdTokenAddress].symbol
            }}
          </div>
        </div>
        <div class="tool-user-info">
          <div class="tool-user-title">你贡献：</div>
          <div class="tool-user-input" v-if="app_load.tokenList[CrowdFund.crowdTokenAddress]">
            {{
              COMMON.math.formatBalance(
                CrowdFund.crowdFundBalance,
                app_load.tokenList[CrowdFund.crowdTokenAddress].decimals,
                app_load.tokenList[CrowdFund.crowdTokenAddress].symbol,
                app_user.decimals
              )
            }}
          </div>
          <a-input
            class="tool-user-input"
            v-if="CrowdFund.allowanceCrowdToken !== 0"
            v-model="CrowdFund.addCrowdTokenInput"
            style="width:150px"
          ></a-input>
          <a-button
            type="primary"
            @click="clickAddCrowdToken"
            :loading="CrowdFund.addCrowdTokenLoad"
            :disabled="new Date() < CrowdFund.startTime || new Date() > CrowdFund.endTime"
            >{{ CrowdFund.allowanceCrowdToken === 0 ? '授权' : '添加' }}</a-button
          >
        </div>
        <div class="tool-user-info">
          <div class="tool-user-title">分得：</div>
          <div class="tool-user-input" v-if="app_load.tokenList[CrowdFund.tokenAddress]">
            {{
              COMMON.math.formatBalance(
                CrowdFund.getToken,
                app_load.tokenList[CrowdFund.tokenAddress].decimals,
                app_load.tokenList[CrowdFund.tokenAddress].symbol,
                app_user.decimals
              )
            }}
          </div>
          <a-button
            type="primary"
            @click="clickWithdrawToken"
            :loading="CrowdFund.withdrawTokenLoad"
            :disabled="new Date() < CrowdFund.endTime || CrowdFund.isGetToken"
            >{{ CrowdFund.isGetToken ? '已提取' : '提取' }}</a-button
          >
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator';
import { namespace } from 'vuex-class';
import * as COMMON from '@/const/common';
import * as CONST from '@/const/const';
import * as Token from '@/web3/contracts/Token';
import * as CrowdFund from '@/web3/contracts/CrowdFund';

const appModule = namespace('app');
const chatModule = namespace('chat');

@Component
export default class MyCrowdFund extends Vue {
  @Prop({ default: false }) showModal: boolean;
  @appModule.State('user') app_user: any;
  @appModule.State('load') app_load: any;
  @appModule.State('const') app_const: any;
  @chatModule.State('user') chat_user: any;
  @chatModule.State('load') chat_load: any;

  COMMON: any = COMMON;
  CONST: any = CONST;

  CrowdFund: any = {};

  @Watch('showModal', { deep: true })
  changeShowModal() {
    if (this.showModal) {
      this.showCrowdFunding();
    }
  }

  async showCrowdFunding() {
    const [
      tokenBalance,
      crowdTokenBalance,
      crowdFundBalance,
      getToken,
      tokenPerCrowdToken,
      startTime,
      endTime,
      isGetToken,
      crowdTokenAddress,
    ] = await Promise.all([
      await this.app_const.web3.CrowdFundFunc.tokenBalance(),
      await this.app_const.web3.CrowdFundFunc.crowdTokenBalance(),
      await this.app_const.web3.CrowdFundFunc.crowdFundBalance(this.app_user.address),
      await this.app_const.web3.CrowdFundFunc.getToken(this.app_user.address),
      await this.app_const.web3.CrowdFundFunc.tokenPerCrowdToken(),
      await this.app_const.web3.CrowdFundFunc.startTime(),
      await this.app_const.web3.CrowdFundFunc.endTime(),
      await this.app_const.web3.CrowdFundFunc.isGetToken(this.app_user.address),
      await this.app_const.web3.CrowdFundFunc.crowdTokenAddress(),
    ]);
    this.CrowdFund = {
      tokenBalance,
      crowdTokenBalance,
      crowdFundBalance,
      getToken,
      tokenPerCrowdToken,
      startTime,
      endTime,
      isGetToken,
      crowdTokenAddress,
      tokenAddress: COMMON.web3Utils.toChecksumAddress(Token.address[this.app_const.chain]),
      addCrowdTokenInput: '',
      addCrowdTokenLoading: false,
      withdrawTokenLoading: false,
    };
    this.app_const.web3.Erc20Func.allowance(
      this.CrowdFund.crowdTokenAddress,
      this.app_user.address,
      COMMON.web3Utils.toChecksumAddress(CrowdFund.address[this.app_const.chain])
    ).then((e: any) => this.$set(this.CrowdFund, 'allowanceCrowdToken', e));
    if (!this.app_load.tokenList[this.CrowdFund.crowdTokenAddress]) {
      async () => {
        const token = await this.$store.dispatch('app/getToken', this.CrowdFund.crowdTokenAddress);
        this.$set(this.app_load.tokenList, this.CrowdFund.crowdTokenAddress, token);
      };
    }
    if (!this.app_load.tokenList[this.CrowdFund.tokenAddress]) {
      async () => {
        const token = await this.$store.dispatch('app/getToken', this.CrowdFund.tokenAddress);
        this.$set(this.app_load.tokenList, this.CrowdFund.tokenAddress, token);
      };
    }
  }

  async clickAddCrowdToken() {
    this.CrowdFund.addCrowdTokenLoad = true;
    if (this.CrowdFund.allowanceCrowdToken === 0) {
      await this.app_const.web3.Erc20Func.approve(
        this.CrowdFund.crowdTokenAddress,
        COMMON.web3Utils.toChecksumAddress(CrowdFund.address[this.app_const.chain]),
        async (block: any) => {
          if (block.status == 'success' || block.status == 'error') {
            this.CrowdFund.addCrowdTokenLoad = false;
            this.app_const.web3.Erc20Func.allowance(
              this.CrowdFund.crowdTokenAddress,
              this.app_user.address,
              CrowdFund.address[this.app_const.chain]
            ).then((e: any) => (this.CrowdFund.allowanceCrowdToken = e));
          }
        }
      ).catch(() => {});
    } else {
      await this.app_const.web3.CrowdFundFunc.addCrowdToken(
        new COMMON.math.BN(this.CrowdFund.addCrowdTokenInput).mul(
          new COMMON.math.BN(Math.pow(10, this.app_load.tokenList[this.CrowdFund.crowdTokenAddress].decimals).toString())
        ),
        async (block: any) => {
          if (block.status == 'success' || block.status == 'error') {
            this.CrowdFund.addCrowdTokenLoad = false;
            this.showCrowdFunding();
          }
        }
      ).catch(() => {});
      this.CrowdFund.addCrowdTokenInput = 0;
    }
  }

  async clickWithdrawToken() {
    this.CrowdFund.withdrawTokenLoad = true;
    await this.app_const.web3.CrowdFundFunc.withdrawToken(async (block: any) => {
      if (block.status == 'success' || block.status == 'error') {
        this.CrowdFund.withdrawTokenLoad = false;
        this.app_const.web3.CrowdFundFunc.isGetToken(this.app_user.address).then((e: any) => (this.CrowdFund.isGetToken = e));
      }
    }).catch(() => {});
  }
}
</script>

<style lang="scss" scoped>
.tool-user {
  text-align: center;
  font-size: 16px;
  .tool-user-avatar {
    position: relative;
    width: 120px;
    overflow: hidden;
    margin: 0 auto 24px;
    border-radius: 50%;
    cursor: pointer;
    .tool-user-upload {
      .text {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        border-radius: 50%;
        line-height: 120px;
        font-weight: bold;
      }
    }
    .loading {
      position: absolute;
      top: 50%;
      left: 50%;
      margin: -18px 0 0 -18px;
      font-size: 35px;
      font-weight: bold;
      color: #fff;
    }
    .img {
      transition: 0.2s all linear;
    }
    &.active {
      .img {
        filter: blur(3px);
      }
    }
  }
}
.tool-user-info {
  display: flex;
  justify-content: left;
  align-items: center;
  .tool-user-input {
    margin-right: 10px;
  }
  .tool-user-button {
    margin-right: 10px;
  }
  .tool-user-title {
    display: flex;
    align-items: center;
    width: 90px;
    text-align: left;
    font-weight: bold;
    word-break: keep-all;
    margin-right: 15px;
  }
}
</style>
