#define STRINGIZER(arg)     #arg
#define STR_VALUE(arg)      STRINGIZER(arg)
#define CA_PATH_STRING STR_VALUE(CA_PATH)
#define CONFIG_PATH_STRING STR_VALUE(CONFIG_PATH)
#define OPENSSL_PATH_STRING STR_VALUE(OPENSSL_PATH)
#define MKDIR_PATH_STRING STR_VALUE(MKDIR_PATH)
#define BASH_PATH_STRING STR_VALUE(BASH_PATH)
#define CHMOD_PATH_STRING STR_VALUE(CHMOD_PATH)

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
#include <time.h>

namespace fs = std::filesystem;
using namespace std;

string configPath = CONFIG_PATH_STRING;
string caPath = CA_PATH_STRING;
string opensslPath = OPENSSL_PATH_STRING;
string mkdirPath = MKDIR_PATH_STRING;
string bashPath = BASH_PATH_STRING;
string chmodPath = CHMOD_PATH_STRING;

const std::string currentDateTime() {
    time_t     now = time(0);
    struct tm  tstruct;
    char       buf[80];
    tstruct = *localtime(&now);
    // Visit http://en.cppreference.com/w/cpp/chrono/c/strftime
    // for more information about date/time format
    strftime(buf, sizeof(buf), "%Y-%m-%d.%X", &tstruct);

    return buf;
}


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
      execl(mkdirPath.c_str(), "mkdir", "-p", dir, NULL);
      return;
  }
}

string int_to_hex_string(int i){
  std::stringstream stream;
  stream << std::hex << i;
  std::string result( stream.str() );
  for(int j = 0; j < int(result.size()); j++) {
      if(isalpha(result[j])) {
          result[j] = toupper(result[j]);
      }
  }

  return  i < 16 ? ("0" + result) : result;
}

void writeFile(string file, string content){
  std::ofstream outfile (file);
  outfile << content;
  if(content != ""){
    outfile << std::endl;
  }
  outfile.close();
}

string readFile(string file){
  string content = "";
  string line;
  ifstream infile (file);
  if (infile.is_open()){
    while (getline(infile,line)){
      if(content == ""){
        content = line;
      }else{
        content = content + '\n' + line;
      }
    }
    infile.close();
  }else{
    throw runtime_error("Unable to open file");
  }

  return content;
}

