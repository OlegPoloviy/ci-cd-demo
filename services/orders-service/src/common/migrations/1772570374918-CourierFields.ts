import { MigrationInterface, QueryRunner } from "typeorm";

export class CourierFields1772570374918 implements MigrationInterface {
    name = 'CourierFields1772570374918'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "order_tracking" DROP CONSTRAINT "FK_order_tracking_order_id"`);
        await queryRunner.query(`ALTER TABLE "order_tracking" DROP CONSTRAINT "FK_order_tracking_courier_id"`);
        await queryRunner.query(`ALTER TABLE "order" ADD "courier_id" uuid`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "roles" SET DEFAULT ARRAY[]::text[]`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "scopes" SET DEFAULT ARRAY[]::text[]`);
        await queryRunner.query(`ALTER TABLE "order_tracking" ALTER COLUMN "last_updated" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "order" ADD CONSTRAINT "FK_9fc6fc323502e09ad77b45882f2" FOREIGN KEY ("courier_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order_tracking" ADD CONSTRAINT "FK_c1e2051fba9bdbb70641cd90ea4" FOREIGN KEY ("order_id") REFERENCES "order"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order_tracking" ADD CONSTRAINT "FK_d69ae2c1a5e5ad73c2b2c66de30" FOREIGN KEY ("courier_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "order_tracking" DROP CONSTRAINT "FK_d69ae2c1a5e5ad73c2b2c66de30"`);
        await queryRunner.query(`ALTER TABLE "order_tracking" DROP CONSTRAINT "FK_c1e2051fba9bdbb70641cd90ea4"`);
        await queryRunner.query(`ALTER TABLE "order" DROP CONSTRAINT "FK_9fc6fc323502e09ad77b45882f2"`);
        await queryRunner.query(`ALTER TABLE "order_tracking" ALTER COLUMN "last_updated" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "scopes" SET DEFAULT ARRAY[]`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "roles" SET DEFAULT ARRAY[]`);
        await queryRunner.query(`ALTER TABLE "order" DROP COLUMN "courier_id"`);
        await queryRunner.query(`ALTER TABLE "order_tracking" ADD CONSTRAINT "FK_order_tracking_courier_id" FOREIGN KEY ("courier_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order_tracking" ADD CONSTRAINT "FK_order_tracking_order_id" FOREIGN KEY ("order_id") REFERENCES "order"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
