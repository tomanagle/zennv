# zennv
Parses environment variables using a Zod schema for type and runtime validation


<img src="img/preview.png" />

## Getting started
### Install the package
`zod` (v4 or later) is a peer dependency, so install it alongside `zennv`.

```bash
yarn add zennv zod
```

```bash
pnpm add zennv zod
```

```bash
npm i zennv zod
```

```bash
bun add zennv zod
```

### Define a Zod schema
```ts
import z from 'zod';

const envSchema = z.object({
  PORT: z.number(),
  HOST: z.string().default('localhost'),
  IS_DEV: z.boolean(),
  IS_DEFAULT_TRUE: z.boolean().default(true),
  IS_DEFAULT_FALSE: z.boolean().default(false),
  IS_OPTIONAL: z.string().optional(),
})
```

### Pass the schema to `zennv`
```ts
import zennv from 'zennv';

const env = zennv({
  dotenv: true,
  schema: envSchema,
});
```

### Use the environment variables
```ts
const { PORT, HOST, IS_DEV, IS_DEFAULT_TRUE, IS_DEFAULT_FALSE, IS_OPTIONAL } = env;
```

## Options
| Name      | Default       | Description                                                                  | Required |
|-----------|---------------|------------------------------------------------------------------------------|----------|
| schema    |               | Zod object schema to parse your environment variables with                   | Yes      |
| dotenv    | `true`        | Load a `.env` file into `process.env` with dotenv before parsing             | No       |
| data      | `process.env` | An object of raw string values to read from instead of `process.env`         | No       |
| overrides |               | Already-typed values that take precedence over `data`, useful in tests       | No       |

## How values are cast
Environment variables are always strings, so `zennv` casts them to match your schema before validating:

- `z.number()`: converted with `Number()`. Non-numeric strings fail validation.
- `z.boolean()`: only the strings `"true"` and `"false"` are accepted. Anything else fails validation.
- Missing variables without a `.default()` or `.optional()` fail validation.

## Releasing
Releases are published to npm by GitHub Actions via [npm trusted publishing](https://docs.npmjs.com/trusted-publishers) whenever a `v*` tag is pushed. The tag must match the version in `package.json`. No npm token is needed; the `zennv` package on npmjs.com trusts the `publish.yml` workflow in this repository.

```bash
npm version <major|minor|patch>
git push --follow-tags
```
