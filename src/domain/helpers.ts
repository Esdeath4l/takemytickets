import { prisma } from '../infra/prisma/client';

export function bayesianAverage(C: number, m: number, n: number, avg: number): number {
  if (n <= 0) return 0;
  return (C * m + n * avg) / (C + n);
}

export async function computeSubjectAggregates(subjectId: string) {
  // fetch published reviews for subject
  const reviews = await prisma.review.findMany({
    where: { subject_id: subjectId, status: 'published' },
    include: { aspects: true }
  });

  const n = reviews.length;
  const dist = [0, 0, 0, 0, 0, 0];
  let sum = 0;
  const aspectsAgg: Record<string, { sum: number; count: number }> = {};

  for (const r of reviews) {
    const rating = r.rating;
    if (rating >= 1 && rating <= 5) dist[rating]++;
    sum += rating;
    for (const a of r.aspects) {
      if (!aspectsAgg[a.aspect_key]) aspectsAgg[a.aspect_key] = { sum: 0, count: 0 };
      aspectsAgg[a.aspect_key].sum += a.rating;
      aspectsAgg[a.aspect_key].count += 1;
    }
  }

  const avg = n > 0 ? sum / n : 0;

  // tenant mean: for simplicity compute global mean across reviews for the subject's tenant
  const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
  const tenantId = subject?.tenant_id;
  const global = await prisma.review.aggregate({
    _avg: { rating: true },
    where: { tenant_id: tenantId, status: 'published' }
  });

  const m = global._avg.rating ?? 3.5;
  const bayes = bayesianAverage(10, m, n, avg);

  const aspects: Record<string, number> = {};
  for (const key of Object.keys(aspectsAgg)) {
    const v = aspectsAgg[key];
    aspects[key] = v.count > 0 ? v.sum / v.count : 0;
  }

  return {
    count_total: n,
    avg_rating: Number(avg.toFixed(2)),
    bayesian_avg: Number(bayes.toFixed(2)),
    dist_1: dist[1],
    dist_2: dist[2],
    dist_3: dist[3],
    dist_4: dist[4],
    dist_5: dist[5],
    aspects
  };
}
