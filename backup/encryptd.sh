#!/bin/bash

ENC_BINARY=$1
DIR_TO_MONITOR=$2
ENC_DIR_TO_STORE=$3
CIPHER_MODE=$4
KEY_PATH=$5

inotifywait -r -m "$DIR_TO_MONITOR" -e modify |
while read dir action file; do
    "$ENC_BINARY" "$dir" "$file" "$action" "$DIR_TO_MONITOR" "$ENC_DIR_TO_STORE" "$CIPHER_MODE" "$KEY_PATH"
done