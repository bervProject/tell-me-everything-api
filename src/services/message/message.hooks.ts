import advanceHook from 'feathers-advance-hook/dist';
import * as feathersAuthentication from '@feathersjs/authentication';
import * as local from '@feathersjs/authentication-local';
// Don't remove this comment. It's needed to format import lines nicely.

const {
  authenticate
} = feathersAuthentication.hooks;
const userAuditHook = advanceHook.userAuditHook;

const {
  hashPassword,
  protect
} = local.hooks;

export default {
  before: {
    all: [],
    find: [
      authenticate('jwt')
    ],
    get: [
      authenticate('jwt')
    ],
    create: [
      hashPassword('messagePassword'),
      authenticate('jwt'),
      userAuditHook()
    ],
    update: [
      hashPassword('messagePassword'),
      authenticate('jwt'),
      userAuditHook()],
    patch: [
      hashPassword('messagePassword'),
      authenticate('jwt'),
      userAuditHook()],
    remove: [authenticate('jwt'), userAuditHook()]
  },

  after: {
    all: [
      protect('messagePassword')
    ],
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
