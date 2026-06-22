# ECS Express Mode Implementation Guide

This guide provides the complete code implementation for migrating to ECS Express Mode with Fargate Spot.

## File Structure

After implementation, your infra directory will have:
```
infra/
├── bin/
│   └── infra.ts (updated)
├── lib/
│   ├── infra-stack.ts (deprecated - App Runner)
│   ├── tme-repo-stack.ts (keep as-is)
│   └── tme-ecs-stack.ts (new - ECS implementation)
├── package.json (updated dependencies)
└── MIGRATION_PLAN.md
```

## Step 1: Update package.json Dependencies

Remove the App Runner alpha dependency and ensure you have the latest CDK version:

```json
{
  "name": "infra",
  "version": "0.1.0",
  "dependencies": {
    "aws-cdk-lib": "2.248.0",
    "constructs": "^10.6.0",
    "source-map-support": "^0.5.21"
  },
  "devDependencies": {
    "@types/jest": "^30.0.0",
    "@types/node": "25.5.2",
    "aws-cdk": "2.1116.0",
    "jest": "^30.3.0",
    "ts-jest": "^29.4.9",
    "ts-node": "^10.9.2",
    "typescript": "~6.0.2"
  }
}
```

**Action**: Remove `"@aws-cdk/aws-apprunner-alpha": "^2.248.0-alpha.0"` from dependencies.

## Step 2: Create New ECS Stack

Create a new file `infra/lib/tme-ecs-stack.ts` with the following content:

```typescript
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
   * @default true - uses default VPC
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
      useDefaultVpc: props?.useDefaultVpc ?? true,
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
```

## Step 3: Update bin/infra.ts

Update your `infra/bin/infra.ts` to use the new ECS stack:

```typescript
#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { TmeStack } from "../lib/infra-stack";
import { TmeRepoStack } from "../lib/tme-repo-stack";
import { TmeEcsStack } from "../lib/tme-ecs-stack";

const app = new cdk.App();

// Keep the ECR repository stack
new TmeRepoStack(app, "TmeRepoStack", {
  // Optionally specify env for specific account/region
});

// Option 1: Deploy ECS stack alongside App Runner (for testing)
new TmeEcsStack(app, "TmeEcsStack", {
  useDefaultVpc: true,
  minCapacity: 1,
  maxCapacity: 10,
  desiredCount: 2,
  cpu: 256,
  memoryLimitMiB: 512,
});

// Option 2: Keep App Runner for now (comment out when ready to migrate)
// new TmeStack(app, "TmeStack", {});
```

## Step 4: Deployment Commands

### Install Dependencies
```bash
cd infra
npm install
```

### Synthesize CloudFormation Template
```bash
npm run cdk synth TmeEcsStack
```

### Deploy to AWS
```bash
# Deploy with specific image tag
npm run cdk deploy TmeEcsStack --parameters imageTag=latest

# Or deploy all stacks
npm run cdk deploy --all --parameters TmeEcsStack:imageTag=latest
```

### Useful CDK Commands
```bash
# Show differences
npm run cdk diff TmeEcsStack

# List all stacks
npm run cdk list

# Destroy stack (cleanup)
npm run cdk destroy TmeEcsStack
```

## Step 5: Testing the Deployment

### 1. Check Service Status
```bash
aws ecs describe-services \
  --cluster tme-cluster \
  --services tme-service \
  --query 'services[0].{Status:status,Running:runningCount,Desired:desiredCount}'
```

### 2. Get Load Balancer URL
```bash
aws cloudformation describe-stacks \
  --stack-name TmeEcsStack \
  --query 'Stacks[0].Outputs[?OutputKey==`LoadBalancerDNS`].OutputValue' \
  --output text
```

### 3. Test Health Endpoint
```bash
# Replace with your ALB DNS
curl http://tme-alb-xxxxx.region.elb.amazonaws.com/
```

### 4. View Logs
```bash
aws logs tail /aws/ecs/tme --follow
```

## Step 6: Monitoring

