#!/bin/bash

g++ -std=c++17 -O3 -Wall "$1" -o "$2" -DCA_PATH="$3" -DCONFIG_PATH="$4" -DOPENSSL_PATH="$5"