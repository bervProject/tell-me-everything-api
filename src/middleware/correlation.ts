import { Request, Response, NextFunction } from "express";
import { v7 as uuidv7 } from "uuid";
import { Namespace } from "cls-hooked";

export default (namespace: Namespace) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const correlationId = uuidv7();
    if (!req.feathers) {
      req.feathers = {};
    }
    req.feathers.correlationId = correlationId;
    namespace.run(() => {
      namespace.set("correlationId", correlationId);
      next();
    });
  };
};
