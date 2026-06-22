# Cost Analysis: AWS App Runner vs ECS Express Mode with Fargate Spot

## Executive Summary

This document provides a detailed cost comparison between AWS App Runner and Amazon ECS Express Mode with Fargate Spot for the Tell Me Everything API application.

**Expected Savings: 40-60% reduction in compute costs**

## Current Architecture: AWS App Runner

### Pricing Model
AWS App Runner charges based on:
1. **Compute**: Per vCPU-hour and GB-hour
2. **Memory**: Per GB-hour
3. **Requests**: Per million requests (included in compute)
4. **Build**: Per build minute (if using source code deployment)

### Estimated Current Costs

#### Scenario 1: Low Traffic (Baseline)
```
Configuration:
- 1 vCPU, 2 GB RAM
- Running 24/7
- Average utilization: 30%

Monthly Cost Breakdown:
- Compute (vCPU): 730 hours × $0.064/vCPU-hour = $46.72
- Memory: 730 hours × 2 GB × $0.007/GB-hour = $10.22
- Total: ~$57/month
```

#### Scenario 2: Medium Traffic
```
Configuration:
- 1 vCPU, 2 GB RAM
- Auto-scaling to 3 instances during peak
- Average: 1.5 instances running

Monthly Cost Breakdown:
- Compute: 1.5 × 730 × $0.064 = $70.08
- Memory: 1.5 × 730 × 2 × $0.007 = $15.33
- Total: ~$85/month
```

#### Scenario 3: High Traffic
```
Configuration:
- 1 vCPU, 2 GB RAM
- Auto-scaling to 5 instances during peak
- Average: 2.5 instances running

Monthly Cost Breakdown:
- Compute: 2.5 × 730 × $0.064 = $116.80
- Memory: 2.5 × 730 × 2 × $0.007 = $25.55
- Total: ~$142/month
```

## Target Architecture: ECS Express Mode with Fargate Spot

### Pricing Model
Amazon ECS with Fargate Spot charges:
1. **Fargate Spot**: Up to 70% discount on compute
2. **Fargate On-Demand**: Regular pricing for baseline capacity
3. **Application Load Balancer**: Fixed + data processing costs
4. **Data Transfer**: Standard AWS rates

### Fargate Pricing (US East 1)
- **On-Demand**: $0.04048/vCPU-hour, $0.004445/GB-hour
- **Spot**: ~$0.012144/vCPU-hour, ~$0.001334/GB-hour (70% discount)

### Estimated Target Costs

#### Configuration: Cost-Optimized
```
Task Definition:
- 0.25 vCPU (256 CPU units)
- 0.5 GB RAM (512 MB)

Capacity Strategy:
- 1 task on Fargate On-Demand (base)
- Additional tasks on Fargate Spot (80% of capacity)
```

#### Scenario 1: Low Traffic (Baseline)
```
Running Tasks:
- 1 task on Fargate On-Demand (24/7)
- 0 tasks on Fargate Spot

Monthly Cost Breakdown:
Compute:
- On-Demand: 730 × 0.25 × $0.04048 = $7.39
- Memory: 730 × 0.5 × $0.004445 = $1.62
- Subtotal: $9.01

Load Balancer:
- ALB Fixed: $16.20
- LCU (minimal): ~$5.00
- Subtotal: $21.20

Total: ~$30/month
Savings vs App Runner: $57 - $30 = $27 (47% reduction)
```

#### Scenario 2: Medium Traffic
```
Running Tasks:
- 1 task on Fargate On-Demand (24/7)
- 2 tasks on Fargate Spot (average)

Monthly Cost Breakdown:
Compute:
- On-Demand: 730 × 0.25 × $0.04048 = $7.39
- On-Demand Memory: 730 × 0.5 × $0.004445 = $1.62
- Spot: 2 × 730 × 0.25 × $0.012144 = $4.43
- Spot Memory: 2 × 730 × 0.5 × $0.001334 = $0.97
- Subtotal: $14.41

Load Balancer:
- ALB Fixed: $16.20
- LCU (medium): ~$10.00
- Subtotal: $26.20

Total: ~$41/month
Savings vs App Runner: $85 - $41 = $44 (52% reduction)
```

