FROM node:20-alpine as builder

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install && npm install pm2 -g

COPY . .

RUN npm run build

RUN chmod +x entrypoint.sh
CMD ["sh", "./entrypoint.sh"]

EXPOSE 3000
