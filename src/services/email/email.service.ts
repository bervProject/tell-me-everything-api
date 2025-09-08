// Initializes the `email` service on path `/email`
import { ServiceAddons } from "@feathersjs/feathers";
import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";
import nodemailer from "nodemailer";
import { Application } from "../../declarations";
import { Email } from "./email.class";
import hooks from "./email.hooks";
import { MongoDBServiceOptions } from "@feathersjs/mongodb";

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

  const options = {
    paginate: app.get("paginate"),
  } as Partial<MongoDBServiceOptions>;

  // Initialize our service with any options it requires
  app.use("email", new Email(options, app, transporter));

  // Get our initialized service so that we can register hooks
  const service = app.service("email");

  service.hooks(hooks);
}
