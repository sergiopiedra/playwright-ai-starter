import { env } from '@config/env';

/** Sauce Demo accounts. Each has scripted behaviour useful for negative/edge-case tests. */
export const USERS = {
  standard: 'standard_user',
  lockedOut: 'locked_out_user',
  problem: 'problem_user',
  performanceGlitch: 'performance_glitch_user',
  error: 'error_user',
  visual: 'visual_user',
} as const;

export type Username = (typeof USERS)[keyof typeof USERS];

export interface Credentials {
  username: string;
  password: string;
}

export function credentialsFor(username: Username): Credentials {
  return { username, password: env.sauce.password };
}

/** Storage state written by `tests/auth.setup.ts` and reused by authenticated specs. */
export const STORAGE_STATE = {
  standard: 'playwright/.auth/standard_user.json',
} as const;
