// Worker で動かせる job の登録表（#383 spike）。main からは job id で指定される。
import { serveJobs, type MessagePortLike } from '../core/placement/executors';
import type { JobDef } from '../core/placement/job';
import type { StateSchema } from '../core/placement/state';
import { physicsJob } from './physicsJob';

serveJobs(self as unknown as MessagePortLike, {
  [physicsJob.id]: physicsJob as unknown as JobDef<StateSchema, unknown>,
});
