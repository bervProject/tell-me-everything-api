// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html
import { Hook, HookContext } from '@feathersjs/feathers';
import CryptoJS from 'crypto-js';

export default (options = {}): Hook => {
  return async (context: HookContext) => {
    const { headers } = context.params;
    const mySalt = '99haze##';
    const messagePassword = headers?.key;
    if (!messagePassword) {
      return context;
    }
    const hashPassword = CryptoJS.enc.Base64.stringify(CryptoJS.SHA512(messagePassword + mySalt));
    context.params.query = {
      messagePassword: hashPassword
    };
    return context;
  };
}
