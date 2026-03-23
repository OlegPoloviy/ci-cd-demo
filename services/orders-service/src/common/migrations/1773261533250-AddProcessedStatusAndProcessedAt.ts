import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProcessedStatusAndProcessedAt1773261533250 implements MigrationInterface {
  name = 'AddProcessedStatusAndProcessedAt1773261533250';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."orders_status_enum" ADD VALUE IF NOT EXISTS 'PROCESSED'`,
    );
    await queryRunner.query(
      `ALTER TABLE "order" ADD COLUMN IF NOT EXISTS "processed_at" TIMESTAMP WITH TIME ZONE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "order" DROP COLUMN IF EXISTS "processed_at"`,
    );
    // PostgreSQL does not support removing an enum value; PROCESSED remains in the type.
  }
}
