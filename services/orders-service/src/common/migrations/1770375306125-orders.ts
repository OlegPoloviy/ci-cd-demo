import { MigrationInterface, QueryRunner } from "typeorm";

export class Orders1770375306125 implements MigrationInterface {
    name = 'Orders1770375306125'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."orders_status_enum" AS ENUM('CREATED', 'PAID', 'CANCELLED')`);
        await queryRunner.query(`CREATE TABLE "order" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "status" "public"."orders_status_enum" NOT NULL DEFAULT 'CREATED', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_1031171c13130102495201e3e20" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "order-item" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "order_id" uuid NOT NULL, "product_id" uuid NOT NULL, "quantity" integer NOT NULL, "price_at_purchase" numeric(12,2) NOT NULL, CONSTRAINT "PK_e06b16183c1f2f8b09f359ed572" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "order-item" ADD CONSTRAINT "FK_ce247ac6959f214f98396bddeed" FOREIGN KEY ("order_id") REFERENCES "order"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order-item" ADD CONSTRAINT "FK_f8c97de6ae254cc8d5052b67d61" FOREIGN KEY ("product_id") REFERENCES "Products"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "order-item" DROP CONSTRAINT "FK_f8c97de6ae254cc8d5052b67d61"`);
        await queryRunner.query(`ALTER TABLE "order-item" DROP CONSTRAINT "FK_ce247ac6959f214f98396bddeed"`);
        await queryRunner.query(`DROP TABLE "order-item"`);
        await queryRunner.query(`DROP TABLE "order"`);
        await queryRunner.query(`DROP TYPE "public"."orders_status_enum"`);
    }

}
