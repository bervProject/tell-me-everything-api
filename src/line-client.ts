import { Client } from "@line/bot-sdk";
import { Application } from "./declarations";

export default function (app: Application): void {
  const lineConfig = {
    channelAccessToken: app.get("lineAccessToken"),
    channelSecret: app.get("lineSecret"),
  };
  const client = new Client(lineConfig);
  app.set("lineClient", client);
}
