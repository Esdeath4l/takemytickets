import request from 'supertest';
import app from '../../src/app';
import { prisma } from '../../src/infra/prisma/client';
import jwt from 'jsonwebtoken';

const tenantId = '00000000-0000-0000-0000-000000000001';
const token = jwt.sign({ tenant_id: tenantId }, 'test-insecure-key');

describe('concurrency', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('concurrent review create by same user on same subject -> only one succeeds', async () => {
    const subject = await prisma.subject.findFirst({ where: { tenant_id: tenantId } });
    const externalUserId = `concurrent-user-${Date.now()}`;

    const payload = { external_user_id: externalUserId, rating: 5 };

    // run two parallel requests creating review for same external_user
    const p1 = request(app).post(`/v1/${subject!.id}/reviews`).set('Authorization', `Bearer ${token}`).send(payload);
    const p2 = request(app).post(`/v1/${subject!.id}/reviews`).set('Authorization', `Bearer ${token}`).send(payload);

    const [r1, r2] = await Promise.all([p1, p2]);
    const statuses = [r1.status, r2.status].sort();
    // expect one 201 and one 409
    expect(statuses).toEqual([201, 409]);
  });
});
