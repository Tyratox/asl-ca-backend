import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateLegacyUserTable1634658508823 implements MigrationInterface {
  name = 'CreateLegacyUserTable1634658508823';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`users\` (\`uid\` varchar(64) NOT NULL DEFAULT '', \`lastname\` varchar(64) NOT NULL DEFAULT '', \`firstname\` varchar(64) NOT NULL DEFAULT '', \`email\` varchar(64) NOT NULL DEFAULT '', \`pwd\` varchar(64) NOT NULL DEFAULT '', PRIMARY KEY (\`uid\`)) ENGINE=InnoDB`,
    );
    //insert legacy data
    await queryRunner.query(
      `INSERT INTO \`users\` VALUES ('ps','Schaller','Patrick','ps@imovies.ch','6e58f76f5be5ef06a56d4eeb2c4dc58be3dbe8c7'),('lb','Bruegger','Lukas','lb@imovies.ch','8d0547d4b27b689c3a3299635d859f7d50a2b805'),('ms','Schlaepfer','Michael','ms@imovies.ch','4d7de8512bd584c3137bb80f453e61306b148875'),('a3','Anderson','Andres Andrea','anderson@imovies.ch','6b97f534c330b5cc78d4cc23e01e48be3377105b');`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`users\``);
  }
}
