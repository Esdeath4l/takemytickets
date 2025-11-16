import request from 'supertest';
import app from '../../src/app';
import { prisma } from '../../src/infra/prisma/client';
import jwt from 'jsonwebtoken';

const TEST_TENANT_ID = '00000000-0000-0000-0000-000000000001';

function makeToken() {
  // for tests we sign with a dummy symmetric key; configure JWT_PUBLIC_KEY accordingly when running
  return jwt.sign({ tenant_id: TEST_TENANT_ID }, 'test-insecure-key');
}

describe('reviews integration', () => {
  beforeAll(async () => {
    // ensure tenant and subject exist if seed not run
    await prisma.tenant.upsert({ where: { id: TEST_TENANT_ID }, update: {}, create: { id: TEST_TENANT_ID, name: 'Tenant' } });
    const subject = await prisma.subject.findFirst({ where: { tenant_id: TEST_TENANT_ID } });
    if (!subject) {
      await prisma.subject.create({ data: { tenant_id: TEST_TENANT_ID, subject_type: 'product', external_ref: 'int-subj', title: 'int' } });
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('create review and see 201', async () => {
    const token = makeToken();
    const subj = await prisma.subject.findFirst({ where: { tenant_id: TEST_TENANT_ID } });
    const res = await request(app).post(`/v1/${subj!.id}/reviews`).set('Authorization', `Bearer ${token}`).send({ external_user_id: 'int-user', rating: 4 });
    expect([201, 409]).toContain(res.status);
  });
});
