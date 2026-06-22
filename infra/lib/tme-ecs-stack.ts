import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ecr from "aws-cdk-lib/aws-ecr";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as iam from "aws-cdk-lib/aws-iam";
import { Secret } from "aws-cdk-lib/aws-secretsmanager";

export interface TmeEcsStackProps extends cdk.StackProps {
  /**
   * CPU units for the task (256 = 0.25 vCPU)
   * @default "256"
   */
  cpu?: string;

  /**
   * Memory in MiB
   * @default "512"
   */
  memory?: string;
}

export class TmeEcsStack extends cdk.Stack {
  public readonly expressService: ecs.CfnExpressGatewayService;

  constructor(scope: Construct, id: string, props?: TmeEcsStackProps) {
    super(scope, id, props);

    // Configuration with defaults
    const config = {
      cpu: props?.cpu ?? "256",
      memory: props?.memory ?? "512",
    };

    // Parameters
    const imageTag = new cdk.CfnParameter(this, "imageTag", {
      type: "String",
      description: "Docker image tag to deploy",
    });

    // Get existing ECR repository
    const repo = ecr.Repository.fromRepositoryName(this, "tme-ecr", "tme");

    // Get secrets from Secrets Manager
    const secrets = Secret.fromSecretNameV2(
      this,
      "ecs-secret",
      "dev/AppRunner/tme",
    );

    // Task Execution Role - for ECS to pull images and write logs
    const taskExecutionRole = new iam.Role(this, "TmeTaskExecutionRole", {
      assumedBy: new iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
      roleName: "TmeEcsTaskExecutionRole",
      description: "Role for ECS tasks to pull images and write logs",
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AmazonECSTaskExecutionRolePolicy",
        ),
      ],
    });

    // Add Secrets Manager permissions to execution role
    taskExecutionRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["secretsmanager:GetSecretValue"],
        resources: [secrets.secretArn],
      }),
    );

    // Task Role - for application runtime permissions
    const taskRole = new iam.Role(this, "TmeTaskRole", {
      assumedBy: new iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
      roleName: "TmeEcsTaskRole",
      description: "Role for application runtime permissions",
    });

    // Add SES permissions for email functionality
    taskRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["ses:SendEmail", "ses:SendRawEmail", "sesv2:SendEmail"],
        resources: ["*"],
      }),
    );

    // Infrastructure Role - for Express Mode to manage AWS resources
    const infrastructureRole = new iam.Role(this, "TmeInfrastructureRole", {
      assumedBy: new iam.ServicePrincipal("ecs.amazonaws.com"),
      roleName: "TmeEcsInfrastructureRole",
      description: "Role for ECS Express Mode to manage infrastructure",
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AmazonECSInfrastructureRolePolicyForExpressMode",
        ),
      ],
    });

    // Build image URI
    const imageUri = `${repo.repositoryUri}:${imageTag.valueAsString}`;

    // Build secrets array for Express Mode
    const expressSecrets: ecs.CfnExpressGatewayService.SecretProperty[] = [
      { name: "AUTH_SECRET", valueFrom: `${secrets.secretArn}:AUTH_SECRET::` },
      {
        name: "DATABASE_URL",
        valueFrom: `${secrets.secretArn}:DATABASE_URL::`,
      },
      {
        name: "ENCRYPT_SALT",
        valueFrom: `${secrets.secretArn}:ENCRYPT_SALT::`,
      },
      {
        name: "FRONTEND_URL",
        valueFrom: `${secrets.secretArn}:FRONTEND_URL::`,
      },
      { name: "HOSTNAME", valueFrom: `${secrets.secretArn}:HOSTNAME::` },
      {
        name: "JWT_AUDIANCE",
        valueFrom: `${secrets.secretArn}:JWT_AUDIANCE::`,
      },
      { name: "JWT_ISSUERS", valueFrom: `${secrets.secretArn}:JWT_ISSUERS::` },
      {
        name: "LINE_CHANNEL_ACCESS_TOKEN",
        valueFrom: `${secrets.secretArn}:LINE_CHANNEL_ACCESS_TOKEN::`,
      },
      {
        name: "LINE_CHANNEL_SECRET",
        valueFrom: `${secrets.secretArn}:LINE_CHANNEL_SECRET::`,
      },
      {
        name: "MONGO_DB_NAME",
        valueFrom: `${secrets.secretArn}:MONGO_DB_NAME::`,
      },
      { name: "MONGO_URL", valueFrom: `${secrets.secretArn}:MONGO_URL::` },
      {
        name: "NODE_AUTH_TOKEN",
        valueFrom: `${secrets.secretArn}:NODE_AUTH_TOKEN::`,
      },
      {
        name: "OAUTH_CLIENT_ID",
        valueFrom: `${secrets.secretArn}:OAUTH_CLIENT_ID::`,
      },
      {
        name: "OAUTH_CLIENT_SECRET",
        valueFrom: `${secrets.secretArn}:OAUTH_CLIENT_SECRET::`,
      },
      {
        name: "OAUTH_REDIRECT_URL",
        valueFrom: `${secrets.secretArn}:OAUTH_REDIRECT_URL::`,
      },
      {
        name: "OAUTH_SUBDOMAIN",
        valueFrom: `${secrets.secretArn}:OAUTH_SUBDOMAIN::`,
      },
      { name: "PGDATABASE", valueFrom: `${secrets.secretArn}:PGDATABASE::` },
      { name: "PGHOST", valueFrom: `${secrets.secretArn}:PGHOST::` },
      { name: "PGPASSWORD", valueFrom: `${secrets.secretArn}:PGPASSWORD::` },
      { name: "PGPORT", valueFrom: `${secrets.secretArn}:PGPORT::` },
      { name: "PGUSER", valueFrom: `${secrets.secretArn}:PGUSER::` },
      { name: "SEARCH_KEY", valueFrom: `${secrets.secretArn}:SEARCH_KEY::` },
    ];

    // Build environment variables array
    const expressEnvironment: ecs.CfnExpressGatewayService.KeyValuePairProperty[] =
      [
        { name: "NODE_ENV", value: "production" },
        { name: "PORT", value: "3030" },
      ];

    // ECS Express Mode Service using CfnExpressGatewayService
    // This is AWS-managed infrastructure similar to App Runner
    this.expressService = new ecs.CfnExpressGatewayService(
      this,
      "TmeExpressService",
      {
        serviceName: "tme-express-service",
        executionRoleArn: taskExecutionRole.roleArn,
        infrastructureRoleArn: infrastructureRole.roleArn,
        taskRoleArn: taskRole.roleArn,
        cpu: config.cpu,
        memory: config.memory,
        healthCheckPath: "/",
        primaryContainer: {
          image: imageUri,
          containerPort: 3030,
          environment: expressEnvironment,
          secrets: expressSecrets,
          awsLogsConfiguration: {
            logGroup: `/aws/ecs/tme-express`,
            logStreamPrefix: "tme",
          },
        },
        scalingTarget: {
          minTaskCount: 1,
          maxTaskCount: 10,
        },
      },
    );

    // Ensure roles are created before the service
    this.expressService.node.addDependency(taskExecutionRole);
    this.expressService.node.addDependency(taskRole);
    this.expressService.node.addDependency(infrastructureRole);

    // Outputs
    new cdk.CfnOutput(this, "ServiceName", {
      value: this.expressService.serviceName!,
      description: "ECS Express Service name",
    });

    new cdk.CfnOutput(this, "ServiceArn", {
      value: this.expressService.attrServiceArn,
      description: "ECS Express Service ARN",
    });
  }
}

// Made with Bob
