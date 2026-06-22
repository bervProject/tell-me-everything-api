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
      cpu: props?.cpu ?? "1024",
      memory: props?.memory ?? "2048",
    };

    // Parameters
    const imageTag = new cdk.CfnParameter(this, "imageTag", {
      type: "String",
      description: "Docker image tag to deploy",
    });

    // Get existing ECR repository
    const repo = ecr.Repository.fromRepositoryName(this, "tme-ecr", "tme");

    // Get secrets from Secrets Manager
    // Import the secret for IAM permissions
    const secrets = Secret.fromSecretNameV2(
      this,
      "ecs-secret",
      "dev/AppRunner/tme",
    );

    // Helper function to create ECS secret reference using ecs.Secret
    const createEcsSecret = (name: string, key: string) => {
      const ecsSecret = ecs.Secret.fromSecretsManager(secrets, key);
      // Extract the valueFrom string from the ECS Secret
      return {
        name: name,
        valueFrom: ecsSecret.arn + `:${key}::`,
      };
    };

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

    // Build secrets array for Express Mode using ecs.Secret helper
    // Note: DATABASE_URL should be a complete PostgreSQL connection string in Secrets Manager
    // Format: postgresql://username:password@host:port/database
    const expressSecrets: ecs.CfnExpressGatewayService.SecretProperty[] = [
      createEcsSecret("AUTH_SECRET", "AUTH_SECRET"),
      createEcsSecret("DATABASE_URL", "DATABASE_URL"),
      createEcsSecret("ENCRYPT_SALT", "ENCRYPT_SALT"),
      createEcsSecret("FRONTEND_URL", "FRONTEND_URL"),
      createEcsSecret("HOSTNAME", "HOSTNAME"),
      createEcsSecret("JWT_AUDIANCE", "JWT_AUDIANCE"),
      createEcsSecret("JWT_ISSUERS", "JWT_ISSUERS"),
      createEcsSecret("LINE_CHANNEL_ACCESS_TOKEN", "LINE_CHANNEL_ACCESS_TOKEN"),
      createEcsSecret("LINE_CHANNEL_SECRET", "LINE_CHANNEL_SECRET"),
      createEcsSecret("MONGO_DB_NAME", "MONGO_DB_NAME"),
      createEcsSecret("MONGO_URL", "MONGO_URL"),
      createEcsSecret("OAUTH_CLIENT_ID", "OAUTH_CLIENT_ID"),
      createEcsSecret("OAUTH_CLIENT_SECRET", "OAUTH_CLIENT_SECRET"),
      createEcsSecret("OAUTH_REDIRECT_URL", "OAUTH_REDIRECT_URL"),
      createEcsSecret("OAUTH_SUBDOMAIN", "OAUTH_SUBDOMAIN"),
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
