#!/bin/bash

g++ -std=c++17 -O3 -Wall ./src/ca-utility.cpp -o ./CA/ca-utility -DCA_PATH="$1" -DCONFIG_PATH="$2" -DOPENSSL_PATH="$3"