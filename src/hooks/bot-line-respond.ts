// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html
import { Hook, HookContext } from '@feathersjs/feathers';
import { CognitiveServicesCredentials } from 'ms-rest-azure';
import { WebSearchClient } from 'azure-cognitiveservices-websearch';
import logger from '../logger';
import client from '../line-client';
import {
  MemberJoinEvent,
  MessageEvent,
  TextEventMessage,
  WebhookEvent,
  WebhookRequestBody,
  Room,
  Group,
  JoinEvent
} from '@line/bot-sdk';

async function handleEvent(event: WebhookEvent) {
  logger.info(JSON.stringify(event));
  const eventType = event.type;
  const sourceType = event.source.type;
  logger.info(`We get event type: ${eventType}`);
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
      } else if (messageText === "hi") {
        await client.replyMessage(messageEvent.replyToken, {
          type: "text",
          text: "Hello World!"
        });
      } else if (messageText.startsWith("search ")) {
        const splitText = messageText.split(" ", 1);
        const searchText = splitText[1];
        const credentials = new CognitiveServicesCredentials(process.env.SEARCH_KEY || "");
        const webSearchClient = new WebSearchClient(credentials);
        const result = await webSearchClient.web.search(searchText);
        console.log(result.webPages?.value);
        console.log(result.images?.value);
      }
    }
  } else if (eventType === "memberJoined") {
    const joinEvent = event as MemberJoinEvent;
    const joinedMembers = joinEvent.joined.members;
    for (const member of joinedMembers) {
      logger.info(`Welcome ${member.userId}`);
      const profile = await client.getProfile(member.userId);
      await client.replyMessage(joinEvent.replyToken, {
        type: "text",
        text: `Hi, ${profile.displayName}! Welcome to the group!`
      });
    }
  } else if (eventType === "join") {
    const joinEvent = event as JoinEvent;
    await client.replyMessage(joinEvent.replyToken, {
      type: "text",
      text: "Halo semuanya! Terima kasih telah mengundang kami di grup ini! Ketik 'bantuan' tanpa tanda petik untuk melihat fungsi dari bot ini."
    });
  }
}

export default (options = {}): Hook => {
  return async (context: HookContext) => {
    const { data } = context;
    logger.info(`Data sending to us: ${JSON.stringify(data)}`);
    const hookBody = data as WebhookRequestBody;
    logger.info(`Event sending to ${hookBody.destination}`);
    const events = hookBody.events;
    for (const event of events) {
      handleEvent(event);
    }
    context.statusCode = 200;
    context.result = data.events;
    return context;
  };
}
