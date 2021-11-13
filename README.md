
## Installation

1. Clone the repository
2. Install the NodeJS dependencies using `yarn install` or `npm install`
3. Install & run a mysql server on localhost
4. Create a database called imovies by for example running `mysql -u root -p` and then run `CREATE DATABASE imovies;`
5. Copy the configuration file `ormconfig-example.json` to `ormconfig.json` and add the credentials
6. Copy the configuration file `.env-example` to `.env` and change the values.
   1. For local development the `CA_PATH` can easily be set to `/path/to/asl-ca-backend/CA` (but this directory has first to be created)
   2. For local development, `FRONTEND_URL` can be set to `http://localhost:8080`.
7. Build the binary that runs the OpenSSL command.
   1. The build script `build-ca-utility.sh` accepts several arguments:
      1. The first argument is the path to the source file, e.g. `./src/ca-utility.cpp`
      2. The second argument is the output path of the binary, for example `./CA/ca-utility`
      3. The third argument is the path to the CA directory, e.g. `/path/to/CA/`. **Important**: There has to be a slash at the end of the path.
      4. The fourth argument is the path to the OpenSSL config file. Usually this is `/etc/ssl/openssl.cnf`. For macOS the config file has to be changed. See `./openssl-example.cnf`. Also update the path to the CA directory inside the config file.
      5. The fifth argument is the path to the OpenSSL binary. Usually this is `/usr/bin/openssl`
      6. The fifth argument is the path to the mkdir binary. Usually this is `/bin/mdkir`
      7. The last argument is the user id of the `setuid` system call. You can get your user id by running `id -u <username>`
   2. The full command looks like `./build-ca-utility.sh ./src/ca-utility.cpp ./CA/ca-utility /path/to/CA/ /etc/ssl/openssl.cnf /usr/bin/openssl /bin/mdkir xx`
   3. These arguments hard code the strings into the binary s.t. the binary doesn't have to rely on user input
   4. Copy the root certificate to `/path/to/CA/cacert.pem` and the (unencrypted) private key to `/path/to/CA/private/cakey.pem`
   5. If desired, the setuid bit of the binary can be set. For local development this is not required.
8. Populate the database using `yarn migrations:run` or `npm run migrations:run` (If this returns an error, drop all tables in the database first)
9. Now the development server can be started using `yarn start / npm start` or `yarn start:dev / npm run start:dev` for hot reloading. (These scripts are defined in the `package.json` file)

### Nginx configuration

An nginx configuration that can be used for local development (in order to test for example the client certififcate authentication) is the following:

```conf
server {
  listen 443 ssl;
  listen [::]:443 ssl;
  server_name asl-ca.localhost;

  ssl_certificate "/path/to/certificate.crt";
  ssl_certificate_key "/path/to/key.key";

  location /authentication/tls-cert {
	  deny all;
  }

  location / {
    proxy_set_header   X-Forwarded-For $remote_addr;

    proxy_set_header   Host $http_host;
    proxy_pass         http://127.0.0.1:3000;
  }
}

server {
  listen 443 ssl;
  listen [::]:443 ssl;
  server_name cert.asl-ca.localhost;

  ssl_certificate "/path/to/certificate.crt";
  ssl_certificate_key "/path/to/key.key";
  
  # for client certificates
  ssl_client_certificate "/path/to/CA/cacert.pem";
  ssl_crl "/path/to/CA/crl/revoked.pem";
  
  # require authentication using TLS client certificates
  ssl_verify_client on;
  
  location /authentication/tls-cert {
    proxy_set_header   X-Forwarded-For $remote_addr;

    # add client certificate as a header
    proxy_set_header   X-SSL-CERT-SERIAL $ssl_client_serial;

    proxy_set_header   Host $http_host;
    proxy_pass         http://127.0.0.1:3000;
  }
}

```

`/etc/hosts` can be edited to forward requests to `cert.asl-ca.localhost` to localhost / `127.0.0.1` instead.

# Known Issues
- Revoked certificates are accepted until nginx is reloaded