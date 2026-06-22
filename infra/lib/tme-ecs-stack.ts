import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecr from "aws-cdk-lib/aws-ecr";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as elbv2 from "aws-cdk-lib/aws-elasticloadbalancingv2";
import * as iam from "aws-cdk-lib/aws-iam";
import * as logs from "aws-cdk-lib/aws-logs";
import * as cloudwatch from "aws-cdk-lib/aws-cloudwatch";
import * as appscaling from "aws-cdk-lib/aws-applicationautoscaling";
import { Secret } from "aws-cdk-lib/aws-secretsmanager";

export interface TmeEcsStackProps extends cdk.StackProps {
  /**
   * Use default VPC or create new one
   * @default false - creates new VPC (set to true to use default VPC, requires AWS credentials)
   */
  useDefaultVpc?: boolean;
  
  /**
   * Minimum number of tasks
   * @default 1
   */
  minCapacity?: number;
  
  /**
   * Maximum number of tasks
   * @default 10
   */
  maxCapacity?: number;
  
  /**
   * Desired number of tasks
   * @default 2
   */
  desiredCount?: number;
  
  /**
   * CPU units for the task (256 = 0.25 vCPU)
   * @default 256
   */
  cpu?: number;
  
  /**
   * Memory in MiB
   * @default 512
   */
  memoryLimitMiB?: number;
}

export class TmeEcsStack extends cdk.Stack {
  public readonly service: ecs.FargateService;
  public readonly loadBalancer: elbv2.ApplicationLoadBalancer;

