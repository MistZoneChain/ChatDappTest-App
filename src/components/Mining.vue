<template>
  <div>
    <a-modal :visible="showModal" footer="" @cancel="$emit('cancel')">
      <a-tabs default-key="1" size="small">
        <a-tab-pane key="1" tab="质押挖矿" v-if="LPPool != {}">
          <div class="tool-user" v-for="(lpPool, address) in LPPool.pools" :key="address">
            <div class="tool-user-info">
              <div class="tool-user-title">质押币种：</div>
              <div
                class="tool-user-input"
                v-if="app_load.tokenList[address] && app_load.tokenList[lpPool.lp.token0] && app_load.tokenList[lpPool.lp.token1]"
              >
                {{
                  app_load.tokenList[address].symbol +
                    '（' +
                    app_load.tokenList[lpPool.lp.token0].symbol +
                    '-' +
                    app_load.tokenList[lpPool.lp.token1].symbol +
                    '）'
                }}
              </div>
            </div>
            <div class="tool-user-info">
              <div class="tool-user-title">质押总量：</div>
              <div class="tool-user-input" v-if="app_load.tokenList[address]">
                {{
                  COMMON.math.formatBalance(
                    lpPool.pool.balance,
                    app_load.tokenList[address].decimals,
                    app_load.tokenList[address].symbol,
                    app_user.decimals
                  )
                }}
              </div>
            </div>
            <div class="tool-user-info">
              <div class="tool-user-title">APY：</div>
              <div class="tool-user-input" v-if="lpPool.apy">
                {{ lpPool.apy + '%' }}
              </div>
            </div>
            <div class="tool-user-info">
              <div class="tool-user-title">下次减产区块：</div>
              <div class="tool-user-input">
                {{
                  LPPool.startBlock +
                    LPPool.reduceFrequency * (LPPool.reducePeriod + 1) +
                    '（预计' +
                    (LPPool.startBlock + (LPPool.reduceFrequency + 1) * LPPool.reducePeriod - LPPool.blockNumber) / 20 +
                    '分钟之后）'
                }}
              </div>
            </div>
            <div class="tool-user-info">
              <div class="tool-user-title">每个区块产量：</div>
              <div class="tool-user-input">
                {{
                  COMMON.math.formatBalance(
                    LPPool.blockReward.mul(new COMMON.math.BN(lpPool.pool.point)).div(new COMMON.math.BN(LPPool.totalPoint)),
                    app_load.tokenList[LPPool.token].decimals,
                    app_load.tokenList[LPPool.token].symbol,
                    app_user.decimals
                  ) +
                    '（' +
                    COMMON.math.formatBalance(
                      LPPool.blockReward
                        .mul(new COMMON.math.BN(lpPool.pool.point))
                        .div(new COMMON.math.BN(LPPool.totalPoint))
                        .mul(new COMMON.math.BN(20 * 60 * 24)),
                      app_load.tokenList[LPPool.token].decimals,
                      app_load.tokenList[LPPool.token].symbol,
                      app_user.decimals
                    ) +
                    '/天）'
                }}
              </div>
            </div>
            <div class="tool-user-info">
              <div class="tool-user-title">你的质押：</div>
              <div class="tool-user-input" v-if="app_load.tokenList[address]">
                {{
                  COMMON.math.formatBalance(
                    lpPool.miner.balance,
                    app_load.tokenList[address].decimals,
                    app_load.tokenList[address].symbol,
                    app_user.decimals
                  )
                }}
              </div>
              <a-input
                class="tool-user-input"
                v-if="lpPool.allowance != 0"
                v-model="lpPool.stakeInput"
                style="width:150px"
                :placeholder="
                  COMMON.math.formatBalance(
                    app_load.balances[address][app_user.address],
                    app_load.tokenList[address].decimals,
                    app_load.tokenList[address].symbol,
                    app_user.decimals
                  )
                "
              ></a-input>
              <a-button
                type="primary"
                class="tool-user-button"
                @click="lpPool.allowance == 0 ? LPPoolApprove(address) : LPPoolStakeLP(address)"
                :loading="lpPool.stakeButtonLoad"
                :disabled="LPPool.blockNumber < LPPool.startBlock"
                >{{ lpPool.allowance == 0 ? '授权' : '添加' }}</a-button
              >
              <a-button
                class="tool-user-button"
                v-if="lpPool.allowance != 0"
                type="primary"
                @click="LPPoolWithdrawLP(address)"
                :loading="lpPool.stakeButtonLoad"
                >{{ '提取' }}</a-button
              >
            </div>
            <div class="tool-user-info">
              <div class="tool-user-title">收获：</div>
              <div class="tool-user-input" v-if="app_load.tokenList[LPPool.token]">
                {{
                  COMMON.math.formatBalance(
                    lpPool.reward,
                    app_load.tokenList[LPPool.token].decimals,
                    app_load.tokenList[LPPool.token].symbol,
                    app_user.decimals
                  )
                }}
              </div>
              <a-button type="primary" class="tool-user-button" @click="LPPoolWithdrawReward(address)" :loading="lpPool.withdrawButtonLoad"
                >提取</a-button
              >
              <a-button type="primary" class="tool-user-button" @click="LPPoolExit(address)" :loading="lpPool.exitButtonLoad"
                >提取并退出</a-button
              >
            </div>
            <br />
          </div>
        </a-tab-pane>
        <!-- <a-tab-pane key="2" tab="聊天挖矿">
          <div class="tool-user" v-if="ChatPool.tokenAddress && app_load.tokenList[ChatPool.tokenAddress]">
            <div class="tool-user-info">
              <div class="tool-user-title">块奖励：</div>
              <div class="tool-user-input" v-if="ChatPool.blockReward">
                {{
                  COMMON.math.formatBalance(
                    ChatPool.blockReward,
                    app_load.tokenList[ChatPool.tokenAddress].decimals,
                    app_load.tokenList[ChatPool.tokenAddress].symbol,
                    app_user.decimals
                  )
                }}
              </div>
            </div>
            <div class="tool-user-info">
              <div class="tool-user-title">累计奖励：</div>
              <div class="tool-user-input" v-if="ChatPool.miner">
                {{
                  COMMON.math.formatBalance(
                    ChatPool.miner.totalReward,
                    app_load.tokenList[ChatPool.tokenAddress].decimals,
                    app_load.tokenList[ChatPool.tokenAddress].symbol,
                    app_user.decimals
                  )
                }}
              </div>
            </div>
            <div class="tool-user-info">
              <div class="tool-user-title">可用奖励：</div>
              <div class="tool-user-input" v-if="ChatPool.miner">
                {{
                  COMMON.math.formatBalance(
                    ChatPool.miner.reward,
                    app_load.tokenList[ChatPool.tokenAddress].decimals,
                    app_load.tokenList[ChatPool.tokenAddress].symbol,
                    app_user.decimals
                  )
                }}
              </div>
              <a-button type="primary" @click="chatPoolWithdraw" :loading="ChatPool.withdrawButtonLoad">提取</a-button>
            </div>
          </div>
        </a-tab-pane> -->
      </a-tabs>
    </a-modal>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch, Prop } from 'vue-property-decorator';
