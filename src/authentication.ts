import { Params, ServiceAddons } from "@feathersjs/feathers";
import { AuthenticationService, JWTStrategy } from "@feathersjs/authentication";
import { LocalStrategy } from "@feathersjs/authentication-local";
import {
  expressOauth,
  OAuthProfile,
  OAuthStrategy,
} from "@feathersjs/authentication-oauth";

import { Application } from "./declarations";

declare module "./declarations" {
  interface ServiceTypes {
    authentication: AuthenticationService & ServiceAddons<any>;
  }
}

class MyAuthService extends AuthenticationService {
  async getPayload(authResult: any, params: any) {
    // Call original `getPayload` first
    const payload = await super.getPayload(authResult, params);
    const { user } = authResult;

    if (user && user.permissions) {
      payload.permissions = user.permissions;
    }

    return payload;
  }
}

class Auth0Strategy extends OAuthStrategy {
  async getEntityData(profile: OAuthProfile, _existing: any, _params: Params) {
    const baseData = await super.getEntityData(profile, _existing, _params);

    return {
      ...baseData,
      email: profile.email,
    };
  }
}

export default function (app: Application): void {
  const authentication = new MyAuthService(app);

  authentication.register("jwt", new JWTStrategy());
  authentication.register("local", new LocalStrategy());
  authentication.register("auth0", new Auth0Strategy());

  app.use("/authentication", authentication);
  app.configure(expressOauth());
}
