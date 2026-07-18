module.exports = {
  host: process.env.HOSTNAME,
  port: process.env.PORT,
  lineAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  lineSecret: process.env.LINE_CHANNEL_SECRET,
  postgres: process.env.DATABASE_URL,
  salt: process.env.ENCRYPT_SALT,
  frontend: process.env.FRONTEND_URL,
  mongodb: process.env.MONGO_URL,
  mongodbname: process.env.MONGO_DB_NAME,
  authentication: {
    secret: process.env.AUTH_SECRET,
    authStrategies: ["jwt", "local", "oauth"],
    jwtOptions: {
      header: {
        typ: "access",
      },
      audience: process.env.JWT_AUDIENCE,
      issuer: process.env.JWT_ISSUERS,
      algorithm: "HS256",
      expiresIn: "1d",
    },
    oauth: {
      redirect: process.env.OAUTH_REDIRECT_URL,
      auth0: {
        key: process.env.OAUTH_CLIENT_ID,
        secret: process.env.OAUTH_CLIENT_SECRET,
        subdomain: process.env.OAUTH_SUBDOMAIN,
        scope: ["openid", "profile", "email"],
      },
    },
  },
};
