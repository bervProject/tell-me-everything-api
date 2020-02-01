// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html
import { Hook, HookContext } from '@feathersjs/feathers';
import logger from '../logger';
import client from '../line-client';
import { MemberJoinEvent } from '@line/bot-sdk';

async function handleEvent(event: any) {
  logger.info(JSON.stringify(event));
  const eventType = event.type;
  const sourceType = event.source.type;
  logger.info(eventType);
  if (eventType === "message") {
    const message = event.message;
    const messageType = message.type;
    const messageText = message.text.toLowerCase();
    logger.info(JSON.stringify(message));
    if (messageType === "text" && messageText === "bye") {
      if (sourceType === "room") {
        await client.leaveRoom(event.source.roomId);
      } else if (sourceType === "group") {
        await client.leaveGroup(event.source.groupId);
      } else {
        await client.replyMessage(event.replyToken, {
          type: "text",
          text: "I cannot leave a 1-on-1 chat!",
        });
      }
    } else if (messageType == "text" && messageText == "hi") {
      await client.replyMessage(event.replyToken, {
        type: "text",
        text: "Hello World!"
      });
    }
  } else if (eventType === "memberJoined") {
    const joinEvent: MemberJoinEvent = event;
    const joinedMembers = joinEvent.joined.members;
    for (const member of joinedMembers) {
      logger.info(`Welcome to ${member.userId}`);
      const profile = await client.getProfile(member.userId);
      await client.replyMessage(event.replyToken, {
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
    for (event of data.events) {
      handleEvent(event);
    }
    context.statusCode = 200;
    context.result = data.events;
    return context;
  };
}
