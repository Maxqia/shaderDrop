# shaderDrop
setting up pipes via QR codes -
[Video Demo](https://www.youtube.com/watch?v=ysDmQjFNMt0)


## setup dev enviroment
    git clone https://github.com/Maxqia/shaderDrop.git
    npm install
    npx lerna bootstrap

## compile webclient and run server
    cd packages/webclient/
    npx webpack
    cd ../server/

    openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes -subj '/CN=localhost' # generate certificate because web browsers won't let you use the camera without it
    PORT=8443 HTTPS=true SSLPRIV="key.pem" SSLPUB="cert.pem" npm run start
    
## run cli client
   cd packages/cli/
   npx ts-node src/command.ts
   (or for the compiled version on any computer with npx)
   npx shaderdrop

### Attribution
https://www.iconfinder.com/icons/1372387/landscape_off_on_orientation_rotate_icon
