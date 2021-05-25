import { MongoClient } from "mongodb";
import { Application } from "./declarations";
import logger from "./logger";

export default function (app: Application): void {
  const connection = app.get("mongodb");
  const database = connection.substr(connection.lastIndexOf("/") + 1);
  const mongoClient = MongoClient.connect(connection, {
    useNewUrlParser: true,
  })
    .then((client) => client.db(database))
    .catch((error) => logger.error(JSON.stringify(error)));

  app.set("mongoClient", mongoClient);
}
