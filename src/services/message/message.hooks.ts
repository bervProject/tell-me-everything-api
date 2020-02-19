import advanceHook from 'feathers-advance-hook/dist';
import * as feathersAuthentication from '@feathersjs/authentication';
import * as local from '@feathersjs/authentication-local';
import checkPermissions from 'feathers-permissions';
import { required, preventChanges } from 'feathers-hooks-common';
import messagesEncrypt from '../../hooks/messages-encrypt';
import gettingMessage from '../../hooks/getting-message';
import openMessage from '../../hooks/open-message';
// Don't remove this comment. It's needed to format import lines nicely.

const {
  authenticate
} = feathersAuthentication.hooks;
const userAuditHook = advanceHook.userAuditHook;

const {
  protect
} = local.hooks;

export default {
  before: {
    all: [
      authenticate('jwt')
    ],
    find: [],
    get: [
      gettingMessage()
    ],
    create: [
      checkPermissions({
        roles: ['admin']
      }),
      required('text', 'messagePassword'),
      messagesEncrypt(),
      userAuditHook()
    ],
    update: [
      checkPermissions({
        roles: ['admin']
      }),
      required('text', 'messagePassword'),
      messagesEncrypt(),
      userAuditHook()
    ],
    patch: [
      checkPermissions({
        roles: ['admin']
      }),
      preventChanges(true, 'text'),
      messagesEncrypt(),
      userAuditHook()
    ],
    remove: [
      checkPermissions({
        roles: ['admin']
      }),
      userAuditHook()
    ]
  },

  after: {
    all: [
      protect('messagePassword')
    ],
    find: [],
    get: [
      openMessage()
    ],
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
