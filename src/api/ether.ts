import { EtherBlockChatUpgradeableClient, DeploymentInfo } from 'blockchat-contract-sdk';
import detectEthereumProvider from '@metamask/detect-provider';
import { ethers, Signer } from 'ethers';
import { Web3Provider } from '@ethersproject/providers';
import { common } from '@/const';
import * as ethUtil from 'ethereumjs-util';
import * as sigUtil from '@metamask/eth-sig-util';
import * as naclUtil from 'tweetnacl-util';

export class Ether {
  private _singer: Signer | undefined;
  private _chainId: number | undefined;
  private _network: string | undefined;
  private _provider: Web3Provider | undefined;
  private _blockchat: EtherBlockChatUpgradeableClient | undefined;
  private _ethereum: any;

  constructor() {}

  async load() {
    const provider: any = await detectEthereumProvider();
    if (provider) {
      if (provider != window.ethereum) {
        throw new Error('Have you installed multiple wallets');
      } else {
        this._ethereum = window.ethereum;
        if (this._ethereum) {
          this._ethereum.on('accountsChanged', () => {
            window.location.reload();
          });
          this._ethereum.on('chainChanged', () => {
            window.location.reload();
          });
          try {
            await this._ethereum.request({ method: 'eth_requestAccounts' });
          } catch (error) {
            throw new Error('Connection refused');
          }
        }
        this._provider = new ethers.providers.Web3Provider(this._ethereum);
        this._singer = this._provider.getSigner();
        if (this._singer) {
          this.setContracts();
          this._chainId = await this._singer.getChainId();
        }
      }
    } else {
      throw new Error('Please use a browser that supports web3 to open');
    }
  }

  setContracts() {
    if (!this._singer) {
      throw new Error('no provider or singer');
    }
    this._blockchat = new EtherBlockChatUpgradeableClient();
    this._blockchat.connect(this._singer, undefined, 1);
  }

  getSinger() {
    if (!this._singer) {
      throw new Error('no singer');
    }
    return this._singer;
  }

  getNetwork() {
    if (!this._network) {
      throw new Error('no network');
    }
    return this._network;
  }

  getBlockChat() {
    if (!this._blockchat) {
      throw new Error('no blockchat');
    }
    return this._blockchat;
  }

  P2P = {
    decrypt: async (secretBase64: string, address: string) => {
      const secretHex = Buffer.from(secretBase64, 'base64').toString('hex');
      const ephemPublicKeyBase64 = naclUtil.encodeBase64(Buffer.from(secretHex.substring(0, 64), 'hex'));
      const nonceBase64 = naclUtil.encodeBase64(Buffer.from(secretHex.substring(64, 112), 'hex'));
      const ciphertextBase64 = naclUtil.encodeBase64(Buffer.from(secretHex.substring(112), 'hex'));
      const encryptData = JSON.stringify({
        version: 'x25519-xsalsa20-poly1305',
        ephemPublicKey: ephemPublicKeyBase64,
        nonce: nonceBase64,
        ciphertext: ciphertextBase64,
      });
      const hex = ethUtil.bufferToHex(Buffer.from(encryptData, 'utf-8'));
      const content: string = await this._ethereum.request({
        method: 'eth_decrypt',
        params: [hex, address],
      });
      console.log(content);
      return content;
    },
    encrypt: (content: string, encryptionPublicKey: string) => {
      const encryptData = sigUtil.encrypt({ publicKey: encryptionPublicKey, data: content, version: 'x25519-xsalsa20-poly1305' });
      const ephemPublicKeyHex = Buffer.from(naclUtil.decodeBase64(encryptData.ephemPublicKey)).toString('hex');
      const nonceHex = Buffer.from(naclUtil.decodeBase64(encryptData.nonce)).toString('hex');
      const ciphertextHex = Buffer.from(naclUtil.decodeBase64(encryptData.ciphertext)).toString('hex');
      const secretHex = ephemPublicKeyHex + nonceHex + ciphertextHex;
      const secretBase64 = Buffer.from(secretHex, 'hex').toString('base64');
      console.log(secretBase64.length);
      return secretBase64;
    },
  };

