// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html
import { Hook, HookContext } from '@feathersjs/feathers';
import CryptoJS from 'crypto-js';

export default (options = {}): Hook => {
  return async (context: HookContext) => {
    const { headers } = context.params;
    const messagePassword = headers?.key;
    if (!messagePassword) {
      return context;
    }
    const { result } = context;
    const output = CryptoJS.AES.decrypt(result.text, messagePassword).toString(CryptoJS.enc.Utf8);
    context.result = Object.assign(result, {
      text: output
    });
    return context;
  };
}
