import { Router } from 'express';
import prisma from '../infra/prisma/client';
import { voteSchema } from '../domain/schemas';
import { writeOutboxEvent } from '../infra/outbox';

const router = Router();

router.post('/reviews/:id/votes', async (req, res) => {
  const { id } = req.params;
  const tenantId = (req as any).tenant_id;
  const body = voteSchema.parse(req.body);

  try {
    const v = await prisma.review_vote.create({ data: { tenant_id: tenantId, review_id: id, voter_external_user_id: body.voter_external_user_id, is_helpful: body.is_helpful } });
    await writeOutboxEvent(tenantId, id, 'review.vote', { voteId: v.id });
    res.status(201).json(v);
  } catch (err: any) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: { code: 'CONFLICT', message: 'Duplicate vote', request_id: '' } });
    }
    throw err;
  }
});

export default router;
