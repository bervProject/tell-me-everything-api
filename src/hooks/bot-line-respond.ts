// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html
import { Hook, HookContext } from "@feathersjs/feathers";
import logger from "../logger";
import { messagingApi } from "@line/bot-sdk";
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
} from "@line/bot-sdk";
import { FlexBubble } from "@line/bot-sdk/dist/messaging-api/api";

async function handleBye(
  sourceType: "room" | "group" | "user",
  messageEvent: MessageEvent,
  client: messagingApi.MessagingApiClient,
) {
  if (sourceType === "room") {
    await client.leaveRoom((messageEvent.source as Room).roomId);
  } else if (sourceType === "group") {
    await client.leaveGroup((messageEvent.source as Group).groupId);
  } else {
    await client.replyMessage({
      replyToken: messageEvent.replyToken,
      messages: [
        {
          type: "text",
          text: "Maaf, kak. Kita lagi saling chat. Kita gak bisa ninggalin kakak di chat ini. :'(",
        },
      ],
    });
  }
}

async function handleHi(
  messageEvent: MessageEvent,
  client: messagingApi.MessagingApiClient,
) {
  const userId = messageEvent.source.userId;
  let name = "";
  if (userId != undefined) {
    const profile = await client.getProfile(userId);
    name = profile.displayName;
  }
  await client.replyMessage({
    replyToken: messageEvent.replyToken,
    messages: [
      {
        type: "text",
        text:
          name !== ""
            ? `Halo, kak ${name}! Semoga hari-harinya menyenangkan!`
            : "Halo! Semoga hari-harinya menyenangkan!",
      },
    ],
  });
}

async function handleHelp(
  messageEvent: MessageEvent,
  client: messagingApi.MessagingApiClient,
) {
  await client.replyMessage({
    replyToken: messageEvent.replyToken,
    messages: [
      {
        type: "text",
        text: "Halo kak! Jadi kita cuman bisa perintah ini loh,",
      },
      {
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
                      text: "Hi",
                    },
                  },
                ],
              },
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
                      text: "Bye",
                    },
                  },
                ],
              },
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
                      text: "Search",
                    },
                  },
                ],
              },
            },
          ],
        },
      },
    ],
  });
}

async function handleSearch(
  messageText: string,
  messageEvent: MessageEvent,
  client: messagingApi.MessagingApiClient,
) {
  const splitText = messageText.split(" ", 2);
  if (splitText.length > 1) {
    const searchText = splitText[1];
    
    try {
      const response = await fetch(`https://api.bing.microsoft.com/v7.0/search?q=${encodeURIComponent(searchText)}`, {
        headers: {
          'Ocp-Apim-Subscription-Key': process.env.SEARCH_KEY || "",
        },
      });
      
      const result = await response.json();
      const output = new Array<FlexBubble>();
      
      if (result.webPages?.value) {
        for (const content of result.webPages.value) {
          if (
            content.displayUrl &&
            (content.displayUrl.startsWith("https://") ||
              content.displayUrl.startsWith("http://"))
          ) {
            output.push({
              type: "bubble",
              header: {
                type: "box",
                layout: "vertical",
                contents: [
                  {
                    type: "text",
                    text: content.name || "",
                  },
                ],
              },
              body: {
                type: "box",
                layout: "vertical",
                contents: [
                  {
                    type: "text",
                    text: content.url || "",
                  },
                ],
              },
              action: {
                label: "link",
                type: "uri",
                uri: content.displayUrl || "",
              },
            });
          }
        }
      }
      
      if (output.length == 0) {
        await client.replyMessage({
          replyToken: messageEvent.replyToken,
          messages: [
            {
              type: "text",
              text: "Sepertinya pencarian kakak tidak ditemukan. :(",
            },
          ],
        });
      } else if (output.length > 10) {
        await client.replyMessage({
          replyToken: messageEvent.replyToken,
          messages: [
            {
              type: "flex",
              altText: "Web Result",
              contents: {
                type: "carousel",
                contents: output.slice(0, 10),
              },
            },
          ],
        });
      } else {
        await client.replyMessage({
          replyToken: messageEvent.replyToken,
          messages: [
            {
              type: "flex",
              altText: "Web Result",
              contents: {
                type: "carousel",
                contents: output,
              },
            },
          ],
        });
      }
    } catch (error) {
      logger.error(`Search error: ${JSON.stringify(error)}`);
      await client.replyMessage({
        replyToken: messageEvent.replyToken,
        messages: [
          {
            type: "text",
            text: "Maaf, terjadi kesalahan saat mencari. Silakan coba lagi nanti.",
          },
        ],
      });
    }
  } else {
    await client.replyMessage({
      replyToken: messageEvent.replyToken,
      messages: [
        {
          type: "text",
          text: "Masukan kata kunci yang ingin anda cari. Misalkan, search ayam",
        },
      ],
    });
  }
}

