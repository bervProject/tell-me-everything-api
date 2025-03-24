import { MongoClient } from "mongodb";
import { Service, MongoDBServiceOptions } from "feathers-mongodb";
import { Params } from "@feathersjs/feathers";
import Mail from "nodemailer/lib/mailer";
import { Application } from "../../declarations";
import logger from "../../logger";
export class Email extends Service {
  transporter: Mail;

  constructor(
    options: Partial<MongoDBServiceOptions>,
    app: Application,
    transport: Mail,
  ) {
    super(options);
    this.transporter = transport;
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

  //eslint-disable-next-line @typescript-eslint/no-explicit-any
  async create(data: Mail.Options, params?: Params): Promise<any> {
    await this.transporter.sendMail(data);
    return await super.create(data, params);
  }

  //eslint-disable-next-line @typescript-eslint/no-explicit-any
  async _create(data: Mail.Options, params?: Params): Promise<any> {
    await this.transporter.sendMail(data);
    return await super._create(data, params);
  }
}
