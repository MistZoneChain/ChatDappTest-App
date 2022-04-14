/*
 * @Author: 33357
 * @Date: 2021-02-28 20:47:13
 * @LastEditTime: 2021-04-30 21:09:29
 * @LastEditors: 33357
 */

import detectEthereumProvider from '@metamask/detect-provider';
import Web3 from 'web3';
import * as Message from './contracts/Message';
import * as ERC20 from './contracts/ERC20';
import * as CrowdFund from './contracts/CrowdFund';
import * as LPPool from './contracts/LPPool';
import * as ChatPool from './contracts/ChatPool';
import * as MdexLP from './contracts/MdexLP';
import * as CONST from '@/const/const';
import * as COMMON from '@/const/common';

export class web3Provider {
  web3: any;
  chain: any;
  contracts: any = {};
  events: any = {};
  eventJson: any = {};
  wAddress: string;

  constructor() {}

  async getWeb3() {
    const provider: any = await detectEthereumProvider();
    if (provider) {
      if (provider !== window.ethereum) {
        throw new Error('您是否安装了多个钱包?');
      } else {
        const ethereum: any = window.ethereum;
        if (ethereum) {
          ethereum.on('accountsChanged', () => {
            window.location.reload();
          });
          ethereum.on('chainChanged', () => {
            window.location.reload();
          });
          try {
            await ethereum.request({ method: 'eth_requestAccounts' });
          } catch (error) {
            throw new Error('拒绝连接！');
          }
        }
        this.web3 = new Web3(provider);
        const chainId = await this.web3.eth.net.getId();
        for (let key in CONST.CHAIN_DATA) {
          if (CONST.CHAIN_DATA[key].CHAIN_ID == chainId) {
            this.chain = key;
            break;
          }
        }
        if (this.chain != undefined) {
          this.wAddress = (await this.web3.eth.getAccounts())[0];
          this.setContracts();
          return { wAddress: this.wAddress, chain: this.chain };
        } else {
          throw new Error('不支持当前区块链网络!');
        }
      }
    } else {
      throw new Error('请使用支持web3的浏览器打开!');
    }
  }

  setContracts() {
    this.contracts.Message = new this.web3.eth.Contract(Message.abi, Message.address[this.chain]);
    this.contracts.CrowdFund = new this.web3.eth.Contract(CrowdFund.abi, CrowdFund.address[this.chain]);
    this.contracts.LPPool = new this.web3.eth.Contract(LPPool.abi, LPPool.address[this.chain]);
    this.contracts.ChatPool = new this.web3.eth.Contract(ChatPool.abi, ChatPool.address[this.chain]);
    this.events.onSendMessage = this.Tools.onEvent(
      this.contracts.Message.events.SendMessage,
      'sendMessage',
      [{ value: 'group' }, { value: 'person' }, { value: 'messageId', type: 'number' }],
      (block: any) => {
        console.log(block);
      }
    );
  }

  MessageFunc: any = {
    getMessageIdsByGroup: async (gAddress: string) => {
      const res: any = await this.Tools.autoTry(this.contracts.Message.methods.getGroupMessageIds, [gAddress], true);
      const _res = [];
      for (const i in res) {
        _res.push(Number(res[i]));
      }
      return _res;
    },
    getLimitMessageIdsByGroup: async (gAddress: string, limit: number, start: number) => {
      const res: any = await this.Tools.autoTry(this.contracts.Message.methods.getGroupMessageIdsByLimit, [gAddress, limit, start], true, [
        'execution reverted: SafeMath: subtraction overflow',
      ]);
      const _res = [];
      for (const i in res) {
        _res.push(Number(res[i]));
      }
      return _res;
    },
    getMessageIdsLengthByGroup: async (gAddress: string) => {
      const res: any = await this.Tools.autoTry(this.contracts.Message.methods.getGroupMessageIdsLength, [gAddress], true);
      return Number(res);
    },
    getGroupPersons: async (gAddress: string) => {
      const res: any = await this.Tools.autoTry(this.contracts.Message.methods.getGroupPersons, [gAddress], true);
      return res;
    },
    getMessageIdsByPerson: async (pAddress: string) => {
      const res: any = await this.Tools.autoTry(this.contracts.Message.methods.getPersonMessageIds, [pAddress], true);
      const _res = [];
      for (const i in res) {
        _res.push(Number(res[i]));
      }
      return _res;
    },
    getLimitMessageIdsByPerson: async (pAddress: string, limit: number, start: number) => {
      const res: any = await this.Tools.autoTry(this.contracts.Message.methods.getPersonMessageIdsByLimit, [pAddress, limit, start], true);
      const _res = [];
      for (const i in res) {
        _res.push(Number(res[i]));
      }
      return _res;
    },
    getMessageIdsLengthByPerson: async (pAddress: string) => {
      const res: any = await this.Tools.autoTry(this.contracts.Message.methods.getPersonMessageIdsLength, [pAddress], true);
      return Number(res);
    },
    getPersonGroups: async (pAddress: string) => {
      const res: any = await this.Tools.autoTry(this.contracts.Message.methods.getPersonGroups, [pAddress], true);
      return res;
    },
    getMessageByMessageId: async (messageId: number) => {
      const res: any = await this.Tools.autoTry(this.contracts.Message.methods.getMessage, [messageId], true);
      return {
        sAddress: res[0],
        gAddress: res[1],
        content: res[2],
        type: Number(res[3]),
        cDate: new Date(Number(res[4]) * 1000),
      };
    },
    personSendMessageToGroup: async (gAddress: string, content: string, typeNumber: number, change: any) => {
      return await this.Tools.transaction(this.contracts.Message.methods.sendMessage, [gAddress, content, typeNumber], change);
    },
  };

