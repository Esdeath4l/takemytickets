import app from './app';
import { config } from './config';
import { runAggregatorLoop } from './workers/aggregatorWorker';
import { prisma } from './infra/prisma/client';

const port = config.PORT || 3000;

async function main() {
  // ensure prisma can connect
  try {
    await prisma.$connect();
  } catch (err) {
    console.warn('Prisma connection warning:', err);
  }

  app.listen(port, () => {
    console.log(`Server listening on ${port}`);
  });

  // start worker loop
  runAggregatorLoop(3000);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
