import * as feathersAuthentication from '@feathersjs/authentication';
import * as local from '@feathersjs/authentication-local';
import { iff, required, preventChanges } from 'feathers-hooks-common';
import checkPermissions from 'feathers-permissions';
import { setField } from 'feathers-authentication-hooks';
// Don't remove this comment. It's needed to format import lines nicely.

const { authenticate } = feathersAuthentication.hooks;
const { hashPassword, protect } = local.hooks;

export default {
  before: {
    all: [],
    find: [
      authenticate('jwt'),
      checkPermissions({
        roles: ['admin'],
        field: 'roles',
        error: false
      }),
      iff(context => !context.params.permitted,
        setField({
          from: 'params.user.id',
          as: 'params.query.id'
        })
      )
    ],
    get: [
      authenticate('jwt'),
      checkPermissions({
        roles: ['admin'],
        field: 'roles',
        error: false
      }),
      iff(context => !context.params.permitted,
        setField({
          from: 'params.user.id',
          as: 'params.query.id'
        })
      )
    ],
    create: [
      required('email', 'password'),
      hashPassword('password')
    ],
    update: [
      required('email', 'password'),
      hashPassword('password'),
      authenticate('jwt'),
      checkPermissions({
        roles: ['admin']
      })
    ],
    patch: [
      preventChanges(true, 'email'),
      required('password'),
      hashPassword('password'),
      authenticate('jwt'),
      checkPermissions({
        roles: ['admin']
      })
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
