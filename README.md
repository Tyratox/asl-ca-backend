
## Installation

1. Clone the repository
2. Install the NodeJS dependencies using `yarn install` or `npm install`
3. Install & run a mysql server on localhost
4. Create a database called imovies by for example running `mysql -u root - p` and then run ```sql CREATE DATABASE imovies;```
5. Copy the configuration file `ormconfig-example.json` to `ormconfig.json` and add the credentials
6. Copy the configuration file `.env-example` to `.env` and change the values.
   1. For local development the `CA_PATH` can easily be set to `/path/to/asl-ca-backend/CA` (but this directory has first to be created)
   3. For local development, `CLIENT_CERT_AUTH_REDIRECT_URL` can be set to `http://localhost:8080/login`.
7. Build the binary that runs the OpenSSL command.
   1. The build script `build-ca-utility.sh` accepts several arguments:
      1. The first argument is the output path of the binary, for example `./CA/ca-utility`
      2. The second argument is the path to the CA directory, e.g. `/path/to/CA`
      3. The third argument is the path to the OpenSSL config file. Usually this is `/etc/ssl/openssl.cnf`
      4. The fourth argument is the path to the OpenSSL binary. Usually this is `/usr/bin/openssl`
   2. The full command looks like `./build-ca-utility.sh ./CA/ca-utility /path/to/CA /etc/ssl/openssl.cnf /usr/bin/openssl`
   3. These arguments hard code the strings into the binary s.t. the binary doesn't have to rely on user input
   4. If desired, the setuid bit of the binary can be set. For local development this is not required.
8. Now the development server can be started using `yarn start / npm start` or `yarn start:dev / npm run start:dev` for hot reloading. (These scripts are defined in the `package.json` file)