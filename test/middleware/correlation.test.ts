import { Request, Response, NextFunction } from "express";
import { createNamespace } from "cls-hooked";
import { validate as uuidValidate, version as uuidVersion } from "uuid";
import correlationMiddleware from "../../src/middleware/correlation";

describe("Correlation Middleware", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;
  let namespace: any;

  beforeEach(() => {
    req = {};
    res = {};
    next = jest.fn();
    namespace = createNamespace("test");
  });

  it("should generate UUID v7 correlation ID", () => {
    const middleware = correlationMiddleware(namespace);
    
    middleware(req as Request, res as Response, next);
    
    expect(req.feathers?.correlationId).toBeDefined();
    expect(uuidValidate(req.feathers.correlationId)).toBe(true);
    expect(uuidVersion(req.feathers.correlationId)).toBe(7);
    expect(next).toHaveBeenCalled();
  });

  it("should set correlation ID in namespace", (done) => {
    const middleware = correlationMiddleware(namespace);
    
    middleware(req as Request, res as Response, () => {
      const correlationId = namespace.get("correlationId");
      expect(correlationId).toBeDefined();
      expect(uuidValidate(correlationId)).toBe(true);
      expect(uuidVersion(correlationId)).toBe(7);
      done();
    });
  });
});
