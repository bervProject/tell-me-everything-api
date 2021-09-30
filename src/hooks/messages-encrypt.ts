// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html
import { Hook, HookContext } from "@feathersjs/feathers";
import AES from "crypto-js/aes";
import * as argon2 from "argon2";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default (options = {}): Hook => {
  return async (context: HookContext) => {
    const data = context.data;
    const text = data.text;
    const password = data.messagePassword;
    const hashPassword = await argon2.hash(password);
    const textEncrypted = AES.encrypt(text, password).toString();
    context.data = Object.assign(data, {
      text: textEncrypted,
      messagePassword: hashPassword,
    });
    return context;
  };
};
