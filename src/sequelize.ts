import { Sequelize } from "sequelize";
import { Application } from "./declarations";
import logger from "./logger";

export default function (app: Application): void {
  try {
    const connectionString = app.get("postgres");
    const sequelize = new Sequelize(connectionString, {
      dialect: "postgres",
      logging: false,
      define: {
        freezeTableName: true,
      },
    });
    const oldSetup = app.setup;

    app.set("sequelizeClient", sequelize);

    app.setup = function (...args) {
      const result = oldSetup.apply(this, args);

      // Set up data relationships
      const models = sequelize.models;
      Object.keys(models).forEach((name) => {
        if ("associate" in models[name]) {
          (models[name] as any).associate(models);
        }
      });

      // Sync to the database
      app.set(
        "sequelizeSync",
        sequelize.sync().catch((err) => logger.error(JSON.stringify(err))),
      );

      return result;
    };
  } catch (error) {
    logger.error("Error setting up Sequelize:", error);
    // debug only
    const connectionString = app.get("postgres");
    logger.warn("Connection string:", connectionString);
  }
}
