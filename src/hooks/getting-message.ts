// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html
import { Forbidden, NotFound } from "@feathersjs/errors";
import { Hook, HookContext } from "@feathersjs/feathers";
import * as argon2 from "argon2";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default (options = {}): Hook => {
  return async (context: HookContext) => {
    const { id, params, app } = context;
    const { headers } = params;
    const messagePassword = headers?.key;
    if (!messagePassword) {
      // without header
      return context;
    }
    const data = await app.service("message")._get(id);
    if (!data) {
      throw new NotFound("Data Not Found!");
    }
    const hashedPassword = data.messagePassword;
    const same = argon2.verify(hashedPassword, messagePassword);
    if (!same) {
      throw new Forbidden("You are not authorized to check this messages");
    }
    return context;
  };
};
