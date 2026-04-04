# 📊 تقرير شامل — البنية التحتية ProTeach VPS
**التاريخ:** 4 أبريل 2026 | **المطور:** إبراهيم الصيداوي

---

## ما تم تحقيقه في هذه الجلسة

### 1. المستودعات التي تم فحصها
| المستودع | الحالة | اللغة |
|----------|--------|-------|
| `ibrahims78/proteach-n8n-setup` | ✅ عام (تم التحقق) | Shell |
| `ibrahims78/WhatsApp-Bot` | ✅ عام (تم التحقق) | TypeScript |

### 2. الملفات التي تم قراءتها وتحليلها
- `docker-compose.yaml` — الملف الرئيسي لجميع الحاويات الـ 8
- `.env` — ملف المتغيرات البيئية
- `backup.sh` — سكريبت النسخ الاحتياطي اليومي
- `artifacts/api-server/src/routes/send.ts` — كامل كود نقاط إرسال الواتساب
- `artifacts/api-server/src/routes/sessions.ts` — كود إدارة جلسات الواتساب
- `Dockerfile.api.dev` — ملف بناء حاوية wa-api
- `.env.example` — نموذج المتغيرات البيئية لمشروع الواتساب
- `README_proteach_n8n.md` — وثيقة الإعداد الموجودة في مستودع الواتساب

---

## معلومات البنية التحتية المُكتشفة

### السيرفر
```
GCP Ubuntu 24.04 LTS | IP: 34.179.180.10
المسار: /home/ibrahimsidawi/proteach-n8n/
الشبكة: n8n-network (Docker Bridge)
```

### الحاويات الـ 8 الكاملة

| # | الحاوية | الصورة/المصدر | المنفذ | الرابط |
|---|---------|--------------|--------|--------|
| 1 | `proteach-db` | postgres:16-alpine | داخلي | — |
| 2 | `proteach-n8n` | n8nio/n8n:latest | 5678 | n8n.sidawin8n.cfd |
| 3 | `proteach-npm` | jc21/nginx-proxy-manager | 80/81/443 | proxy.sidawin8n.cfd |
| 4 | `proteach-portainer` | portainer-ce:latest | 9000 | admin.sidawin8n.cfd |
| 5 | `proteach-wa-db` | postgres:15-alpine | داخلي | — |
| 6 | `proteach-wa-api` | WhatsApp-Bot (TypeScript) | 8080 | wa-api.sidawin8n.cfd |
| 7 | `proteach-wa-dashboard` | WhatsApp-Bot (Vite) | 5000 (5005 خارجي) | wa.sidawin8n.cfd |
| 8 | `proteach-hr-app` | employee-management-system | 5002 | hr.sidawin8n.cfd |
| — | `proteach-hr-db` | postgres:15-alpine | داخلي | — |

> ملاحظة: العدد الفعلي 9 حاويات شاملاً hr-db

### تفاصيل wa-api (المكتشفة من الكود)

نقاط الإرسال المدعومة:
```
POST /api/send/text    ← نص (sessionId, number, message)
POST /api/send/image   ← صورة (+ caption اختياري)
POST /api/send/video   ← فيديو (+ caption اختياري)
POST /api/send/audio   ← صوت (voice note أو ملف صوتي)
POST /api/send/file    ← ملف عام (+ fileName, caption)
```

مميزات متقدمة مُكتشفة في الكود:
- **آلية Retry ذكية**: عند فشل @c.us تجرب تلقائياً @lid (للحسابات متعددة الأجهزة)
- **Temp files**: الوسائط base64 تُحفظ مؤقتاً وتُحذف بعد الإرسال
- **Feature flags**: يمكن تعطيل أنواع إرسال محددة لكل جلسة
- **Audit logs**: جميع الإرسالات مُسجَّلة في قاعدة البيانات
- **Rate limiting**: حماية من الإرسال الزائد
- **Phone validation**: التحقق من صحة أرقام E.164 (7-15 رقم)

