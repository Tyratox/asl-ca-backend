#!/bin/bash

if [ -z "$1" ]
then
  echo "Usage: ./build-ca-utility.sh /input/ca-utility.cpp /output/ca-utility /path/to/CA /path/to/openssl.cnf /path/to/openssl /path/to/mkdir SETUID_USER_ID"
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
  echo "OpenSSL path is required!"
  exit
fi

if [ -z "$6" ]
then
  echo "mkdir path is required!"
  exit
fi

if [ -z "$7" ]
then
  echo "UID is required!"
  exit
fi

g++ -std=c++17 -O3 -Wall "$1" -o "$2" -DCA_PATH="$3" -DCONFIG_PATH="$4" -DOPENSSL_PATH="$5" -DMKDIR_PATH="$6" -DUID="$7"