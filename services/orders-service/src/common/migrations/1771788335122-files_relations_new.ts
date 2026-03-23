import { MigrationInterface, QueryRunner } from "typeorm";

export class FilesRelationsNew1771788335122 implements MigrationInterface {
    name = 'FilesRelationsNew1771788335122'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "roles" SET DEFAULT ARRAY[]::text[]`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "scopes" SET DEFAULT ARRAY[]::text[]`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "scopes" SET DEFAULT ARRAY[]`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "roles" SET DEFAULT ARRAY[]`);
    }

}
