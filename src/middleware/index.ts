import { createNamespace } from 'cls-hooked';
import { middleware } from '@line/bot-sdk';
import { Application } from '../declarations';
import config from '../line-config';
import correlation from './correlation';
import headersCatch from './headers-catch';
import lineBotMiddleware from './line-bot-middleware';
// Don't remove this comment. It's needed to format import lines nicely.
const logNamespace = createNamespace('logger');

export default function (app: Application) {
  app.use(correlation(logNamespace));
  app.use(headersCatch());
  app.use('line-bot', middleware(config), lineBotMiddleware());
}
