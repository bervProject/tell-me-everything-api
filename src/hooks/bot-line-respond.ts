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
  JoinEvent,
  FollowEvent
} from '@line/bot-sdk';

async function handleEvent(event: WebhookEvent) {
  logger.info(JSON.stringify(event));
  const eventType = event.type;
  logger.info(`We get event type: ${eventType}`);
  if (eventType === "message") {
    const messageEvent = event as MessageEvent;
    const message = messageEvent.message;
    const sourceType = messageEvent.source.type;
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
        const userId = messageEvent.source.userId;
        let name = "";
        if (userId != undefined) {
          const profile = await client.getProfile(userId);
          name = profile.displayName;
        }
        await client.replyMessage(messageEvent.replyToken, {
          type: "text",
          text: name !== "" ? `Halo, kak ${name}!` : "Halo!"
        });
      } else if (messageText.startsWith("search ")) {
        const splitText = messageText.split(" ", 1);
        const searchText = splitText[1];
        const credentials = new CognitiveServicesCredentials(process.env.SEARCH_KEY || "");
        const webSearchClient = new WebSearchClient(credentials);
        const result = await webSearchClient.web.search(searchText);
        console.log(result.webPages?.value);
        console.log(result.images?.value);
      } else {
        await client.replyMessage(messageEvent.replyToken, {
          type: "text",
          text: "Maaf saat ini perintah yang anda berikan tidak tersedia. Mohon masukan 'bantuan' untuk info lebih lanjut."
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
        text: `Halo kak, ${profile.displayName}! Selamat datang di grup!`
      });
    }
  } else if (eventType === "join") {
    const joinEvent = event as JoinEvent;
    await client.replyMessage(joinEvent.replyToken, {
      type: "text",
      text: "Halo semuanya! Terima kasih telah mengundang kami di grup ini! Ketik 'bantuan' tanpa tanda petik untuk melihat fungsi dari bot ini."
    });
  } else if (eventType === "follow") {
    const followEvent = event as FollowEvent;
    const sourceType = followEvent.source.type.toLowerCase();
    if (sourceType === "user") {
      const userId = followEvent.source.userId;
      logger.info(`Welcoming to ${userId}`);
      if (userId != undefined) {
        const profile = await client.getProfile(userId);
        await client.replyMessage(followEvent.replyToken, {
          type: "text",
          text: `Halo kak ${profile.displayName}, terima kasih sudah menambahkan saya!`
        });
      }
    }
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
