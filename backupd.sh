#!/bin/bash

source backupd.cnf # TODO change to absolute path
cd "$LOCAL_CA_PATH"

while true; do
  find . | entr -d rsync -avh -e ssh . $REMOTE_HOST:$REMOTE_CA_PATH
done