  ChatPoolFunc: any = {
    getMiner: async (wAddress: string) => {
      const res: any = await this.Tools.autoTry(this.contracts.ChatPool.methods.getMiner, [wAddress], true);
      return { reward: Number(res[0]), totalReward: Number(res[1]), lastRewardBlock: Number(res[2]) };
    },
    getPool: async (cAddress: string) => {
      const res: any = await this.Tools.autoTry(this.contracts.ChatPool.methods.getPool, [cAddress], true);
      return {
        point: Number(res[0]),
        totalReward: Number(res[1]),
        lastRewardBlock: Number(res[2]),
        minBalance: Number(res[3]),
        paused: res[4],
      };
    },
    getReward: async (cAddress: string) => {
      const res: any = await this.Tools.autoTry(this.contracts.ChatPool.methods.getReward, [cAddress], true);
      return Number(res);
    },
    blockReward: async () => {
      const res: any = await this.Tools.autoTry(this.contracts.ChatPool.methods.blockReward, [], true);
      return Number(res);
    },
    withdrawReward: async (change: any) => {
      return await this.Tools.transaction(this.contracts.ChatPool.methods.withdrawReward, [], change);
    },
  };

  CrowdFundFunc: any = {
    tokenPerCrowdToken: async () => {
      const res: any = await this.Tools.autoTry(this.contracts.CrowdFund.methods.tokenPerCrowdToken, [], true);
      return Number(res);
    },

    tokenBalance: async () => {
      const res: any = await this.Tools.autoTry(this.contracts.CrowdFund.methods.tokenBalance, [], true);
      return Number(res);
    },

    crowdTokenAddress: async () => {
      const res: any = await this.Tools.autoTry(this.contracts.CrowdFund.methods.crowdTokenAddr, [], true);
      return res;
    },

    crowdTokenBalance: async () => {
      const res: any = await this.Tools.autoTry(this.contracts.CrowdFund.methods.crowdTokenBalance, [], true);
      return Number(res);
    },

    crowdFundBalance: async (wAddress: string) => {
      const res: any = await this.Tools.autoTry(this.contracts.CrowdFund.methods.crowdFundBalance, [wAddress], true);
      return Number(res);
    },

    getToken: async (wAddress: string) => {
      const res: any = await this.Tools.autoTry(this.contracts.CrowdFund.methods.getToken, [wAddress], true);
      return Number(res);
    },

    startTime: async () => {
      const res: any = await this.Tools.autoTry(this.contracts.CrowdFund.methods.startTime, [], true);
      return Number(res);
    },

    endTime: async () => {
      const res: any = await this.Tools.autoTry(this.contracts.CrowdFund.methods.endTime, [], true);
      return Number(res);
    },

    isGetToken: async (wAddress: string) => {
      const res: any = await this.Tools.autoTry(this.contracts.CrowdFund.methods.isGetToken, [wAddress], true);
      return res;
    },

    addCrowdToken: async (balance: any, change: any) => {
      return await this.Tools.transaction(this.contracts.CrowdFund.methods.addCrowdToken, [balance], change);
    },

    withdrawToken: async (change: any) => {
      return await this.Tools.transaction(this.contracts.CrowdFund.methods.withdrawToken, [], change);
    },
  };

