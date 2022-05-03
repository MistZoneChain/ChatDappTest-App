import { BigNumber, log, utils } from '.';

function getType(content: string, that: any) {
  try {
    if (content.substring(0, 3) == 'u::') {
      const [_, href, text] = content.split('::');
      return {
        type: 'url',
        href,
        text,
      };
    }
    if (content.substring(0, 3) == 't::') {
      const [_, contractAddress, functionName, value, types, args, text] = content.split('::');
      let typeList = [types];
      if (types.indexOf(',') != -1) {
        typeList = types.split(',');
      }
      let argList = [args];
      if (args.indexOf(',') != -1) {
        argList = args.split(',');
      }
      const code = utils.ethers.defaultAbiCoder.encode(typeList, argList);
      const seletor = utils.ethers.id(`${functionName}(${types})`).slice(0, 10);
      const callcode = seletor + code.substring(2);
      return {
        type: 'transaction',
        text,
        transaction: {
          contractAddress,
          value: BigNumber.from(value),
          callcode,
        },
      };
    }
    if (content.substring(0, 3) == 'c::') {
      const [_, contractAddress, functionName, types, args, returnTypes, numZeros, callTexts, text] = content.split('::');
      let typeList = [types];
      if (types.indexOf(',') != -1) {
        typeList = types.split(',');
      }
      let argList = [args];
      if (args.indexOf(',') != -1) {
        argList = args.split(',');
      }
      let returnTypeList = [returnTypes];
      if (returnTypes.indexOf(',') != -1) {
        returnTypeList = returnTypes.split(',');
      }
      let callTextList = [callTexts];
      if (callTexts.indexOf(',') != -1) {
        callTextList = callTexts.split(',');
      }
      let numZeroList = [numZeros];
      if (numZeros.indexOf(',') != -1) {
        numZeroList = numZeros.split(',');
      }
      const code = utils.ethers.defaultAbiCoder.encode(typeList, argList);
      const seletor = utils.ethers.id(`${functionName}(${types})`).slice(0, 10);
      const callcode = seletor + code.substring(2);
      return {
        type: 'call',
        text,
        transaction: {
          contractAddress,
          callcode,
          returnTypeList,
          numZeroList,
          callTextList,
        },
      };
    }
    if (content.substring(0, 3) == 'e::') {
      if (that.appStorage.activeRecipientText == that.appSync.userAddress) {
        return {
          type: 'encrypt',
          text: that.$t('message.decrypt_message'),
        };
      } else {
        return {
          type: 'text',
          text: that.$t('message.encrypt_message'),
        };
      }
    }
    if (content.substring(0, 3) == 'i::') {
      const [_, src, alt] = content.split('::');
      return {
        type: 'image',
        src,
        alt,
      };
    }
    if (content.substring(0, 3) == 'v::') {
      const [_, src] = content.split('::');
      return {
        type: 'video',
        src,
      };
    }
    if (content.substring(0, 3) == 'a::') {
      const [_, src] = content.split('::');
      return {
        type: 'audio',
        src,
      };
    }
    if (content.substring(0, 4) == 'tr::') {
      const [_, from, to, amount] = content.split('::');
      return {
        type: 'tr',
        text: `${from} send ${amount.length > 18 ? amount.substring(0, amount.length - 18) : '0.' + amount} to ${to}`,
      };
    }
    return {
      type: 'text',
      text: content,
    };
  } catch (err) {
    log(err);
    return {
      type: 'text',
      text: content,
    };
  }
}

export const messageType = {
  getType,
};
