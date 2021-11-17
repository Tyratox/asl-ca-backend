#!/bin/bash

echo "Reading backupd.cnf ..."
source backupd.cnf # TODO change to absolute path

send() {
    cd "$1"
    while true; do
        find . | entr -d rsync -avh -e ssh . $REMOTE_HOST:$2
    done
}

send "$LOCAL_CA_enc_PATH" "$REMOTE_CA_enc_PATH" &
send "$LOCAL_DB_enc_PATH" "$REMOTE_DB_enc_PATH" &
