#!/bin/bash

g++ -std=c++17 -O3 -Wall ./src/ca-utility.cpp -o "$1" -DCA_PATH="$2" -DCONFIG_PATH="$3" -DOPENSSL_PATH="$4"