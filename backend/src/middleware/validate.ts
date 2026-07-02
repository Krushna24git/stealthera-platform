import type { Request, Response, NextFunction } from "express";
import type { ZodTypeAny } from "zod";

interface RequestSchemas {
  body?: ZodTypeAny;
  params?: ZodTypeAny;
}

export function validate(schemas: RequestSchemas) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (schemas.params) req.params = schemas.params.parse(req.params) as typeof req.params;
      if (schemas.body) req.body = schemas.body.parse(req.body);
      next();
    } catch (error) {
      next(error);
    }
  };
}
