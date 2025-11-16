import { Router } from 'express';
import prisma from '../infra/prisma/client';
import { writeOutboxEvent } from '../infra/outbox';

const router = Router();

router.post('/reviews/:id/approve', async (req, res) => {
  const { id } = req.params as { id: string };
  const r = await prisma.review.update({ where: { id }, data: { status: 'published' } });
  await writeOutboxEvent(r.tenant_id, r.subject_id, 'review.approved', { reviewId: r.id });
  res.json(r);
});

router.post('/reviews/:id/reject', async (req, res) => {
  const { id } = req.params as { id: string };
  const reason = req.body.reason;
  const r = await prisma.review.update({ where: { id }, data: { status: 'rejected' } });
  await writeOutboxEvent(r.tenant_id, r.subject_id, 'review.rejected', { reviewId: r.id, reason });
  res.json(r);
});

export default router;
