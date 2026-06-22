# ECS Express Mode Migration Checklist

Quick reference checklist for executing the migration from AWS App Runner to Amazon ECS Express Mode.

## Pre-Migration Checklist

### Week 1: Preparation
- [ ] **Backup current configuration**
  - [ ] Export App Runner service configuration
  - [ ] Document current DNS settings
  - [ ] Save current environment variables list
  - [ ] Note current resource allocation (CPU/Memory)

- [ ] **Gather baseline metrics** (from CloudWatch)
  - [ ] Average CPU utilization: ____%
  - [ ] Average memory utilization: ____%
  - [ ] Peak request count: _____
  - [ ] Average response time: _____ms
  - [ ] Current monthly cost: $_____

- [ ] **Review application requirements**
  - [ ] Database connectivity requirements documented
  - [ ] External API dependencies listed
  - [ ] Required IAM permissions identified
  - [ ] Health check endpoint verified: `/`

### Week 2: Infrastructure Setup

- [ ] **Update CDK dependencies**
  ```bash
  cd infra
  # Remove App Runner alpha dependency from package.json
  npm install
  ```

- [ ] **Create new ECS stack file**
  - [ ] Copy code from `IMPLEMENTATION_GUIDE.md` to `lib/tme-ecs-stack.ts`
  - [ ] Review and adjust configuration parameters
  - [ ] Verify all 23 secrets are mapped correctly

- [ ] **Update bin/infra.ts**
  - [ ] Import `TmeEcsStack`
  - [ ] Add ECS stack instantiation
  - [ ] Keep App Runner stack commented (for rollback)

- [ ] **Synthesize and review**
  ```bash
  npm run cdk synth TmeEcsStack
  # Review the generated CloudFormation template
  ```

### Week 3: Deployment and Testing

- [ ] **Deploy ECS stack to staging/test**
  ```bash
  npm run cdk deploy TmeEcsStack --parameters imageTag=latest
  ```

- [ ] **Verify deployment**
  - [ ] ECS cluster created: `tme-cluster`
  - [ ] Service running: `tme-service`
  - [ ] Tasks running: _____ / _____ (running/desired)
  - [ ] ALB created and healthy
  - [ ] Target group health checks passing

- [ ] **Test application functionality**
  - [ ] Get ALB DNS name from CloudFormation outputs
  - [ ] Test health endpoint: `curl http://[ALB-DNS]/`
  - [ ] Test LINE bot webhook
  - [ ] Test authentication endpoints
  - [ ] Test database connectivity (MongoDB & PostgreSQL)
  - [ ] Test email functionality (SES)
  - [ ] Verify all API endpoints work correctly

- [ ] **Monitor initial metrics** (24-48 hours)
  - [ ] CPU utilization: ____%
  - [ ] Memory utilization: ____%
  - [ ] Task count variations: _____
  - [ ] Fargate Spot interruptions: _____
  - [ ] Response times: _____ms
  - [ ] Error rate: ____%

### Week 4: Migration Execution

- [ ] **Pre-migration verification**
  - [ ] All tests passing on ECS
  - [ ] Monitoring dashboards configured
  - [ ] Rollback plan documented
  - [ ] Team notified of migration window
  - [ ] Backup of current App Runner config saved

- [ ] **Execute migration**
  - [ ] **Option A: DNS Cutover** (Immediate)
    - [ ] Update DNS to point to ALB DNS name
    - [ ] Monitor for 15 minutes
    - [ ] Verify traffic flowing to ECS
    
  - [ ] **Option B: Weighted Routing** (Gradual)
    - [ ] Configure Route 53 weighted routing
    - [ ] Set 10% traffic to ECS, 90% to App Runner
    - [ ] Monitor for 2 hours
    - [ ] Increase to 50/50 split
    - [ ] Monitor for 4 hours
    - [ ] Increase to 100% ECS
    - [ ] Monitor for 24 hours

- [ ] **Post-migration monitoring** (48 hours)
  - [ ] Error rate within acceptable range: ____%
  - [ ] Response times acceptable: _____ms
  - [ ] No database connection issues
  - [ ] Auto-scaling working correctly
  - [ ] Fargate Spot interruptions handled gracefully
  - [ ] All alarms configured and working

