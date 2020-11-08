// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html
import { Hook, HookContext } from "@feathersjs/feathers";
import AES from "crypto-js/aes";
import Base64 from "crypto-js/enc-base64";
import SHA512 from "crypto-js/sha512";

export default (options = {}): Hook => {
  return async (context: HookContext) => {
    const { app } = context;
    const mySalt = app.get("salt");
    const data = context.data;
    const text = data.text;
    const password = data.messagePassword;
    const hashPassword = Base64.stringify(SHA512(password + mySalt));
    const textEncrypted = AES.encrypt(text, password).toString();
    context.data = Object.assign(data, {
      text: textEncrypted,
      messagePassword: hashPassword,
    });
    return context;
  };
};
