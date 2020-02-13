// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html
import { Hook, HookContext } from '@feathersjs/feathers';
import { SignatureValidationFailed, JSONParseError } from '@line/bot-sdk';
import logger from '../logger';

export default (options = {}): Hook => {
  return async (context: HookContext) => {
    const { error } = context;
    if (error instanceof SignatureValidationFailed) {
      context.statusCode = 401;
      context.error = error.signature;
      context.result = error.signature;
    } else if (error instanceof JSONParseError) {
      context.statusCode = 400;
      context.error = error.raw;
      context.result = error.raw;
    }
    logger.error(`Error: ${JSON.stringify(context)}`);
    return context;
  };
}