### Week 5-6: Optimization and Cleanup

- [ ] **Analyze performance data**
  - [ ] Review 2 weeks of metrics
  - [ ] Identify optimization opportunities
  - [ ] Document actual vs expected costs

- [ ] **Optimize resources**
  - [ ] Adjust CPU/memory if needed
    - Current: 256 CPU / 512 MB
    - Optimized: _____ CPU / _____ MB
  - [ ] Fine-tune auto-scaling thresholds
  - [ ] Adjust Fargate Spot ratio if needed
  - [ ] Optimize log retention settings

- [ ] **Cost comparison**
  - [ ] App Runner monthly cost: $_____
  - [ ] ECS monthly cost: $_____
  - [ ] Savings achieved: $_____  (____%)
  - [ ] Cost optimization target met: [ ] Yes [ ] No

- [ ] **Cleanup old resources**
  - [ ] Delete App Runner service
  - [ ] Remove old CloudWatch log groups
  - [ ] Delete unused IAM roles
  - [ ] Archive old configurations

- [ ] **Documentation updates**
  - [ ] Update deployment runbook
  - [ ] Document new monitoring procedures
  - [ ] Update disaster recovery plan
  - [ ] Share lessons learned with team

## Rollback Checklist

If issues occur during migration:

- [ ] **Immediate actions**
  - [ ] Revert DNS to App Runner endpoint
  - [ ] Verify App Runner still running
  - [ ] Confirm traffic flowing to App Runner
  - [ ] Document issues encountered

- [ ] **Investigation**
  - [ ] Review CloudWatch logs
  - [ ] Check ECS service events
  - [ ] Analyze error patterns
  - [ ] Identify root cause

- [ ] **Resolution**
  - [ ] Fix identified issues
  - [ ] Test fixes in staging
  - [ ] Plan retry of migration
  - [ ] Update migration plan based on learnings

## Key Commands Reference

### Deployment
```bash
# Synthesize
npm run cdk synth TmeEcsStack

# Deploy
npm run cdk deploy TmeEcsStack --parameters imageTag=latest

# Check diff
npm run cdk diff TmeEcsStack
```

### Monitoring
```bash
# Service status
aws ecs describe-services --cluster tme-cluster --services tme-service

# View logs
aws logs tail /aws/ecs/tme --follow

# List tasks
aws ecs list-tasks --cluster tme-cluster --service-name tme-service

# Task details
aws ecs describe-tasks --cluster tme-cluster --tasks [TASK-ARN]
```

### Troubleshooting
```bash
# Check task failures
aws ecs describe-tasks --cluster tme-cluster --tasks [TASK-ARN] \
  --query 'tasks[0].containers[0].reason'

# View service events
aws ecs describe-services --cluster tme-cluster --services tme-service \
  --query 'services[0].events[0:10]'

# Check ALB target health
aws elbv2 describe-target-health --target-group-arn [TG-ARN]
```

## Success Criteria

Migration is considered successful when:

- [ ] Application running on ECS for 7+ days without issues
- [ ] Error rate < 0.1%
- [ ] Response times within 10% of App Runner baseline
- [ ] Auto-scaling working as expected
- [ ] Cost reduction of 40%+ achieved
- [ ] No database connectivity issues
- [ ] All monitoring and alarms functional
- [ ] Team comfortable with new deployment process

## Emergency Contacts

- **AWS Support**: [Your support plan details]
- **On-call Engineer**: [Contact info]
- **Database Admin**: [Contact info]
- **DevOps Lead**: [Contact info]

## Notes and Observations

### Migration Date: ___________

**Issues Encountered:**
- 
- 
- 

**Resolutions:**
- 
- 
- 

**Lessons Learned:**
- 
- 
- 

**Recommendations for Future:**
- 
- 
- 

---

## Quick Status Check

Current Status: [ ] Planning [ ] In Progress [ ] Testing [ ] Migrated [ ] Optimized

Last Updated: ___________
Updated By: ___________