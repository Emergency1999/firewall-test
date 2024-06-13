FROM node:16

WORKDIR /app

COPY package.json .

RUN npm install

COPY server.js .
COPY index.html .

EXPOSE 3000

CMD [ "node", "server.js" ]
