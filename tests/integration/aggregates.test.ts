import { computeSubjectAggregates } from '../../src/domain/helpers';
import { prisma } from '../../src/infra/prisma/client';

describe('aggregates', () => {
  test('computeSubjectAggregates returns correct shape', async () => {
    const subject = await prisma.subject.findFirst();
    const res = await computeSubjectAggregates(subject!.id);
    expect(res).toHaveProperty('count_total');
    expect(res).toHaveProperty('avg_rating');
    expect(res).toHaveProperty('bayesian_avg');
  });
});
