// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html
import { Hook, HookContext } from '@feathersjs/feathers';
import logger from '../logger';
//import Client from '../line-client';

export default (options = {}): Hook => {
  return async (context: HookContext) => {
    const { headers } = context.params;
    const { data } = context;
    logger.info(JSON.stringify(headers));
    logger.info(JSON.stringify(data));
    //Client.pushMessage()
    context.statusCode = 200;
    context.result = data;
    return context;
  };
}
