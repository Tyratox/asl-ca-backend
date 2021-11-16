#!/bin/bash

echo "Reading backupd.cnf ..."
source backupd.cnf # TODO change to absolute path
cd "$LOCAL_CA_PATH"

monitor() {
inotifywait -r -m "$1" -e modify |
    while read dir action file; do
        #echo "The file '$file' appeared in directory '$dir' via '$action'"
        ../encrypt.py $file $dir $action $CIPHER_MODE $KEY_PATH
    done
}

monitor "$LOCAL_CA_PATH"

# find . -type f -exec openssl enc -in {} -out {}.enc -e -aes-256-gcm -k "$KEY_PATH" \;
