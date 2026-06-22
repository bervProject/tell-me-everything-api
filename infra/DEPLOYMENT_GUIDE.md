# ECS Stack Deployment Guide

## Prerequisites

1. **AWS CLI configured with appropriate profile**
   ```bash
   aws configure --profile your-profile-name
   ```

2. **CDK Bootstrap** (if not already done)
   ```bash
   # Using specific profile
   cdk bootstrap --profile your-profile-name
   
   # Or with explicit account/region
   cdk bootstrap aws://ACCOUNT-NUMBER/REGION --profile your-profile-name
   ```

3. **Docker image pushed to ECR**
   - Ensure your application image is available in the `tme` ECR repository
   - Note the image tag you want to deploy

## Configuration Options

### VPC Configuration

The stack supports two VPC modes:

1. **Create New VPC (Default - No AWS credentials needed for synth)**
   ```typescript
   useDefaultVpc: false  // Creates new VPC with 2 AZs and 1 NAT Gateway
   ```

2. **Use Default VPC (Requires AWS credentials)**
   ```typescript
   useDefaultVpc: true   // Looks up and uses existing default VPC
   ```

To use the default VPC, update `infra/bin/infra.ts`:
```typescript
new TmeEcsStack(app, "TmeEcsStack", {
  useDefaultVpc: true,  // Change to true
  // ... other config
  env: { 
    account: process.env.CDK_DEFAULT_ACCOUNT, 
    region: process.env.CDK_DEFAULT_REGION 
  },
});
```

### Resource Configuration

Adjust these parameters in `infra/bin/infra.ts`:

```typescript
new TmeEcsStack(app, "TmeEcsStack", {
  useDefaultVpc: false,
  minCapacity: 1,        // Minimum number of tasks
  maxCapacity: 10,       // Maximum number of tasks
  desiredCount: 2,       // Initial number of tasks
  cpu: 256,              // CPU units (256 = 0.25 vCPU)
  memoryLimitMiB: 512,   // Memory in MiB
});
```

## Deployment Commands

### 1. Synthesize CloudFormation Template

```bash
cd infra

# Without AWS profile (creates new VPC)
npm run cdk synth TmeEcsStack

# With AWS profile (can use default VPC)
npm run cdk synth TmeEcsStack -- --profile your-profile-name
```

### 2. Review Changes (Diff)

```bash
# Show what will change
npm run cdk diff TmeEcsStack -- --profile your-profile-name
```

### 3. Deploy Stack

```bash
# Deploy with specific image tag
npm run cdk deploy TmeEcsStack \
  --parameters imageTag=latest \
  --profile your-profile-name

# Deploy with approval prompt
npm run cdk deploy TmeEcsStack \
  --parameters imageTag=v1.0.0 \
  --profile your-profile-name \
  --require-approval any-change

# Deploy without approval (CI/CD)
npm run cdk deploy TmeEcsStack \
  --parameters imageTag=latest \
  --profile your-profile-name \
  --require-approval never
```

### 4. Deploy All Stacks

```bash
npm run cdk deploy --all \
  --parameters TmeEcsStack:imageTag=latest \
  --profile your-profile-name
```

## Post-Deployment

### Get Load Balancer URL

```bash
# From CloudFormation outputs
aws cloudformation describe-stacks \
  --stack-name TmeEcsStack \
  --query 'Stacks[0].Outputs[?OutputKey==`LoadBalancerDNS`].OutputValue' \
  --output text \
  --profile your-profile-name
```

### Check Service Status

```bash
aws ecs describe-services \
  --cluster tme-cluster \
  --services tme-service \
  --profile your-profile-name
```

### View Logs

```bash
# Tail logs
aws logs tail /aws/ecs/tme --follow --profile your-profile-name

# View recent logs
aws logs tail /aws/ecs/tme --since 1h --profile your-profile-name
```

### List Running Tasks

```bash
aws ecs list-tasks \
  --cluster tme-cluster \
  --service-name tme-service \
  --profile your-profile-name
```

## Monitoring

### CloudWatch Metrics

Access CloudWatch Console to view:
- ECS Service CPU/Memory utilization
- ALB request count and response times
- Target health status
- Auto-scaling activities

### CloudWatch Alarms

The stack creates these alarms:
- `tme-high-cpu`: Alerts when CPU > 85%
- `tme-high-memory`: Alerts when memory > 90%
- `tme-unhealthy-targets`: Alerts when targets are unhealthy

## Updating the Stack

