// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html
import { Hook, HookContext } from "@feathersjs/feathers";
import AES from "crypto-js/aes";
import Utf8 from "crypto-js/enc-utf8";

export default (options = {}): Hook => {
  return async (context: HookContext) => {
    const { headers } = context.params;
    const messagePassword = headers?.key;
    if (!messagePassword) {
      return context;
    }
    const { result } = context;
    const output = AES.decrypt(result.text, messagePassword).toString(Utf8);
    context.result = Object.assign(result, {
      text: output,
    });
    return context;
  };
};
