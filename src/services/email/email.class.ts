import { Db } from "mongodb";
import { Service, MongoDBServiceOptions } from "feathers-mongodb";
import { Params } from "@feathersjs/feathers";
import Mail from "nodemailer/lib/mailer";
import { Application } from "../../declarations";

export class Email extends Service {
  transporter: Mail;
  //eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(
    options: Partial<MongoDBServiceOptions>,
    app: Application,
    transport: Mail,
  ) {
    super(options);
    this.transporter = transport;
    const client: Promise<Db> = app.get("mongoClient");

    client.then((db) => {
      this.Model = db.collection("email");
    });
  }

  async create(data: Mail.Options, params?: Params): Promise<any> {
    await this.transporter.sendMail(data);
    return await super.create(data, params);
  }

  async _create(data: Mail.Options, params?: Params): Promise<any> {
    await this.transporter.sendMail(data);
    return await super._create(data, params);
  }
}
