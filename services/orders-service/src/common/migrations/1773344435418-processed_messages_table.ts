import { MigrationInterface, QueryRunner } from "typeorm";

export class ProcessedMessagesTable1773344435418 implements MigrationInterface {
    name = 'ProcessedMessagesTable1773344435418'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "processed_messages" ("message_id" uuid NOT NULL, "processed_at" TIMESTAMP WITH TIME ZONE NOT NULL, "order_id" uuid NOT NULL, "handler" character varying(255), CONSTRAINT "PK_e357ddfac536c6c9708130ec3bc" PRIMARY KEY ("message_id"))`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "roles" SET DEFAULT ARRAY[]::text[]`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "scopes" SET DEFAULT ARRAY[]::text[]`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "scopes" SET DEFAULT ARRAY[]`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "roles" SET DEFAULT ARRAY[]`);
        await queryRunner.query(`DROP TABLE "processed_messages"`);
    }

}
