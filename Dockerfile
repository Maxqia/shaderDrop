FROM node:13

WORKDIR /usr/src/app

COPY . .
RUN npm install
RUN npx lerna bootstrap
RUN npx lerna run tsc

WORKDIR /usr/src/app/packages/webclient
RUN npx webpack

WORKDIR /usr/src/app/packages/server

EXPOSE 80
ENV PORT=80
CMD [ "npm", "run", "server" ]
