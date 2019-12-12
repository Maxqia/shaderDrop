# shaderDrop
setting up pipes via QR codes - 
[Video Demo](https://www.youtube.com/watch?v=ysDmQjFNMt0)


## setup dev enviroment
    git clone https://github.com/Maxqia/shaderDrop.git
    npm install
    npx lerna bootstrap

## compile and run server
    npx lerna run tsc
    cd packages/webclient/
    npx run webpack
    cd ../server/
    PORT=8080 npm run server

