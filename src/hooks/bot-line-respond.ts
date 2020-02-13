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
  FollowEvent,
  TextMessage
} from '@line/bot-sdk';

async function proccessMessageEvent(messageEvent: MessageEvent) {
  const message = messageEvent.message;
  const sourceType = messageEvent.source.type;
  logger.info(JSON.stringify(message));
  const messageType = message.type;
  if (messageType === "text") {
    const messageText = (message as TextEventMessage).text.toLowerCase();
    if (messageText === "bye") {
      if (sourceType === "room") {
        await client.leaveRoom((messageEvent.source as Room).roomId);
      } else if (sourceType === "group") {
        await client.leaveGroup((messageEvent.source as Group).groupId);
      } else {
        await client.replyMessage(messageEvent.replyToken, {
          type: "text",
          text: "Maaf, kak. Kita lagi saling chat. Kita gak bisa ninggalin kakak di chat ini. :'(",
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
        text: name !== "" ? `Halo, kak ${name}! Semoga hari-harinya menyenangkan!` : "Halo! Semoga hari-harinya menyenangkan!"
      });
    } else if (messageText.startsWith("search")) {
      const splitText = messageText.split(" ", 2);
      if (splitText.length > 1) {
        const searchText = splitText[1];
        const credentials = new CognitiveServicesCredentials(process.env.SEARCH_KEY || "");
        const webSearchClient = new WebSearchClient(credentials);
        const result = await webSearchClient.web.search(searchText);
        const output = new Array<TextMessage>();
        // logger.info(JSON.stringify(result.webPages?.value));
        // logger.info(JSON.stringify(result.images?.value));
        if (result.webPages) {
          for (let content of result.webPages.value) {
            output.push({ type: "text", text: content.displayUrl || "" });
          }
        }
        if (output.length == 0) {
          await client.replyMessage(messageEvent.replyToken, {
            type: "text",
            text: "Sepertinya pencarian kakak tidak ditemukan. :("
          });
        } else if (output.length > 5) {
          await client.replyMessage(messageEvent.replyToken, output.slice(0,5));
        } else {
          await client.replyMessage(messageEvent.replyToken, output);
        }
      } else {
        await client.replyMessage(messageEvent.replyToken, {
          type: "text",
          text: "Masukan kata kunci yang ingin anda cari. Misalkan, search ayam"
        })
      }
    } else if (messageText === "bantuan") {
      await client.replyMessage(messageEvent.replyToken, [{
        type: "text",
        text: "Halo kak! Jadi kita cuman bisa perintah ini loh,"
      }, {
        type: "text",
        text: "bye, hi, search"
      }])
    } else {
      await client.replyMessage(messageEvent.replyToken, {
        type: "text",
        text: "Maaf saat ini perintah yang anda berikan tidak tersedia. Mohon masukan 'bantuan' untuk info lebih lanjut."
      });
    }
  }
}

async function proccessMemberJoin(joinEvent: MemberJoinEvent) {
  const joinedMembers = joinEvent.joined.members;
  for (const member of joinedMembers) {
    logger.info(`Welcome to ${member.userId}`);
    const profile = await client.getProfile(member.userId);
    await client.replyMessage(joinEvent.replyToken, {
      type: "text",
      text: `Halo kak, ${profile.displayName}! Selamat datang di grup!`
    });
  }
}

async function proccessFollowEvent(followEvent: FollowEvent) {
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

async function handleEvent(event: WebhookEvent) {
  try {
    logger.info(JSON.stringify(event));
    const eventType = event.type;
    logger.info(`We get event type: ${eventType}`);
    if (eventType === "message") {
      const messageEvent = event as MessageEvent;
      await proccessMessageEvent(messageEvent);
    } else if (eventType === "memberJoined") {
      const joinEvent = event as MemberJoinEvent;
      await proccessMemberJoin(joinEvent);
    } else if (eventType === "join") {
      const joinEvent = event as JoinEvent;
      await client.replyMessage(joinEvent.replyToken, {
        type: "text",
        text: "Halo semuanya! Terima kasih telah mengundang kami di grup ini! Ketik 'bantuan' tanpa tanda petik untuk melihat fungsi dari bot ini."
      });
    } else if (eventType === "follow") {
      const followEvent = event as FollowEvent;
      await proccessFollowEvent(followEvent);
    }
  } catch (exception) {
    logger.error(`${JSON.stringify(exception)}`);
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
