import * as feathersAuthentication from '@feathersjs/authentication';
import * as local from '@feathersjs/authentication-local';
import { iff, isProvider, required, preventChanges } from 'feathers-hooks-common';
import advanceHook from 'feathers-advance-hook/dist';
import checkPermissions from 'feathers-permissions';
import { setField } from 'feathers-authentication-hooks';
// Don't remove this comment. It's needed to format import lines nicely.

const { authenticate } = feathersAuthentication.hooks;
const { hashPassword, protect } = local.hooks;
const userAuditHook = advanceHook.userAuditHook;

export default {
  before: {
    all: [],
    find: [
      iff(isProvider('external'),
        authenticate('jwt'),
        checkPermissions({
          roles: ['admin'],
          error: false
        }),
        iff(context => !context.params.permitted,
          setField({
            from: 'params.user.id',
            as: 'params.query.id'
          })
        )
      )
    ],
    get: [
      iff(isProvider('external'),
        authenticate('jwt'),
        checkPermissions({
          roles: ['admin'],
          error: false
        }),
        iff(context => !context.params.permitted,
          setField({
            from: 'params.user.id',
            as: 'params.query.id'
          })
        )
      )
    ],
    create: [
      required('email', 'password'),
      hashPassword('password'),
      userAuditHook()
    ],
    update: [
      required('email', 'password'),
      hashPassword('password'),
      authenticate('jwt'),
      checkPermissions({
        roles: ['admin']
      }),
      userAuditHook()
    ],
    patch: [
      preventChanges(true, 'email'),
      required('password'),
      hashPassword('password'),
      authenticate('jwt'),
      checkPermissions({
        roles: ['admin']
      }),
      userAuditHook()
    ],
    remove: [
      authenticate('jwt')
    ]
  },

  after: {
    all: [
      // Make sure the password field is never sent to the client
      // Always must be the last hook
      protect('password')
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
