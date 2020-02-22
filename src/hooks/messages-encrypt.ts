// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html
import { Hook, HookContext } from '@feathersjs/feathers';
import CryptoJS from 'crypto-js';
import logger from '../logger';

export default (options = {}): Hook => {
  return async (context: HookContext) => {
    const mySalt = '99haze##';
    const data = context.data;
    const text = data.text;
    const password = data.messagePassword;
    const hashPassword = CryptoJS.enc.Base64.stringify(CryptoJS.SHA512(password + mySalt));
    const textEncrypted = CryptoJS.AES.encrypt(text, password).toString();
    context.data = Object.assign(data, {
      text: textEncrypted,
      messagePassword: hashPassword
    });
    return context;
  };
}
