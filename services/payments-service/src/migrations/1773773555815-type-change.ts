import { MigrationInterface, QueryRunner } from "typeorm";

export class TypeChange1773773555815 implements MigrationInterface {
    name = 'TypeChange1773773555815'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "amount"`);
        await queryRunner.query(`ALTER TABLE "payments" ADD "amount" numeric NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "amount"`);
        await queryRunner.query(`ALTER TABLE "payments" ADD "amount" character varying NOT NULL`);
    }

}
