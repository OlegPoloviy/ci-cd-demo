import { MigrationInterface, QueryRunner } from "typeorm";

export class NewUserColls1771693389844 implements MigrationInterface {
    name = 'NewUserColls1771693389844'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ADD "roles" character varying(255) array NOT NULL DEFAULT ARRAY[]::text[]`);
        await queryRunner.query(`ALTER TABLE "user" ADD "scopes" character varying(255) array NOT NULL DEFAULT ARRAY[]::text[]`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "scopes"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "roles"`);
    }

}
