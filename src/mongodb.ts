import { MongoClient } from "mongodb";
import { Application } from "./declarations";

export default function (app: Application): void {
  const connection = app.get("mongodb");
  const mongoClient = new MongoClient(connection);
  app.set("mongoClient", mongoClient);
}
