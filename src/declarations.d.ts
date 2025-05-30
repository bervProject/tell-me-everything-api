import { Application as ExpressFeathers } from "@feathersjs/express";
import "@feathersjs/transport-commons";

// A mapping of service names to types. Will be extended in service files.
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ServiceTypes {}
// The application instance type that will be used everywhere else
export type Application = ExpressFeathers<ServiceTypes>;
export type HookContext = FeathersHookContext<Application>;
