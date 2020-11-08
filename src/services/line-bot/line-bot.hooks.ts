import botLineRespond from "../../hooks/bot-line-respond";
import botErrorHandling from "../../hooks/bot-error-handling";
export default {
  before: {
    all: [],
    find: [],
    get: [],
    create: [botLineRespond()],
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
    all: [],
    find: [],
    get: [],
    create: [botErrorHandling()],
    update: [],
    patch: [],
    remove: [],
  },
};
