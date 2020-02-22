// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html
import { Hook, HookContext } from '@feathersjs/feathers';

export default (options = {}): Hook => {
  return async (context: HookContext) => {
    const { app, result } = context;
    await app.service('mailer').create({
      from: 'notification@berviantoleo.my.id',
      to: result.email,
      subject: 'You\'re invited to secret message site',
      html: `<h1>Hello ${result.email}</h1><p>Visit to https://tell-secret.onrender.com/ for more information.</p><p>Please ask administrator for login credential.</p>`
    })
    return context;
  };
}
