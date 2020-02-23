// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html
import { Hook, HookContext } from '@feathersjs/feathers';

export default (options = {}): Hook => {
  return async (context: HookContext) => {
    const canAll = process.env.CAN_ALL;
    if (!canAll && canAll === "true") {
      context.params = Object.assign(context.params, {
        canAll: false
      });
    }
    return context;
  };
}
