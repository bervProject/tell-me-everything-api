import { Request, Response, NextFunction } from "express";
import logger from "../logger";
import { webhook } from "@line/bot-sdk";
type WebhookRequestBody = webhook.CallbackRequest;

export default () => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (req.body) {
      const body = req.body as WebhookRequestBody;
      logger.info(JSON.stringify(body.events));
      logger.info(body.destination);
    }
    next();
  };
};
