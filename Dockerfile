FROM node:20-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:20-slim
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts
RUN mkdir -p storage/uploads storage/temp_uploads
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
EXPOSE 5001
ENV NODE_ENV=production
ENV PORT=5001
ENTRYPOINT ["/entrypoint.sh"]
