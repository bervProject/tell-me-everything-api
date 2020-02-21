// Initializes the `mailer` service on path `/mailer`
import { ServiceAddons } from '@feathersjs/feathers';
import aws from 'aws-sdk';
import nodemailer from 'nodemailer';
import { Application } from '../../declarations';
import hooks from './mailer.hooks';
import { Mailer } from './mailer.class';

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    'mailer': ServiceAddons<any>;
  }
}

export default function (app: Application) {
  aws.config.update({ region: 'us-east-1' });

  let transporter = nodemailer.createTransport({
    SES: new aws.SES({ apiVersion: "2010-12-01" })
  });
  app.use('/mailer', new Mailer(transporter))

  // Get our initialized service so that we can register hooks
  const service = app.service('mailer');

  service.hooks(hooks);
}
