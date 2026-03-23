import { MigrationInterface, QueryRunner } from 'typeorm';

export class OrderStatusAddPENDING1772650000000 implements MigrationInterface {
  name = 'OrderStatusAddPENDING1772650000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."orders_status_enum" ADD VALUE IF NOT EXISTS 'PENDING'`,
    );
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // PostgreSQL does not support removing an enum value; full revert would require
    // recreating the type and updating the column. No-op for add-value migrations.
  }
}
