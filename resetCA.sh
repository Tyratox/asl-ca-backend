#!/bin/bash

echo "Enter mysql root password:"
echo "USE imovies; TRUNCATE certificates;" | mysql -sfu root -p

cd CA
rm -rf index* crl* newcerts requests tmp serial* private/users/*

