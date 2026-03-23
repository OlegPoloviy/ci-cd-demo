import { MigrationInterface, QueryRunner } from 'typeorm';

export class OrderTrackingCourierId1771790300000 implements MigrationInterface {
  name = 'OrderTrackingCourierId1771790300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "order_tracking"
      ADD COLUMN "courier_id" uuid NULL,
      ADD CONSTRAINT "FK_order_tracking_courier_id" FOREIGN KEY ("courier_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "order_tracking"
      DROP CONSTRAINT "FK_order_tracking_courier_id",
      DROP COLUMN "courier_id"
    `);
  }
}
