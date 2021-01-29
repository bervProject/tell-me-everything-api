// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html
import { Hook, HookContext } from "@feathersjs/feathers";

export default (options = {}): Hook => {
  return async (context: HookContext) => {
    const { app, result } = context;
    const frontEndUrl = app.get("frontend");
    if (result.to) {
      await app.service("email")._create({
        from: "notification@berviantoleo.my.id",
        to: result.to,
        subject: "You've got secret message",
        html: `<h1>Hello ${result.to}</h1><p>Please open the message to <a href="${frontEndUrl}">here</a>.</p><p>Please ask ${result.createdBy} for more information. Also ask administrator to create your account if not ready yet.</p><p><h2>Here the message:</h2> <pre>${result.text}</pre></p>`,
      });
    }
    return context;
  };
};
