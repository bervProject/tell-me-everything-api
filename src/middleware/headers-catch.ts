export default () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (req: any, res: any, next: any) => {
    if (!req.feathers) {
      req.feathers = {};
    }
    req.feathers.headers = req.headers;
    next();
  };
};
