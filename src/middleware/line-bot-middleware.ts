import { Request, Response, NextFunction } from "express";
import logger from "../logger";

export default () => {
  return (req: Request, res: Response, next: NextFunction) => {
    logger.info(req.body.events);
    logger.info(req.body.destination);
    next();
  };
};
