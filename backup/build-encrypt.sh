#!/bin/bash

MKDIR_PATH=$(which mkdir)
OPENSSL_PATH=$(which openssl)

if [ -z "$1" ]
then
  echo "Usage: ./build-encrypt.sh /input/encrypt.cpp /output/encrypt"
  exit
fi

if [ -z "$2" ]
then
  echo "Output path is required!"
  exit
fi

g++ -std=c++17 -O3 -Wall "$1" -o "$2" -DOPENSSL_PATH="$OPENSSL_PATH" -DMKDIR_PATH="$MKDIR_PATH"
