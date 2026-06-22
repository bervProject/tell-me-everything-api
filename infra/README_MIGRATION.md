# AWS App Runner to ECS Express Mode Migration

## 📋 Overview

This directory contains a complete migration plan for transitioning the Tell Me Everything API from AWS App Runner to Amazon ECS Express Mode with Fargate Spot, optimized for cost savings.

## 🎯 Migration Goals

- **Primary**: Reduce infrastructure costs by 40-60%
- **Secondary**: Maintain application reliability and performance
- **Approach**: Fargate Spot for cost optimization with minimal risk

## 📚 Documentation Structure

### 1. [MIGRATION_PLAN.md](./MIGRATION_PLAN.md) - Strategic Overview
**Purpose**: High-level migration strategy and architecture design

**Contents:**
- Current vs target architecture diagrams
- Migration benefits and risk analysis
- Detailed phase-by-phase migration steps
- Success criteria and timeline
- Monitoring and optimization strategies

**When to use**: Start here for understanding the overall strategy and approach.

### 2. [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md) - Technical Implementation
**Purpose**: Complete code implementation and deployment instructions

**Contents:**
- Full TypeScript code for ECS stack
- Step-by-step deployment commands
- Configuration parameters and options
- Testing procedures
- Troubleshooting guide

**When to use**: Reference this when actually implementing the infrastructure code.

### 3. [MIGRATION_CHECKLIST.md](./MIGRATION_CHECKLIST.md) - Execution Checklist
**Purpose**: Week-by-week execution checklist with actionable items

**Contents:**
- Pre-migration preparation tasks
- Deployment verification steps
- Testing checklist
- Post-migration optimization
- Rollback procedures

**When to use**: Use this as your daily/weekly guide during the migration process.

### 4. [COST_ANALYSIS.md](./COST_ANALYSIS.md) - Financial Analysis
**Purpose**: Detailed cost comparison and optimization strategies

**Contents:**
- Current App Runner costs breakdown
- Target ECS costs with Fargate Spot
- Cost comparison across different traffic scenarios
- ROI and break-even analysis
- Optimization recommendations

**When to use**: Reference for budget planning and cost optimization decisions.

## 🚀 Quick Start Guide

### For Decision Makers
1. Read [MIGRATION_PLAN.md](./MIGRATION_PLAN.md) - Executive Summary
2. Review [COST_ANALYSIS.md](./COST_ANALYSIS.md) - Cost Comparison Summary
3. Check timeline and success criteria

### For Engineers
1. Review [MIGRATION_PLAN.md](./MIGRATION_PLAN.md) - Technical sections
2. Follow [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md) - Step by step
3. Use [MIGRATION_CHECKLIST.md](./MIGRATION_CHECKLIST.md) - Track progress

### For Project Managers
1. Use [MIGRATION_CHECKLIST.md](./MIGRATION_CHECKLIST.md) - Track milestones
2. Monitor [COST_ANALYSIS.md](./COST_ANALYSIS.md) - Budget tracking
3. Review success criteria weekly

## 📊 Expected Outcomes

### Cost Savings
| Traffic Level | Current (App Runner) | Target (ECS + Spot) | Monthly Savings | % Reduction |
|---------------|---------------------|---------------------|-----------------|-------------|
| Low | $57 | $30 | $27 | 47% |
| Medium | $85 | $41 | $44 | 52% |
| High | $142 | $56 | $86 | 61% |

### Timeline
- **Week 1**: Preparation and setup
- **Week 2**: Infrastructure deployment
- **Week 3**: Testing and validation
- **Week 4**: Production migration
- **Week 5-6**: Optimization and cleanup

### Key Improvements
- ✅ 40-60% cost reduction
- ✅ Better resource utilization
- ✅ Enhanced monitoring capabilities
- ✅ Improved deployment control
- ✅ Auto-scaling optimization

## 🏗️ Architecture Comparison

### Current: AWS App Runner
```
Users → App Runner Service → [MongoDB, PostgreSQL, LINE API]
         ↓
    ECR Repository
         ↓
    Secrets Manager
```

### Target: ECS Express Mode
```
Users → ALB → ECS Service (Fargate Spot) → [MongoDB, PostgreSQL, LINE API]
              ↓
         ECS Cluster
              ↓
         Task Definition
              ↓
    [ECR Repository, Secrets Manager, IAM Roles]
```

