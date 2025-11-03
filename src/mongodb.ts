import { MongoClient } from "mongodb";
import { Application } from "./declarations";

export default function (app: Application): void {
  const connection = app.get("mongodb");
  if (!connection) {
    const mongoClient = new MongoClient(connection);
    mongoClient.connect().then(() => {
      const mongoDbName = app.get("mongodbname");
      if (!mongoDbName) {
        const db = mongoClient.db(mongoDbName);
        app.set("mongoClient", db);
      }
    });
  }
}
