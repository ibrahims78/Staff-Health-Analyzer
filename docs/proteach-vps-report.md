# 📊 تقرير شامل — مستودع proteach-n8n-setup
**التاريخ:** 3 أبريل 2026 | **المطور:** إبراهيم الصيداوي

---

## 1. نبذة عامة

مستودع `proteach-n8n-setup` هو ملف الإدارة المركزي للبنية التحتية الكاملة لمشروع **ProTeach** على سيرفر GCP. يحتوي على ملف `docker-compose.yaml` الذي يُشغّل **8 حاويات** متكاملة تُغطي 3 أنظمة رئيسية + خدمات البنية التحتية.

---

## 2. معلومات السيرفر

| العنصر | القيمة |
|--------|--------|
| المزود | Google Cloud Platform (GCP) |
| عنوان IP | 34.179.180.10 |
| نظام التشغيل | Ubuntu 24.04 LTS |
| المسار الرئيسي | `/home/ibrahimsidawi/proteach-n8n/` |
| الشبكة الداخلية | `n8n-network` (Docker Bridge) |
| المستودع على GitHub | `git@github.com:ibrahims78/proteach-n8n-setup.git` |
| الفرع الرئيسي | `master` |

---

## 3. خريطة الخدمات الكاملة

### أ. خدمات البنية التحتية الأساسية

| الحاوية | الصورة | المنفذ الداخلي | الرابط الخارجي | الوظيفة |
|---------|--------|----------------|----------------|---------|
| `proteach-n8n` | `n8nio/n8n:latest` | 5678 | `n8n.sidawin8n.cfd` | محرك الأتمتة |
| `proteach-db` | `postgres:16-alpine` | 5432 | داخلي فقط | قاعدة بيانات n8n |
| `proteach-npm` | `jc21/nginx-proxy-manager:latest` | 80, 81, 443 | `proxy.sidawin8n.cfd` | إدارة التوجيه وSSL |
| `proteach-portainer` | `portainer/portainer-ce:latest` | 9000 | `admin.sidawin8n.cfd` | إدارة الحاويات |

### ب. نظام إدارة الواتساب (WA Manager)

| الحاوية | المنفذ الداخلي | الرابط الخارجي | الوظيفة |
|---------|----------------|----------------|---------|
| `proteach-wa-api` | 8080 | `wa-api.sidawin8n.cfd` | محرك معالجة الواتساب |
| `proteach-wa-dashboard` | 5000 (5005 خارجي مؤقت) | `wa.sidawin8n.cfd` | واجهة إدارة الواتساب |
| `proteach-wa-db` | 5432 | داخلي فقط | قاعدة بيانات الواتساب |

### ج. نظام إدارة الموظفين (HR App)

| الحاوية | المنفذ الداخلي | الرابط الخارجي | الوظيفة |
|---------|----------------|----------------|---------|
| `proteach-hr-app` | 5002 | `hr.sidawin8n.cfd` | تطبيق إدارة الموظفين |
| `proteach-hr-db` | 5432 | داخلي فقط | قاعدة بيانات الموظفين |

---

## 4. قواعد البيانات

| القاعدة | الحاوية | المستخدم | كلمة المرور | الاسم |
|---------|---------|---------|------------|-------|
| n8n | proteach-db | n8n_user | VMware2@ | n8n_database |
| WhatsApp | proteach-wa-db | wauser | WaPass2026! | whatsapp_manager_db |
| HR | proteach-hr-db | hruser | HrPass2026! | hr_db |

---

## 5. الوضع الحالي للحاويات

### hr-app — وضع التطوير (Development)
```yaml
NODE_ENV: development
PORT: 5002
dockerfile: Dockerfile.dev
```
**Volumes المتزامنة:**
- `./hr-app/client` → `/app/client`
- `./hr-app/server` → `/app/server`
- `./hr-app/shared` → `/app/shared`
- `./hr_storage` → `/app/storage`

### wa-api — وضع التطوير (Development)
```yaml
NODE_ENV: development
PORT: 8080
dockerfile: Dockerfile.api.dev
```

### wa-dashboard — وضع التطوير (Development)
```yaml
NODE_ENV: development
PORT: 5000
VITE_API_TARGET: http://wa-api:8080
dockerfile: Dockerfile.dashboard.dev
```

---

## 6. بروتوكول الأمان

| الطبقة | الإعداد |
|--------|---------|
| جدار الحماية UFW | يسمح فقط بالمنافذ: 22, 80, 443 |
| SSL/TLS | شهادات Let's Encrypt عبر Nginx Proxy Manager |
| Cloudflare | وضع Full (Strict) — حماية DNS وتشفير المرور |
| Docker | حاوية Portainer محمية بـ `no-new-privileges: true` |

---

## 7. النسخ الاحتياطي التلقائي

| العنصر | التفاصيل |
|--------|---------|
| السكريبت | `~/proteach-n8n/backup.sh` |
| الجدول | يومياً الساعة 3:00 AM (Cron Job) |
| المجلدات المحمية | `n8n_data`, `wa_tokens`, `hr_storage`, `wa_postgres_data`, `hr_postgres_data` |
| الوجهة | Git push إلى `master` تلقائياً |
| السجل | `backup.log` |

---

## 8. إجراء تحديث hr-app من GitHub

```bash
# الخطوة 1: سحب الكود الجديد
cd ~/proteach-n8n/hr-app && git pull origin main

# الخطوة 2: إعادة بناء الحاوية فقط (لا تؤثر على الخدمات الأخرى)
cd ~/proteach-n8n && sudo docker-compose up -d --build hr-app

# الخطوة 3: مراقبة السجلات
sudo docker-compose logs -f hr-app
```

---

## 9. نقاط القوة في البنية الحالية

- **عزل كامل**: كل نظام له قاعدة بيانات مستقلة
- **شبكة داخلية موحدة**: جميع الحاويات على `n8n-network` تتواصل بأسماء الحاويات
- **Hot Reload**: في وضع التطوير، أي تعديل في الكود ينعكس فوراً بدون إعادة بناء
- **SSL تلقائي**: Nginx Proxy Manager يجدد الشهادات تلقائياً
- **نسخ احتياطي يومي**: آلي عبر Cron + Git

---

## 10. نقاط تحتاج انتباهاً

| المشكلة | التوصية |
|---------|---------|
| بيانات الاعتماد مكشوفة في docker-compose.yaml | نقلها لملف `.env` غير مرفوع على GitHub |
| المنفذ 5005 مكشوف للخارج (wa-dashboard) | إزالته والاعتماد على Nginx بالكامل |
| وضع التطوير في الإنتاج | مناسب حالياً لكن يجب مراجعته قبل الإطلاق الرسمي |
| `version: '3.8'` في docker-compose | مهمل في Docker Compose الحديث (تحذير، ليس خطأ) |
