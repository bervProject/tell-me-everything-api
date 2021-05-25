import { disallow } from "feathers-hooks-common";
import * as feathersAuthentication from "@feathersjs/authentication";
import checkPermissions from "feathers-permissions";
import { iff } from "feathers-hooks-common";

const { authenticate } = feathersAuthentication.hooks;

export default {
  before: {
    all: [
      authenticate("jwt"),
      checkPermissions({
        roles: ["admin"],
        error: false,
      }),
      iff((context) => !context.params.permitted, disallow("external")),
    ],
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
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: [],
  },
};
