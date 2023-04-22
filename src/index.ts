import { z } from 'zod';

export type Zennv<S> = {
  dotenv: boolean;
  schema: S;
  data?: Record<string, any>;
};

const cast = {
  string_to_number: (value: string) => Number(value),
  string_to_boolean: (value: string) => value === 'true',
  undefined_to_string: (value: string) => value,
  undefined_to_number: (value: string) => Number(value),
  undefined_to_boolean: (value: string) => value === 'true',
};

// @ts-ignore
function set(obj, prop, value) {
  return (obj[prop] = value);
}

export const main = <S extends z.AnyZodObject>({
  dotenv = true,
  schema,
  data,
}: Zennv<S>): z.infer<S> => {
  const processEnv = (data || process.env) as Record<keyof z.infer<S>, string>;

  if (dotenv) {
    const dotenv = require('dotenv');
    dotenv.config();
  }

  const shape = schema.shape;

  const keys = Object.keys(shape) as (keyof z.infer<S>)[];

  const envKeys = Object.keys(processEnv) as (keyof z.infer<S>)[];

  const result = {} as Record<keyof z.infer<S>, any>;

  for (const key of envKeys) {
    if (keys.includes(key)) {
      result[key] = processEnv[key];
    }
  }

  const env = (schema as z.AnyZodObject).safeParse(result);

  if (env.success) {
    return env.data;
  }

  const errors = env.error;

  for (const error of errors.errors) {
    const path = error.path[0];

    if (error.code === 'invalid_type') {
      const fnPath = `${error.received}_to_${error.expected}` as keyof typeof cast;

      const fn = cast[fnPath];

      if (!fn) {
        console.error(error);
        throw new Error(`No cast function for ${fnPath} - ${path}`);
      }

      const value = fn(result[path]);

      set(result, path, value);
    }
  }

  return (schema as z.AnyZodObject).parse(result);
};

export default main;
