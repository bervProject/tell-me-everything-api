import { Request, Response, NextFunction } from "express";
import logger from "../logger";
import { WebhookRequestBody } from "@line/bot-sdk";

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
