import { MigrationInterface, QueryRunner } from "typeorm";

export class IdempotencyKey1770400226399 implements MigrationInterface {
    name = 'IdempotencyKey1770400226399'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "order" ADD "idempotencyKey" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "order" ADD CONSTRAINT "UQ_dcc1766b047d4b14ea3e113e766" UNIQUE ("idempotencyKey")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "order" DROP CONSTRAINT "UQ_dcc1766b047d4b14ea3e113e766"`);
        await queryRunner.query(`ALTER TABLE "order" DROP COLUMN "idempotencyKey"`);
    }

}
