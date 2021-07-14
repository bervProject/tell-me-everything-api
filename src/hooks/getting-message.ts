// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html
import { Forbidden, NotFound } from "@feathersjs/errors";
import { Hook, HookContext } from "@feathersjs/feathers";
import bcryptjs from "bcryptjs";

export default (options = {}): Hook => {
  return async (context: HookContext) => {
    const { id, params, app } = context;
    const { headers } = params;
    const messagePassword = headers?.key;
    if (!messagePassword) {
      throw new Forbidden("You are not authorized to check this messages");
    }
    const data = await app.service("message")._get(id);
    if (!data) {
      throw new NotFound("Data Not Found!");
    }
    const originalPassword = data.messagePassword;
    const same = bcryptjs.compareSync(messagePassword, originalPassword);
    if (!same) {
      throw new Forbidden("You are not authorized to check this messages");
    }
    return context;
  };
};
