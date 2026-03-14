# 🐳 دليل النشر الكامل — ويندوز 10 + Docker

<div dir="rtl">

> هذا الدليل يشرح بالتفصيل كل خطوة لتشغيل برنامج **ذاتية الموظفين** على سيرفر محلي يعمل بنظام Windows 10 باستخدام Docker.

---

## 📋 جدول المحتويات

1. [المتطلبات الأساسية](#1-المتطلبات-الأساسية)
2. [تفعيل WSL2 (مرحلة إعداد ويندوز)](#2-تفعيل-wsl2)
3. [تثبيت Docker Desktop](#3-تثبيت-docker-desktop)
4. [تثبيت Git (إن لم يكن موجوداً)](#4-تثبيت-git)
5. [التثبيت التلقائي — ملف setup.bat](#5-التثبيت-التلقائي--ملف-setupbat) ⭐
6. [التثبيت اليدوي (خطوة بخطوة)](#6-التثبيت-اليدوي-خطوة-بخطوة)
7. [فهم بنية الحاويات](#7-فهم-بنية-الحاويات)
8. [عمليات الصيانة اليومية](#8-عمليات-الصيانة-اليومية)
9. [تحديث البرنامج](#9-تحديث-البرنامج)
10. [النسخ الاحتياطي والاستعادة](#10-النسخ-الاحتياطي-والاستعادة)
11. [حل المشكلات الشائعة](#11-حل-المشكلات-الشائعة)

---

## 1. المتطلبات الأساسية

قبل البدء، تأكد أن جهازك يستوفي المتطلبات التالية:

| المتطلب | الحد الأدنى | الموصى به |
|---------|------------|-----------|
| نظام التشغيل | Windows 10 نسخة 1903 (Build 18362) | Windows 10 نسخة 21H2 أو أحدث |
| ذاكرة RAM | 4 جيجابايت | 8 جيجابايت |
| مساحة القرص | 5 جيجابايت | 10 جيجابايت |
| المعالج | يدعم Virtualization (VT-x / AMD-V) | أي معالج حديث |
| الإنترنت | مطلوب للتثبيت الأول فقط | — |

### كيف أعرف نسخة ويندوز لدي؟

اضغط `Windows + R` ثم اكتب `winver` واضغط Enter. ستظهر نافذة تُظهر رقم الإصدار والبناء (Build).

---

## 2. تفعيل WSL2

**WSL2** (Windows Subsystem for Linux) هو مكوّن ضروري يتيح لـ Docker العمل بكفاءة على ويندوز.

### الخطوة 1: فتح PowerShell كمسؤول

- ابحث عن **PowerShell** في قائمة ابدأ
- انقر بالزر الأيمن → اختر **"تشغيل كمسؤول"**
- اضغط **نعم** في نافذة UAC

### الخطوة 2: تفعيل مكونات WSL

```powershell
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
```

ثم:

```powershell
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart
```

### الخطوة 3: إعادة تشغيل الجهاز

```powershell
shutdown /r /t 0
```

### الخطوة 4: تحديث نواة Linux لـ WSL2

بعد إعادة التشغيل، افتح PowerShell كمسؤول مجدداً وشغّل:

```powershell
wsl --update
```

ثم اضبط WSL2 كإصدار افتراضي:

```powershell
wsl --set-default-version 2
```

للتحقق من نجاح الإعداد:

```powershell
wsl --status
```

يجب أن يظهر: `Default Version: 2`

> **ملاحظة:** إذا ظهر خطأ عند تشغيل `wsl --update`، قم بتنزيل حزمة تحديث نواة WSL2 يدوياً من:
> `https://aka.ms/wsl2kernel`

---

## 3. تثبيت Docker Desktop

### الخطوة 1: تحميل Docker Desktop

انتقل إلى الموقع الرسمي:
```
https://www.docker.com/products/docker-desktop
```
اضغط **"Download for Windows"** وانتظر اكتمال التحميل.

### الخطوة 2: تشغيل المثبّت

- شغّل ملف `Docker Desktop Installer.exe`
- في شاشة الخيارات، تأكد من تحديد:

```
✅ Use WSL 2 instead of Hyper-V         (مهم جداً — يُفعّل WSL2)
✅ Add shortcut to desktop              (اختياري)
```

- اضغط **OK** وانتظر اكتمال التثبيت
- عند الانتهاء، أعد تشغيل الجهاز إذا طُلب منك ذلك

### الخطوة 3: تشغيل Docker Desktop

- افتح **Docker Desktop** من سطح المكتب أو قائمة ابدأ
- انتظر حتى يظهر **أيقونة الحوت 🐳 باللون الأخضر** في شريط المهام (الزاوية السفلية اليمنى)
- هذا يعني أن Docker يعمل بشكل صحيح

> **⏱️ قد يستغرق بدء التشغيل الأول 1-3 دقائق.**

### الخطوة 4: التحقق من نجاح التثبيت

افتح **CMD** أو **PowerShell** وشغّل:

```cmd
docker --version
```
يجب أن يظهر: `Docker version 27.x.x, build ...`

```cmd
docker compose version
```
يجب أن يظهر: `Docker Compose version v2.x.x`

```cmd
docker run hello-world
```
إذا ظهرت رسالة `Hello from Docker!` فكل شيء يعمل بشكل صحيح.

### إعدادات الأداء الموصى بها في Docker Desktop

افتح Docker Desktop → **Settings** → **Resources**:

| الإعداد | القيمة الموصى بها |
|---------|-----------------|
| CPUs | نصف عدد النوى المتاحة |
| Memory | 4 GB على الأقل |
| Swap | 1 GB |
| Disk image size | 60 GB |

---

## 4. تثبيت Git

ملف `setup.bat` يقوم بتثبيت Git تلقائياً إذا لم يكن موجوداً. إذا أردت تثبيته يدوياً:

### الطريقة 1: التثبيت اليدوي

انتقل إلى:
```
https://git-scm.com/download/win
```
حمّل الإصدار الـ 64-bit وشغّل المثبّت مع الإعدادات الافتراضية.

### الطريقة 2: عبر PowerShell (Winget)

```powershell
winget install --id Git.Git -e --source winget
```

### التحقق من التثبيت

أغلق وأعد فتح CMD ثم:

```cmd
git --version
```
يجب أن يظهر رقم الإصدار.

---

## 5. التثبيت التلقائي — ملف setup.bat

هذه **الطريقة الأسهل والموصى بها**. ملف `setup.bat` يقوم بكل شيء تلقائياً.

### الخطوة 1: تحميل ملف الإعداد

افتح المتصفح وانتقل إلى:
```
https://raw.githubusercontent.com/ibrahims78/employee-management-system/main/setup.bat
```

- اضغط **كليك يمين** في أي مكان بالصفحة
- اختر **"حفظ باسم"** (Save As)
- احفظه على **سطح المكتب** باسم `setup.bat`

> **مهم:** تأكد أن الملف محفوظ بامتداد `.bat` وليس `.bat.txt`

### الخطوة 2: تشغيل الملف كمسؤول

- انقر بالزر الأيمن على `setup.bat`
- اختر **"تشغيل كمسؤول"** (Run as administrator)
- اضغط **نعم** في نافذة UAC

### ماذا يفعل ملف setup.bat خطوة بخطوة؟

```
═══════════════════════════════════════════════════
   Employee Management System - Setup Script
═══════════════════════════════════════════════════

[1/8] التحقق من صلاحيات المسؤول
      ↳ يتأكد أنك تشغّله كـ Administrator
      ↳ يتوقف بخطأ واضح إذا لم تكن لديك الصلاحيات

[2/8] التحقق من Git
      ↳ إذا لم يكن Git مثبتاً → يثبّته تلقائياً بصمت
      ↳ إذا كان موجوداً → يتابع مباشرة

[3/8] التحقق من Docker
      ↳ يتحقق أن Docker يعمل (ليس فقط مثبتاً)
      ↳ يتوقف إذا كان Docker Desktop مغلقاً

[4/8] تنزيل/تحديث المشروع من GitHub
      ↳ إذا كان المشروع موجوداً في C:\staff_health_2026
         → يسحب أحدث التغييرات (git pull)
      ↳ إذا لم يكن موجوداً
         → ينسخ المشروع كاملاً (git clone)

[5/8] إنشاء مجلدات التخزين
      ↳ ينشئ: C:\staff_health_2026\storage\uploads
      ↳ ينشئ: C:\staff_health_2026\storage\backups
      ↳ هذه المجلدات تُربط بالحاوية (Volume Mounting)

[6/8] بناء وتشغيل الحاويات
      ↳ يوقف أي حاويات قديمة (docker compose down)
      ↳ يبني الصورة من Dockerfile (docker compose up --build -d)
      ↳ يعيد المحاولة تلقائياً حتى 3 مرات عند فشل الشبكة
      ↳ ينظّف cache البناء بين المحاولات

[7/8] انتظار جاهزية التطبيق
      ↳ ينتظر 15 ثانية لإكمال التهيئة
      ↳ يعرض حالة الحاويات
      ↳ يعرض آخر 15 سطر من سجلات التطبيق
      ↳ يتحقق من أن الخادم يستجيب على المنفذ 5001

[8/8] الانتهاء
      ↳ يفتح المتصفح تلقائياً على http://localhost:5001
```

### الخطوة 3: انتظر اكتمال التثبيت

التثبيت الأول يستغرق عادةً **3-8 دقائق** (حسب سرعة الإنترنت) لأن Docker يقوم بتحميل وبناء الصور.

### الخطوة 4: الدخول للبرنامج

بعد اكتمال التثبيت، سيفتح المتصفح تلقائياً على:
```
http://localhost:5001
```

| الحقل | القيمة |
|-------|--------|
| اسم المستخدم | `admin` |
| كلمة المرور | `123456` |

> ⚠️ **مهم:** غيّر كلمة المرور فوراً من صفحة **المستخدمين** بعد أول دخول.

### إعادة التشغيل وتحديث البرنامج

عند الحاجة لتحديث البرنامج مستقبلاً، كل ما عليك هو تشغيل `setup.bat` مرة أخرى. سيقوم تلقائياً بسحب أحدث إصدار وإعادة البناء.

---

## 6. التثبيت اليدوي (خطوة بخطوة)

إذا أردت التحكم الكامل في العملية:

### الخطوة 1: فتح PowerShell في المجلد الصحيح

```powershell
mkdir C:\staff_health_2026
cd C:\staff_health_2026
```

### الخطوة 2: تنزيل المشروع من GitHub

```powershell
git clone https://github.com/ibrahims78/employee-management-system.git C:\staff_health_2026
```

انتظر اكتمال التنزيل.

### الخطوة 3: الانتقال لمجلد المشروع

```powershell
cd C:\staff_health_2026
```

### الخطوة 4: إنشاء مجلدات التخزين

```powershell
New-Item -ItemType Directory -Force -Path "storage\uploads"
New-Item -ItemType Directory -Force -Path "storage\backups"
New-Item -ItemType Directory -Force -Path "storage\temp_uploads"
```

### الخطوة 5: مراجعة الإعدادات (اختياري)

يمكنك مراجعة ملف `docker-compose.yml` لتغيير المنفذ أو كلمات المرور:

```powershell
notepad docker-compose.yml
```

الإعدادات الافتراضية:

| الإعداد | القيمة الافتراضية |
|---------|-----------------|
| منفذ التطبيق | 5001 |
| اسم قاعدة البيانات | hr_db |
| مستخدم قاعدة البيانات | hruser |

### الخطوة 6: بناء وتشغيل الحاويات

```powershell
docker compose up -d --build
```

شرح الأعلام:
- `-d` : التشغيل في الخلفية (Detached mode)
- `--build` : إعادة بناء الصور حتى لو كانت موجودة

انتظر **2-5 دقائق** حتى اكتمال البناء. ستظهر رسائل مثل:
```
✔ Container staff-health-db   Healthy
✔ Container staff-health-app  Started
```

### الخطوة 7: التحقق من تشغيل الحاويات

```powershell
docker ps
```

يجب أن ترى حاويتين في حالة `Up`:
```
CONTAINER ID   IMAGE                  PORTS                    NAMES
xxxxxxxxxxxx   employee-mgmt-app      0.0.0.0:5001->5001/tcp   staff-health-app
xxxxxxxxxxxx   postgres:15-alpine     5432/tcp                 staff-health-db
```

### الخطوة 8: التحقق من سجلات التطبيق

```powershell
docker logs staff-health-app --tail 20
```

يجب أن ترى سطراً يقول:
```
serving on port 5001
```

### الخطوة 9: فتح البرنامج

افتح المتصفح على:
```
http://localhost:5001
```

---

## 7. فهم بنية الحاويات

```
┌─────────────────────────────────────────────────────────┐
│                    Docker Compose                        │
│                                                          │
│  ┌───────────────────────┐                               │
│  │    staff-health-app   │◄──── المتصفح                  │
│  │    (Node.js + React)  │      http://localhost:5001    │
│  │                       │                               │
│  │  - Express.js Server  │                               │
│  │  - React Frontend     │                               │
│  │  - منفذ: 5001         │                               │
│  └──────────┬────────────┘                               │
│             │ DATABASE_URL (شبكة داخلية)                 │
│  ┌──────────▼────────────┐                               │
│  │    staff-health-db    │  (غير مكشوف للخارج)           │
│  │    (PostgreSQL 15)    │                               │
│  │                       │                               │
│  │  - قاعدة البيانات     │                               │
│  │  - منفذ: 5432         │                               │
│  └───────────────────────┘                               │
│                                                          │
│  ═══════════ التخزين الدائم (Volumes) ═══════════        │
│                                                          │
│  postgres_data  →  بيانات قاعدة البيانات                │
│  ./storage      →  ملفات ومستندات الموظفين              │
│                    (C:\staff_health_2026\storage)      │
└─────────────────────────────────────────────────────────┘
```

### شرح المكونات

| المكوّن | الوصف |
|---------|-------|
| `staff-health-app` | الحاوية الرئيسية — تشغّل التطبيق (الخادم والواجهة) |
| `staff-health-db` | حاوية قاعدة البيانات PostgreSQL |
| `postgres_data` | Volume داخلي يحفظ بيانات قاعدة البيانات بشكل دائم |
| `./storage` | ربط مباشر لمجلد storage على جهازك بالحاوية |

### لماذا نستخدم Volumes?

Volumes تضمن أن **البيانات لا تُفقد** عند إيقاف أو إعادة بناء الحاويات. حتى لو حذفت الحاوية وأنشأتها من جديد، ستجد بياناتك سليمة.

---

## 8. عمليات الصيانة اليومية

جميع الأوامر تُشغَّل من مجلد المشروع:

```powershell
cd C:\staff_health_2026
```

### إيقاف البرنامج مؤقتاً (مع الحفاظ على البيانات)

```powershell
docker compose stop
```

### إعادة تشغيل البرنامج

```powershell
docker compose start
```

أو لإعادة التشغيل مع إعادة بناء:

```powershell
docker compose restart
```

### إيقاف البرنامج وإزالة الحاويات (البيانات محفوظة في Volumes)

```powershell
docker compose down
```

### عرض حالة الحاويات

```powershell
docker compose ps
```

### عرض سجلات التطبيق

```powershell
# آخر 50 سطر
docker logs staff-health-app --tail 50

# متابعة السجلات بشكل مباشر (اضغط Ctrl+C للخروج)
docker logs staff-health-app -f

# سجلات قاعدة البيانات
docker logs staff-health-db --tail 20
```

### الدخول إلى الحاوية (للمستخدمين المتقدمين)

```powershell
# الدخول لحاوية التطبيق
docker exec -it staff-health-app sh

# الدخول المباشر لقاعدة البيانات
docker exec -it staff-health-db psql -U hruser -d hr_db
```

### التحقق من استخدام الموارد

```powershell
docker stats
```

---

## 9. تحديث البرنامج

### الطريقة السهلة: إعادة تشغيل setup.bat

شغّل `setup.bat` مرة أخرى كمسؤول. سيسحب أحدث التغييرات تلقائياً ويُعيد البناء.

### الطريقة اليدوية

```powershell
cd C:\staff_health_2026

# سحب أحدث التغييرات من GitHub
git pull origin main

# إيقاف الحاويات القديمة
docker compose down

# بناء وتشغيل الحاويات الجديدة
docker compose up -d --build
```

> ملاحظة: البيانات محفوظة في Volumes ولن تُفقد عند التحديث.

---

## 10. النسخ الاحتياطي والاستعادة

### نسخ احتياطي لقاعدة البيانات

```powershell
cd C:\staff_health_2026

# إنشاء نسخة احتياطية باسم يتضمن التاريخ
$date = Get-Date -Format "yyyy-MM-dd_HH-mm"
docker exec staff-health-db pg_dump -U hruser hr_db > "storage\backups\backup_$date.sql"
```

### استعادة نسخة احتياطية

```powershell
# استبدل اسم الملف بالاسم الصحيح
docker exec -i staff-health-db psql -U hruser -d hr_db < "storage\backups\backup_2026-01-01_12-00.sql"
```

### النسخ الاحتياطي من داخل البرنامج

يمكن إنشاء نسخة احتياطية بصيغة JSON مباشرة من **واجهة البرنامج**:
- انتقل إلى **الإعدادات** → **النسخ الاحتياطي** → اضغط **"إنشاء نسخة احتياطية"**

---

## 11. حل المشكلات الشائعة

### ❌ Docker Desktop لا يبدأ

**الأعراض:** أيقونة Docker في شريط المهام لا تتحول للأخضر

**الحلول:**
1. تأكد من تفعيل Virtualization في BIOS
2. تأكد من إكمال إعداد WSL2 (المرحلة 2)
3. أعد تشغيل Docker Desktop من قائمة ابدأ
4. أعد تشغيل الجهاز كاملاً

---

### ❌ رسالة "Virtualization not enabled"

**الحل:** أعد تشغيل الجهاز وادخل إلى إعدادات BIOS:
- **Intel:** ابحث عن **Intel VT-x** أو **Intel Virtualization Technology** وفعّله
- **AMD:** ابحث عن **AMD-V** أو **SVM Mode** وفعّله

---

### ❌ رسالة "WSL 2 requires an update to its kernel component"

**الحل:**

```powershell
wsl --update
```

ثم أعد تشغيل Docker Desktop.

---

### ❌ فشل البناء بسبب مشكلة شبكة (ECONNRESET / timeout)

**الحل:** setup.bat يعيد المحاولة تلقائياً 3 مرات. إذا استمرت المشكلة:

```powershell
cd C:\staff_health_2026

# تنظيف cache Docker
docker system prune -f
docker builder prune -f
```

ثم شغّل `setup.bat` مجدداً.

---

### ❌ المنفذ 5001 محجوز

**الأعراض:** رسالة `Bind: address already in use` عند تشغيل الحاويات

**البحث عن البرنامج المستخدم للمنفذ:**

```powershell
netstat -ano | findstr :5001
```

**الحل أ:** أوقف البرنامج الذي يستخدم المنفذ.

**الحل ب:** غيّر منفذ التطبيق في `docker-compose.yml`:
```yaml
ports:
  - "5002:5001"   # غيّر 5002 لأي منفذ حر
```
ثم افتح المتصفح على `http://localhost:5002`

---

### ❌ البرنامج يعمل لكن قاعدة البيانات لا تتصل

**فحص حالة قاعدة البيانات:**

```powershell
docker logs staff-health-db --tail 20
```

**إذا ظهرت رسائل خطأ:**

```powershell
cd C:\staff_health_2026
docker compose down -v        # تحذير: يحذف بيانات قاعدة البيانات
docker compose up -d --build
```

> ⚠️ الخيار `-v` يحذف الـ Volumes. استخدمه فقط إذا لم يكن لديك بيانات مهمة.

---

### ❌ الصفحة لا تفتح في المتصفح

**الخطوات:**

```powershell
# 1. تحقق من حالة الحاويات
docker ps

# 2. تحقق من سجلات التطبيق
docker logs staff-health-app --tail 30

# 3. تحقق من المنفذ
netstat -ano | findstr :5001
```

إذا كانت الحاوية تعمل، جرّب فتح:
```
http://127.0.0.1:5001
```

---

### ❌ نسيت كلمة مرور admin

**الحل:** أنشئ مستخدماً جديداً عبر قاعدة البيانات:

```powershell
docker exec -it staff-health-app node -e "
const crypto = require('crypto');
const salt = crypto.randomBytes(16).toString('hex');
const hash = crypto.scryptSync('newpassword123', salt, 64).toString('hex');
console.log(hash + '.' + salt);
"
```

انسخ الناتج ثم نفّذ:

```powershell
docker exec -it staff-health-db psql -U hruser -d hr_db -c "UPDATE users SET password='[الناتج_من_الأمر_السابق]' WHERE username='admin';"
```

---

## 🚀 أوامر مرجعية سريعة

```powershell
# تشغيل البرنامج
docker compose up -d

# إيقاف البرنامج
docker compose stop

# إعادة التشغيل
docker compose restart

# تحديث البرنامج
git pull && docker compose up -d --build

# عرض السجلات
docker logs staff-health-app -f

# حالة الحاويات
docker compose ps

# نسخة احتياطية
docker exec staff-health-db pg_dump -U hruser hr_db > backup.sql
```

---

<div align="center">

**تم التطوير بواسطة إبراهيم الصيداوي**

</div>

</div>
