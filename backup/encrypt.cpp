#define STRINGIZER(arg)     #arg
#define STR_VALUE(arg)      STRINGIZER(arg)
#define OPENSSL_PATH_STRING STR_VALUE(OPENSSL_PATH)
#define MKDIR_PATH_STRING STR_VALUE(MKDIR_PATH)

#include <iostream>
#include <iomanip>
#include <sstream>
#include <fstream>
#include <string>
#include <stdlib.h>
#include <cstdio>
#include <memory>
#include <stdexcept>
#include <array>
#include <filesystem>
#include <fcntl.h>
#include <unistd.h>
#include <errno.h>
#include <sys/wait.h>
#include <regex>
#include <cctype>

namespace fs = std::filesystem;
using namespace std;

string opensslPath = OPENSSL_PATH_STRING;
string mkdirPath = MKDIR_PATH_STRING;

void mkdir(const char* dir){
  pid_t c_pid = fork();

    if (c_pid == -1) {
      throw runtime_error("couldn't fork!");
  } else if (c_pid > 0) {
      // parent process
      // wait for child  to terminate
      wait(nullptr);

      return;
  } else {
      // don't print error messages such as "Folder already exists"
      int devNull = open("/dev/null", O_WRONLY);
      dup2(devNull, STDERR_FILENO);
      // child process
      execl(mkdirPath.c_str(), "-p", dir, NULL);
      return;
  }
}

int main(int argc, char *argv[]){
  if(argc < 8){
    throw runtime_error("Usage: ./encrypt file dir action LOCAL_FOLDER_NAME LOCAL_enc_PATH CIPHER_MODE KEY_PATH");
  }

  string dir_str = argv[1];
  string file_str = argv[2];

  fs::path file(dir_str + file_str);
  string action = argv[3];
  fs::path CA_PATH(argv[4]);

  fs::path ENC_PATH(argv[5]);
  string CIPHER_MODE = argv[6];
  string KEY_PATH = argv[7];
  
  fs::path relative_path = fs::relative(file, CA_PATH);

  fs::path file_enc =  ENC_PATH / relative_path;

  mkdir(file_enc.parent_path().c_str());

  execl(opensslPath.c_str(), "enc", "-in", file.c_str(), "-out", file_enc.c_str(), "-e", CIPHER_MODE.c_str(), "-k", KEY_PATH.c_str(), NULL);

  return 0;
}