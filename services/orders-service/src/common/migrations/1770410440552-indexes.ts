import { MigrationInterface, QueryRunner } from "typeorm";

export class Indexes1770410440552 implements MigrationInterface {
    name = 'Indexes1770410440552'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE INDEX "IDX_PRODUCT_PRICE_DESC" ON "Products" ("price") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_PRODUCT_PRICE_DESC"`);
    }

}
