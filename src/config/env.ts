import path from 'node:path';
import dotenv from 'dotenv';
import { z } from 'zod';

export const TEST_ENVS = ['dev', 'prod'] as const;
export type TestEnv = (typeof TEST_ENVS)[number];

const testEnv: TestEnv = z.enum(TEST_ENVS).parse(process.env.TEST_ENV || 'dev');

const booleanString = z.enum(['true', 'false']).transform((value) => value === 'true');

const schema = z.object({
  BASE_URL: z.url(),
  SAUCE_PASSWORD: z.string().min(1, 'SAUCE_PASSWORD is required (set it in .env.local or CI)'),
  API_URL: z.url(),
  API_USERNAME: z.string().min(1),
  API_PASSWORD: z.string().min(1, 'API_PASSWORD is required (set it in .env.local or CI)'),
  ALLOW_DATA_MUTATION: booleanString.default(false),
});

// CI exposes unset secrets as empty strings. Treat them as missing so the .env files
// can still provide defaults (dotenv skips any key that already exists).
for (const key of Object.keys(schema.shape)) {
  if (process.env[key] === '') delete process.env[key];
}

// dotenv never overrides, so the first source to define a key wins:
// real environment variables > .env.local > .env.<TEST_ENV>
const root = path.resolve(__dirname, '../..');
dotenv.config({
  path: [path.join(root, '.env.local'), path.join(root, `.env.${testEnv}`)],
  quiet: true,
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  throw new Error(
    `Invalid environment configuration for TEST_ENV=${testEnv}:\n${z.prettifyError(parsed.error)}`,
  );
}

const vars = parsed.data;

/** Typed, validated test configuration. Import this instead of reading `process.env`. */
export const env = {
  name: testEnv,
  baseUrl: vars.BASE_URL,
  apiUrl: vars.API_URL,
  sauce: { password: vars.SAUCE_PASSWORD },
  api: { username: vars.API_USERNAME, password: vars.API_PASSWORD },
  allowDataMutation: vars.ALLOW_DATA_MUTATION,
} as const;
