FROM node:12

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .
RUN npx webpack

EXPOSE 80
ENV PORT=80
CMD [ "npm", "run", "server" ]