int main(int argc, char *argv[]){

  if(argc <= 1){
    cerr << "ca-utility requires at least one argument!" << endl;
    cerr << "Usage: ./ca-utility (generate|request|sign|revoke) target OR ./ca-utility update-crl" << endl;
    return 1;
  }

  if(setuid(UID) != 0){
    cerr << currentDateTime() << " Error : Couldn't run setuid(" << UID << ")!" << endl; 
    cerr << currentDateTime() << " Error : code (errno): " << errno << endl;
    return 255;
  }

  string caPathIndexFile = caPath + "index.txt";
  string caPathSerialFile = caPath + "serial";
  string caCrlNumberFile = caPath + "crlnumber";
  string caCrlFile = caPath + "crl/crl.pem";
  string caRevokedFile = caPath + "crl/revoked.pem";

  string caPathPrivate = caPath + "private";
  string caPathUserKeys = caPath + "private/users/";
  string caPathNewUserKeys = caPath + "private/newkeys/";
  string caPathRequests = caPath + "requests/";
  string caPathCertificates = caPath + "newcerts/";
  // certs/ doesn't seem to be used so
  //string caPathNewCertificates = caPath + "newcerts/";
  string caPathCRL = caPath + "crl/";

  // safe since no user input is used
  mkdir(caPathNewUserKeys.c_str());
  mkdir(caPathPrivate.c_str());
  mkdir(caPathUserKeys.c_str());
  mkdir(caPathRequests.c_str());
  //mkdir(caPathNewCertificates.c_str());
  mkdir(caPathCertificates.c_str());
  mkdir(caPathCRL.c_str());

  fs::path index{ caPathIndexFile };
  if (!fs::exists(index)){
    writeFile(caPathIndexFile, "");
  }
  fs::path revoke{ caRevokedFile };
  if (!fs::exists(revoke)){
    writeFile(caRevokedFile, "");
  }
  fs::path serial{ caPathSerialFile };
  if (!fs::exists(serial)){
    writeFile(caPathSerialFile, "01");
  }
  fs::path crlNum{ caCrlNumberFile };
  if (!fs::exists(crlNum)){
    writeFile(caCrlNumberFile, "01");
  }

  string command = argv[1];

  if(command == "update-crl"){
    pid_t c_pid = fork();

    if (c_pid == -1) {
        return 101;
    } else if (c_pid > 0) {
        // parent process
        // wait for child  to terminate
        wait(nullptr);
        // generate the revoked.pem file required by nginx
        // use exec instead of execl as we need to pipe
        // IMPORTANT: no user input
        string cert = readFile(caPath + "cacert.pem");
        string crl = readFile(caCrlFile);
        writeFile(caRevokedFile, cert + '\n' + crl);
        
        // after updating the CRL, nginx must be reloded to take effect
        // !leave this comment below, in deployment the // are removed!
        // system("sudo nginx -s reload");
        return 0;
    } else {
        // child process
        execl(opensslPath.c_str(), "openssl", "ca", "-gencrl", "-out", caCrlFile.c_str(), "-config", configPath.c_str(), NULL);
        return 0;
    }
    
    return 0;
  }else if(argc <= 2){
    cerr << currentDateTime() << " Error : ca-utility requires at least two arguments!" << endl;
    cerr << currentDateTime() << " Usage: ./ca-utility (generate|request|sign|revoke) target" << endl;
    return 1;
  }

  string targetString = argv[2];

  try {
      int target = stoi(targetString);

      if(command == "generate"){
        // read serial file
        string serialString = readFile(caPathSerialFile);
        try {
          int serial = stoi(serialString, 0, 16);
          if(target != serial){
            cerr << currentDateTime() << " Error : Serial file is at " << serial << ", you requested to generate " << target << endl;
            return 4;
          }
        } catch (exception const &e) {
          cerr << currentDateTime() << " Error : Serial file contains invalid content: " << serial << "!" << endl;
          return 5;
        }

        string output = caPathNewUserKeys + to_string(target) + ".key";
        fs::path p{ output };
        if (fs::exists(p)){
          cerr << currentDateTime() << "Error : File at path '" << output << "' already exists!" << endl;
          return 6;
        }

        pid_t c_pid = fork();

        if (c_pid == -1) {
            return 100;
        } else if (c_pid > 0) {
            // parent process
            // wait for child  to terminate
            wait(nullptr);
            // the user actually needs to have the private key so on generation return the contents!
            string outputString = readFile(output);
            cerr << currentDateTime() << " : Certificate generated --- key : " << target << endl;
            cout << outputString << endl;
            return 0;
        } else {
            pid_t c_pid = fork();

            if (c_pid == -1) {
                return 100;
            } else if (c_pid > 0) {
                // parent process
                // wait for child  to terminate
                wait(nullptr);
                execl(chmodPath.c_str(), "chmod", "660", output.c_str(), NULL);
                return 0;
            } else {
                // child process
                execl(opensslPath.c_str(), "openssl", "genrsa", "-out", output.c_str(), "4096", NULL);
                return 0;
            }
        }

      } else if(command == "request"){
        // read serial file
        string serialString = readFile(caPathSerialFile);
        try {
          int serial = stoi(serialString, 0, 16);
          if(target != serial){
            cerr << currentDateTime() << " Error : Serial file is at " << serial << ", you requested to generate " << target << endl;
            return 7;
          }
        } catch (exception const &e) {
          cerr << currentDateTime() << " Error : Serial file contains invalid content: " << serial << "!" << endl;
          return 8;
        }

        string output = caPathRequests + to_string(target) + ".csr";
        fs::path p{ output };
        if (fs::exists(p)){
          cerr << currentDateTime() << " Error : File at path '" << output << "' already exists!" << endl;
          return 9;
        }

        string input = caPathNewUserKeys + to_string(target) + ".key";
        fs::path p2{ input };
        if (!fs::exists(p2)){
          cerr << currentDateTime() << " Error : File at path '" << input << "' does not exists!" << endl;
          return 10;
        }

        //-subj "/C=GB/ST=London/L=London/O=Global Security/OU=IT Department/CN=example.com
        if(argc <= 4){
          cerr << currentDateTime() << " Error : For creating a Certificate request, a common name has to be passed!" << endl;
          return 11;
        }

        string commonName = argv[3];
        string uid = argv[4];

        // sanitize input
        regex e (".*@imovies\\.ch");
        if (regex_match(commonName,e)){
          string subject = "/C=CH/ST=Zurich/L=Zurich/O=iMovies/OU=IT/CN=" + commonName;
          string command = "openssl req -new -key \"" + input + "\" -out \"" + output + "\" -subj \"" + subject + "\"";

          cerr << currentDateTime() << " : Certificate requested --- " << " key : " << target << ", uid : " << uid << endl;
          execl(bashPath.c_str(), "bash", "-p", "-c", command.c_str(), NULL);
        
          return 0;
        } else{
          cerr << currentDateTime() << " Error : The passed common name is invalid!" << endl;
          return 12;
        }

      } else if(command == "sign"){
        string serialString = readFile(caPathSerialFile);
        try {
          int serial = stoi(serialString, 0, 16);
          if(target != serial){
            cerr << currentDateTime() << " Error : Serial file is at " << serial << ", you requested to sign " << target << endl;
            return 13;
          }
        } catch (exception const &e) {
          cerr << currentDateTime() << " Error : Serial file contains invalid content: " << serial << "!" << endl;
          return 14;
        }

        string input = caPathRequests + to_string(target) + ".csr";
        fs::path p{ input };
        if (!fs::exists(p)){
          cerr << currentDateTime() << " Error : File at path '" << input << "' does not exists!" << endl;
          return 15;
        }

        string output = caPathCertificates + int_to_hex_string(target) + ".pem";

        fs::path p2{ output };
        if (fs::exists(p2)){
          cerr << currentDateTime() << " Error : File at path '" << output << "' already exists!" << endl;
          return 16;
        }

        pid_t c_pid = fork();

        if (c_pid == -1) {
            return 101;
        } else if (c_pid > 0) {
            // parent process
            // wait for child  to terminate
            wait(nullptr);
            // the user actually needs to have the signed certificate so on signing return the contents!
            string outputString = readFile(output);
            cerr << currentDateTime() << " : Certificate signed --- " << " key : " << target << endl;
            cout << outputString << endl;

            //the key can now be backed up & deleted, move to caPathUserKeys
            string k1 = caPathNewUserKeys + to_string(target) + ".key";
            string k2 = caPathUserKeys + to_string(target) + ".key";

            filesystem::rename(k1, k2);
            return 0;
        } else {
            // child process
            execl(opensslPath.c_str(), "openssl", "ca", "-batch", "-in", input.c_str(), "-config", configPath.c_str(), NULL);
            return 0;
        }
        
        return 0;
      }else if(command == "revoke"){
        string input = caPathCertificates + int_to_hex_string(target) + ".pem";
        fs::path p{ input };
        if (!fs::exists(p)){
          cerr << currentDateTime() << " Error : File at path '" << input << "' does not exists!" << endl;
          return 17;
        }

        cerr << currentDateTime() << " : Certificate revoked --- " << " key : " << target << endl;
        execl(opensslPath.c_str(), "openssl", "ca", "-revoke", input.c_str(), "-config", configPath.c_str(), NULL);
        return 0;
      }else{
        cerr << currentDateTime() << " Error : Unknown command '" << command << "'" << endl;
        return 3;
      }

  } catch (exception const &e) {
    cerr << currentDateTime() << " Error : Invalid target was passed!" << endl;
    // cerr << "e.what(): " << e.what() << endl;
    return 2;
  }

  return 0;
}