  constructor(scope: Construct, id: string, props?: TmeEcsStackProps) {
    super(scope, id, props);

    // Configuration with defaults
    const config = {
      useDefaultVpc: props?.useDefaultVpc ?? false,
      minCapacity: props?.minCapacity ?? 1,
      maxCapacity: props?.maxCapacity ?? 10,
      desiredCount: props?.desiredCount ?? 2,
      cpu: props?.cpu ?? 256,
      memoryLimitMiB: props?.memoryLimitMiB ?? 512,
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
      "dev/AppRunner/tme"
    );

    // VPC - use default or create new
    const vpc = config.useDefaultVpc
      ? ec2.Vpc.fromLookup(this, "DefaultVPC", { isDefault: true })
      : new ec2.Vpc(this, "TmeVpc", {
          maxAzs: 2,
          natGateways: 1,
        });

    // ECS Cluster with Fargate Spot enabled
    const cluster = new ecs.Cluster(this, "TmeCluster", {
      vpc,
      clusterName: "tme-cluster",
      containerInsights: true,
      enableFargateCapacityProviders: true,
    });

    // Task Execution Role - for ECS to pull images and write logs
    const taskExecutionRole = new iam.Role(this, "TmeTaskExecutionRole", {
      assumedBy: new iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
      roleName: "TmeEcsTaskExecutionRole",
      description: "Role for ECS tasks to pull images and write logs",
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AmazonECSTaskExecutionRolePolicy"
        ),
      ],
    });

    // Add Secrets Manager permissions to execution role
    taskExecutionRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["secretsmanager:GetSecretValue"],
        resources: [secrets.secretArn],
      })
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
        actions: [
          "ses:SendEmail",
          "ses:SendRawEmail",
          "sesv2:SendEmail",
        ],
        resources: ["*"],
      })
    );

    // Task Definition
    const taskDefinition = new ecs.FargateTaskDefinition(
      this,
      "TmeTaskDef",
      {
        memoryLimitMiB: config.memoryLimitMiB,
        cpu: config.cpu,
        executionRole: taskExecutionRole,
        taskRole: taskRole,
        runtimePlatform: {
          cpuArchitecture: ecs.CpuArchitecture.X86_64,
          operatingSystemFamily: ecs.OperatingSystemFamily.LINUX,
        },
      }
    );

    // Container Definition
    const container = taskDefinition.addContainer("TmeContainer", {
      image: ecs.ContainerImage.fromEcrRepository(
        repo,
        imageTag.valueAsString
      ),
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: "tme",
        logRetention: logs.RetentionDays.ONE_WEEK,
      }),
      secrets: {
        AUTH_SECRET: ecs.Secret.fromSecretsManager(secrets, "AUTH_SECRET"),
        DATABASE_URL: ecs.Secret.fromSecretsManager(secrets, "DATABASE_URL"),
        ENCRYPT_SALT: ecs.Secret.fromSecretsManager(secrets, "ENCRYPT_SALT"),
        FRONTEND_URL: ecs.Secret.fromSecretsManager(secrets, "FRONTEND_URL"),
        HOSTNAME: ecs.Secret.fromSecretsManager(secrets, "HOSTNAME"),
        JWT_AUDIANCE: ecs.Secret.fromSecretsManager(secrets, "JWT_AUDIANCE"),
        JWT_ISSUERS: ecs.Secret.fromSecretsManager(secrets, "JWT_ISSUERS"),
        LINE_CHANNEL_ACCESS_TOKEN: ecs.Secret.fromSecretsManager(
          secrets,
          "LINE_CHANNEL_ACCESS_TOKEN"
        ),
        LINE_CHANNEL_SECRET: ecs.Secret.fromSecretsManager(
          secrets,
          "LINE_CHANNEL_SECRET"
        ),
        MONGO_DB_NAME: ecs.Secret.fromSecretsManager(secrets, "MONGO_DB_NAME"),
        MONGO_URL: ecs.Secret.fromSecretsManager(secrets, "MONGO_URL"),
        NODE_AUTH_TOKEN: ecs.Secret.fromSecretsManager(
          secrets,
          "NODE_AUTH_TOKEN"
        ),
        OAUTH_CLIENT_ID: ecs.Secret.fromSecretsManager(
          secrets,
          "OAUTH_CLIENT_ID"
        ),
        OAUTH_CLIENT_SECRET: ecs.Secret.fromSecretsManager(
          secrets,
          "OAUTH_CLIENT_SECRET"
        ),
        OAUTH_REDIRECT_URL: ecs.Secret.fromSecretsManager(
          secrets,
          "OAUTH_REDIRECT_URL"
        ),
        OAUTH_SUBDOMAIN: ecs.Secret.fromSecretsManager(
          secrets,
          "OAUTH_SUBDOMAIN"
        ),
        PGDATABASE: ecs.Secret.fromSecretsManager(secrets, "PGDATABASE"),
        PGHOST: ecs.Secret.fromSecretsManager(secrets, "PGHOST"),
        PGPASSWORD: ecs.Secret.fromSecretsManager(secrets, "PGPASSWORD"),
        PGPORT: ecs.Secret.fromSecretsManager(secrets, "PGPORT"),
        PGUSER: ecs.Secret.fromSecretsManager(secrets, "PGUSER"),
        SEARCH_KEY: ecs.Secret.fromSecretsManager(secrets, "SEARCH_KEY"),
      },
      environment: {
        NODE_ENV: "production",
        PORT: "3030",
      },
      portMappings: [
        {
          containerPort: 3030,
          protocol: ecs.Protocol.TCP,
        },
      ],
      healthCheck: {
        command: ["CMD-SHELL", "curl -f http://localhost:3030/ || exit 1"],
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        retries: 3,
        startPeriod: cdk.Duration.seconds(60),
      },
    });

    // Application Load Balancer
    this.loadBalancer = new elbv2.ApplicationLoadBalancer(this, "TmeALB", {
      vpc,
      internetFacing: true,
      loadBalancerName: "tme-alb",
    });

    // Target Group
    const targetGroup = new elbv2.ApplicationTargetGroup(
      this,
      "TmeTargetGroup",
      {
        vpc,
        port: 3030,
        protocol: elbv2.ApplicationProtocol.HTTP,
        targetType: elbv2.TargetType.IP,
        healthCheck: {
          path: "/",
          interval: cdk.Duration.seconds(30),
          timeout: cdk.Duration.seconds(5),
          healthyThresholdCount: 2,
          unhealthyThresholdCount: 3,
        },
        deregistrationDelay: cdk.Duration.seconds(30),
      }
    );

    // Listener
    const listener = this.loadBalancer.addListener("TmeListener", {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultTargetGroups: [targetGroup],
    });

    // ECS Service with Fargate Spot
    this.service = new ecs.FargateService(this, "TmeService", {
      cluster,
      taskDefinition,
      serviceName: "tme-service",
      desiredCount: config.desiredCount,
      capacityProviderStrategies: [
        {
          capacityProvider: "FARGATE_SPOT",
          weight: 4,
          base: 0,
        },
        {
          capacityProvider: "FARGATE",
          weight: 1,
          base: 1, // Ensure at least 1 task on regular Fargate
        },
      ],
      circuitBreaker: {
        rollback: true,
      },
      enableExecuteCommand: true,
      healthCheckGracePeriod: cdk.Duration.seconds(60),
      minHealthyPercent: 50,
      maxHealthyPercent: 200,
    });

    // Attach service to target group
    this.service.attachToApplicationTargetGroup(targetGroup);

    // Auto Scaling Configuration
    const scaling = this.service.autoScaleTaskCount({
      minCapacity: config.minCapacity,
      maxCapacity: config.maxCapacity,
    });

    // CPU-based scaling
    scaling.scaleOnCpuUtilization("CpuScaling", {
      targetUtilizationPercent: 70,
      scaleInCooldown: cdk.Duration.seconds(60),
      scaleOutCooldown: cdk.Duration.seconds(60),
    });

    // Memory-based scaling
    scaling.scaleOnMemoryUtilization("MemoryScaling", {
      targetUtilizationPercent: 80,
      scaleInCooldown: cdk.Duration.seconds(60),
      scaleOutCooldown: cdk.Duration.seconds(60),
    });

    // Request count scaling
    scaling.scaleOnRequestCount("RequestScaling", {
      requestsPerTarget: 1000,
      targetGroup: targetGroup,
      scaleInCooldown: cdk.Duration.seconds(60),
      scaleOutCooldown: cdk.Duration.seconds(60),
    });

    // CloudWatch Alarms
    new cloudwatch.Alarm(this, "HighCpuAlarm", {
      metric: this.service.metricCpuUtilization(),
      threshold: 85,
      evaluationPeriods: 2,
      alarmDescription: "Alert when CPU exceeds 85%",
      alarmName: "tme-high-cpu",
    });

    new cloudwatch.Alarm(this, "HighMemoryAlarm", {
      metric: this.service.metricMemoryUtilization(),
      threshold: 90,
      evaluationPeriods: 2,
      alarmDescription: "Alert when memory exceeds 90%",
      alarmName: "tme-high-memory",
    });

    new cloudwatch.Alarm(this, "UnhealthyTargetAlarm", {
      metric: targetGroup.metricUnhealthyHostCount(),
      threshold: 1,
      evaluationPeriods: 2,
      alarmDescription: "Alert when targets are unhealthy",
      alarmName: "tme-unhealthy-targets",
    });

    // Outputs
    new cdk.CfnOutput(this, "LoadBalancerDNS", {
      value: this.loadBalancer.loadBalancerDnsName,
      description: "Application Load Balancer DNS name",
      exportName: "TmeAlbDns",
    });

    new cdk.CfnOutput(this, "ServiceName", {
      value: this.service.serviceName,
      description: "ECS Service name",
    });

    new cdk.CfnOutput(this, "ClusterName", {
      value: cluster.clusterName,
      description: "ECS Cluster name",
    });
  }
}

// Made with Bob
