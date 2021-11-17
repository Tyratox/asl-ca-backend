#!/bin/bash

echo "Reading backupd.cnf ..."
source backupd.cnf # TODO change to absolute path

monitor() {
    cd "$1"
    inotifywait -r -m "$1" -e modify |
    while read dir action file; do
        ../encrypt.py $file $dir $action "$2" "$3" $CIPHER_MODE $KEY_PATH
    done
}

monitor "$LOCAL_CA_PATH" "$LOCAL_CA_FOLDER_NAME" "$LOCAL_CA_enc_PATH" &
monitor "$LOCAL_DB_PATH" "$LOCAL_DB_FOLDER_NAME" "$LOCAL_DB_enc_PATH" &
