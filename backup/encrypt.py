#!/usr/bin/env python3

import sys
import os

file = sys.argv[1]
dir = sys.argv[2]
action = sys.argv[3]
LOCAL_FOLDER_NAME = sys.argv[4]
LOCAL_enc_PATH = sys.argv[5]
CIPHER_MODE = sys.argv[6]
KEY_PATH = sys.argv[7]

local_dir = dir.split(LOCAL_FOLDER_NAME)[1]
local_enc_dir =  LOCAL_enc_PATH + local_dir
enc_file_name = local_enc_dir + file + '.enc'

command = f'openssl enc -in ".{local_dir}{file}" -out "{enc_file_name}" -e -"{CIPHER_MODE}" -k "{KEY_PATH}"'

os.system('mkdir -p ' + local_enc_dir)
os.system(command)
