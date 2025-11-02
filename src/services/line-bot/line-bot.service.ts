// Initializes the `line-bot` service on path `/line-bot`
import type { MongoDBAdapterOptions } from "@feathersjs/mongodb";
import { Application } from "../../declarations";
import { LineBot } from "./line-bot.class";
import hooks from "./line-bot.hooks";
import { MongoClient } from "mongodb";

// Add this service to the service type index
declare module "../../declarations" {
  interface ServiceTypes {
    "line-bot": LineBot;
  }
}

export default function (app: Application): void {
  const options: MongoDBAdapterOptions = {
    paginate: app.get("paginate"),
    Model: app.get("mongoClient").then((db: any) => db.collection("linebot")),
  };

  // Initialize our service with any options it requires
  app.use("line-bot", new LineBot(options));

  // Get our initialized service so that we can register hooks
  const service = app.service("line-bot");

  service.hooks(hooks);
}