  Erc20Func: any = {
    approve: async (cAddress: string, spender: string, change: any) => {
      const contract = new this.web3.eth.Contract(ERC20.abi, cAddress);
      return await this.Tools.transaction(
        contract.methods.approve,
        [spender, '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'],
        change
      );
    },
    allowance: async (cAddress: string, owner: string, spender: string) => {
      const contract = new this.web3.eth.Contract(ERC20.abi, cAddress);
      const res: any = await this.Tools.autoTry(contract.methods.allowance, [owner, spender], true);
      return Number(res);
    },
    balance: async (cAddress: string, wAddress: string) => {
      const contract = new this.web3.eth.Contract(ERC20.abi, cAddress);
      const res: any = await this.Tools.autoTry(contract.methods.balanceOf, [wAddress], true);
      return Number(res);
    },
    name: async (cAddress: string) => {
      const contract = new this.web3.eth.Contract(ERC20.abi, cAddress);
      const res: any = await this.Tools.autoTry(contract.methods.name, [], true);
      return res;
    },

    symbol: async (cAddress: string) => {
      const contract = new this.web3.eth.Contract(ERC20.abi, cAddress);
      const res: any = await this.Tools.autoTry(contract.methods.symbol, [], true);
      return res;
    },

    decimals: async (cAddress: string) => {
      const contract = new this.web3.eth.Contract(ERC20.abi, cAddress);
      const res: any = await this.Tools.autoTry(contract.methods.decimals, [], true);
      return Number(res);
    },

    totalSupply: async (cAddress: string) => {
      const contract = new this.web3.eth.Contract(ERC20.abi, cAddress);
      const res: any = await this.Tools.autoTry(contract.methods.totalSupply, [], true);
      return Number(res);
    },
  };

  EthFunc: any = {
    blockNumber: async () => {
      const res: any = await this.Tools.autoTry(this.web3.eth.getBlockNumber, []);
      return Number(res);
    },
    balance: async (wAddress: any) => {
      const res: any = await this.Tools.autoTry(this.web3.eth.getBalance, [wAddress]);
      return new COMMON.math.BN(res);
    },
    isContract: async (address: string) => {
      const code = await this.Tools.autoTry(this.web3.eth.getCode, [address]);
      if (code === '0x') {
        return false;
      } else {
        return true;
      }
    },
  };

  MdexLPFunc: any = {
    getReserves: async (cAddress: string) => {
      const contract = new this.web3.eth.Contract(MdexLP.abi, cAddress);
      const res: any = await this.Tools.autoTry(contract.methods.getReserves, [], true);
      return { reserve0: new COMMON.math.BN(res[0]), reserve1: new COMMON.math.BN(res[1]), blockTimestampLast: Number(res[2]) };
    },
    totalSupply: async (cAddress: string) => {
      const contract = new this.web3.eth.Contract(MdexLP.abi, cAddress);
      const res: any = await this.Tools.autoTry(contract.methods.totalSupply, [], true);
      return new COMMON.math.BN(res);
    },
    token0: async (cAddress: string) => {
      const contract = new this.web3.eth.Contract(MdexLP.abi, cAddress);
      const res: any = await this.Tools.autoTry(contract.methods.token0, [], true);
      return res;
    },
    token1: async (cAddress: string) => {
      const contract = new this.web3.eth.Contract(MdexLP.abi, cAddress);
      const res: any = await this.Tools.autoTry(contract.methods.token1, [], true);
      return res;
    },
  };

