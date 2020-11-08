import { createNamespace } from "cls-hooked";
import { middleware } from "@line/bot-sdk";
import { Application } from "../declarations";
import correlation from "./correlation";
import headersCatch from "./headers-catch";
import lineBotMiddleware from "./line-bot-middleware";
// Don't remove this comment. It's needed to format import lines nicely.
const logNamespace = createNamespace("logger");

export default function (app: Application) {
  app.use(correlation(logNamespace));
  app.use(headersCatch());
  const lineConfig = {
    channelAccessToken: app.get("lineAccessToken"),
    channelSecret: app.get("lineSecret"),
  };
  app.use("line-bot", middleware(lineConfig), lineBotMiddleware());
}