#### Scenario 3: High Traffic
```
Running Tasks:
- 1 task on Fargate On-Demand (24/7)
- 4 tasks on Fargate Spot (average)

Monthly Cost Breakdown:
Compute:
- On-Demand: 730 × 0.25 × $0.04048 = $7.39
- On-Demand Memory: 730 × 0.5 × $0.004445 = $1.62
- Spot: 4 × 730 × 0.25 × $0.012144 = $8.87
- Spot Memory: 4 × 730 × 0.5 × $0.001334 = $1.95
- Subtotal: $19.83

Load Balancer:
- ALB Fixed: $16.20
- LCU (high): ~$20.00
- Subtotal: $36.20

Total: ~$56/month
Savings vs App Runner: $142 - $56 = $86 (61% reduction)
```

## Cost Comparison Summary

| Scenario | App Runner | ECS + Fargate Spot | Savings | % Reduction |
|----------|------------|-------------------|---------|-------------|
| Low Traffic | $57/month | $30/month | $27/month | 47% |
| Medium Traffic | $85/month | $41/month | $44/month | 52% |
| High Traffic | $142/month | $56/month | $86/month | 61% |

## Cost Optimization Strategies

### 1. Right-Sizing Resources

**Current Analysis:**
- App Runner: 1 vCPU, 2 GB RAM (fixed)
- Actual usage: ~30% CPU, ~40% memory (estimated)

**Optimization:**
- ECS: 0.25 vCPU, 0.5 GB RAM (right-sized)
- Can scale up if needed
- **Savings: 75% on compute resources**

### 2. Fargate Spot Utilization

**Strategy:**
```
Capacity Provider Strategy:
- Base: 1 task on Fargate On-Demand (always available)
- Scale: 80% on Fargate Spot, 20% on On-Demand
```

**Benefits:**
- 70% discount on majority of tasks
- Minimal interruption risk (2-minute notice)
- Automatic replacement of interrupted tasks

**Expected Spot Interruption Rate:**
- Historical: <5% of tasks per month
- Impact: Minimal due to auto-replacement

### 3. Auto-Scaling Optimization

**Scheduled Scaling:**
```
Off-Peak Hours (10 PM - 6 AM):
- Min: 1 task
- Max: 2 tasks
- Expected savings: ~30% during 8 hours/day

Peak Hours (6 AM - 10 PM):
- Min: 2 tasks
- Max: 10 tasks
- Scale based on demand
```

**Estimated Monthly Savings:**
- Off-peak reduction: 8 hours × 30 days × 1 task × $0.015 = $3.60/month
- Annual: ~$43/year

### 4. Load Balancer Optimization

**ALB Cost Breakdown:**
- Fixed: $0.0225/hour = $16.20/month
- LCU: $0.008/LCU-hour

**Optimization Tips:**
- Use connection reuse
- Enable HTTP/2
- Optimize request routing
- Consider CloudFront for static content

### 5. Data Transfer Optimization

**Current:**
- App Runner: Included in compute costs

**ECS:**
- First 100 GB/month: Free
- Next 10 TB: $0.09/GB
- Optimization: Use CloudFront, enable compression

## Additional Cost Considerations

### CloudWatch Logs
```
App Runner:
- Included in service cost

ECS:
- Ingestion: $0.50/GB
- Storage: $0.03/GB/month
- Estimated: $5-10/month (with 7-day retention)
```

### Container Insights
```
Optional (recommended for initial monitoring):
- Custom metrics: $0.30/metric/month
- Estimated: $10-15/month
- Can disable after optimization phase
```

### Secrets Manager
```
Both architectures:
- $0.40/secret/month
- 23 secrets × $0.40 = $9.20/month
- API calls: $0.05/10,000 calls
```

## Total Cost of Ownership (TCO)

### Year 1 Comparison (Medium Traffic Scenario)

**App Runner:**
```
Monthly: $85
Annual: $1,020
Setup: $0 (managed service)
Maintenance: Minimal
Total Year 1: ~$1,020
```

