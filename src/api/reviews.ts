import { Router } from 'express';
import prisma from '../infra/prisma/client';
import { reviewCreateSchema } from '../domain/schemas';
import { writeOutboxEvent } from '../infra/outbox';

const router = Router();

router.post('/:subjectId/reviews', async (req, res) => {
  const tenantId = (req as any).tenant_id;
  const { subjectId } = req.params;
  const body = reviewCreateSchema.parse(req.body);
  // enforce allowed aspect keys for tenant
  const allowed = (await import('../domain/tenantConfig')).getAllowedAspectKeys(tenantId);
  if (body.aspects) {
    for (const a of body.aspects) {
      if (!allowed.includes(a.aspect_key)) {
        return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: `Aspect key not allowed: ${a.aspect_key}`, request_id: '' } });
      }
    }
  }

  // find or create end_user
  const user = await prisma.end_user.upsert({
    where: { tenant_id_external_user_id: { tenant_id: tenantId, external_user_id: body.external_user_id } },
    update: {},
    create: { tenant_id: tenantId, external_user_id: body.external_user_id }
  });

  try {
    const r = await prisma.review.create({
      data: {
        tenant_id: tenantId,
        subject_id: subjectId,
        user_id: user.id,
        rating: body.rating,
        title: body.title,
        body: body.body,
        language: body.language,
        is_verified_purchase: body.is_verified_purchase ?? false,
        aspects: { create: (body.aspects || []).map((a: any) => ({ aspect_key: a.aspect_key, rating: a.rating })) }
      },
      include: { aspects: true }
    });

    // write outbox
    await writeOutboxEvent(tenantId, subjectId, 'review.created', { reviewId: r.id });

    res.status(201).json(r);
  } catch (err: any) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: { code: 'CONFLICT', message: 'Review exists', request_id: '' } });
    }
    throw err;
  }
});

router.get('/reviews/:id', async (req, res) => {
  const id = req.params.id;
  const r = await prisma.review.findUnique({ where: { id }, include: { aspects: true, votes: true, flags: true } });
  if (!r) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Review not found', request_id: '' } });
  res.json(r);
});

router.patch('/reviews/:id', async (req, res) => {
  const id = req.params.id;
  const { title, body: bodyText, rating } = req.body;
  const patched = await prisma.review.update({ where: { id }, data: { title, body: bodyText, rating } });
  await writeOutboxEvent(patched.tenant_id, patched.subject_id, 'review.updated', { reviewId: patched.id });
  res.json(patched);
});

router.delete('/reviews/:id', async (req, res) => {
  const id = req.params.id;
  const r = await prisma.review.update({ where: { id }, data: { status: 'deleted' } });
  await writeOutboxEvent(r.tenant_id, r.subject_id, 'review.deleted', { reviewId: r.id });
  res.status(204).send();
});

export default router;
