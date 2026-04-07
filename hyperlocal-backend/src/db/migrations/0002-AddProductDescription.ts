import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductDescription16000000000001 implements MigrationInterface {
  name = 'AddProductDescription16000000000001';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "description" text NULL`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "description"`);
  }
}

