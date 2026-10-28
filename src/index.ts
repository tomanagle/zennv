import { z } from 'zod';
import { config as loadDotenv } from 'dotenv';

export type Zennv<S extends z.ZodObject> = {
  /** Load a `.env` file into `process.env` before parsing. Defaults to true. */
  dotenv?: boolean;
  /** Zod object schema describing the environment variables. */
  schema: S;
  /** Source of raw values. Defaults to `process.env`. */
  data?: Record<string, string | undefined>;
  /** Already-typed values that take precedence over `data`. */
  overrides?: Partial<z.infer<S>>;
};

const cast: Record<string, (value: string) => unknown> = {
  number: (value) => Number(value),
  boolean: (value) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  },
};

export const main = <S extends z.ZodObject>({
  dotenv = true,
  schema,
  data,
  overrides,
}: Zennv<S>): z.infer<S> => {
  if (dotenv) {
    loadDotenv();
  }

  const source = data ?? process.env;

  const result: Record<string, unknown> = {};

  for (const key of Object.keys(schema.shape)) {
    const override = overrides?.[key as keyof z.infer<S>];

    if (override !== undefined) {
      result[key] = override;
    } else if (source[key] !== undefined) {
      result[key] = source[key];
    }
  }

  const env = schema.safeParse(result);

  if (env.success) {
    return env.data as z.infer<S>;
  }

  for (const issue of env.error.issues) {
    if (issue.code !== 'invalid_type') continue;

    const key = String(issue.path[0]);
    const value = result[key];

    if (typeof value !== 'string') continue;

    const fn = cast[issue.expected];

    if (fn) {
      result[key] = fn(value);
    }
  }

  return schema.parse(result) as z.infer<S>;
};

export default main;
