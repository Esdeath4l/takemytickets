import { Router } from 'express';
import prisma from '../infra/prisma/client';
import { flagSchema } from '../domain/schemas';
import { writeOutboxEvent } from '../infra/outbox';

const router = Router();

router.post('/reviews/:id/flags', async (req, res) => {
  const { id } = req.params;
  const tenantId = (req as any).tenant_id;
  const body = flagSchema.parse(req.body);

  const f = await prisma.review_flag.create({ data: { tenant_id: tenantId, review_id: id, flag_type: body.flag_type, notes: body.notes, created_by_external_user_id: body.created_by_external_user_id } });
  await writeOutboxEvent(tenantId, id, 'review.flag', { flagId: f.id });
  res.status(201).json(f);
});

export default router;
