import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding...');

  // create or get tenant
  let tenant = await prisma.tenant.findUnique({ where: { id: '00000000-0000-0000-0000-000000000001' } });
  if (!tenant) {
    tenant = await prisma.tenant.create({ data: { id: '00000000-0000-0000-0000-000000000001', name: 'Demo Tenant' } });
  }

  // create or get subjects
  let subject1 = await prisma.subject.findFirst({ where: { tenant_id: tenant.id, subject_type: 'product', external_ref: 'prod-1' } });
  if (!subject1) {
    subject1 = await prisma.subject.create({ data: { tenant_id: tenant.id, subject_type: 'product', external_ref: 'prod-1', title: 'Product One', metadata: { category: 'electronics' } } });
  }

  let subject2 = await prisma.subject.findFirst({ where: { tenant_id: tenant.id, subject_type: 'product', external_ref: 'prod-2' } });
  if (!subject2) {
    subject2 = await prisma.subject.create({ data: { tenant_id: tenant.id, subject_type: 'product', external_ref: 'prod-2', title: 'Product Two' } });
  }

  // create or get user
  let user = await prisma.end_user.findFirst({ where: { tenant_id: tenant.id, external_user_id: 'user-1' } });
  if (!user) {
    user = await prisma.end_user.create({ data: { tenant_id: tenant.id, external_user_id: 'user-1', display_name: 'Alice' } });
  }

  // create review if not exists
  const existingReview = await prisma.review.findFirst({ where: { tenant_id: tenant.id, subject_id: subject1.id, user_id: user.id } });
  if (!existingReview) {
    await prisma.review.create({
      data: {
        tenant_id: tenant.id,
        subject_id: subject1.id,
        user_id: user.id,
        rating: 5,
        title: 'Great product',
        body: 'I liked it a lot',
        language: 'en',
        status: 'published'
      }
    });
  }

  console.log('Seeding done');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