async function proccessMessageEvent(
  messageEvent: MessageEvent,
  client: messagingApi.MessagingApiClient,
) {
  const message = messageEvent.message;
  const sourceType = messageEvent.source.type;
  logger.info(JSON.stringify(message));
  const messageType = message.type;
  if (messageType === "text") {
    const messageText = (message as TextEventMessage).text.toLowerCase();
    switch (messageText) {
      case "bye":
        await handleBye(sourceType, messageEvent, client);
        break;
      case "hi":
        await handleHi(messageEvent, client);
        break;
      case "bantuan":
        await handleHelp(messageEvent, client);
        break;
      default:
        if (messageText.startsWith("search")) {
          await handleSearch(messageText, messageEvent, client);
        } else {
          await client.replyMessage({
            replyToken: messageEvent.replyToken,
            messages: [
              {
                type: "text",
                text: "Maaf saat ini perintah yang anda berikan tidak tersedia. Mohon masukan 'bantuan' untuk info lebih lanjut.",
              },
            ],
          });
        }
        break;
    }
  }
}

async function proccessMemberJoin(
  joinEvent: MemberJoinEvent,
  client: messagingApi.MessagingApiClient,
) {
  const joinedMembers = joinEvent.joined.members;
  for (const member of joinedMembers) {
    logger.info(`Welcome to ${member.userId}`);
    const profile = await client.getProfile(member.userId);
    await client.replyMessage({
      replyToken: joinEvent.replyToken,
      messages: [
        {
          type: "text",
          text: `Halo kak, ${profile.displayName}! Selamat datang di grup!`,
        },
      ],
    });
  }
}

async function proccessFollowEvent(
  followEvent: FollowEvent,
  client: messagingApi.MessagingApiClient,
) {
  const sourceType = followEvent.source.type.toLowerCase();
  if (sourceType === "user") {
    const userId = followEvent.source.userId;
    logger.info(`Welcoming to ${userId}`);
    if (userId != undefined) {
      const profile = await client.getProfile(userId);
      await client.replyMessage({
        replyToken: followEvent.replyToken,
        messages: [
          {
            type: "text",
            text: `Halo kak ${profile.displayName}, terima kasih sudah menambahkan saya!`,
          },
          {
            type: "text",
            text: "Ketik 'bantuan' untuk perintah lebih lanjut ya, kak.",
          },
          {
            type: "text",
            text: "Kami bisa membantu kakak mencari banyak hal di web.",
          },
        ],
      });
    }
  }
}

async function handleEvent(
  event: WebhookEvent,
  client: messagingApi.MessagingApiClient,
) {
  try {
    logger.info(JSON.stringify(event));
    const eventType = event.type;
    logger.info(`We get event type: ${eventType}`);
    switch (eventType) {
      case "message":
        const messageEvent = event as MessageEvent;
        await proccessMessageEvent(messageEvent, client);
        break;
      case "memberJoined":
        const memberJoinEvent = event as MemberJoinEvent;
        await proccessMemberJoin(memberJoinEvent, client);
        break;
      case "join":
        const joinEvent = event as JoinEvent;
        await client.replyMessage({
          replyToken: joinEvent.replyToken,
          messages: [
            {
              type: "text",
              text: "Halo semuanya! Terima kasih telah mengundang kami di grup ini! Ketik 'bantuan' tanpa tanda petik untuk melihat fungsi dari bot ini.",
            },
            {
              type: "text",
              text: "Bot ini berfungsi memberikan sugesti halaman web yang dapat dituju berdasarkan kata kunci dari kakak.",
            },
          ],
        });
        break;
      case "follow":
        const followEvent = event as FollowEvent;
        await proccessFollowEvent(followEvent, client);
        break;
      default:
        logger.info(`Current ${eventType} not supported`);
    }
  } catch (exception) {
    logger.error(`${JSON.stringify(exception)}`);
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default (options = {}): Hook => {
  return async (context: HookContext) => {
    const { data, app } = context;
    logger.info(`Data sending to us: ${JSON.stringify(data)}`);
    const hookBody = data as WebhookRequestBody;
    logger.info(`Event sending to ${hookBody.destination}`);
    const events = hookBody.events;
    const client: messagingApi.MessagingApiClient = app.get("lineClient");
    for (const event of events) {
      await handleEvent(event, client);
    }
    context.statusCode = 200;
    context.result = data.events;
    return context;
  };
};
