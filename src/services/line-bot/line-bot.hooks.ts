
import botLineRespond from '../../hooks/bot-line-respond';
export default {
  before: {
    all: [],
    find: [],
    get: [],
    create: [botLineRespond()],
    update: [],
    patch: [],
    remove: []
  },

  after: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  },

  error: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  }
};
