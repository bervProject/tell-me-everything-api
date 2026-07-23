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
      cpu: props?.cpu ?? "512",
      memory: props?.memory ?? "1024",
    };

    // Parameters
    const imageTag = new cdk.CfnParameter(this, "imageTag", {
      type: "String",
      description: "Docker image tag to deploy",
    });

    const secretArn = new cdk.CfnParameter(this, "secretArn", {
      type: "String",
      description: "Full ARN of the Secrets Manager secret",
      default:
        "arn:aws:secretsmanager:ap-southeast-1:092318301320:secret:dev/AppRunner/tme-pjsiZH",
    });

    // Get existing ECR repository
    const repo = ecr.Repository.fromRepositoryName(this, "tme-ecr", "tme");

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

    // Add CloudWatch Logs permissions to execution role
    taskExecutionRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
        ],
        resources: [
          `arn:aws:logs:${this.region}:${this.account}:log-group:/aws/ecs/tme-express*`,
        ],
      }),
    );

    // Add Secrets Manager permissions to execution role
    // Using full ARN pattern to match the secret with its random suffix
    // The actual secret ARN is: arn:aws:secretsmanager:ap-southeast-1:092318301320:secret:dev/AppRunner/tme-XXXXXX
    taskExecutionRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["secretsmanager:GetSecretValue"],
        resources: [
          `arn:aws:secretsmanager:${this.region}:${this.account}:secret:dev/AppRunner/tme-*`,
        ],
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
    // Based on: https://dev.to/aws-builders/amazon-ecs-express-mode-from-an-iac-perspective-294i
    // The infrastructure role needs specific trust relationships for ECS Express Mode
    const infrastructureRole = new iam.Role(this, "TmeInfrastructureRole", {
      assumedBy: new iam.CompositePrincipal(
        new iam.ServicePrincipal("ecs.amazonaws.com"),
      ),
      roleName: "TmeEcsInfrastructureRole",
      description: "Role for ECS Express Mode to manage infrastructure",
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AmazonECSInfrastructureRoleforExpressGatewayServices",
        ),
      ],
    });

    // Build image URI
    const imageUri = `${repo.repositoryUri}:${imageTag.valueAsString}`;

    // Build secrets array for Express Mode
    // Note: DATABASE_URL should be a complete PostgreSQL connection string in Secrets Manager
    // Format: postgresql://username:password@host:port/database
    // valueFrom only needs the secret ARN, the key is specified in the name field
    const expressSecrets: ecs.CfnExpressGatewayService.SecretProperty[] = [
      {
        name: "AUTH_SECRET",
        valueFrom: `${secretArn.valueAsString}:AUTH_SECRET::`,
      },
      {
        name: "DATABASE_URL",
        valueFrom: `${secretArn.valueAsString}:DATABASE_URL::`,
      },
      {
        name: "ENCRYPT_SALT",
        valueFrom: `${secretArn.valueAsString}:ENCRYPT_SALT::`,
      },
      {
        name: "FRONTEND_URL",
        valueFrom: `${secretArn.valueAsString}:FRONTEND_URL::`,
      },
      { name: "HOSTNAME", valueFrom: `${secretArn.valueAsString}:HOSTNAME::` },
      {
        name: "JWT_AUDIANCE",
        valueFrom: `${secretArn.valueAsString}:JWT_AUDIANCE::`,
      },
      {
        name: "JWT_ISSUERS",
        valueFrom: `${secretArn.valueAsString}:JWT_ISSUERS::`,
      },
      {
        name: "LINE_CHANNEL_ACCESS_TOKEN",
        valueFrom: `${secretArn.valueAsString}:LINE_CHANNEL_ACCESS_TOKEN::`,
      },
      {
        name: "LINE_CHANNEL_SECRET",
        valueFrom: `${secretArn.valueAsString}:LINE_CHANNEL_SECRET::`,
      },
      {
        name: "MONGO_DB_NAME",
        valueFrom: `${secretArn.valueAsString}:MONGO_DB_NAME::`,
      },
      {
        name: "MONGO_URL",
        valueFrom: `${secretArn.valueAsString}:MONGO_URL::`,
      },
      {
        name: "OAUTH_CLIENT_ID",
        valueFrom: `${secretArn.valueAsString}:OAUTH_CLIENT_ID::`,
      },
      {
        name: "OAUTH_CLIENT_SECRET",
        valueFrom: `${secretArn.valueAsString}:OAUTH_CLIENT_SECRET::`,
      },
      {
        name: "OAUTH_REDIRECT_URL",
        valueFrom: `${secretArn.valueAsString}:OAUTH_REDIRECT_URL::`,
      },
      {
        name: "OAUTH_SUBDOMAIN",
        valueFrom: `${secretArn.valueAsString}:OAUTH_SUBDOMAIN::`,
      },
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
          autoScalingMetric: 'REQUEST_COUNT_PER_TARGET',
          autoScalingTargetValue: 20,
          minTaskCount: 1,
          maxTaskCount: 3,
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
