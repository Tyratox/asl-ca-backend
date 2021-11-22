#!/bin/bash

MKDIR_PATH=$(which mkdir)
OPENSSL_PATH=$(which openssl)
BASH_PATH=$(which bash)

if [ -z "$1" ]
then
  echo "Usage: ./build-ca-utility.sh /input/ca-utility.cpp /output/ca-utility /path/to/CA /path/to/openssl.cnf SETUID_USER_ID"
  exit
fi

if [ -z "$2" ]
then
  echo "Output path is required!"
  exit
fi

if [ -z "$3" ]
then
  echo "CA path is required!"
  exit
fi

if [ -z "$4" ]
then
  echo "OpenSSL config path is required!"
  exit
fi

if [ -z "$5" ]
then
  echo "UID is required!"
  exit
fi

g++ -std=c++17 -O3 -Wall "$1" -o "$2" -DCA_PATH="$3" -DCONFIG_PATH="$4" -DOPENSSL_PATH="$OPENSSL_PATH" -DMKDIR_PATH="$MKDIR_PATH" -DBASH_PATH="$BASH_PATH" -DUID="$5"
