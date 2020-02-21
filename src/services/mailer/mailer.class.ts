import { Id, NullableId, Paginated, Params, ServiceMethods } from '@feathersjs/feathers';
import Mail from 'nodemailer/lib/mailer';

interface Data { }

export class Mailer implements ServiceMethods<Data> {
  transporter: Mail;

  constructor(transport: Mail) {
    this.transporter = transport;
  }

  async find(params?: Params): Promise<Data[] | Paginated<Data>> {
    return [];
  }

  async get(id: Id, params?: Params): Promise<Data> {
    return {
      id, text: `A new message with ID: ${id}!`
    };
  }

  async create(data: Mail.Options, params?: Params): Promise<Data> {
    return this.transporter.sendMail(data);
  }

  async update(id: NullableId, data: Data, params?: Params): Promise<Data> {
    return data;
  }

  async patch(id: NullableId, data: Data, params?: Params): Promise<Data> {
    return data;
  }

  async remove(id: NullableId, params?: Params): Promise<Data> {
    return { id };
  }
}