  LPPoolFunc: any = {
    reduceFrequency: async () => {
      const res: any = await this.Tools.autoTry(this.contracts.LPPool.methods.reduceFrequency, [], true);
      return Number(res);
    },
    reducePeriod: async () => {
      const res: any = await this.Tools.autoTry(this.contracts.LPPool.methods.reducePeriod, [], true);
      return Number(res);
    },
    paused: async () => {
      const res: any = await this.Tools.autoTry(this.contracts.LPPool.methods.paused, [], true);
      return res;
    },
    totalPoint: async () => {
      const res: any = await this.Tools.autoTry(this.contracts.LPPool.methods.totalPoint, [], true);
      return Number(res);
    },
    blockReward: async () => {
      const res: any = await this.Tools.autoTry(this.contracts.LPPool.methods.blockReward, [], true);
      return new COMMON.math.BN(res);
    },
    startBlock: async () => {
      const res: any = await this.Tools.autoTry(this.contracts.LPPool.methods.startBlock, [], true);
      return Number(res);
    },
    token: async () => {
      const res: any = await this.Tools.autoTry(this.contracts.LPPool.methods.token, [], true);
      return res;
    },
    poolAddrs: async () => {
      const res: any = await this.Tools.autoTry(this.contracts.LPPool.methods.poolAddrs, [], true);
      return res;
    },
    getPool: async (pool: string) => {
      const res: any = await this.Tools.autoTry(this.contracts.LPPool.methods.getPool, [pool], true);
      return {
        point: Number(res[0]),
        balance: new COMMON.math.BN(res[1]),
        rewardPerTokenStored: new COMMON.math.BN(res[2]),
        totalWithdrawReward: new COMMON.math.BN(res[3]),
        lastUpdateBlock: Number(res[4]),
        paused: res[5],
      };
    },
    getMiner: async (pool: string, miner: string) => {
      const res: any = await this.Tools.autoTry(this.contracts.LPPool.methods.getMiner, [pool, miner], true);
      return {
        balance: new COMMON.math.BN(res[0]),
        rewardStored: new COMMON.math.BN(res[1]),
        rewardPerTokenPaid: new COMMON.math.BN(res[2]),
        totalWithdrawReward: new COMMON.math.BN(res[3]),
      };
    },
    getReward: async (pool: string, miner: string) => {
      const res: any = await this.Tools.autoTry(this.contracts.LPPool.methods.getReward, [pool, miner], true);
      return new COMMON.math.BN(res);
    },
    stakeLP: async (token: string, amount: any, change: any) => {
      return await this.Tools.transaction(this.contracts.LPPool.methods.stakeLP, [token, amount], change);
    },
    withdrawLP: async (token: string, amount: any, change: any) => {
      return await this.Tools.transaction(this.contracts.LPPool.methods.withdrawLP, [token, amount], change);
    },
    withdrawReward: async (token: string, change: any) => {
      return await this.Tools.transaction(this.contracts.LPPool.methods.withdrawReward, [token], change);
    },
    exit: async (token: string, change: any) => {
      return await this.Tools.transaction(this.contracts.LPPool.methods.exit, [token], change);
    },
  };

  Tools: any = {
    addEvent: async (event: string, func: Function) => {
      this.eventJson[event] = func;
    },
    onEvent: (func: Function, event: string, onFuncArgsStr: any, change: Function) => {
      func({ filter: {}, fromBlock: 'latest' }, (error: any, res: any) => {
        if (error) {
          throw error;
        } else {
          if (this.eventJson[event] !== undefined) {
            const args = [];
            for (const i in onFuncArgsStr) {
              if (onFuncArgsStr[i].type == 'number') {
                args.push(Number(res.returnValues[onFuncArgsStr[i].value]));
              } else if (onFuncArgsStr[i].type == 'BN') {
                args.push(new COMMON.math.BN(res.returnValues[onFuncArgsStr[i].value]));
              } else {
                args.push(res.returnValues[onFuncArgsStr[i].value]);
              }
            }
            this.eventJson[event](...args);
          }
        }
      })
        .on('connected', function(subscriptionId: any) {
          //console.log(subscriptionId);
          change({ status: 'connected', data: { subscriptionId } });
        })
        .on('changed', function(event: any) {
          change({ status: 'changed', data: { event } });
        })
        .on('error', function(error: any, receipt: any) {
          console.log(error, receipt);
          change({ status: 'error', data: { error, receipt } });
        });
    },
    transaction: (func: Function, args: Array<any>, change: any) => {
      return new Promise((resolve, reject) => {
        func(...args)
          .send({ from: this.wAddress })
          .on('transactionHash', function(hash: any) {
            change({ message: '等待确认', status: 'loading2', hash: hash });
          })
          .on('receipt', function(receipt: any) {
            change({ message: '发送成功', status: 'success' });
            resolve(receipt);
          })
          .on('error', function(error: any, receipt: any) {
            change({ message: '发送失败', status: 'error' });
            reject(error);
          });
      });
    },
    autoTry: (fun: Function, args: Array<any>, isCall: boolean = false, notErrArr: any = []) => {
      return new Promise(async (resolve, reject) => {
        let err;
        let time: number = 30;
        let _time: number = new Date().getTime();
        for (let i = 0; i < time; i++) {
          try {
            let res;
            if (isCall) {
              res = await fun(...args).call();
            } else {
              res = await fun(...args);
            }
            resolve(res);
            break;
          } catch (error) {
            err = error;
            if (notErrArr.length != 0) {
              if (JSON.parse(notErrArr.indexOf(err.message.substring(25)).message) != -1) {
                break;
              }
            }
            if (i === time - 1) {
              console.log('autoTry', args, i, err, new Date().getTime() - _time);
              reject(err);
              break;
            }
            await COMMON.sleep(100);
            console.log('autoTry', args, i, err, new Date().getTime() - _time);
            _time = new Date().getTime();
            continue;
          }
        }
      });
    },
  };
}
