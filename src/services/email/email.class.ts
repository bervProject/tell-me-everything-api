import { MongoDBService } from "@feathersjs/mongodb";
import type { MongoDBAdapterOptions } from "@feathersjs/mongodb";
import { Params } from "@feathersjs/feathers";
import Mail from "nodemailer/lib/mailer";
import { Application } from "../../declarations";
export class Email extends MongoDBService {
  transporter: Mail;

  constructor(
    options: MongoDBAdapterOptions,
    app: Application,
    transport: Mail,
  ) {
    super(options);
    this.transporter = transport;
  }

  //eslint-disable-next-line @typescript-eslint/no-explicit-any
  override async create(data: any, params?: Params): Promise<any> {
    await this.transporter.sendMail(data);
    return await super.create(data, params);
  }
}
