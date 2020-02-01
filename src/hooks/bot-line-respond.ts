// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html
import { Hook, HookContext } from '@feathersjs/feathers';
import logger from '../logger';
import client from '../line-client';

export default (options = {}): Hook => {
  return async (context: HookContext) => {
    const { headers } = context.params;
    const { data } = context;
    logger.info(JSON.stringify(headers));
    logger.info(JSON.stringify(data));
    const event = data.events[0];
    logger.info(event);
    if (event.source.type == "user") {
      logger.info("Reply User");
      logger.info(event.replyToken);
      client.replyMessage(event.replyToken, {
        type: "text",
        text: "Hello World"
      });
    }
    context.statusCode = 200;
    context.result = data.events;
    return context;
  };
}
