import { HookContext } from "@feathersjs/feathers";
import logger from "./logger";

// Application hooks that run for every service
// Don't remove this comment. It's needed to format import lines nicely.

export default {
  before: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: [],
  },

  after: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: [],
  },

  error: {
    all: [
      (context: HookContext) => {
        logger.error(JSON.stringify(context.error));
      },
    ],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: [],
  },
};
