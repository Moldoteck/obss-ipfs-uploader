FROM node:18-buster as builder
WORKDIR /app

COPY package* ./
RUN npm install
COPY src/ ./src
COPY ["tsconfig.*", "./"]
RUN npm run build


FROM node:18-buster as prod
ENV NODE_ENV=production
WORKDIR /app

COPY ["package*", "./"]
RUN npm install --omit=dev

COPY --from=builder ./app/dist ./dist

COPY [".env.production", "./.env"]

EXPOSE 420
CMD ["node", "dist/main.js"]
#CMD [ "sh", "-c", "node dist/main.js > /app/logs/obss-uploader.log 2>&1" ]