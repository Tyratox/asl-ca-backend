import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSession1634755767263 implements MigrationInterface {
  name = 'CreateSession1634755767263';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`sessions\` (\`session_id\` varchar(255) NOT NULL DEFAULT '', \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`userUid\` varchar(64) NULL, PRIMARY KEY (\`session_id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`sessions\` ADD CONSTRAINT \`FK_795891b08b6ff54097eff8a8042\` FOREIGN KEY (\`userUid\`) REFERENCES \`users\`(\`uid\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`sessions\` DROP FOREIGN KEY \`FK_795891b08b6ff54097eff8a8042\``,
    );
    await queryRunner.query(`DROP TABLE \`sessions\``);
  }
}
