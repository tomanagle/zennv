import { z } from 'zod';
import { config as loadDotenv } from 'dotenv';

export type Zennv<S extends z.ZodObject> = {
  dotenv: boolean;
  schema: S;
  overrides?: Partial<z.infer<S>>;
};

const cast = {
  string_to_number: (value: string) => Number(value),
  string_to_boolean: (value: string) => value === 'true',
  undefined_to_string: (value: string) => value,
  undefined_to_number: (value: string) => Number(value),
  undefined_to_boolean: (value: string) => value === 'true',
};

export const main = <S extends z.ZodObject>({
  dotenv = true,
  schema,
  overrides,
}: Zennv<S>): z.infer<S> => {
  if (dotenv) {
    loadDotenv();
  }

  const processEnv = process.env as Record<string, string | undefined>;

  const keys = Object.keys(schema.shape);

  const result: Record<string, unknown> = {};

  for (const key of keys) {
    if (!(key in processEnv)) continue;

    const override = overrides?.[key as keyof z.infer<S>];

    result[key] = override !== undefined ? override : processEnv[key];
  }

  const env = schema.safeParse(result);

  if (env.success) {
    return env.data as z.infer<S>;
  }

  for (const issue of env.error.issues) {
    const path = String(issue.path[0]);

    if (issue.code === 'invalid_type') {
      const received = typeof result[path];
      const fnPath = `${received}_to_${issue.expected}` as keyof typeof cast;

      const fn = cast[fnPath];

      if (!fn) {
        console.error(issue);
        throw new Error(`No cast function for ${fnPath} - ${path}`);
      }

      result[path] = fn(result[path] as string);
    }
  }

  return schema.parse(result) as z.infer<S>;
};

export default main;
