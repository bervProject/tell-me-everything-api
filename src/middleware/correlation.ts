import { Request, Response, NextFunction } from 'express';
import uuidv4 from 'uuid/v4';
import { Namespace } from 'cls-hooked';

export default (namespace: Namespace) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const correlationId = uuidv4();
    if (!req.feathers) {
      req.feathers = {};
    }
    req.feathers.correlationId = correlationId;
    namespace.run(() => {
      namespace.set('correlationId', correlationId);
      next();
    });
  };
}
