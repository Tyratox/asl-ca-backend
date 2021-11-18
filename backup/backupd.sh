#!/bin/bash

DIR_TO_BACKUP=$1
REMOTE_HOST=$2
REMOTE_DIR=$3

while true; do
    find $DIR_TO_BACKUP | entr -d rsync -avh -e ssh . $REMOTE_HOST:$REMOTE_DIR
done