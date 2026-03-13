FROM node:20-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:20-slim
WORKDIR /app
# تثبيت أدوات النظام الضرورية
RUN apt-get update && apt-get install -y dos2unix && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
# تثبيت حزم الإنتاج مع تثبيت drizzle-kit بشكل صريح
RUN npm install --production && npm install drizzle-kit

# نسخ ملفات التطبيق المبنية
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts

# --- الحل الجديد ---
# نسخ أي ملفات SQL قد يحتاجها التطبيق في مجلد dist
# هذا السطر يضمن وجود ملف table.sql داخل الحاوية النهائية
COPY --from=builder /app/*.sql ./dist/ 2>/dev/null || :
COPY --from=builder /app/dist/*.sql ./dist/ 2>/dev/null || :
# ------------------

RUN mkdir -p storage/uploads storage/temp_uploads storage/backups

COPY entrypoint.sh /entrypoint.sh
RUN dos2unix /entrypoint.sh && chmod +x /entrypoint.sh

EXPOSE 5001
ENV NODE_ENV=production
ENV PORT=5001

ENTRYPOINT ["/entrypoint.sh"]