## 🔧 Key Technologies

- **AWS CDK**: Infrastructure as Code
- **Amazon ECS**: Container orchestration
- **AWS Fargate Spot**: Cost-optimized compute
- **Application Load Balancer**: Traffic distribution
- **CloudWatch**: Monitoring and alarms
- **Secrets Manager**: Secure configuration

## 📝 Migration Phases

### Phase 1: Preparation (Week 1)
- [ ] Review current configuration
- [ ] Update CDK dependencies
- [ ] Document baseline metrics
- [ ] Create backup plan

### Phase 2: Infrastructure (Week 2)
- [ ] Create ECS stack
- [ ] Configure IAM roles
- [ ] Set up monitoring
- [ ] Deploy to staging

### Phase 3: Testing (Week 3)
- [ ] Functional testing
- [ ] Performance testing
- [ ] Load testing
- [ ] Security validation

### Phase 4: Migration (Week 4)
- [ ] Deploy to production
- [ ] DNS cutover
- [ ] Monitor closely
- [ ] Validate success

### Phase 5: Optimization (Week 5-6)
- [ ] Analyze metrics
- [ ] Optimize resources
- [ ] Fine-tune auto-scaling
- [ ] Clean up old resources

## ⚠️ Risk Mitigation

### Fargate Spot Interruptions
- **Risk**: Tasks may be interrupted
- **Mitigation**: Keep 1 task on regular Fargate
- **Impact**: <5% interruption rate, automatic replacement

### Performance Impact
- **Risk**: Lower resources may affect performance
- **Mitigation**: Start conservative, monitor, adjust
- **Impact**: Can scale up if needed, still cost-effective

### Migration Downtime
- **Risk**: Service disruption during cutover
- **Mitigation**: Parallel deployment, gradual traffic shift
- **Impact**: Zero-downtime migration possible

## 🎯 Success Criteria

Migration is successful when:
- ✅ Application running on ECS for 7+ days
- ✅ Error rate < 0.1%
- ✅ Response times within 10% of baseline
- ✅ Cost reduction of 40%+ achieved
- ✅ Auto-scaling working correctly
- ✅ All monitoring functional

## 🔄 Rollback Plan

If issues occur:
1. Revert DNS to App Runner
2. Keep App Runner running during migration
3. Investigate and fix issues
4. Retry migration when ready

**Rollback Time**: < 5 minutes

## 📞 Support

### Documentation
- AWS ECS: https://docs.aws.amazon.com/ecs/
- Fargate Spot: https://docs.aws.amazon.com/AmazonECS/latest/developerguide/fargate-capacity-providers.html
- CDK: https://docs.aws.amazon.com/cdk/

### Monitoring
- CloudWatch Dashboard: [To be created]
- ECS Console: https://console.aws.amazon.com/ecs/
- Cost Explorer: https://console.aws.amazon.com/cost-management/

## 📈 Next Steps

1. **Review all documentation** in this directory
2. **Get stakeholder approval** on migration plan
3. **Schedule migration window** (recommend low-traffic period)
4. **Begin Phase 1** following the checklist
5. **Track progress** using the migration checklist

## 🤝 Contributing

When updating this migration plan:
1. Update the relevant document (MIGRATION_PLAN, IMPLEMENTATION_GUIDE, etc.)
2. Update this README if structure changes
3. Keep the MIGRATION_CHECKLIST in sync
4. Document lessons learned

## 📅 Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-06-22 | Initial migration plan created | Planning Mode |

## 📄 License

This migration plan is part of the Tell Me Everything API project.
See [LICENSE](../LICENSE) for details.

---

## Quick Reference Commands

### Deploy ECS Stack
```bash
cd infra
npm install
npm run cdk deploy TmeEcsStack --parameters imageTag=latest
```

### Check Service Status
```bash
aws ecs describe-services --cluster tme-cluster --services tme-service
```

### View Logs
```bash
aws logs tail /aws/ecs/tme --follow
```

### Get ALB URL
```bash
aws cloudformation describe-stacks --stack-name TmeEcsStack \
  --query 'Stacks[0].Outputs[?OutputKey==`LoadBalancerDNS`].OutputValue' \
  --output text
```

---

**Ready to begin?** Start with [MIGRATION_PLAN.md](./MIGRATION_PLAN.md) for the complete strategy! 🚀