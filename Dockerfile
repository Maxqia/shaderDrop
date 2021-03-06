FROM node:15

WORKDIR /usr/src/app
RUN npm set unsafe-perm true

COPY . .
RUN npm install
RUN npx lerna bootstrap

WORKDIR /usr/src/app/packages/webclient
RUN npx webpack

WORKDIR /usr/src/app/packages/server

EXPOSE 80
ENV PORT=80
CMD [ "npm", "start" ]
