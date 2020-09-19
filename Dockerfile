FROM node:14

WORKDIR /usr/src/app
RUN npm set unsafe-perm true

COPY . .
RUN npx lerna bootstrap

WORKDIR /usr/src/app/packages/webclient
RUN npx webpack

WORKDIR /usr/src/app/packages/server

EXPOSE 80
ENV PORT=80
CMD [ "npm", "start" ]
