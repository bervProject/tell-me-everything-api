import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ecr from "aws-cdk-lib/aws-ecr";
import * as iam from "aws-cdk-lib/aws-iam";
import * as apprunner from "@aws-cdk/aws-apprunner-alpha";
import { Secret } from "aws-cdk-lib/aws-secretsmanager";

export class TmeStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const repo = ecr.Repository.fromRepositoryName(this, "tme-ecr", "tme");

    const imageTag = new cdk.CfnParameter(this, "imageTag", {
      type: "String",
      description: "Target tag",
    });

    const secrets = Secret.fromSecretNameV2(
      this,
      "apprunner-secret",
      "dev/AppRunner/tme",
    );

    // temporary role, reuse lambda
    const role = iam.Role.fromRoleName(this, "tme-role", "S3RoleLambda");

    const appRunner = new apprunner.Service(this, "tme-apprunner", {
      instanceRole: role,
      source: apprunner.Source.fromEcr({
        repository: repo,
        imageConfiguration: {
          port: 3030,
          environmentSecrets: {
            AUTH_SECRET: apprunner.Secret.fromSecretsManager(
              secrets,
              "AUTH_SECRET",
            ),
            DATABASE_URL: apprunner.Secret.fromSecretsManager(
              secrets,
              "DATABASE_URL",
            ),
            ENCRYPT_SALT: apprunner.Secret.fromSecretsManager(
              secrets,
              "ENCRYPT_SALT",
            ),
            FRONTEND_URL: apprunner.Secret.fromSecretsManager(
              secrets,
              "FRONTEND_URL",
            ),
            HOSTNAME: apprunner.Secret.fromSecretsManager(secrets, "HOSTNAME"),
            JWT_AUDIANCE: apprunner.Secret.fromSecretsManager(
              secrets,
              "JWT_AUDIANCE",
            ),
            JWT_ISSUERS: apprunner.Secret.fromSecretsManager(
              secrets,
              "JWT_ISSUERS",
            ),
            LINE_CHANNEL_ACCESS_TOKEN: apprunner.Secret.fromSecretsManager(
              secrets,
              "LINE_CHANNEL_ACCESS_TOKEN",
            ),
            LINE_CHANNEL_SECRET: apprunner.Secret.fromSecretsManager(
              secrets,
              "LINE_CHANNEL_SECRET",
            ),
            MONGO_DB_NAME: apprunner.Secret.fromSecretsManager(
              secrets,
              "MONGO_DB_NAME",
            ),
            MONGO_URL: apprunner.Secret.fromSecretsManager(
              secrets,
              "MONGO_URL",
            ),
            NODE_AUTH_TOKEN: apprunner.Secret.fromSecretsManager(
              secrets,
              "NODE_AUTH_TOKEN",
            ),
            OAUTH_CLIENT_ID: apprunner.Secret.fromSecretsManager(
              secrets,
              "OAUTH_CLIENT_ID",
            ),
            OAUTH_CLIENT_SECRET: apprunner.Secret.fromSecretsManager(
              secrets,
              "OAUTH_CLIENT_SECRET",
            ),
            OAUTH_REDIRECT_URL: apprunner.Secret.fromSecretsManager(
              secrets,
              "OAUTH_REDIRECT_URL",
            ),
            OAUTH_SUBDOMAIN: apprunner.Secret.fromSecretsManager(
              secrets,
              "OAUTH_SUBDOMAIN",
            ),
            PGDATABASE: apprunner.Secret.fromSecretsManager(
              secrets,
              "PGDATABASE",
            ),
            PGHOST: apprunner.Secret.fromSecretsManager(secrets, "PGHOST"),
            PGPASSWORD: apprunner.Secret.fromSecretsManager(
              secrets,
              "PGPASSWORD",
            ),
            PGPORT: apprunner.Secret.fromSecretsManager(secrets, "PGPORT"),
            PGUSER: apprunner.Secret.fromSecretsManager(secrets, "PGUSER"),
            SEARCH_KEY: apprunner.Secret.fromSecretsManager(
              secrets,
              "SEARCH_KEY",
            ),
          },
        },
        tagOrDigest: imageTag.valueAsString,
      }),
    });

    new cdk.CfnOutput(this, "output-tme-apprunner-url", {
      value: appRunner.serviceUrl,
    });
  }
}