**ECS Express Mode:**
```
Monthly: $41
Annual: $492
Setup: ~$100 (engineering time)
Maintenance: ~$50/year (monitoring, optimization)
Total Year 1: ~$642

Net Savings Year 1: $378 (37%)
```

### 3-Year TCO

**App Runner:**
```
Year 1-3: $1,020 × 3 = $3,060
```

**ECS Express Mode:**
```
Year 1: $642
Year 2-3: $492 × 2 = $984
Total: $1,626

Net Savings 3 Years: $1,434 (47%)
```

## Break-Even Analysis

**Initial Investment:**
- Engineering time: ~8-16 hours
- Cost: ~$100-200 (at $25/hour)

**Monthly Savings:**
- Medium traffic: $44/month

**Break-Even:**
- Time: 2.3-4.5 months
- After break-even: Pure savings

## Risk Assessment

### Fargate Spot Interruptions

**Risk Level:** Low
- Historical interruption rate: <5%
- 2-minute warning before interruption
- Automatic task replacement

**Mitigation:**
- Keep 1 task on On-Demand (base capacity)
- Enable circuit breaker for rollback
- Monitor interruption metrics

**Cost Impact:**
- Worst case: 5% of Spot tasks interrupted
- Additional cost: <$2/month
- Still 50%+ savings vs App Runner

### Performance Considerations

**Potential Issues:**
- Lower resources (0.25 vCPU vs 1 vCPU)
- Cold start times (minimal with ECS)

**Mitigation:**
- Monitor performance metrics
- Scale up resources if needed
- Use auto-scaling for burst capacity

**Cost Impact:**
- If need to double resources: Still 30-40% savings

## Recommendations

### Phase 1: Initial Deployment (Month 1)
1. Start with conservative resources (0.25 vCPU, 0.5 GB)
2. Use 80% Fargate Spot, 20% On-Demand
3. Enable Container Insights for detailed monitoring
4. Set aggressive auto-scaling thresholds

**Expected Cost:** $35-45/month

### Phase 2: Optimization (Month 2-3)
1. Analyze actual resource usage
2. Adjust CPU/memory allocation
3. Fine-tune auto-scaling policies
4. Optimize Fargate Spot ratio
5. Disable Container Insights if not needed

**Expected Cost:** $30-40/month

### Phase 3: Steady State (Month 4+)
1. Maintain optimized configuration
2. Review costs monthly
3. Adjust for traffic patterns
4. Consider reserved capacity for predictable workloads

**Expected Cost:** $25-35/month

## Monitoring and Reporting

### Key Metrics to Track

1. **Cost Metrics**
   - Daily spend by service
   - Fargate Spot vs On-Demand ratio
   - ALB LCU usage
   - Data transfer costs

2. **Performance Metrics**
   - Task CPU/memory utilization
   - Response times
   - Error rates
   - Fargate Spot interruption rate

3. **Efficiency Metrics**
   - Cost per request
   - Cost per user
   - Resource utilization percentage

### Monthly Cost Review Template

```markdown
## Month: _______

### Actual Costs
- ECS Tasks: $_____
- Load Balancer: $_____
- Data Transfer: $_____
- CloudWatch: $_____
- Total: $_____

### Comparison
- Projected: $_____
- Actual: $_____
- Variance: $_____

### Optimization Actions
- [ ] Action 1
- [ ] Action 2
- [ ] Action 3

### Next Month Target: $_____
```

## Conclusion

Migrating from AWS App Runner to Amazon ECS Express Mode with Fargate Spot offers significant cost savings (40-60%) while maintaining or improving application performance and reliability.

**Key Benefits:**
- **Cost Reduction:** $27-86/month depending on traffic
- **Better Control:** Fine-grained resource allocation
- **Flexibility:** Advanced deployment strategies
- **Scalability:** More efficient auto-scaling

**Investment Required:**
- **Time:** 8-16 hours of engineering effort
- **Cost:** ~$100-200 initial setup
- **Break-Even:** 2-4 months

**Recommendation:** Proceed with migration, starting with conservative resource allocation and optimizing based on actual usage data.