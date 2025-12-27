FROM node:20-alpine
WORKDIR /usr/src/app
ENV NODE_ENV=production
COPY package.json package-lock.json* ./
RUN npm ci --only=production || npm install --only=production
COPY . .
ENV PORT=3500
EXPOSE 3500
CMD ["node", "src/server.js"]
