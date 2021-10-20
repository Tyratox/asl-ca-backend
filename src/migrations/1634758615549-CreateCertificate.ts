import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCertificate1634758615549 implements MigrationInterface {
  name = 'CreateCertificate1634758615549';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`certificates\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, \`is_revoked\` tinyint NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`userUid\` varchar(64) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`certificates\` ADD CONSTRAINT \`FK_238baa99046ccfeaa8bb79ac1fc\` FOREIGN KEY (\`userUid\`) REFERENCES \`users\`(\`uid\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`certificates\` DROP FOREIGN KEY \`FK_238baa99046ccfeaa8bb79ac1fc\``,
    );
    await queryRunner.query(`DROP TABLE \`certificates\``);
  }
}
