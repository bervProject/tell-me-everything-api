import { messagingApi } from "@line/bot-sdk";
const { MessagingApiClient } = messagingApi;
import { Application } from "./declarations";

export default function (app: Application): void {
  const lineConfig = {
    channelAccessToken: app.get("lineAccessToken"),
    channelSecret: app.get("lineSecret"),
  };
  const client = new MessagingApiClient(lineConfig);
  app.set("lineClient", client);
}
