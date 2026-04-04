# 🛡️ ProTeach Infrastructure — البنية التحتية الكاملة

<div dir="rtl">

منظومة متكاملة تضم ثلاثة أنظمة فرعية تعمل على سيرفر GCP واحد عبر Docker Compose، مع بنية تحتية آمنة بـ Cloudflare + Nginx + SSL تلقائي.

</div>

<p align="center">
  <img src="https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker" alt="Docker"/>
  <img src="https://img.shields.io/badge/Ubuntu-24.04_LTS-E95420?style=for-the-badge&logo=ubuntu" alt="Ubuntu"/>
  <img src="https://img.shields.io/badge/GCP-Cloud-4285F4?style=for-the-badge&logo=googlecloud" alt="GCP"/>
  <img src="https://img.shields.io/badge/Cloudflare-Full_Strict-F38020?style=for-the-badge&logo=cloudflare" alt="Cloudflare"/>
  <img src="https://img.shields.io/badge/n8n-Automation-EA4B71?style=for-the-badge" alt="n8n"/>
  <img src="https://img.shields.io/badge/TypeScript-WPPConnect-3178C6?style=for-the-badge&logo=typescript" alt="TypeScript"/>
</p>

---

## 📋 الفهرس

- [معلومات السيرفر](#معلومات-السيرفر)
- [خريطة المنظومة](#خريطة-المنظومة)
- [تفاصيل الحاويات](#تفاصيل-الحاويات)
- [هيكل المجلدات](#هيكل-المجلدات)
- [التثبيت من الصفر](#التثبيت-من-الصفر)
- [إعداد Cloudflare و Nginx](#إعداد-cloudflare-و-nginx)
- [النسخ الاحتياطي](#النسخ-الاحتياطي)
- [إجراءات التحديث](#إجراءات-التحديث)
- [أوامر مفيدة](#أوامر-مفيدة)
- [API الواتساب](#api-الواتساب)

---

## معلومات السيرفر

| العنصر | القيمة |
|--------|--------|
| المزود | Google Cloud Platform (GCP) |
| عنوان IP | `34.179.180.10` |
| نظام التشغيل | Ubuntu 24.04 LTS |
| المسار الرئيسي | `/home/ibrahimsidawi/proteach-n8n/` |
| الشبكة الداخلية | `n8n-network` (Docker Bridge) |
| الفرع الرئيسي | `master` |

---

## خريطة المنظومة

```
┌─────────────────────────────────────────────────┐
│            Cloudflare (DNS + SSL Full Strict)   │
└───────────────────────┬─────────────────────────┘
                        │ HTTPS (443)
┌───────────────────────▼─────────────────────────┐
│         Nginx Proxy Manager (proteach-npm)      │
│  Routes: n8n | wa | wa-api | admin | hr | proxy │
└──┬───────────┬──────────────┬──────────────┬────┘
   │           │              │              │
┌──▼───┐  ┌───▼────────┐  ┌──▼──────────┐ ┌▼───────────┐
│ n8n  │  │ WA Manager │  │  HR App     │ │ Portainer  │
│:5678 │  │ API :8080  │  │  :5002      │ │ :9000      │
└──┬───┘  │ Dash:5000  │  └──────┬──────┘ └────────────┘
   │      └─────┬──────┘         │
┌──▼──┐    ┌───▼───┐         ┌───▼───┐
│ DB  │    │ WA DB │         │ HR DB │
│PG16 │    │ PG15  │         │ PG15  │
└─────┘    └───────┘         └───────┘
```

---

## تفاصيل الحاويات

### 🔄 n8n — محرك الأتمتة

| الخاصية | القيمة |
|---------|--------|
| الصورة | `n8nio/n8n:latest` |
| الحاوية | `proteach-n8n` |
| المنفذ الداخلي | `5678` |
| الرابط الخارجي | [n8n.sidawin8n.cfd](https://n8n.sidawin8n.cfd) |
| الوضع | `production` |
| قاعدة البيانات | PostgreSQL 16 (`proteach-db`) |
| البيانات الدائمة | `./n8n_data` → `/home/node/.n8n` |

**المتغيرات البيئية:**
```yaml
DB_TYPE: postgresdb
DB_POSTGRESDB_HOST: db
DB_POSTGRESDB_DATABASE: n8n_database
N8N_HOST: n8n.sidawin8n.cfd
N8N_PROTOCOL: https
WEBHOOK_URL: https://n8n.sidawin8n.cfd/
NODE_ENV: production
```

---

### 📱 wa-api — محرك معالجة الواتساب

| الخاصية | القيمة |
|---------|--------|
| المستودع | [ibrahims78/WhatsApp-Bot](https://github.com/ibrahims78/WhatsApp-Bot) |
| اللغة | TypeScript (Node.js 20) |
| الحاوية | `proteach-wa-api` |
| المنفذ الداخلي | `8080` (غير مكشوف للخارج) |
| الوضع | `development` |
| المحرك | WPPConnect + Chromium/Puppeteer |
| قاعدة البيانات | PostgreSQL 15 (`proteach-wa-db`) |

**Dockerfile:** `Dockerfile.api.dev` — يثبت Chromium لتشغيل WPPConnect

**المتغيرات البيئية:**
```yaml
DATABASE_URL: postgres://wauser:***@wa-db:5432/whatsapp_manager_db
PORT: 8080
JWT_SECRET: ***
NODE_ENV: development
```

**Volumes الحيّة (Hot Reload):**
- `./whatsapp-manager/lib` → `/app/lib`
- `./whatsapp-manager/artifacts/api-server/src` → `/app/artifacts/api-server/src`
- `./wa_tokens` → `/app/artifacts/api-server/tokens`

---

### 🖥️ wa-dashboard — واجهة إدارة الواتساب

| الخاصية | القيمة |
|---------|--------|
| الحاوية | `proteach-wa-dashboard` |
| المنفذ الداخلي | `5000` |
| الرابط الخارجي | [wa.sidawin8n.cfd](https://wa.sidawin8n.cfd) |
| الوضع | `development` (Vite HMR) |
| API Target | `http://wa-api:8080` |

---

### 👔 hr-app — نظام إدارة الموظفين

| الخاصية | القيمة |
|---------|--------|
| المستودع | [ibrahims78/employee-management-system](https://github.com/ibrahims78/employee-management-system) |
| اللغة | TypeScript (Node.js 20 + React 18) |
| الحاوية | `proteach-hr-app` |
| المنفذ الداخلي | `5002` |
| الرابط الخارجي | [hr.sidawin8n.cfd](https://hr.sidawin8n.cfd) |
| الوضع | `development` |
| قاعدة البيانات | PostgreSQL 15 (`proteach-hr-db`) |

**Dockerfile:** `Dockerfile.dev` — يستخدم `npx tsx` لتشغيل Express في وضع التطوير

**المتغيرات البيئية:**
```yaml
DATABASE_URL: postgres://hruser:***@hr-db:5432/hr_db
NODE_ENV: development
PORT: 5002
COOKIE_SECURE: "false"
SESSION_SECRET: ***
```

**Volumes الحيّة (Hot Reload):**
- `./hr-app/client` → `/app/client`
- `./hr-app/server` → `/app/server`
- `./hr-app/shared` → `/app/shared`
- `./hr_storage` → `/app/storage`

**بيانات الدخول الافتراضية:**
| الحقل | القيمة |
|-------|--------|
| اسم المستخدم | `admin` |
| كلمة المرور | `123456` |

> ⚠️ غيّر كلمة المرور فور الدخول الأول

---

### 🌐 Nginx Proxy Manager

| الخاصية | القيمة |
|---------|--------|
| الحاوية | `proteach-npm` |
| المنافذ المكشوفة | `80` (HTTP) · `443` (HTTPS) · `81` (لوحة التحكم) |
| الرابط | [proxy.sidawin8n.cfd](https://proxy.sidawin8n.cfd) |
| SSL | Let's Encrypt تلقائي |
| البيانات الدائمة | `./npm_data` + `./npm_letsencrypt` |

**جدول التوجيه (Proxy Hosts):**

| النطاق | الحاوية الهدف | المنفذ |
|--------|--------------|--------|
| `n8n.sidawin8n.cfd` | `proteach-n8n` | `5678` |
| `wa.sidawin8n.cfd` | `proteach-wa-dashboard` | `5000` |
| `wa-api.sidawin8n.cfd` | `proteach-wa-api` | `8080` |
| `hr.sidawin8n.cfd` | `proteach-hr-app` | `5002` |
| `admin.sidawin8n.cfd` | `proteach-portainer` | `9000` |
| `proxy.sidawin8n.cfd` | `localhost` | `81` |

---

### 🐳 Portainer — إدارة الحاويات

| الخاصية | القيمة |
|---------|--------|
| الحاوية | `proteach-portainer` |
| المنفذ الداخلي | `9000` |
| الرابط الخارجي | [admin.sidawin8n.cfd](https://admin.sidawin8n.cfd) |
| الحماية | `no-new-privileges: true` |

---

### 🗄️ قواعد البيانات

| الحاوية | الصورة | قاعدة البيانات | المستخدم |
|---------|--------|---------------|---------|
| `proteach-db` | PostgreSQL 16 | `n8n_database` | `n8n_user` |
| `proteach-wa-db` | PostgreSQL 15 | `whatsapp_manager_db` | `wauser` |
| `proteach-hr-db` | PostgreSQL 15 | `hr_db` | `hruser` |

> جميع قواعد البيانات داخلية فقط — غير مكشوفة للخارج

---

## هيكل المجلدات

```
proteach-n8n/
├── docker-compose.yaml          # إدارة جميع الحاويات
├── .env                         # المتغيرات البيئية
├── backup.sh                    # النسخ الاحتياطي اليومي
├── Automation_And_Backup_Guide.md
│
├── hr-app/                      # [submodule] ibrahims78/employee-management-system
│   ├── Dockerfile.dev
│   ├── entrypoint.dev.sh
│   ├── client/                  # React 18 + Vite
│   ├── server/                  # Express.js v5
│   └── shared/                  # Drizzle schema + types
│
├── whatsapp-manager/            # [submodule] ibrahims78/WhatsApp-Bot
│   ├── Dockerfile.api.dev       # Node20 + Chromium + WPPConnect
│   ├── Dockerfile.dashboard.dev
│   ├── artifacts/api-server/src/routes/
│   │   ├── send.ts              # إرسال: نص، صورة، فيديو، صوت، ملف
│   │   ├── sessions.ts          # إدارة جلسات الواتساب
│   │   ├── auth.ts              # تسجيل الدخول + JWT
│   │   └── users.ts             # إدارة المستخدمين
│   └── lib/                     # المكتبات المشتركة
│
├── postgres_data/               # بيانات قاعدة n8n (دائمة)
├── n8n_data/                    # ورك فلو + إعدادات n8n (دائمة)
├── wa_postgres_data/            # بيانات قاعدة الواتساب (دائمة)
├── wa_tokens/                   # جلسات WPPConnect/Chromium (دائمة)
├── wa_public/                   # ملفات عامة للواتساب (دائمة)
├── hr_postgres_data/            # بيانات قاعدة الموظفين (دائمة)
├── hr_storage/                  # مستندات الموظفين (دائمة)
├── npm_data/                    # إعدادات Nginx (دائمة)
├── npm_letsencrypt/             # شهادات SSL (دائمة)
└── portainer_data/              # بيانات Portainer (دائمة)
```

---

## التثبيت من الصفر

### 1. تثبيت Docker

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker
```

### 2. استنساخ المستودع

```bash
git clone --recurse-submodules git@github.com:ibrahims78/proteach-n8n-setup.git
cd proteach-n8n-setup
```

### 3. استنساخ مشاريع الأنظمة الفرعية

```bash
# نظام الموظفين
git clone https://github.com/ibrahims78/employee-management-system hr-app

# نظام الواتساب
git clone https://github.com/ibrahims78/WhatsApp-Bot whatsapp-manager
```

### 4. إعداد المتغيرات البيئية

```bash
cp .env.example .env
nano .env
```

```env
# CORS — نطاق لوحة تحكم الواتساب
ALLOWED_ORIGINS=https://wa.sidawin8n.cfd
```

### 5. تشغيل جميع الخدمات

```bash
sudo docker-compose up -d
```

---

## إعداد Cloudflare و Nginx

### Cloudflare — DNS Records

أضف سجل **A** لكل نطاق فرعي يشير إلى IP السيرفر:

| الاسم | النوع | القيمة | Proxy |
|-------|-------|--------|-------|
| `n8n` | A | `34.179.180.10` | ✅ |
| `wa` | A | `34.179.180.10` | ✅ |
| `wa-api` | A | `34.179.180.10` | ✅ |
| `hr` | A | `34.179.180.10` | ✅ |
| `admin` | A | `34.179.180.10` | ✅ |
| `proxy` | A | `34.179.180.10` | ✅ |

> SSL Mode: **Full (Strict)**

### Nginx Proxy Manager — Proxy Hosts

| النطاق | Forward Host | Forward Port |
|--------|-------------|-------------|
| `n8n.sidawin8n.cfd` | `proteach-n8n` | `5678` |
| `wa.sidawin8n.cfd` | `proteach-wa-dashboard` | `5000` |
| `wa-api.sidawin8n.cfd` | `proteach-wa-api` | `8080` |
| `hr.sidawin8n.cfd` | `proteach-hr-app` | `5002` |
| `admin.sidawin8n.cfd` | `proteach-portainer` | `9000` |
| `proxy.sidawin8n.cfd` | `localhost` | `81` |

---

## النسخ الاحتياطي

يعمل `backup.sh` يومياً عند **3:00 AM** عبر Cron:

```bash
# عرض جدول Cron
crontab -l

# تشغيل يدوي
bash ~/proteach-n8n/backup.sh
```

**المجلدات المشمولة في النسخة:**

| المجلد | الوصف |
|--------|-------|
| `n8n_data/` | ورك فلو وإعدادات n8n |
| `wa_postgres_data/` | قاعدة بيانات الواتساب |
| `wa_tokens/` | جلسات WPPConnect |
| `wa_public/` | الملفات العامة |
| `docker-compose.yaml` | ملف الإعدادات الرئيسي |
| `*.md` | ملفات التوثيق |

> ⚠️ **ملاحظة:** `hr_storage/` لا تُضمَّن تلقائياً في backup.sh — أضفها يدوياً إذا أردت نسخ مستندات الموظفين

---

## إجراءات التحديث

### تحديث نظام الموظفين (hr-app)

```bash
# سحب آخر تحديثات
cd ~/proteach-n8n/hr-app && git pull origin main

# في حال ظهور تعارض:
git stash
mv Dockerfile.dev Dockerfile.dev.bak 2>/dev/null
mv entrypoint.dev.sh entrypoint.dev.sh.bak 2>/dev/null
git pull origin main

# إعادة بناء الحاوية فقط
cd ~/proteach-n8n && sudo docker-compose up -d --build hr-app

# مراقبة السجلات
sudo docker-compose logs -f hr-app
```

### تحديث نظام الواتساب (wa-api + wa-dashboard)

```bash
cd ~/proteach-n8n/whatsapp-manager && git pull origin main
cd ~/proteach-n8n && sudo docker-compose up -d --build wa-api wa-dashboard
```

### تحديث n8n

```bash
cd ~/proteach-n8n
sudo docker-compose pull n8n
sudo docker-compose up -d n8n
```

---

## أوامر مفيدة

```bash
# حالة جميع الحاويات
sudo docker-compose ps

# سجلات حاوية محددة
sudo docker-compose logs -f hr-app
sudo docker-compose logs -f wa-api
sudo docker-compose logs --tail=50 n8n

# إعادة تشغيل حاوية واحدة
sudo docker-compose restart hr-app

# إحصائيات الموارد
sudo docker stats --no-stream

# فحص جلسات الواتساب
curl -s http://localhost:5005/api/sessions \
  -H "x-api-key: <YOUR_API_KEY>" | python3 -m json.tool
```

---

## API الواتساب

### نقطة الوصول الداخلية

```
http://proteach-wa-api:8080
```
> يعمل فقط داخل شبكة Docker (`n8n-network`)

### إرسال رسالة نصية

```bash
POST /api/send/text
Content-Type: application/json
x-api-key: <YOUR_API_KEY>

{
  "sessionId": "session_de11c7693988",
  "number": "963XXXXXXXXX",
  "message": "نص الرسالة"
}
```

### أنواع الإرسال المدعومة

| النوع | المسار | الحقول المطلوبة |
|-------|--------|----------------|
| نص | `POST /api/send/text` | `sessionId, number, message` |
| صورة | `POST /api/send/image` | `sessionId, number, imageUrl, caption?` |
| فيديو | `POST /api/send/video` | `sessionId, number, videoUrl, caption?` |
| صوت | `POST /api/send/audio` | `sessionId, number, audioUrl` |
| ملف | `POST /api/send/file` | `sessionId, number, fileUrl, fileName, caption?` |

### الاستجابة عند النجاح

```json
{ "success": true, "messageId": null }
```

### قواعد الإرسال المهمة

- الرقم بصيغة دولية بدون `+` — مثال: `963948500505`
- لا يمكن لجلسة أن ترسل لنفس رقمها
- الرسالة تُرسَل من الجلسة المحددة بـ `sessionId`

---

## ⚠️ قواعد مهمة

1. **لا تعدّل الـ Volumes** — مسارات التخزين الدائمة يجب أن تبقى كما هي
2. **المنافذ المحجوزة** — 80، 81، 443 محجوزة لـ Nginx فقط
3. **git pull قبل التعديل** — لتجنب تعارض النسخ
4. **الشبكة الموحدة** — جميع الحاويات يجب أن تبقى على `n8n-network`
5. **لا تضف مجلدات بيانات حساسة للـ .gitignore** — تأكد من إضافة `hr_storage/` و `wa_tokens/` إلى `.gitignore`

---

<div align="center">

**تم التطوير والإدارة بواسطة إبراهيم الصيداوي**
آخر تحديث: أبريل 2026

</div>
