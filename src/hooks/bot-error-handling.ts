// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html
import { Hook, HookContext } from "@feathersjs/feathers";
import { SignatureValidationFailed, JSONParseError } from "@line/bot-sdk";
import logger from "../logger";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default (options = {}): Hook => {
  return async (context: HookContext) => {
    const { error } = context;
    if (error instanceof SignatureValidationFailed) {
      if (context.http) {
        context.http.status = 401;
      }
      context.error = error.signature;
      context.result = error.signature;
    } else if (error instanceof JSONParseError) {
      if (context.http) {
        context.http.status = 400;
      }
      context.error = error.raw;
      context.result = error.raw;
    }

    logger.error(`Error: ${JSON.stringify(error)}`);
    return context;
  };
};
