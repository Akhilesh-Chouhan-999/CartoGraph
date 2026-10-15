import type { Request, Response } from 'express';
import { describe, expect, it } from 'vitest';

import { AppError } from '../src/errors/index.js';
import { ErrorMiddleware } from '../src/middleware/index.js';

describe('API error handling', () => {
  it('returns the standard failure response for operational errors', () => {
    const response = {
      statusCode: 0,
      body: undefined as unknown,
      /**
       * Records the HTTP status code returned by the error middleware.
       * @param code - The HTTP status code to record.
       */
      status(code: number) {
        this.statusCode = code;
        return this;
      },
      /**
       * Stores the JSON response body returned by the error middleware.
       * @param body - The response body to store.
       */
      json(body: unknown) {
        this.body = body;
        return this;
      },
    };
    const handler = new ErrorMiddleware().handler();

    handler(
      new AppError('Project not found', 404),
      {} as Request,
      response as unknown as Response,
      () => undefined,
    );

    expect(response.statusCode).toBe(404);
    expect(response.body).toEqual({ success: false, message: 'Project not found' });
  });
});
