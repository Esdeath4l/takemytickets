import { fetchUnprocessed, markProcessed } from '../infra/outbox';
import { computeSubjectAggregates } from '../domain/helpers';
import { prisma } from '../infra/prisma/client';

export async function processOneEvent(event: any) {
  // For simplicity, recompute aggregates for subject
  const subjectId = event.subject_id;
  const tenantId = event.tenant_id;
  const agg = await computeSubjectAggregates(subjectId);

  await prisma.subject_rating_aggregate.upsert({
    where: { subject_id: subjectId },
    update: {
      tenant_id: tenantId,
      count_total: agg.count_total,
      avg_rating: agg.avg_rating,
      bayesian_avg: agg.bayesian_avg,
      dist_1: agg.dist_1,
      dist_2: agg.dist_2,
      dist_3: agg.dist_3,
      dist_4: agg.dist_4,
      dist_5: agg.dist_5,
      aspects: agg.aspects,
      last_recomputed_at: new Date()
    },
    create: {
      subject_id: subjectId,
      tenant_id: tenantId,
      count_total: agg.count_total,
      avg_rating: agg.avg_rating,
      bayesian_avg: agg.bayesian_avg,
      dist_1: agg.dist_1,
      dist_2: agg.dist_2,
      dist_3: agg.dist_3,
      dist_4: agg.dist_4,
      dist_5: agg.dist_5,
      aspects: agg.aspects,
      last_recomputed_at: new Date()
    }
  });

  await markProcessed(event.id);
}

export async function runAggregatorLoop(intervalMs = 2000) {
  // simple poller
  setInterval(async () => {
    try {
      const events = await fetchUnprocessed(20);
      for (const e of events) {
        await processOneEvent(e);
      }
    } catch (err) {
      console.error('Aggregator error', err);
    }
  }, intervalMs);
}
