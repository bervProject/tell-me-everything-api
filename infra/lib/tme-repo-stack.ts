import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ecr from "aws-cdk-lib/aws-ecr";
import * as iam from "aws-cdk-lib/aws-iam";

export class TmeRepoStack extends cdk.Stack {
  public readonly repository: ecr.Repository;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.repository = new ecr.Repository(this, "tme-ecr", {
      repositoryName: "tme",
      imageScanOnPush: false,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      imageTagMutability: ecr.TagMutability.MUTABLE,
      encryption: ecr.RepositoryEncryption.KMS,
      lifecycleRules: [
        {
          maxImageAge: cdk.Duration.days(7),
          rulePriority: 1,
          tagStatus: ecr.TagStatus.UNTAGGED,
        },
      ],
    });

    // Add repository policy to allow ECS Task Execution Role to pull images
    // Reference: https://repost.aws/knowledge-center/ecs-tasks-pull-images-ecr-repository
    // This grants access to the specific Task Execution Role created in TmeEcsStack
    this.repository.addToResourcePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        principals: [
          new iam.ArnPrincipal(
            `arn:aws:iam::${cdk.Stack.of(this).account}:role/TmeEcsTaskExecutionRole`,
          ),
        ],
        actions: [
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage",
        ],
      }),
    );

    new cdk.CfnOutput(this, "output-tme-ecr", {
      value: this.repository.repositoryArn,
    });
  }
}
