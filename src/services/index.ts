import { Application } from "../declarations";
import lineBot from "./line-bot/line-bot.service";
import message from "./message/message.service";
import users from "./users/users.service";
import email from "./email/email.service";
// Don't remove this comment. It's needed to format import lines nicely.

export default function (app: Application): void {
  app.configure(lineBot);
  app.configure(message);
  app.configure(users);
  app.configure(email);
}
