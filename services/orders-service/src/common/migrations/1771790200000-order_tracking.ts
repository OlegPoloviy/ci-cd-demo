import { MigrationInterface, QueryRunner } from 'typeorm';

export class OrderTracking1771790200000 implements MigrationInterface {
  name = 'OrderTracking1771790200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "order_tracking" (
        "order_id" uuid NOT NULL,
        "lat" double precision NOT NULL,
        "lng" double precision NOT NULL,
        "last_updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_order_tracking_order_id" PRIMARY KEY ("order_id"),
        CONSTRAINT "FK_order_tracking_order_id" FOREIGN KEY ("order_id") REFERENCES "order"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "order_tracking"`);
  }
}
