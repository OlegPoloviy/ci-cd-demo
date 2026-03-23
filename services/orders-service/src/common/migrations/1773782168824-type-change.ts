import { MigrationInterface, QueryRunner } from "typeorm";

export class TypeChange1773782168824 implements MigrationInterface {
    name = 'TypeChange1773782168824'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "order" ADD "payment_id" uuid`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "roles" SET DEFAULT ARRAY[]::text[]`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "scopes" SET DEFAULT ARRAY[]::text[]`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "scopes" SET DEFAULT ARRAY[]`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "roles" SET DEFAULT ARRAY[]`);
        await queryRunner.query(`ALTER TABLE "order" DROP COLUMN "payment_id"`);
    }

}
