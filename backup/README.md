# backupd

## usage
1. After machine setup, create `CA` and `CA_enc` directories, and remote `CA_enc` directories.

2. Specify those absolute paths in `backupd.cnf`, along with an absolute path to the AES
symmetric key file and ciper mode to use (e.g. `aes-256-cbc`).

3. Run `encryptd.sh`.
4. Run `backupd.sh`.
5. From now on, as soon as a new file is created in `CA`, it will be encrypted and transferred
to `CA_enc` on the backup server.
