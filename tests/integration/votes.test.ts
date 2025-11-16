import request from 'supertest';
import app from '../../src/app';
import { prisma } from '../../src/infra/prisma/client';
import jwt from 'jsonwebtoken';

const tenantId = '00000000-0000-0000-0000-000000000001';
const token = jwt.sign({ tenant_id: tenantId }, 'test-insecure-key');

describe('votes', () => {
  beforeAll(async () => {
    // ensure sample subject and review exist from seed
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('duplicate vote returns 409', async () => {
    // create a review to vote on
    const subject = await prisma.subject.findFirst({ where: { tenant_id: tenantId } });
    const user = await prisma.end_user.create({ data: { tenant_id: tenantId, external_user_id: 'voter-1' } });
    const review = await prisma.review.create({ data: { tenant_id: tenantId, subject_id: subject!.id, user_id: user.id, rating: 4 } });

    const payload = { voter_external_user_id: 'voter-external-1', is_helpful: true };

    const res1 = await request(app).post(`/v1/reviews/${review.id}/votes`).set('Authorization', `Bearer ${token}`).send(payload);
    expect(res1.status).toBe(201);

    const res2 = await request(app).post(`/v1/reviews/${review.id}/votes`).set('Authorization', `Bearer ${token}`).send(payload);
    expect(res2.status).toBe(409);
  });
});
