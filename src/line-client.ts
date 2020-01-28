import { Client } from '@line/bot-sdk';
import config from './line-config';

const client = new Client(config);

export default client;
