import { ZodSchema } from 'zod';
import { Request, Response, NextFunction } from 'express';

export const validate = (schema: ZodSchema<any>) => (req: Request, res: Response, next: NextFunction) => {
  try {
    const obj = { ...req.body, ...req.params, ...req.query };
    schema.parse(obj);
    next();
  } catch (err: any) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: err.message, field_errors: err.errors || [], request_id: '' } });
  }
};
