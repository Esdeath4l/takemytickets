import { prisma } from './prisma/client';

export async function writeOutboxEvent(tenantId: string, subjectId: string, eventType: string, payload?: any) {
  return prisma.outbox_event.create({ data: { tenant_id: tenantId, subject_id: subjectId, event_type: eventType, payload } });
}

export async function fetchUnprocessed(limit = 50) {
  return prisma.outbox_event.findMany({ where: { processed: false }, take: limit, orderBy: { created_at: 'asc' } });
}

export async function markProcessed(id: string) {
  return prisma.outbox_event.update({ where: { id }, data: { processed: true } });
}
