import { userAuditHook } from "@bervproject/feathers-advance-hook";
import * as feathersAuthentication from "@feathersjs/authentication";
import * as local from "@feathersjs/authentication-local";
import checkPermissions from "feathers-permissions";
import { iff, required, preventChanges } from "feathers-hooks-common";
import { setField } from "feathers-hooks-common";

import messagesEncrypt from "../../hooks/messages-encrypt";
import gettingMessage from "../../hooks/getting-message";
import openMessage from "../../hooks/open-message";
import messageSend from "../../hooks/message-send";
import { HookOptions } from "@feathersjs/feathers";
import { Application } from "../../declarations";
import { Message } from "./message.class";
// Don't remove this comment. It's needed to format import lines nicely.

const { authenticate } = feathersAuthentication.hooks;
const { protect } = local.hooks;

export default {
  before: {
    all: [authenticate("jwt")],
    find: [
      checkPermissions({
        roles: ["admin"],
        error: false,
      }),
      iff(
        (context) => !(context.params as any).permitted,
        setField({
          from: "params.user.email",
          as: "params.query.to",
        }),
      ),
    ],
    get: [
      checkPermissions({
        roles: ["admin"],
        error: false,
      }),
      iff(
        (context) => !(context.params as any).permitted,
        setField({
          from: "params.user.email",
          as: "params.query.to",
        }),
      ),
      gettingMessage(),
    ],
    create: [
      checkPermissions({
        roles: ["admin"],
      }),
      required("text", "messagePassword"),
      messagesEncrypt(),
      userAuditHook(),
    ],
    update: [
      checkPermissions({
        roles: ["admin"],
      }),
      required("text", "messagePassword"),
      messagesEncrypt(),
      userAuditHook(),
    ],
    patch: [
      checkPermissions({
        roles: ["admin"],
      }),
      preventChanges(true, "text"),
      messagesEncrypt(),
      userAuditHook(),
    ],
    remove: [
      checkPermissions({
        roles: ["admin"],
      }),
      userAuditHook(),
    ],
  },

  after: {
    all: [protect("messagePassword")],
    find: [],
    get: [openMessage()],
    create: [messageSend()],
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
} as HookOptions<Application, Message>;