import { namespace } from 'vuex-class';
import * as COMMON from '@/const/common';
import * as CONST from '@/const/const';
import * as Token from '@/web3/contracts/Token';
import * as LPPool from '@/web3/contracts/LPPool';

const appModule = namespace('app');
const chatModule = namespace('chat');

@Component
export default class MyMining extends Vue {
  @Prop({ default: false }) showModal: boolean;
  @appModule.State('user') app_user: any;
  @appModule.State('load') app_load: any;
  @appModule.State('const') app_const: any;
  @chatModule.State('user') chat_user: any;
  @chatModule.State('load') chat_load: any;

  COMMON: any = COMMON;
  CONST: any = CONST;

  LPPool: any = {};

  ChatPool: any = {
    blockReward: undefined,
    miner: undefined,
    tokenAddress: undefined,
    withdrawButtonLoad: false,
  };

  @Watch('showModal', { deep: true })
  changeShowModal() {
    if (this.showModal) {
      this.showMining();
    }
  }

  async showMining() {
    // this.$set(this.ChatPool, 'blockReward', await this.app_const.web3.ChatPoolFunc.blockReward());
    // this.$set(this.ChatPool, 'miner', await this.app_const.web3.ChatPoolFunc.getMiner(this.app_user.address));
    // this.$set(this.ChatPool, 'tokenAddress', Token.address[this.app_const.chain]);
    // if (!this.app_load.tokenList[this.ChatPool.tokenAddress]) {
    //   const token = await this.$store.dispatch('app/getToken', this.ChatPool.tokenAddress);
    //   this.$set(this.app_load.tokenList, this.ChatPool.tokenAddress, token);
    // }
    const [poolAddrs, token, blockReward, paused, totalPoint, blockNumber, reduceFrequency, reducePeriod, startBlock] = await Promise.all([
      await this.app_const.web3.LPPoolFunc.poolAddrs(),
      await this.app_const.web3.LPPoolFunc.token(),
      await this.app_const.web3.LPPoolFunc.blockReward(),
      await this.app_const.web3.LPPoolFunc.paused(),
      await this.app_const.web3.LPPoolFunc.totalPoint(),
      await this.app_const.web3.EthFunc.blockNumber(),
      await this.app_const.web3.LPPoolFunc.reduceFrequency(),
      await this.app_const.web3.LPPoolFunc.reducePeriod(),
      await this.app_const.web3.LPPoolFunc.startBlock(),
    ]);
    this.LPPool = { poolAddrs, token, blockReward, paused, totalPoint, blockNumber, reduceFrequency, reducePeriod, startBlock, pools: {} };
    if (!this.app_load.tokenList[this.LPPool.token]) {
      const token = await this.$store.dispatch('app/getToken', this.LPPool.token);
      this.$set(this.app_load.tokenList, this.LPPool.token, token);
    }
    this.LPPool.poolAddrs.forEach(async (address: any) => {
      if (!this.app_load.tokenList[address]) {
        const token = await this.$store.dispatch('app/getToken', address);
        this.$set(this.app_load.tokenList, address, token);
      }
      this.$store.dispatch('app/addBalance', [address, this.app_user.address]);
      const [pool, miner, reward, token0, token1, allowance, reserves, totalSupply] = await Promise.all([
        await this.app_const.web3.LPPoolFunc.getPool(address),
        await this.app_const.web3.LPPoolFunc.getMiner(address, this.app_user.address),
        await this.app_const.web3.LPPoolFunc.getReward(address, this.app_user.address),
        await this.app_const.web3.MdexLPFunc.token0(address),
        await this.app_const.web3.MdexLPFunc.token1(address),
        await this.app_const.web3.Erc20Func.allowance(address, this.app_user.address, LPPool.address[this.app_const.chain]),
        await this.app_const.web3.MdexLPFunc.getReserves(address),
        await this.app_const.web3.MdexLPFunc.totalSupply(address),
      ]);
      this.$set(this.LPPool.pools, address, {
        pool,
        miner,
        reward,
        allowance,
        lp: { token0, token1, reserves, totalSupply },
        stakeButtonLoad: false,
        withdrawButtonLoad: false,
        exitButtonLoad: false,
        stakeInput: '',
      });
      COMMON.autoRun(async () => {
        this.$set(this.LPPool.pools[address], 'reward', await this.app_const.web3.LPPoolFunc.getReward(address, this.app_user.address));
      }, 3000);
      if (!this.app_load.tokenList[this.LPPool.pools[address].lp.token0]) {
        const token = await this.$store.dispatch('app/getToken', this.LPPool.pools[address].lp.token0);
        this.$set(this.app_load.tokenList, this.LPPool.pools[address].lp.token0, token);
      }
      if (!this.app_load.tokenList[this.LPPool.pools[address].lp.token1]) {
        const token = await this.$store.dispatch('app/getToken', this.LPPool.pools[address].lp.token1);
        this.$set(this.app_load.tokenList, this.LPPool.pools[address].lp.token1, token);
      }
      await this.setApy(address);
    });
  }

