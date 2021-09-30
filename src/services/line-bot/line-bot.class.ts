import { MongoClient } from "mongodb";
import { Service, MongoDBServiceOptions } from "feathers-mongodb";
import { Application } from "../../declarations";
import logger from "../../logger";

export class LineBot extends Service {
  constructor(options: Partial<MongoDBServiceOptions>, app: Application) {
    super(options);
    const client: MongoClient = app.get("mongoClient");
    const dbName = app.get("mongodbname");

    client
      .connect()
      .then((clientConnected) => {
        this.Model = clientConnected.db(dbName).collection("linebot");
      })
      .catch((error: Error) => {
        logger.error(error.message);
      });
  }
}
