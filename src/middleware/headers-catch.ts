import { Request, Response, NextFunction } from 'express';

export default () => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.feathers) {
      req.feathers = {};
    }
    req.feathers.headers = req.headers;
    next();
  };
}
