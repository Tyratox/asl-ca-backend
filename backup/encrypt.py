#!/usr/bin/env python3

import sys
import os

file = sys.argv[1]
dir = sys.argv[2]
action = sys.argv[3]
CIPHER_MODE = sys.argv[4]
KEY_PATH = sys.argv[5]

local_dir = dir.split('/CA')[1]
local_ca_dir = '../CA_enc' + local_dir
enc_file_name = local_ca_dir + file + '.enc'
command = f'openssl enc -in ".{local_dir}{file}" -out "{enc_file_name}" -e -"{CIPHER_MODE}" -k "{KEY_PATH}"'

os.system('mkdir -p ' + local_ca_dir)
os.system(command)