  // async chatPoolWithdraw() {
  //   this.ChatPool.withdrawButtonLoad = true;
  //   this.$set(this.ChatPool, 'withdrawButtonLoad', true);
  //   await this.app_const.web3.ChatPoolFunc.withdrawReward(async (block: any) => {
  //     if (block.status == 'success' || block.status == 'error') {
  //       this.$set(this.ChatPool, 'withdrawButtonLoad', false);
  //       this.$set(this.ChatPool, 'miner', await this.app_const.web3.ChatPoolFunc.getMiner(this.app_user.address));
  //     }
  //   }).catch(() => {});
  // }

  async LPPoolApprove(address: string) {
    this.$set(this.LPPool.pools[address], 'stakeButtonLoad', true);
    this.app_const.web3.Erc20Func.approve(address, LPPool.address[this.app_const.chain], async (args: any) => {
      if (args.status == 'success' || args.status == 'error') {
        this.$set(this.LPPool.pools[address], 'stakeButtonLoad', false);
        this.$set(
          this.LPPool.pools[address],
          'allowance',
          await this.app_const.web3.Erc20Func.allowance(address, this.app_user.address, LPPool.address[this.app_const.chain])
        );
      }
    });
  }

  async LPPoolStakeLP(address: string) {
    this.$set(this.LPPool.pools[address], 'stakeButtonLoad', true);
    this.app_const.web3.LPPoolFunc.stakeLP(
      address,
      new COMMON.math.BN(this.LPPool.pools[address].stakeInput).mul(
        new COMMON.math.BN(Math.pow(10, this.app_load.tokenList[address].decimals).toString())
      ),
      async (args: any) => {
        if (args.status == 'success' || args.status == 'error') {
          this.$set(this.LPPool.pools[address], 'stakeButtonLoad', false);
          this.$set(this.LPPool.pools[address], 'pool', await this.app_const.web3.LPPoolFunc.getPool(address));
          this.$set(this.LPPool.pools[address], 'miner', await this.app_const.web3.LPPoolFunc.getMiner(address, this.app_user.address));
          this.$set(
            this.LPPool.pools[address],
            'allowance',
            await this.app_const.web3.Erc20Func.allowance(address, this.app_user.address, LPPool.address[this.app_const.chain])
          );
        }
      }
    );
  }

