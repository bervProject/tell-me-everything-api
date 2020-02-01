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
    logger.info(JSON.stringify(event));
    if (event.type === "message") {
      const message = event.message;
      logger.info(JSON.stringify(message));
      if (message.type === "text" && message.text === "bye") {
        if (event.source.type === "room") {
          client.leaveRoom(event.source.roomId);
        } else if (event.source.type === "group") {
          client.leaveGroup(event.source.groupId);
        } else {
          client.replyMessage(event.replyToken, {
            type: "text",
            text: "I cannot leave a 1-on-1 chat!",
          });
        }
      } else if (message.type == "text" && message.text == "hi") {
        client.replyMessage(event.replyToken, {
          type: "text",
          text: "Hello World!"
        });
      }
    }
    context.statusCode = 200;
    context.result = data.events;
    return context;
  };
}
