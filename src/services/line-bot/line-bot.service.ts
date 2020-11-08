// Initializes the `line-bot` service on path `/line-bot`
import { ServiceAddons } from "@feathersjs/feathers";
import { Application } from "../../declarations";
import { LineBot } from "./line-bot.class";
import hooks from "./line-bot.hooks";

// Add this service to the service type index
declare module "../../declarations" {
  interface ServiceTypes {
    "line-bot": LineBot & ServiceAddons<any>;
  }
}

export default function (app: Application) {
  const options = {
    paginate: app.get("paginate"),
  };

  // Initialize our service with any options it requires
  app.use("/line-bot", new LineBot(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service("line-bot");

  service.hooks(hooks);
}