  async LPPoolWithdrawLP(address: string) {
    this.$set(this.LPPool.pools[address], 'stakeButtonLoad', true);
    this.app_const.web3.LPPoolFunc.withdrawLP(
      address,
      new COMMON.math.BN(this.LPPool.pools[address].stakeInput).mul(
        new COMMON.math.BN(Math.pow(10, this.app_load.tokenList[address].decimals).toString())
      ),
      async (args: any) => {
        if (args.status == 'success' || args.status == 'error') {
          this.$set(this.LPPool.pools[address], 'stakeButtonLoad', false);
          this.$set(this.LPPool.pools[address], 'pool', await this.app_const.web3.LPPoolFunc.getPool(address));
          this.$set(this.LPPool.pools[address], 'miner', await this.app_const.web3.LPPoolFunc.getMiner(address, this.app_user.address));
          this.$set(
            this.LPPool.pools[address],
            'allowance',
            await this.app_const.web3.Erc20Func.allowance(address, this.app_user.address, LPPool.address[this.app_const.chain])
          );
        }
      }
    );
  }

  async LPPoolWithdrawReward(address: string) {
    this.$set(this.LPPool.pools[address], 'withdrawButtonLoad', true);
    this.app_const.web3.LPPoolFunc.withdrawReward(address, async (args: any) => {
      if (args.status == 'success' || args.status == 'error') {
        this.$set(this.LPPool.pools[address], 'withdrawButtonLoad', false);
        this.$set(this.LPPool.pools[address], 'pool', await this.app_const.web3.LPPoolFunc.getPool(address));
        this.$set(this.LPPool.pools[address], 'miner', await this.app_const.web3.LPPoolFunc.getMiner(address, this.app_user.address));
        this.$set(
          this.LPPool.pools[address],
          'allowance',
          await this.app_const.web3.Erc20Func.allowance(address, this.app_user.address, LPPool.address[this.app_const.chain])
        );
      }
    });
  }

  async LPPoolExit(address: string) {
    this.$set(this.LPPool.pools[address], 'exitButtonLoad', true);
    this.app_const.web3.LPPoolFunc.exit(address, async (args: any) => {
      if (args.status == 'success' || args.status == 'error') {
        this.$set(this.LPPool.pools[address], 'exitButtonLoad', false);
        this.$set(this.LPPool.pools[address], 'pool', await this.app_const.web3.LPPoolFunc.getPool(address));
        this.$set(this.LPPool.pools[address], 'miner', await this.app_const.web3.LPPoolFunc.getMiner(address, this.app_user.address));
        this.$set(
          this.LPPool.pools[address],
          'allowance',
          await this.app_const.web3.Erc20Func.allowance(address, this.app_user.address, LPPool.address[this.app_const.chain])
        );
      }
    });
  }

  async setApy(address: string) {
    const year = new COMMON.math.BN((365 * 24 * 60 * 60) / 3);
    const reward = this.LPPool.blockReward
      .mul(new COMMON.math.BN(this.LPPool.pools[address].pool.point))
      .div(new COMMON.math.BN(this.LPPool.totalPoint));
    let balance = this.LPPool.pools[address].pool.balance;
    if (balance.isZero()) {
      balance = new COMMON.math.BN(Math.pow(10, this.app_load.tokenList[address].decimals).toString());
    }
    const apy = reward
      .mul(year)
      .div(
        balance
          .mul(
            this.LPPool.pools[address].lp.token0 === this.LPPool.token
              ? this.LPPool.pools[address].lp.reserves.reserve0
              : this.LPPool.pools[address].lp.reserves.reserve1
          )
          .mul(new COMMON.math.BN(2))
          .div(this.LPPool.pools[address].lp.totalSupply)
      )
      .mul(new COMMON.math.BN(100));
    this.$set(this.LPPool.pools[address], 'apy', apy);
  }
}
</script>

<style lang="scss" scoped>
.tool-user {
  text-align: center;
  font-size: 16px;
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
