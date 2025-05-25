import z from 'zod';
import zennv from '../src/index';
import { describe, expect, it } from 'vitest';

describe('zennv', () => {
  it('should return true', () => {
    const env = zennv({
      dotenv: true,
      schema: z.object({
        PORT: z.number(),
        HOST: z.string().default('localhost'),
        IS_DEV: z.boolean(),
        IS_DEFAULT_TRUE: z.boolean().default(true),
        IS_DEFAULT_FALSE: z.boolean().default(false),
        IS_OPTIONAL: z.string().optional(),
      }),
    });

    expect(typeof env.PORT).toBe('number');
    expect(env.HOST).toBe('localhost');
    expect(env.IS_DEV).toEqual(false);
    expect(env.IS_DEFAULT_TRUE).toEqual(true);
    expect(env.IS_DEFAULT_FALSE).toEqual(false);
    expect(env.IS_OPTIONAL).toBeUndefined();
  });

  it('should override values', () => {
    const env = zennv({
      dotenv: true,
      schema: z.object({
        PORT: z.number(),
      }),
      overrides: {
        PORT: 4000,
      },
    });

    expect(env.PORT).toBe(4000);
  });
});
