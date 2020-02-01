// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html
import { Hook, HookContext } from '@feathersjs/feathers';
import logger from '../logger';
import client from '../line-client';
import {
  MemberJoinEvent,
  MessageEvent,
  TextEventMessage,
  WebhookEvent,
  WebhookRequestBody,
  Room,
  Group
} from '@line/bot-sdk';

async function handleEvent(event: WebhookEvent) {
  logger.info(JSON.stringify(event));
  const eventType = event.type;
  const sourceType = event.source.type;
  logger.info(eventType);
  if (eventType === "message") {
    const messageEvent = event as MessageEvent;
    const message = messageEvent.message;
    logger.info(JSON.stringify(message));
    const messageType = message.type;
    if (messageType === "text") {
      const messageText = (message as TextEventMessage).text.toLowerCase();
      if (messageText === "bye") {
        if (sourceType === "room") {
          await client.leaveRoom((event.source as Room).roomId);
        } else if (sourceType === "group") {
          await client.leaveGroup((event.source as Group).groupId);
        } else {
          await client.replyMessage(messageEvent.replyToken, {
            type: "text",
            text: "I cannot leave a 1-on-1 chat!",
          });
        }
      } else if (messageText == "hi") {
        await client.replyMessage(messageEvent.replyToken, {
          type: "text",
          text: "Hello World!"
        });
      }
    }
  } else if (eventType === "memberJoined") {
    const joinEvent = event as MemberJoinEvent;
    const joinedMembers = joinEvent.joined.members;
    for (const member of joinedMembers) {
      logger.info(`Welcome to ${member.userId}`);
      const profile = await client.getProfile(member.userId);
      await client.replyMessage(joinEvent.replyToken, {
        type: "text",
        text: `Hi, ${profile.displayName}! Welcome to the group!`
      });
    }
  }
}

export default (options = {}): Hook => {
  return async (context: HookContext) => {
    const { data } = context;
    logger.info(JSON.stringify(data));
    const events = (data as WebhookRequestBody).events;
    for (const event of events) {
      handleEvent(event);
    }
    context.statusCode = 200;
    context.result = data.events;
    return context;
  };
}
