import * as feathersAuthentication from "@feathersjs/authentication";
import * as local from "@feathersjs/authentication-local";
import {
  iff,
  isProvider,
  required,
  preventChanges,
} from "feathers-hooks-common";
import { userAuditHook } from "@bervproject/feathers-advance-hook";
import checkPermissions from "feathers-permissions";
import { setField } from "feathers-hooks-common";
import emailUser from "../../hooks/email-user";
import userCreationLimit from "../../hooks/user-creation-limit";
import { HookOptions } from "@feathersjs/feathers";
import { Application } from "../../declarations";
import { Users } from "./users.class";
// Don't remove this comment. It's needed to format import lines nicely.

const { authenticate } = feathersAuthentication.hooks;
const { hashPassword, protect } = local.hooks;

export default {
  before: {
    all: [],
    find: [
      iff(
        isProvider("external"),
        authenticate("jwt"),
        checkPermissions({
          roles: ["admin"],
          error: false,
        }),
        iff(
          (context) => !(context.params as any).permitted,
          setField({
            from: "params.user.id",
            as: "params.query.id",
          }),
        ),
      ),
    ],
    get: [
      iff(
        isProvider("external"),
        authenticate("jwt"),
        checkPermissions({
          roles: ["admin"],
          error: false,
        }),
        iff(
          (context) => !(context.params as any).permitted,
          setField({
            from: "params.user.id",
            as: "params.query.id",
          }),
        ),
      ),
    ],
    create: [
      userCreationLimit(),
      iff(
        (context) => !(context.params as any).canAll,
        authenticate("jwt"),
        checkPermissions({
          roles: ["admin"],
        }),
      ),
      required("email", "password"),
      hashPassword("password"),
      userAuditHook(),
    ],
    update: [
      required("email", "password"),
      hashPassword("password"),
      authenticate("jwt"),
      checkPermissions({
        roles: ["admin"],
      }),
      userAuditHook(),
    ],
    patch: [
      preventChanges(true, "email"),
      required("password"),
      hashPassword("password"),
      authenticate("jwt"),
      checkPermissions({
        roles: ["admin"],
      }),
      userAuditHook(),
    ],
    remove: [authenticate("jwt")],
  },

  after: {
    all: [
      // Make sure the password field is never sent to the client
      // Always must be the last hook
      protect("password"),
    ],
    find: [],
    get: [],
    create: [emailUser()],
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
} as HookOptions<Application, Users>;
