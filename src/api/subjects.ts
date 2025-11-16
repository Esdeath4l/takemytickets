import { Router } from 'express';
import prisma from '../infra/prisma/client';
import { subjectCreateSchema } from '../domain/schemas';
import { writeOutboxEvent } from '../infra/outbox';

const router = Router();

router.post('/', async (req, res) => {
  const body = subjectCreateSchema.parse(req.body);
  const tenantId = (req as any).tenant_id;
  try {
    const s = await prisma.subject.create({ data: { tenant_id: tenantId, ...body } });
    res.status(201).json(s);
  } catch (err: any) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: { code: 'CONFLICT', message: 'Subject exists', request_id: '' } });
    }
    throw err;
  }
});

router.get('/:id', async (req, res) => {
  const id = req.params.id;
  const s = await prisma.subject.findUnique({ where: { id } });
  if (!s) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Subject not found', request_id: '' } });
  res.json(s);
});

router.get('/', async (req, res) => {
  const { subject_type, external_ref } = req.query;
  if (!subject_type || !external_ref) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'subject_type and external_ref required', request_id: '' } });
  const s = await prisma.subject.findUnique({ where: { subject_type_external_ref: { tenant_id: (req as any).tenant_id, subject_type: String(subject_type), external_ref: String(external_ref) } } });
  if (!s) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Subject not found', request_id: '' } });
  res.json(s);
});

router.get('/:id/rating', async (req, res) => {
  const id = req.params.id;
  const agg = await prisma.subject_rating_aggregate.findUnique({ where: { subject_id: id } });
  if (!agg) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'No ratings', request_id: '' } });
  res.set('ETag', `W/"${agg.last_recomputed_at?.getTime() || 0}"`).set('Cache-Control', 'public, max-age=60');
  res.json({ avg_rating: agg.avg_rating, bayesian_avg: agg.bayesian_avg, count_total: agg.count_total, distribution: { 1: agg.dist_1, 2: agg.dist_2, 3: agg.dist_3, 4: agg.dist_4, 5: agg.dist_5 }, aspects: agg.aspects });
});

export default router;
