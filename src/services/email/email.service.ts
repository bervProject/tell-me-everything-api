// Initializes the `email` service on path `/email`
import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";
import { MongoDBAdapterOptions } from "@feathersjs/mongodb";
import nodemailer from "nodemailer";
import { Application } from "../../declarations";
import { Email } from "./email.class";
import hooks from "./email.hooks";

// Add this service to the service type index
declare module "../../declarations" {
  interface ServiceTypes {
    email: Email;
  }
}

export default function (app: Application): void {
  const sesClient = new SESv2Client({
    apiVersion: "2010-12-01",
    region: app.get("sesregion") || "us-east-1",
  });

  const transporter = nodemailer.createTransport({
    SES: { sesClient, SendEmailCommand },
  });

  const options: MongoDBAdapterOptions = {
    paginate: app.get("paginate"),
    // eslint-disable-next-lint @typescript-eslint/no-explicit-any
    Model: app.get("mongoClient")?.then((db: any) => db.collection("email")),
  };

  // Initialize our service with any options it requires
  app.use("email", new Email(options, app, transporter));

  // Get our initialized service so that we can register hooks
  const service = app.service("email");

  service.hooks(hooks);
}
