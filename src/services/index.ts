import { Application } from '../declarations';
import lineBot from './line-bot/line-bot.service';
// Don't remove this comment. It's needed to format import lines nicely.

export default function (app: Application) {
  app.configure(lineBot);
}
