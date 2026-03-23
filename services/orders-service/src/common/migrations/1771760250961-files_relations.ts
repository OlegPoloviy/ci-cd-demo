import { MigrationInterface, QueryRunner } from 'typeorm';

export class FilesRelations1771760250961 implements MigrationInterface {
  name = 'FilesRelations1771760250961';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "file_record" DROP COLUMN "ownerId"`);
    await queryRunner.query(`ALTER TABLE "file_record" DROP COLUMN "entityId"`);
    await queryRunner.query(
      `ALTER TABLE "file_record" ADD "owner_id" uuid NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "file_record" ADD "product_id" uuid`);
    await queryRunner.query(
      `ALTER TABLE "user" ALTER COLUMN "roles" SET DEFAULT ARRAY[]::text[]`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ALTER COLUMN "scopes" SET DEFAULT ARRAY[]::text[]`,
    );
    await queryRunner.query(
      `ALTER TABLE "file_record" ALTER COLUMN "visibility" SET DEFAULT 'public'`,
    );
    await queryRunner.query(
      `ALTER TABLE "file_record" ADD CONSTRAINT "FK_3e882dd38c81b3e466673045325" FOREIGN KEY ("owner_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "file_record" ADD CONSTRAINT "FK_b878df37c869fe8aac3ff86e7de" FOREIGN KEY ("product_id") REFERENCES "Products"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "file_record" DROP CONSTRAINT "FK_b878df37c869fe8aac3ff86e7de"`,
    );
    await queryRunner.query(
      `ALTER TABLE "file_record" DROP CONSTRAINT "FK_3e882dd38c81b3e466673045325"`,
    );
    await queryRunner.query(
      `ALTER TABLE "file_record" ALTER COLUMN "visibility" SET DEFAULT 'private'`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ALTER COLUMN "scopes" SET DEFAULT ARRAY[]`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ALTER COLUMN "roles" SET DEFAULT ARRAY[]`,
    );
    await queryRunner.query(
      `ALTER TABLE "file_record" DROP COLUMN "product_id"`,
    );
    await queryRunner.query(`ALTER TABLE "file_record" DROP COLUMN "owner_id"`);
    await queryRunner.query(`ALTER TABLE "file_record" ADD "entityId" uuid`);
    await queryRunner.query(
      `ALTER TABLE "file_record" ADD "ownerId" uuid NOT NULL`,
    );
  }
}
