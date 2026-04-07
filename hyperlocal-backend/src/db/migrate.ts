import { ensureDbInitialized, AppDataSource } from './dataSource';

async function main() {
  await ensureDbInitialized();
  await AppDataSource.runMigrations({ transaction: 'all' });
  await AppDataSource.destroy();
  console.log('Migrations complete.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

