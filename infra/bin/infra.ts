#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { TmeStack } from "../lib/infra-stack";
import { TmeRepoStack } from "../lib/tme-repo-stack";
import { TmeEcsStack } from "../lib/tme-ecs-stack";

const app = new cdk.App();

// Keep the ECR repository stack
new TmeRepoStack(app, "TmeRepoStack", {
  /* If you don't specify 'env', this stack will be environment-agnostic.
   * Account/Region-dependent features and context lookups will not work,
   * but a single synthesized template can be deployed anywhere. */
  /* Uncomment the next line to specialize this stack for the AWS Account
   * and Region that are implied by the current CLI configuration. */
  // env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
  /* Uncomment the next line if you know exactly what Account and Region you
   * want to deploy the stack to. */
  // env: { account: '123456789012', region: 'us-east-1' },
  /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
});

// NEW: ECS Express Mode Stack with Fargate Spot
new TmeEcsStack(app, "TmeEcsStack", {
  useDefaultVpc: false, // Set to true to use default VPC (requires AWS credentials for lookup)
  minCapacity: 1,
  maxCapacity: 10,
  desiredCount: 2,
  cpu: 256,
  memoryLimitMiB: 512,
  // Uncomment when deploying to specify account/region
  // env: {
  //   account: process.env.CDK_DEFAULT_ACCOUNT,
  //   region: process.env.CDK_DEFAULT_REGION
  // },
});

// OLD: App Runner Stack (commented out for migration, keep for rollback)
// Uncomment this if you need to rollback to App Runner
/*
new TmeStack(app, "TmeStack", {
  // env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
});
*/
