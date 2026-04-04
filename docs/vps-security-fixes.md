# 🔧 أوامر إصلاح مشاكل الأمان على السيرفر
**يجب تنفيذها بالترتيب — لا تؤثر على عمل الخدمات الجارية**

---

## المشكلة 1 🔴 CRITICAL — مستندات الموظفين منشورة على GitHub

`hr_storage/` يحتوي على وثائق موظفين حقيقيين (صور، ملفات) مرفوعة على مستودع عام.

```bash
cd ~/proteach-n8n

# 1. إلغاء تتبع المجلد بالكامل من git (الملفات تبقى على السيرفر)
git rm -r --cached hr_storage/
git rm -r --cached n8n_data/
git rm --cached proteach_full_backup_*.tar.gz 2>/dev/null || true

# 2. إضافة المجلدات لـ .gitignore
cat >> .gitignore << 'EOF'

# === بيانات حساسة — لا ترفع على GitHub ===
hr_storage/
n8n_data/
wa_tokens/
wa_postgres_data/
hr_postgres_data/
postgres_data/
*.tar.gz
*.tar
EOF

# 3. حفظ التغييرات ورفعها
git add .gitignore
git commit -m "security: remove sensitive data from tracking (hr_storage, n8n_data, backups)"
git push origin master
```

> ✅ الملفات تبقى موجودة على السيرفر في مكانها — فقط توقف git عن تتبعها

---

## المشكلة 2 🟡 MEDIUM — المنفذ 5005 مكشوف للخارج (wa-dashboard)

المنفذ 5005 مفتوح مباشرة من docker-compose مما يسمح بالوصول للواجهة بدون SSL.

```bash
cd ~/proteach-n8n

# 1. تحرير docker-compose.yaml وحذف سطر المنفذ من wa-dashboard
# ابحث عن هذا القسم:
#   wa-dashboard:
#     ports:
#       - "5005:5000"
# واحذف السطرين ports و - "5005:5000"
# أو استخدم sed مباشرة:

sed -i '/ports:/{ N; /5005:5000/d }' docker-compose.yaml
# إذا لم يعمل sed استخدم nano يدوياً:
# nano docker-compose.yaml  ← ابحث عن "5005" واحذف السطرين

# 2. إعادة تشغيل wa-dashboard فقط (لا تؤثر على الخدمات الأخرى)
sudo docker-compose up -d --no-deps wa-dashboard

# 3. تأكد أن الواجهة لا تزال تعمل عبر Nginx
curl -s -o /dev/null -w "%{http_code}" https://wa.sidawin8n.cfd
# يجب أن يعيد 200 أو 301
```

> ✅ الواجهة ستبقى متاحة عبر `wa.sidawin8n.cfd` (من خلال Nginx) فقط

---

## المشكلة 3 🟢 LOW — `version: '3.8'` مهملة في docker-compose

```bash
cd ~/proteach-n8n

# حذف سطر version من docker-compose.yaml
sed -i '/^version:/d' docker-compose.yaml

# احفظ على git
git add docker-compose.yaml
git commit -m "chore: remove obsolete version field from docker-compose"
git push origin master
```

> ✅ لا تأثير على الخدمات — فقط يزيل التحذير

---

## التحقق النهائي

```bash
# تأكد من حالة الحاويات بعد التغييرات
sudo docker-compose ps

# تأكد أن المنفذ 5005 لم يعد مكشوفاً
sudo netstat -tlnp | grep 5005
# يجب أن لا يظهر شيء

# تأكد أن hr-app يعمل
curl -s -o /dev/null -w "%{http_code}" https://hr.sidawin8n.cfd
# يجب أن يعيد 200

# تأكد أن wa-dashboard يعمل
curl -s -o /dev/null -w "%{http_code}" https://wa.sidawin8n.cfd
# يجب أن يعيد 200

# تأكد أن n8n يعمل
curl -s -o /dev/null -w "%{http_code}" https://n8n.sidawin8n.cfd
# يجب أن يعيد 200
```

---

## ترتيب التنفيذ الموصى به

| الترتيب | المشكلة | الوقت المقدر | التأثير على الخدمات |
|---------|---------|-------------|---------------------|
| 1 | إزالة hr_storage و n8n_data من git | ~2 دقيقة | لا يوجد |
| 2 | إزالة المنفذ 5005 | ~1 دقيقة | wa-dashboard يعيد تشغيل لمدة 10 ثوانٍ |
| 3 | حذف سطر version | ~30 ثانية | لا يوجد |
