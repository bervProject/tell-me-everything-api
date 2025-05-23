import path from "path";
import favicon from "serve-favicon";
import compress from "compression";
import helmet from "helmet";
import cors from "cors";

import {feathers} from "@feathersjs/feathers";
import configuration from "@feathersjs/configuration";
import express, {errorHandler, json, notFound, urlencoded, rest, static as staticFiles} from "@feathersjs/express";
import socketio from "@feathersjs/socketio";

import { Application } from "./declarations";
import logger from "./logger";
import middleware from "./middleware";
import services from "./services";
import appHooks from "./app.hooks";
import channels from "./channels";
import sequelize from "./sequelize";
import authentication from "./authentication";
import mongodb from "./mongodb";
// Don't remove this comment. It's needed to format import lines nicely.

const app: Application = express(feathers());

// Load app configuration
app.configure(configuration());
// Enable security, CORS, compression, favicon and body parsing
app.use(helmet());
app.use(cors());
app.use(compress());
app.use(json());
app.use(urlencoded({ extended: true }));
app.use(favicon(path.join(app.get("public"), "favicon.ico")));
// Host the public folder
app.use("/", staticFiles(app.get("public")));

// Set up Plugins and providers
app.configure(rest());
app.configure(socketio());

app.configure(sequelize);

app.configure(mongodb);

// Configure other middleware (see `middleware/index.js`)
app.configure(middleware);
app.configure(authentication);
// Set up our services (see `services/index.js`)
app.configure(services);
// Set up event channels (see channels.js)
app.configure(channels);

// Configure a middleware for 404s and the error handler
app.use(notFound());
app.use(errorHandler({ logger } as any));

app.hooks(appHooks);

export default app;