### تفاصيل hr-app
- **Framework**: React 18 + Express.js v5 + TypeScript
- **ORM**: Drizzle + PostgreSQL 15
- **Port الداخلي**: 5002
- **Hot Reload**: مفعّل عبر volumes مباشرة على السورس كود
- **SESSION_SECRET**: محفوظ في docker-compose.yaml
- **المستودع**: github.com/ibrahims78/employee-management-system (main)

### تفاصيل n8n
- **الإصدار**: latest (يتحدث تلقائياً)
- **الوضع**: production
- **WEBHOOK_URL**: https://n8n.sidawin8n.cfd/
- **قاعدة بيانات**: PostgreSQL 16 (أحدث إصدار)
- **البيانات**: n8n_data/ يحتوي ورك فلو وإعدادات

### تفاصيل Nginx Proxy Manager
- **المنافذ المكشوفة**: 80, 81, 443 فقط (صحيح)
- **SSL**: Let's Encrypt تلقائي
- **البيانات الدائمة**: npm_data/ + npm_letsencrypt/
- **التوجيه**: يعمل كـ reverse proxy لجميع الخدمات

### تفاصيل backup.sh
```bash
# الجدول: يومياً 3:00 AM
# يشمل: n8n_data, wa_postgres_data, wa_tokens, wa_public, docker-compose.yaml, *.md
# لا يشمل: hr_storage, hr_postgres_data, postgres_data, npm_data, portainer_data
# يرفع تلقائياً: git push origin master
# يحذف النسخ القديمة: rm -f proteach_full_backup_*.tar.gz
```

---

## المشاكل المُكتشفة والحلول

### 🔴 المشكلة 1 — مستندات الموظفين الحقيقيين مرفوعة على GitHub

**الوضع الحالي:**
- `hr_storage/uploads/10000000489_سامر محمد المصري/` مرفوع
- `hr_storage/uploads/10000000548_خالد زاهر الحداد/` مرفوع
- `hr_storage/uploads/10000000603_سعيد محمد الزين/` مرفوع
- `hr_storage/uploads/10000000617_فادي منير النجار/` مرفوع
- ملفات Excel وWord تحتوي بيانات موظفين — مرفوعة

**الحل الكامل:** (راجع `docs/vps-security-fixes.md`)
```bash
git rm -r --cached hr_storage/ n8n_data/
git rm --cached proteach_full_backup_*.tar.gz
# ← إضافة للـ .gitignore ← commit ← push
```

### 🟡 المشكلة 2 — المنفذ 5005 مكشوف خارجياً

**الوضع الحالي:** `wa-dashboard` يكشف المنفذ `5005:5000` مباشرة بدون SSL

**الحل:** إزالة `ports:` من `wa-dashboard` في docker-compose.yaml ثم:
```bash
sudo docker-compose up -d --no-deps wa-dashboard
```

### 🟢 المشكلة 3 — `version: '3.8'` مهملة

**الحل:**
```bash
sed -i '/^version:/d' docker-compose.yaml
```

---

## الملفات التي تم إنشاؤها/تحديثها

| الملف | الوصف |
|-------|-------|
| `docs/proteach-n8n-setup-README.md` | ✅ **محدَّث** — README شامل لمستودع proteach-n8n-setup |
| `docs/proteach-vps-report.md` | ✅ **محدَّث** — هذا التقرير |
| `docs/vps-security-fixes.md` | ✅ **جديد** — أوامر إصلاح المشاكل الأمنية |

---

## ما يحتاج منك

1. **نسخ `docs/proteach-n8n-setup-README.md`** إلى مستودع `proteach-n8n-setup` باسم `README.md`
2. **تنفيذ الأوامر في `docs/vps-security-fixes.md`** على السيرفر بالترتيب
3. **إبلاغك**: هل تريد إضافة `hr_storage/` إلى backup.sh أيضاً؟

---

## توصيات مستقبلية

| التوصية | الأولوية |
|---------|---------|
| نقل كلمات مرور قواعد البيانات من docker-compose إلى .env | عالية |
| تفعيل Fail2Ban لحماية SSH | متوسطة |
| مراقبة تلقائية لصحة الحاويات (health alerts) | متوسطة |
| نسخ احتياطي إلى خارج السيرفر (S3/Drive) | منخفضة |
