import { Application } from '../declarations';
import lineBot from './line-bot/line-bot.service';
import message from './message/message.service';
import users from './users/users.service';
import mailer from './mailer/mailer.service';
// Don't remove this comment. It's needed to format import lines nicely.

export default function (app: Application) {
  app.configure(lineBot);
  app.configure(message);
  app.configure(users);
  app.configure(mailer);
}
