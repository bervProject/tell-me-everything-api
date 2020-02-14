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
  FlexBubble
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
        const output = new Array<FlexBubble>();
        if (result.webPages) {
          for (let content of result.webPages.value) {
            output.push({
              type: "bubble",
              body: {
                type: "box",
                layout: "vertical",
                contents: [{
                  type: "text",
                  text: content.displayUrl || ""
                }]
              },
              action: {
                label: "link",
                type: "uri",
                uri: content.displayUrl || ""
              }
            });
          }
        }
        if (output.length == 0) {
          await client.replyMessage(messageEvent.replyToken, {
            type: "text",
            text: "Sepertinya pencarian kakak tidak ditemukan. :("
          });
        } else if (output.length > 10) {
          await client.replyMessage(messageEvent.replyToken, {
            type: "flex",
            altText: "Web Result",
            contents: {
              type: "carousel",
              contents: output.slice(0, 10)
            }
          });
        } else {
          await client.replyMessage(messageEvent.replyToken, {
            type: "flex",
            altText: "Web Result",
            contents: {
              type: "carousel",
              contents: output
            }
          });
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
        type: "flex",
        altText: "bye, hi, search",
        contents: {
          type: "carousel",
          contents: [
            {
              type: "bubble",
              body: {
                type: "box",
                layout: "horizontal",
                contents: [
                  {
                    type: "text",
                    text: "Hi",
                    action: {
                      label: "Hi",
                      type: "message",
                      text: "Hi"
                    }
                  }
                ]
              }
            },
            {
              type: "bubble",
              body: {
                type: "box",
                layout: "horizontal",
                contents: [
                  {
                    type: "text",
                    text: "Bye",
                    action: {
                      label: "Bye",
                      type: "message",
                      text: "Bye"
                    }
                  }
                ]
              }
            },
            {
              type: "bubble",
              body: {
                type: "box",
                layout: "horizontal",
                contents: [
                  {
                    type: "text",
                    text: "Search",
                    action: {
                      label: "Search",
                      type: "message",
                      text: "Search"
                    }
                  }
                ]
              }
            }
          ]
        }
      }]);
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
      await client.replyMessage(followEvent.replyToken, [{
        type: "text",
        text: `Halo kak ${profile.displayName}, terima kasih sudah menambahkan saya!`
      }, {
        type: "text",
        text: "Ketik 'bantuan' untuk perintah lebih lanjut ya, kak."
      }, {
        type: "text",
        text: "Kami bisa membantu kakak mencari banyak hal di web."
      }]);
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
      await client.replyMessage(joinEvent.replyToken, [{
        type: "text",
        text: "Halo semuanya! Terima kasih telah mengundang kami di grup ini! Ketik 'bantuan' tanpa tanda petik untuk melihat fungsi dari bot ini."
      }, {
        type: "text",
        text: "Bot ini berfungsi memberikan sugesti halaman web yang dapat dituju berdasarkan kata kunci dari kakak."
      }]);
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
