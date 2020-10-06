// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html
import { Hook, HookContext } from '@feathersjs/feathers';
import Base64 from 'crypto-js/enc-base64';
import SHA512 from 'crypto-js/sha512';

export default (options = {}): Hook => {
  return async (context: HookContext) => {
    const { headers } = context.params;
    const mySalt = '99haze##';
    const messagePassword = headers?.key;
    if (!messagePassword) {
      return context;
    }
    const hashPassword = Base64.stringify(SHA512(messagePassword + mySalt));
    context.params.query = {
      messagePassword: hashPassword
    };
    return context;
  };
}
