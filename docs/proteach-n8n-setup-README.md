# 🛡️ ProTeach Infrastructure — البنية التحتية الكاملة

<div dir="rtl">

نظام إدارة متكامل يضم ثلاثة أنظمة فرعية تعمل على سيرفر واحد عبر Docker Compose، مع بنية تحتية آمنة ومُدارة بالكامل.

</div>

<p align="center">
  <img src="https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker" alt="Docker"/>
  <img src="https://img.shields.io/badge/Ubuntu-24.04_LTS-E95420?style=for-the-badge&logo=ubuntu" alt="Ubuntu"/>
  <img src="https://img.shields.io/badge/GCP-Cloud-4285F4?style=for-the-badge&logo=googlecloud" alt="GCP"/>
  <img src="https://img.shields.io/badge/Nginx-Proxy_Manager-009639?style=for-the-badge&logo=nginx" alt="Nginx"/>
  <img src="https://img.shields.io/badge/n8n-Automation-EA4B71?style=for-the-badge" alt="n8n"/>
</p>

---

## 📋 الفهرس

- [نبذة عن المشروع](#نبذة-عن-المشروع)
- [معلومات السيرفر](#معلومات-السيرفر)
- [خريطة الخدمات](#خريطة-الخدمات)
- [هيكل المجلدات](#هيكل-المجلدات)
- [الأمان والحماية](#الأمان-والحماية)
- [النسخ الاحتياطي](#النسخ-الاحتياطي)
- [إجراءات التحديث](#إجراءات-التحديث)
- [أوامر مفيدة](#أوامر-مفيدة)

---

## نبذة عن المشروع

<div dir="rtl">

يضم هذا المستودع الإعدادات الكاملة لتشغيل منظومة **ProTeach** على سيرفر GCP، وتشمل:

1. **n8n**: محرك الأتمتة وإدارة سير العمل
2. **HR App**: نظام إدارة الموظفين (Node.js + React + PostgreSQL)
3. **WA Manager**: نظام إدارة رسائل الواتساب (API + Dashboard)
4. **Nginx Proxy Manager**: إدارة التوجيه وشهادات SSL
5. **Portainer**: إدارة الحاويات عبر واجهة رسومية

</div>

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

## خريطة الخدمات

### 🌐 روابط الوصول الخارجي

| الخدمة | الرابط | المنفذ الداخلي | الحاوية |
|--------|--------|----------------|---------|
| نظام الموظفين (HR) | [hr.sidawin8n.cfd](https://hr.sidawin8n.cfd) | 5002 | `proteach-hr-app` |
| لوحة الأتمتة (n8n) | [n8n.sidawin8n.cfd](https://n8n.sidawin8n.cfd) | 5678 | `proteach-n8n` |
| مدير الواتساب (WA) | [wa.sidawin8n.cfd](https://wa.sidawin8n.cfd) | 5000 | `proteach-wa-dashboard` |
| API الواتساب | [wa-api.sidawin8n.cfd](https://wa-api.sidawin8n.cfd) | 8080 | `proteach-wa-api` |
| إدارة الحاويات | [admin.sidawin8n.cfd](https://admin.sidawin8n.cfd) | 9000 | `proteach-portainer` |
| مدير التوجيه | [proxy.sidawin8n.cfd](https://proxy.sidawin8n.cfd) | 81 | `proteach-npm` |

### 🗄️ قواعد البيانات (داخلية فقط)

| الحاوية | قاعدة البيانات | المستخدم | الحاوية |
|---------|---------------|---------|---------|
| n8n DB | `n8n_database` | `n8n_user` | `proteach-db` (PostgreSQL 16) |
| WA DB | `whatsapp_manager_db` | `wauser` | `proteach-wa-db` (PostgreSQL 15) |
| HR DB | `hr_db` | `hruser` | `proteach-hr-db` (PostgreSQL 15) |

---

## هيكل المجلدات

```
proteach-n8n/
├── docker-compose.yaml          # ملف إدارة جميع الحاويات
├── backup.sh                    # سكريبت النسخ الاحتياطي اليومي
│
├── hr-app/                      # كود نظام إدارة الموظفين
│   ├── Dockerfile.dev           # ملف بناء حاوية التطوير
│   ├── entrypoint.dev.sh        # نقطة دخول حاوية التطوير
│   ├── client/                  # الواجهة الأمامية (React)
│   ├── server/                  # الخادم (Express.js)
│   └── shared/                  # الكود المشترك
│
├── whatsapp-manager/            # كود نظام الواتساب
│   ├── Dockerfile.api.dev       # ملف بناء حاوية wa-api
│   ├── Dockerfile.dashboard.dev # ملف بناء حاوية wa-dashboard
│   ├── artifacts/               # ملفات المشروع المُجمَّعة
│   └── lib/                     # المكتبات المشتركة
│
├── postgres_data/               # بيانات قاعدة n8n (دائمة)
├── n8n_data/                    # بيانات n8n الداخلية (دائمة)
├── wa_postgres_data/            # بيانات قاعدة الواتساب (دائمة)
├── wa_tokens/                   # رموز جلسات الواتساب (دائمة)
├── wa_public/                   # ملفات عامة للواتساب (دائمة)
├── hr_postgres_data/            # بيانات قاعدة الموظفين (دائمة)
├── hr_storage/                  # ملفات الموظفين والمستندات (دائمة)
├── npm_data/                    # بيانات Nginx Proxy Manager (دائمة)
├── npm_letsencrypt/             # شهادات SSL (دائمة)
└── portainer_data/              # بيانات Portainer (دائمة)
```

---

## الأمان والحماية

<div dir="rtl">

### جدار الحماية (UFW)
```bash
# المنافذ المسموح بها فقط
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
```

### SSL/TLS
- جميع الروابط محمية بشهادات **Let's Encrypt** تتجدد تلقائياً عبر Nginx Proxy Manager

### Cloudflare
- وضع **Full (Strict)** مفعّل لحماية DNS وتشفير حركة المرور بالكامل

### Docker
- حاوية Portainer محمية بـ `no-new-privileges: true`
- جميع الحاويات على شبكة داخلية معزولة `n8n-network`
- قواعد البيانات غير مكشوفة للخارج

</div>

---

## النسخ الاحتياطي

<div dir="rtl">

يعمل سكريبت `backup.sh` تلقائياً يومياً الساعة **3:00 AM** عبر Cron Job:

```bash
# عرض جدول Cron
crontab -l

# تشغيل النسخ الاحتياطي يدوياً
bash ~/proteach-n8n/backup.sh
```

### المجلدات المحمية في النسخ الاحتياطي

| المجلد | الوصف |
|--------|-------|
| `n8n_data/` | ورك فلو n8n والإعدادات |
| `wa_tokens/` | رموز جلسات الواتساب |
| `hr_storage/` | مستندات وملفات الموظفين |
| `wa_postgres_data/` | قاعدة بيانات الواتساب |
| `hr_postgres_data/` | قاعدة بيانات الموظفين |

> ⚠️ **ملاحظة**: عند إضافة مجلد جديد يحتاج تخزيناً دائماً، أضفه يدوياً في `backup.sh`

</div>

---

## إجراءات التحديث

### تحديث نظام الموظفين (HR App)

```bash
# 1. سحب آخر تحديثات من GitHub
cd ~/proteach-n8n/hr-app && git pull origin main

# في حال ظهور تعارض في الملفات:
git stash
mv Dockerfile.dev Dockerfile.dev.bak 2>/dev/null
mv entrypoint.dev.sh entrypoint.dev.sh.bak 2>/dev/null
git pull origin main

# 2. إعادة بناء وتشغيل الحاوية فقط
cd ~/proteach-n8n && sudo docker-compose up -d --build hr-app

# 3. مراقبة السجلات
sudo docker-compose logs -f hr-app
```

### تحديث نظام الواتساب (WA Manager)

```bash
cd ~/proteach-n8n && sudo docker-compose up -d --build wa-api wa-dashboard
```

### تحديث n8n

```bash
cd ~/proteach-n8n
sudo docker-compose pull n8n
sudo docker-compose up -d n8n
```

### تحديث البنية التحتية الكاملة (بحذر)

```bash
cd ~/proteach-n8n
git pull origin master
sudo docker-compose up -d
```

---

## أوامر مفيدة

### مراقبة الحاويات

```bash
# حالة جميع الحاويات
sudo docker-compose ps

# سجلات حاوية محددة
sudo docker-compose logs -f hr-app
sudo docker-compose logs -f n8n
sudo docker-compose logs --tail=50 wa-api

# إحصائيات استخدام الموارد
sudo docker stats
```

### إدارة الحاويات

```bash
# إيقاف وتشغيل حاوية واحدة
sudo docker-compose restart hr-app

# إيقاف جميع الحاويات (لا يحذف البيانات)
sudo docker-compose down

# إعادة تشغيل الكل
sudo docker-compose up -d
```

### اختبار API الواتساب من داخل الشبكة

```bash
# من داخل حاوية hr-app
sudo docker exec proteach-hr-app node -e "
fetch('http://proteach-wa-api:8080/api/send/text', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': '<YOUR_API_KEY>'
  },
  body: JSON.stringify({
    sessionId: '<SESSION_ID>',
    number: '<PHONE_NUMBER>',
    message: 'test'
  })
}).then(r => r.text()).then(console.log)
"
```

### فحص جلسات الواتساب

```bash
curl -s http://localhost:5005/api/sessions \
  -H "x-api-key: <YOUR_API_KEY>" | python3 -m json.tool
```

---

## ⚠️ قواعد مهمة

<div dir="rtl">

1. **لا تعدّل الـ Volumes**: مسارات التخزين الدائمة يجب أن تبقى كما هي لضمان عدم فقدان البيانات
2. **لا تستخدم المنافذ**: 80، 81، 443 محجوزة لـ Nginx Proxy Manager
3. **git pull قبل التعديل**: دائماً اسحب آخر نسخة قبل أي تعديل لتجنب تعارض النسخ
4. **الشبكة الموحدة**: جميع الحاويات يجب أن تبقى على `n8n-network`
5. **وضع التطوير**: `NODE_ENV=development` في hr-app و wa-app للحفاظ على Hot Reload

</div>

---

<div align="center">

**تم التطوير والإدارة بواسطة إبراهيم الصيداوي**  
آخر تحديث: أبريل 2026

</div>