  P2G = {
    decrypt: (signSecretBase64: string, privateKey: string) => {
      const signSecretHex = Buffer.from(signSecretBase64, 'base64').toString('hex');
      const signHex = '0x' + signSecretHex.substring(0, 130);
      const secretHex = signSecretHex.substring(130);
      const address = sigUtil.recoverPersonalSignature({ data: secretHex, signature: signHex });
      const wallet = new ethers.Wallet(privateKey);
      const isSign = ethers.utils.getAddress(address) == ethers.utils.getAddress(wallet.address);
      const ephemPublicKeyBase64 = naclUtil.encodeBase64(Buffer.from(secretHex.substring(0, 64), 'hex'));
      const nonceBase64 = naclUtil.encodeBase64(Buffer.from(secretHex.substring(64, 112), 'hex'));
      const ciphertextBase64 = naclUtil.encodeBase64(Buffer.from(secretHex.substring(112), 'hex'));
      const encryptedData = {
        version: 'x25519-xsalsa20-poly1305',
        ephemPublicKey: ephemPublicKeyBase64,
        nonce: nonceBase64,
        ciphertext: ciphertextBase64,
      };
      const content = sigUtil.decrypt({ encryptedData, privateKey: privateKey.substring(2) });
      console.log({ content, isSign });
      return { content, isSign };
    },
    encrypt: (content: string, privateKey: string) => {
      const encryptionPublicKey = sigUtil.getEncryptionPublicKey(privateKey.substring(2));
      const encryptData = sigUtil.encrypt({ publicKey: encryptionPublicKey, data: content, version: 'x25519-xsalsa20-poly1305' });
      const ephemPublicKeyHex = Buffer.from(naclUtil.decodeBase64(encryptData.ephemPublicKey)).toString('hex');
      const nonceHex = Buffer.from(naclUtil.decodeBase64(encryptData.nonce)).toString('hex');
      const ciphertextHex = Buffer.from(naclUtil.decodeBase64(encryptData.ciphertext)).toString('hex');
      const secretHex = ephemPublicKeyHex + nonceHex + ciphertextHex;
      const sign = sigUtil.personalSign({ data: secretHex, privateKey: Buffer.from(privateKey.substring(2), 'hex') });
      const signHex = sign.substring(2);
      const signSecretHex = signHex + secretHex;
      const signSecretBase64 = Buffer.from(signSecretHex, 'hex').toString('base64');
      console.log(signSecretBase64, signSecretBase64.length);
      return signSecretBase64;
    },
  };

  metamask = {
    getEncryptionPublicKeyByAddress: async (address: string) => {
      const publicKey: string = await this._ethereum.request({
        method: 'eth_getEncryptionPublicKey',
        params: [address],
      });
      return publicKey;
    },
    createWallet: () => {
      return ethers.Wallet.createRandom();
    },
    getWalletByPrivateKey: (privateKey: string) => {
      return new ethers.Wallet(privateKey);
    },
    getEncryptionPublicKeyByPrivateKey: (privateKey: string) => {
      return sigUtil.getEncryptionPublicKey(privateKey);
    },
    getBalance: (address: string) => {
      if (!this._provider) {
        throw new Error('no provider');
      }
      return this._provider.getBalance(address);
    },
    isContract: async (address: string) => {
      if (!this._provider) {
        throw new Error('no provider');
      }
      const code = await this._provider.getCode(address);
      if (code == '0x') {
        return false;
      }
      return true;
    },
  };

  utils = {
    // getType: async (address: string) => {
    //   if (address == common.etherAddress) {
    //     return 'erc20';
    //   } else if (await this.metamask.isContract(address)) {
    //     try {
    //       const erc20 = this.getERC20(address);
    //       if (await erc20.decimals()) {
    //         return 'erc20';
    //       } else if (await erc20.totalSupply()) {
    //         return 'erc721';
    //       }
    //       return 'contract';
    //     } catch (err) {
    //       console.log(err);
    //       return 'contract';
    //     }
    //   } else {
    //     return 'wallet';
    //   }
    // },
  };
}