### CloudWatch Metrics to Monitor
1. **Service Metrics**
   - CPUUtilization
   - MemoryUtilization
   - RunningTaskCount
   - DesiredTaskCount

2. **ALB Metrics**
   - TargetResponseTime
   - HealthyHostCount
   - UnHealthyHostCount
   - RequestCount

3. **Cost Metrics**
   - Fargate Spot interruptions
   - Task duration
   - Data transfer costs

### Set Up CloudWatch Dashboard
```bash
# Create a custom dashboard in AWS Console
# Add widgets for:
# - ECS Service CPU/Memory
# - ALB Target Health
# - Request Count
# - Error Rate
```

## Step 7: Gradual Migration Strategy

### Phase 1: Parallel Run (Week 1)
- Deploy ECS stack alongside App Runner
- Test ECS endpoint thoroughly
- Monitor for 3-7 days

### Phase 2: Traffic Split (Week 2)
- Use Route 53 weighted routing
- Send 10% traffic to ECS
- Monitor error rates and performance
- Gradually increase to 50%, then 100%

### Phase 3: Full Migration (Week 3)
- Route all traffic to ECS
- Keep App Runner running as backup
- Monitor for 48 hours

### Phase 4: Cleanup (Week 4)
- Delete App Runner service
- Remove old CloudWatch log groups
- Update documentation

## Troubleshooting

### Issue: Tasks Keep Stopping
**Solution**: Check CloudWatch logs for errors
```bash
aws logs tail /aws/ecs/tme --follow --since 1h
```

### Issue: Health Checks Failing
**Solution**: Verify container port and health check path
- Ensure container listens on port 3030
- Verify health check endpoint returns 200 OK

### Issue: Cannot Pull Image
**Solution**: Check task execution role permissions
- Verify ECR permissions
- Check image tag exists

### Issue: High Costs
**Solution**: Optimize resource allocation
- Reduce CPU/memory if underutilized
- Adjust auto-scaling thresholds
- Increase Fargate Spot ratio

## Cost Optimization Tips

1. **Right-size Resources**
   - Start with 256 CPU / 512 MB memory
   - Monitor actual usage
   - Adjust based on metrics

2. **Maximize Fargate Spot Usage**
   - Use 80-90% Spot capacity
   - Keep 1-2 tasks on regular Fargate

3. **Optimize Auto-scaling**
   - Set aggressive scale-in policies
   - Use scheduled scaling for predictable patterns
   - Scale to minimum during off-peak hours

4. **Reduce Data Transfer**
   - Use VPC endpoints for AWS services
   - Enable compression in application
   - Optimize API responses

5. **Log Retention**
   - Set appropriate log retention (7-14 days)
   - Use log filtering to reduce volume
   - Archive old logs to S3

## Rollback Procedure

If you need to rollback to App Runner:

1. **Immediate Rollback**
   ```bash
   # Update DNS to point back to App Runner
   # Or use Route 53 weighted routing to shift traffic
   ```

2. **Keep ECS Running**
   - Don't delete ECS stack immediately
   - Investigate issues
   - Fix and retry

3. **Complete Rollback**
   ```bash
   npm run cdk destroy TmeEcsStack
   ```

## Next Steps

After successful migration:

1. **Monitor for 2 weeks**
   - Track costs daily
   - Monitor performance metrics
   - Adjust auto-scaling as needed

2. **Optimize**
   - Fine-tune CPU/memory allocation
   - Adjust Fargate Spot ratio
   - Optimize auto-scaling thresholds

3. **Document**
   - Update runbooks
   - Document new deployment process
   - Share lessons learned

4. **Cleanup**
   - Delete App Runner stack
   - Remove unused resources
   - Archive old configurations

## Support

For issues or questions:
- Check CloudWatch Logs
- Review ECS service events
- Consult AWS ECS documentation
- Review this migration plan

## Conclusion

This implementation guide provides all the code and commands needed to migrate from AWS App Runner to ECS Express Mode with Fargate Spot. Follow the steps carefully, test thoroughly, and monitor closely during the migration.