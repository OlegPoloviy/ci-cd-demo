import { MigrationInterface, QueryRunner } from 'typeorm';

export class FilesTable1771759923054 implements MigrationInterface {
  name = 'FilesTable1771759923054';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."file_record_status_enum" AS ENUM('pending', 'ready')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."file_record_visibility_enum" AS ENUM('public', 'private')`,
    );
    await queryRunner.query(
      `CREATE TABLE "file_record" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "ownerId" uuid NOT NULL, "entityId" uuid, "key" character varying(255) NOT NULL, "contentType" character varying(255) NOT NULL, "size" integer NOT NULL, "status" "public"."file_record_status_enum" NOT NULL DEFAULT 'pending', "visibility" "public"."file_record_visibility_enum" NOT NULL DEFAULT 'private', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_5e896b85466a93e7265be386b0a" UNIQUE ("key"), CONSTRAINT "PK_16ca009355a1f732909b3ff477b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ALTER COLUMN "roles" SET DEFAULT ARRAY[]::text[]`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ALTER COLUMN "scopes" SET DEFAULT ARRAY[]::text[]`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" ALTER COLUMN "scopes" SET DEFAULT ARRAY[]`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ALTER COLUMN "roles" SET DEFAULT ARRAY[]`,
    );
    await queryRunner.query(`DROP TABLE "file_record"`);
    await queryRunner.query(`DROP TYPE "public"."file_record_visibility_enum"`);
    await queryRunner.query(`DROP TYPE "public"."file_record_status_enum"`);
  }
}
