import { z } from 'zod';
import { beforeEach, describe, expect, it } from 'vitest';
import zennv from '../src/index';

const schema = z.object({
  PORT: z.number(),
  HOST: z.string().default('localhost'),
  IS_DEV: z.boolean(),
  IS_DEFAULT_TRUE: z.boolean().default(true),
  IS_DEFAULT_FALSE: z.boolean().default(false),
  IS_OPTIONAL: z.string().optional(),
});

const parse = (
  data: Record<string, string | undefined>,
  overrides?: Partial<z.infer<typeof schema>>
) => zennv({ dotenv: false, schema, data, overrides });

describe('zennv', () => {
  describe('parsing', () => {
    it('casts numbers and booleans from strings', () => {
      const env = parse({ PORT: '3000', IS_DEV: 'true' });

      expect(env.PORT).toBe(3000);
      expect(env.IS_DEV).toBe(true);
    });

    it('casts the string "false" to false', () => {
      const env = parse({ PORT: '3000', IS_DEV: 'false' });

      expect(env.IS_DEV).toBe(false);
    });

    it('applies defaults when the variable is absent', () => {
      const env = parse({ PORT: '3000', IS_DEV: 'true' });

      expect(env.HOST).toBe('localhost');
      expect(env.IS_DEFAULT_TRUE).toBe(true);
      expect(env.IS_DEFAULT_FALSE).toBe(false);
    });

    it('uses the provided value over the default', () => {
      const env = parse({
        PORT: '3000',
        IS_DEV: 'true',
        HOST: 'example.com',
        IS_DEFAULT_TRUE: 'false',
      });

      expect(env.HOST).toBe('example.com');
      expect(env.IS_DEFAULT_TRUE).toBe(false);
    });

    it('leaves optional variables undefined when absent', () => {
      const env = parse({ PORT: '3000', IS_DEV: 'true' });

      expect(env.IS_OPTIONAL).toBeUndefined();
    });

    it('ignores variables not in the schema', () => {
      const env = parse({ PORT: '3000', IS_DEV: 'true', EXTRA: 'x' });

      expect(env).not.toHaveProperty('EXTRA');
    });
  });

  describe('validation', () => {
    it('throws when a required number is missing', () => {
      expect(() => parse({ IS_DEV: 'true' })).toThrow();
    });

    it('throws when a required boolean is missing', () => {
      expect(() => parse({ PORT: '3000' })).toThrow();
    });

    it('throws when a required string is missing', () => {
      const s = z.object({ NAME: z.string() });

      expect(() => zennv({ dotenv: false, schema: s, data: {} })).toThrow();
    });

    it('throws when a number is not numeric', () => {
      expect(() => parse({ PORT: 'abc', IS_DEV: 'true' })).toThrow();
    });

    it('throws when a boolean is not "true" or "false"', () => {
      expect(() => parse({ PORT: '3000', IS_DEV: 'yes' })).toThrow();
      expect(() => parse({ PORT: '3000', IS_DEV: '1' })).toThrow();
    });
  });

  describe('overrides', () => {
    it('takes precedence over data', () => {
      const env = parse({ PORT: '3000', IS_DEV: 'true' }, { PORT: 4000 });

      expect(env.PORT).toBe(4000);
    });

    it('works for keys absent from data', () => {
      const env = parse({ IS_DEV: 'true' }, { PORT: 4000 });

      expect(env.PORT).toBe(4000);
    });

    it('accepts falsy values', () => {
      const env = parse(
        { PORT: '3000', IS_DEV: 'true' },
        { PORT: 0, IS_DEV: false }
      );

      expect(env.PORT).toBe(0);
      expect(env.IS_DEV).toBe(false);
    });
  });

  describe('sources', () => {
    beforeEach(() => {
      delete process.env.ZENNV_TEST_PORT;
    });

    it('reads from process.env by default', () => {
      process.env.ZENNV_TEST_PORT = '5000';

      const env = zennv({
        dotenv: false,
        schema: z.object({ ZENNV_TEST_PORT: z.number() }),
      });

      expect(env.ZENNV_TEST_PORT).toBe(5000);
    });

    it('loads a .env file when dotenv is enabled', () => {
      // .env in the repo root sets PORT="3000"
      const env = zennv({
        schema: z.object({ PORT: z.number() }),
      });

      expect(env.PORT).toBe(3000);
    });
  });
});