### Update Image Tag

```bash
npm run cdk deploy TmeEcsStack \
  --parameters imageTag=v1.1.0 \
  --profile your-profile-name
```

### Update Configuration

1. Modify `infra/bin/infra.ts` or `infra/lib/tme-ecs-stack.ts`
2. Review changes:
   ```bash
   npm run cdk diff TmeEcsStack -- --profile your-profile-name
   ```
3. Deploy:
   ```bash
   npm run cdk deploy TmeEcsStack \
     --parameters imageTag=latest \
     --profile your-profile-name
   ```

## Rollback

### Rollback to Previous Version

```bash
# Deploy with previous image tag
npm run cdk deploy TmeEcsStack \
  --parameters imageTag=previous-tag \
  --profile your-profile-name
```

### Rollback to App Runner

If you need to rollback to App Runner:

1. Uncomment App Runner stack in `infra/bin/infra.ts`:
   ```typescript
   new TmeStack(app, "TmeStack", {});
   ```

2. Deploy App Runner:
   ```bash
   npm run cdk deploy TmeStack --profile your-profile-name
   ```

3. Update DNS to point back to App Runner

4. Delete ECS stack:
   ```bash
   npm run cdk destroy TmeEcsStack --profile your-profile-name
   ```

## Cleanup

### Delete ECS Stack

```bash
npm run cdk destroy TmeEcsStack --profile your-profile-name
```

**Note**: This will delete:
- ECS Cluster and Service
- Application Load Balancer
- VPC (if created by stack)
- CloudWatch Log Groups
- IAM Roles

The ECR repository will NOT be deleted (managed by TmeRepoStack).

## Troubleshooting

### Issue: Synthesis fails with VPC lookup error

**Solution**: Set `useDefaultVpc: false` in `infra/bin/infra.ts` to create a new VPC instead.

### Issue: Tasks keep stopping

**Solution**: Check CloudWatch logs for errors:
```bash
aws logs tail /aws/ecs/tme --follow --profile your-profile-name
```

### Issue: Health checks failing

**Solution**: 
1. Verify container listens on port 3030
2. Check health endpoint returns 200 OK
3. Review security group rules

### Issue: Cannot pull image from ECR

**Solution**: 
1. Verify image exists in ECR
2. Check task execution role has ECR permissions
3. Verify image tag is correct

## Cost Optimization

### Monitor Costs

```bash
# View cost breakdown
aws ce get-cost-and-usage \
  --time-period Start=2024-01-01,End=2024-01-31 \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --group-by Type=SERVICE \
  --profile your-profile-name
```

### Optimization Tips

1. **Use Fargate Spot** (already configured)
   - 70% cost savings vs regular Fargate
   - Stack uses 80% Spot, 20% regular Fargate

2. **Right-size resources**
   - Monitor actual CPU/memory usage
   - Adjust `cpu` and `memoryLimitMiB` accordingly

3. **Optimize auto-scaling**
   - Review scaling metrics after 1-2 weeks
   - Adjust thresholds in `infra/lib/tme-ecs-stack.ts`

4. **Scale down during off-peak**
   - Add scheduled scaling rules
   - Reduce `minCapacity` during low-traffic periods

## Security Best Practices

1. **Use AWS Secrets Manager** (already configured)
   - All secrets stored in `dev/AppRunner/tme`
   - Never commit secrets to code

2. **IAM Roles**
   - Task Execution Role: Minimal permissions for ECS
   - Task Role: Application runtime permissions

3. **Network Security**
   - ALB in public subnets
   - ECS tasks in private subnets (if using new VPC)
   - Security groups restrict access

4. **Enable Container Insights** (already enabled)
   - Monitor for security anomalies
   - Track resource usage patterns

## Support

For issues or questions:
- Check CloudWatch Logs: `/aws/ecs/tme`
- Review ECS service events in AWS Console
- Consult migration documentation in `infra/` directory
- AWS ECS Documentation: https://docs.aws.amazon.com/ecs/

## Next Steps

After successful deployment:

1. **Monitor for 24-48 hours**
   - Check error rates
   - Monitor response times
   - Verify auto-scaling behavior

2. **Update DNS**
   - Point domain to ALB DNS name
   - Use Route 53 for weighted routing (gradual migration)

3. **Optimize**
   - Adjust resources based on actual usage
   - Fine-tune auto-scaling thresholds
   - Review cost metrics

4. **Document**
   - Update runbooks
   - Document any custom configurations
   - Share lessons learned with team