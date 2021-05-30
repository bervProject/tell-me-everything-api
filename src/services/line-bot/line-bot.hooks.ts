import * as feathersAuthentication from "@feathersjs/authentication";
import checkPermissions from "feathers-permissions";
const { authenticate } = feathersAuthentication.hooks;

import botLineRespond from "../../hooks/bot-line-respond";
import botErrorHandling from "../../hooks/bot-error-handling";

export default {
  before: {
    all: [],
    find: [
      authenticate("jwt"),
      checkPermissions({
        roles: ["admin"],
      }),
    ],
    get: [
      authenticate("jwt"),
      checkPermissions({
        roles: ["admin"],
      }),
    ],
    create: [botLineRespond()],
    update: [
      authenticate("jwt"),
      checkPermissions({
        roles: ["admin"],
      }),
    ],
    patch: [
      authenticate("jwt"),
      checkPermissions({
        roles: ["admin"],
      }),
    ],
    remove: [
      authenticate("jwt"),
      checkPermissions({
        roles: ["admin"],
      }),
    ],
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
