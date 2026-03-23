import { MigrationInterface, QueryRunner } from 'typeorm';

export class OrderPaymentId1773800000000 implements MigrationInterface {
  name = 'OrderPaymentId1773800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "order" ADD COLUMN IF NOT EXISTS "payment_id" uuid`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "order" DROP COLUMN IF EXISTS "payment_id"`,
    );
  }
}
