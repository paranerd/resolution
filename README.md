# OpenPhotos

The attempt at an offline alternative to Google Photos

## Setup
1. Install MongoDB
    - Check [this guide](https://docs.mongodb.com/manual/installation/) on how to intall.

2. Install PM2 globally
```
npm i -g pm2
```

3. Clone repository
```
git clone https://github.com/paranerd/to-do-list.git
```

```
cd to-do-list/
```

4. Update server config
    - Set environment variables in `/server/.env`

5. Update client config
    - Set environment variables in `/client/.env`

6. Build the client
```
npm run-script --prefix ./client build
```

7. Start the app
```
npm start --prefix ./client && npm start --prefix ./server
```

## Configure Nginx
In case you're running Nginx as a reverse proxy, this would be a working config (replace <placeholders>):

```
server {
    listen 443 ssl;
    server_name <YOUR_DOMAIN>;
    ssl_certificate  </path/to/your/fullchain.pem>;
    ssl_certificate_key  </path/to/your/privkey.pem>;

    # Improve HTTPS performance with session resumption
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 5m;

    # Enable server-side protection against BEAST attacks
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDH+AESGCM:ECDH+AES256:ECDH+AES128:DH+3DES:!ADH:!AECDH:!MD5;

    # Disable SSLv3
    ssl_protocols TLSv1 TLSv1.1 TLSv1.2;

    # Diffie-Hellman parameter for DHE ciphersuites
    # sudo openssl dhparam -dsaparam -out /etc/ssl/certs/dhparam.pem 4096
    ssl_dhparam /etc/ssl/certs/dhparam.pem;

    # Enable HSTS (https://developer.mozilla.org/en-US/docs/Security/HTTP_Strict_Transport_Security)
    #add_header Strict-Transport-Security "max-age=63072000; includeSubdomains";

    # Enable OCSP stapling (http://blog.mozilla.org/security/2013/07/29/ocsp-stapling-in-firefox)
    ssl_stapling on;
    ssl_stapling_verify on;
    ssl_trusted_certificate </path/to/your/fullchain.pem>;
    resolver 8.8.8.8 8.8.4.4 valid=300s;
    resolver_timeout 5s;

    proxy_set_header Host $host;
    proxy_http_version 1.1;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "Upgrade";

    location ~ ^/(api|cast) {
        if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' '*';

            # Om nom nom cookies
            add_header 'Access-Control-Allow-Credentials' 'true';
            add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS';

            # Custom headers and headers various browsers *should* be OK with but aren't
            add_header 'Access-Control-Allow-Headers' 'DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type';

            # Tell client that this pre-flight info is valid for 20 days
            add_header 'Access-Control-Max-Age' 1728000;
            add_header 'Content-Type' 'text/plain charset=UTF-8';
            add_header 'Content-Length' 0;
            return 204;
        }

        if ($request_method = 'POST') {
            add_header 'Access-Control-Allow-Origin' '*';
            add_header 'Access-Control-Allow-Credentials' 'true';
            add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS';
            add_header 'Access-Control-Allow-Headers' 'DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type';
        }

        if ($request_method = 'GET') {
            add_header 'Access-Control-Allow-Origin' '*';
            add_header 'Access-Control-Allow-Credentials' 'true';
            add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS';
            add_header 'Access-Control-Allow-Headers' 'DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type';
        }

        proxy_pass http://localhost:8081;
    }

    location / {
        proxy_pass http://localhost:8080;
    }
}

server {
    listen 80;
    server_name <YOUR_DOMAIN>;

    return 301 https://$host$request_uri;
}
```