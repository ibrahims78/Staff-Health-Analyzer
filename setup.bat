@echo off
chcp 65001 >nul 2>&1
setlocal EnableDelayedExpansion
title Staff Health Analyzer - Auto Setup

:: تفعيل دعم الألوان في CMD على ويندوز 10
reg add HKCU\Console /v VirtualTerminalLevel /t REG_DWORD /d 1 /f >nul 2>&1

:: ================================================================
::   برنامج ذاتية الموظفين - المكتب الهندسي
::   Auto Setup Script - لا يحتاج أي تدخل من المستخدم
::   المطور: إبراهيم الصيداوي
:: ================================================================

:: ---- الإعدادات الثابتة ----
set INSTALL_DIR=C:\staff_health_2026
set REPO_URL=https://github.com/ibrahims78/Staff-Health-Analyzer.git
set BRANCH=main
set APP_PORT=5001
set APP_CONTAINER=staff-health-app
set DB_CONTAINER=staff-health-db
set LOG_FILE=%INSTALL_DIR%\setup_report.txt
set START_TIME=%TIME%
set START_DATE=%DATE%

:: ---- الألوان في CMD ----
set GREEN=[92m
set RED=[91m
set YELLOW=[93m
set BLUE=[94m
set CYAN=[96m
set WHITE=[97m
set RESET=[0m

cls
echo.
echo %CYAN%================================================================%RESET%
echo %WHITE%     برنامج ذاتية الموظفين في المكتب الهندسي%RESET%
echo %WHITE%     Staff Health Analyzer - Auto Installer%RESET%
echo %CYAN%================================================================%RESET%
echo %YELLOW%  المطور : ابراهيم الصيداوي%RESET%
echo %YELLOW%  المستودع: https://github.com/ibrahims78/Staff-Health-Analyzer%RESET%
echo %CYAN%================================================================%RESET%
echo.
echo %WHITE%  جاري تجهيز بيئة التشغيل، يرجى الانتظار...%RESET%
echo.

:: ================================================================
::  المرحلة 1: التحقق من الصلاحيات
:: ================================================================
echo %BLUE%[1/7]%RESET% التحقق من صلاحيات المدير...

net session >nul 2>&1
if %errorLevel% NEQ 0 (
    echo.
    echo %RED%  [خطأ] يجب تشغيل هذا الملف بصلاحيات المدير (Run as Administrator)%RESET%
    echo %YELLOW%  الحل: انقر بالزر الأيمن على الملف واختر "Run as administrator"%RESET%
    echo.
    set STEP1=FAILED - صلاحيات المدير مفقودة
    goto :report_error
)
echo %GREEN%  [OK] صلاحيات المدير متوفرة%RESET%
set STEP1=PASSED

:: ================================================================
::  المرحلة 2: التحقق من Git
:: ================================================================
echo %BLUE%[2/7]%RESET% التحقق من وجود Git...

git --version >nul 2>&1
if %errorLevel% NEQ 0 (
    echo %YELLOW%  Git غير مثبت. جاري تحميل وتثبيت Git تلقائياً...%RESET%
    
    powershell -Command "& {Invoke-WebRequest -Uri 'https://github.com/git-for-windows/git/releases/download/v2.44.0.windows.1/Git-2.44.0-64-bit.exe' -OutFile '%TEMP%\git_installer.exe'}" >nul 2>&1
    
    if exist "%TEMP%\git_installer.exe" (
        "%TEMP%\git_installer.exe" /VERYSILENT /NORESTART /NOCANCEL /SP- /CLOSEAPPLICATIONS /RESTARTAPPLICATIONS /COMPONENTS="icons,ext\reg\shellhere,assoc,assoc_sh" >nul 2>&1
        
        set PATH=%PATH%;C:\Program Files\Git\bin;C:\Program Files\Git\cmd
        git --version >nul 2>&1
        if !errorLevel! EQU 0 (
            echo %GREEN%  [OK] تم تثبيت Git بنجاح%RESET%
            set STEP2=PASSED - تم التثبيت تلقائياً
        ) else (
            echo %RED%  [خطأ] فشل تثبيت Git تلقائياً%RESET%
            echo %YELLOW%  حمّله يدوياً من: https://git-scm.com/download/win%RESET%
            set STEP2=FAILED - فشل تثبيت Git
            goto :report_error
        )
    ) else (
        echo %RED%  [خطأ] فشل تحميل Git. تأكد من الاتصال بالإنترنت%RESET%
        set STEP2=FAILED - فشل تحميل Git
        goto :report_error
    )
) else (
    for /f "tokens=3" %%G in ('git --version 2^>^&1') do set GIT_VER=%%G
    echo %GREEN%  [OK] Git مثبت - الإصدار: !GIT_VER!%RESET%
    set STEP2=PASSED - الإصدار !GIT_VER!
)

:: ================================================================
::  المرحلة 3: التحقق من Docker
:: ================================================================
echo %BLUE%[3/7]%RESET% التحقق من Docker Desktop...

docker --version >nul 2>&1
if %errorLevel% NEQ 0 (
    echo %RED%  [خطأ] Docker غير مثبت أو لا يعمل%RESET%
    echo %YELLOW%  يرجى تثبيت Docker Desktop أولاً من:%RESET%
    echo %YELLOW%  https://www.docker.com/products/docker-desktop%RESET%
    echo %YELLOW%  ثم تشغيله والانتظار حتى يصبح الشعار أخضر اللون%RESET%
    set STEP3=FAILED - Docker غير مثبت
    goto :report_error
)

docker info >nul 2>&1
if %errorLevel% NEQ 0 (
    echo %RED%  [خطأ] Docker مثبت لكن غير مشغّل%RESET%
    echo %YELLOW%  افتح Docker Desktop وانتظر حتى يصبح الشعار أخضر ثم أعد التشغيل%RESET%
    set STEP3=FAILED - Docker غير مشغّل
    goto :report_error
)

for /f "tokens=3" %%D in ('docker --version 2^>^&1') do set DOCKER_VER=%%D
echo %GREEN%  [OK] Docker يعمل بشكل طبيعي - الإصدار: !DOCKER_VER!%RESET%
set STEP3=PASSED - الإصدار !DOCKER_VER!

:: ================================================================
::  المرحلة 4: إنشاء مجلد التثبيت وسحب الكود
:: ================================================================
echo %BLUE%[4/7]%RESET% تجهيز مجلد التثبيت وسحب الكود من GitHub...

if exist "%INSTALL_DIR%\.git" (
    echo %YELLOW%  المشروع موجود مسبقاً. جاري تحديثه من GitHub...%RESET%
    cd /d "%INSTALL_DIR%"
    git pull origin %BRANCH% >nul 2>&1
    if !errorLevel! EQU 0 (
        echo %GREEN%  [OK] تم تحديث الكود بنجاح%RESET%
        set STEP4=PASSED - تم التحديث من GitHub
    ) else (
        echo %YELLOW%  [تحذير] فشل التحديث، سيتم استخدام النسخة الموجودة%RESET%
        set STEP4=WARNING - فشل التحديث، تم استخدام النسخة الموجودة
    )
) else (
    if exist "%INSTALL_DIR%" (
        echo %YELLOW%  جاري حذف المجلد القديم وإعادة الاستنساخ...%RESET%
        rmdir /s /q "%INSTALL_DIR%" >nul 2>&1
    )
    
    echo %YELLOW%  جاري استنساخ المشروع من GitHub إلى: %INSTALL_DIR%%RESET%
    git clone --branch %BRANCH% --depth 1 %REPO_URL% "%INSTALL_DIR%" 2>&1
    
    if !errorLevel! NEQ 0 (
        echo %RED%  [خطأ] فشل استنساخ المشروع. تحقق من الاتصال بالإنترنت%RESET%
        set STEP4=FAILED - فشل استنساخ المستودع
        goto :report_error
    )
    echo %GREEN%  [OK] تم استنساخ المشروع بنجاح%RESET%
    set STEP4=PASSED - تم الاستنساخ من GitHub
)

:: ================================================================
::  المرحلة 5: إنشاء المجلدات والملفات الضرورية
:: ================================================================
echo %BLUE%[5/7]%RESET% إنشاء المجلدات والملفات الضرورية...

cd /d "%INSTALL_DIR%"

if not exist "storage" mkdir storage
if not exist "storage\uploads" mkdir storage\uploads
if not exist "storage\temp_uploads" mkdir storage\temp_uploads
if not exist "storage\backups" mkdir storage\backups

echo %GREEN%  [OK] تم إنشاء المجلدات بنجاح%RESET%
echo %GREEN%       storage\uploads       - ملفات الموظفين المرفوعة%RESET%
echo %GREEN%       storage\temp_uploads  - ملفات مؤقتة%RESET%
echo %GREEN%       storage\backups       - النسخ الاحتياطية%RESET%
set STEP5=PASSED - تم إنشاء 3 مجلدات

:: ================================================================
::  المرحلة 6: بناء وتشغيل الحاويات
:: ================================================================
echo %BLUE%[6/7]%RESET% بناء وتشغيل حاويات Docker...
echo %YELLOW%  هذا قد يستغرق من 5 إلى 15 دقيقة في أول مرة...%RESET%
echo.

cd /d "%INSTALL_DIR%"

:: إيقاف الحاويات القديمة إن وُجدت
docker compose down >nul 2>&1

:: بناء وتشغيل في الخلفية
docker compose up --build -d 2>&1
if %errorLevel% NEQ 0 (
    echo %RED%  [خطأ] فشل بناء أو تشغيل الحاويات%RESET%
    echo %YELLOW%  لمزيد من التفاصيل شغّل: docker compose logs%RESET%
    set STEP6=FAILED - فشل بناء الحاويات
    goto :report_error
)

echo.
echo %YELLOW%  جاري انتظار تشغيل التطبيق...%RESET%

:: الانتظار حتى يعمل التطبيق
set /a WAIT_COUNT=0
:wait_loop
timeout /t 5 /nobreak >nul
set /a WAIT_COUNT+=5

powershell -Command "try { $r=(Invoke-WebRequest -Uri 'http://localhost:%APP_PORT%' -TimeoutSec 3 -UseBasicParsing).StatusCode; if ($r -lt 500) { exit 0 } else { exit 1 } } catch { exit 1 }" >nul 2>&1
if %errorLevel% EQU 0 goto :app_ready

if %WAIT_COUNT% GEQ 120 (
    echo %YELLOW%  [تحذير] التطبيق يستغرق وقتاً أطول من المعتاد. سيتم المتابعة...%RESET%
    set STEP6=WARNING - التطبيق قد يحتاج دقيقة إضافية للبدء
    goto :skip_wait
)

echo %YELLOW%  انتظار... (!WAIT_COUNT! ثانية)%RESET%
goto :wait_loop

:app_ready
echo %GREEN%  [OK] التطبيق يعمل بشكل طبيعي%RESET%
set STEP6=PASSED - التطبيق يعمل على المنفذ %APP_PORT%

:skip_wait

:: ================================================================
::  المرحلة 7: التحقق النهائي من الحاويات
:: ================================================================
echo %BLUE%[7/7]%RESET% التحقق النهائي من حالة الحاويات...

for /f "tokens=*" %%S in ('docker inspect -f "{{.State.Status}}" %APP_CONTAINER% 2^>nul') do set APP_STATUS=%%S
for /f "tokens=*" %%S in ('docker inspect -f "{{.State.Status}}" %DB_CONTAINER% 2^>nul') do set DB_STATUS=%%S

if "!APP_STATUS!"=="running" (
    echo %GREEN%  [OK] حاوية التطبيق: تعمل بشكل طبيعي%RESET%
    set CONTAINER_APP=RUNNING
) else (
    echo %YELLOW%  [!] حاوية التطبيق: !APP_STATUS!%RESET%
    set CONTAINER_APP=!APP_STATUS!
)

if "!DB_STATUS!"=="running" (
    echo %GREEN%  [OK] حاوية قاعدة البيانات: تعمل بشكل طبيعي%RESET%
    set CONTAINER_DB=RUNNING
) else (
    echo %YELLOW%  [!] حاوية قاعدة البيانات: !DB_STATUS!%RESET%
    set CONTAINER_DB=!DB_STATUS!
)

set STEP7=PASSED

:: ================================================================
::  كتابة التقرير النهائي
:: ================================================================
goto :write_report

:report_error
echo.
echo %RED%================================================================%RESET%
echo %RED%  فشل الإعداد في إحدى المراحل. راجع التفاصيل أعلاه.%RESET%
echo %RED%================================================================%RESET%
set INSTALL_STATUS=FAILED
goto :write_report

:write_report
if "!INSTALL_STATUS!"=="" set INSTALL_STATUS=SUCCESS

:: حساب وقت التنفيذ
set END_TIME=%TIME%

:: إنشاء ملف التقرير
if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%" >nul 2>&1
set LOG_FILE=%INSTALL_DIR%\setup_report.txt

(
echo ================================================================
echo   تقرير التثبيت - برنامج ذاتية الموظفين
echo   Staff Health Analyzer - Installation Report
echo ================================================================
echo.
echo   حالة التثبيت : !INSTALL_STATUS!
echo   تاريخ التثبيت: %START_DATE%
echo   وقت البداية  : %START_TIME%
echo   وقت الانتهاء : %END_TIME%
echo.
echo ================================================================
echo   نتائج مراحل التثبيت
echo ================================================================
echo.
echo   المرحلة 1 - صلاحيات المدير    : !STEP1!
echo   المرحلة 2 - Git                : !STEP2!
echo   المرحلة 3 - Docker             : !STEP3!
echo   المرحلة 4 - سحب الكود         : !STEP4!
echo   المرحلة 5 - إنشاء المجلدات    : !STEP5!
echo   المرحلة 6 - بناء الحاويات     : !STEP6!
echo   المرحلة 7 - التحقق النهائي    : !STEP7!
echo.
echo ================================================================
echo   معلومات الحاويات
echo ================================================================
echo.
echo   حاوية التطبيق       : !CONTAINER_APP!
echo   حاوية قاعدة البيانات: !CONTAINER_DB!
echo.
echo ================================================================
echo   معلومات التطبيق
echo ================================================================
echo.
echo   رابط التطبيق        : http://localhost:%APP_PORT%
echo   اسم المستخدم        : admin
echo   كلمة المرور         : 123456
echo   مجلد التثبيت        : %INSTALL_DIR%
echo   مجلد ملفات الموظفين : %INSTALL_DIR%\storage\uploads
echo   مجلد النسخ الاحتياطية: %INSTALL_DIR%\storage\backups
echo.
echo ================================================================
echo   أوامر الإدارة اليومية
echo ================================================================
echo.
echo   تشغيل التطبيق  : cd %INSTALL_DIR% ^&^& docker compose up -d
echo   إيقاف التطبيق  : cd %INSTALL_DIR% ^&^& docker compose down
echo   عرض السجلات    : cd %INSTALL_DIR% ^&^& docker compose logs -f
echo   حالة الحاويات  : docker compose ps
echo   إعادة التشغيل  : cd %INSTALL_DIR% ^&^& docker compose restart
echo.
echo ================================================================
echo   للوصول من أجهزة أخرى على نفس الشبكة
echo ================================================================
echo.
echo   افتح CMD واكتب: ipconfig
echo   ابحث عن "IPv4 Address" ثم افتح من الجهاز الآخر:
echo   http://[عنوان IP]:%APP_PORT%
echo.
echo ================================================================
echo   تم إنشاء هذا التقرير تلقائياً بواسطة setup.bat
echo ================================================================
) > "%LOG_FILE%"

:: ================================================================
::  عرض التقرير على الشاشة
:: ================================================================
cls
echo.
echo %CYAN%================================================================%RESET%

if "!INSTALL_STATUS!"=="SUCCESS" (
    echo %GREEN%   التثبيت اكتمل بنجاح ^(SUCCESS^)%RESET%
) else (
    echo %RED%   فشل التثبيت ^(FAILED^)%RESET%
)

echo %CYAN%================================================================%RESET%
echo.
echo %WHITE%  التاريخ  : %START_DATE%%RESET%
echo %WHITE%  البداية  : %START_TIME%%RESET%
echo %WHITE%  الانتهاء : %END_TIME%%RESET%
echo.
echo %CYAN%  ── نتائج المراحل ──────────────────────────────────────────%RESET%
echo.
call :print_step "المرحلة 1 - صلاحيات المدير   " "!STEP1!"
call :print_step "المرحلة 2 - Git               " "!STEP2!"
call :print_step "المرحلة 3 - Docker            " "!STEP3!"
call :print_step "المرحلة 4 - سحب الكود        " "!STEP4!"
call :print_step "المرحلة 5 - إنشاء المجلدات   " "!STEP5!"
call :print_step "المرحلة 6 - بناء الحاويات    " "!STEP6!"
call :print_step "المرحلة 7 - التحقق النهائي   " "!STEP7!"
echo.
echo %CYAN%  ── حالة الحاويات ──────────────────────────────────────────%RESET%
echo.
echo %WHITE%  التطبيق        :  %GREEN%!CONTAINER_APP!%RESET%
echo %WHITE%  قاعدة البيانات :  %GREEN%!CONTAINER_DB!%RESET%
echo.

if "!INSTALL_STATUS!"=="SUCCESS" (
    echo %CYAN%  ── معلومات الدخول للتطبيق ─────────────────────────────────%RESET%
    echo.
    echo %WHITE%  الرابط        :  %GREEN%http://localhost:%APP_PORT%%RESET%
    echo %WHITE%  المستخدم      :  %GREEN%admin%RESET%
    echo %WHITE%  كلمة المرور   :  %GREEN%123456%RESET%
    echo %WHITE%  مجلد التثبيت  :  %YELLOW%%INSTALL_DIR%%RESET%
)

echo.
echo %CYAN%  ── ملف التقرير ─────────────────────────────────────────────%RESET%
echo.
echo %WHITE%  تم حفظ التقرير الكامل في:%RESET%
echo %YELLOW%  %LOG_FILE%%RESET%
echo.
echo %CYAN%================================================================%RESET%
echo.

if "!INSTALL_STATUS!"=="SUCCESS" (
    echo %GREEN%  يمكنك الآن فتح المتصفح والانتقال إلى:%RESET%
    echo %GREEN%  http://localhost:%APP_PORT%%RESET%
    echo.
    :: فتح المتصفح تلقائياً
    start http://localhost:%APP_PORT%
    echo %GREEN%  تم فتح المتصفح تلقائياً...%RESET%
) else (
    echo %RED%  راجع التفاصيل في ملف التقرير:%RESET%
    echo %RED%  %LOG_FILE%%RESET%
)

echo.
echo %WHITE%  اضغط أي مفتاح للخروج...%RESET%
pause >nul
goto :eof

:: دالة طباعة نتيجة المرحلة بلون مناسب
:print_step
set LABEL=%~1
set RESULT=%~2
echo !RESULT! | findstr /i "FAILED" >nul && (
    echo   %RED%[X]%RESET% %WHITE%!LABEL!%RESET% : %RED%!RESULT!%RESET%
) || (
    echo !RESULT! | findstr /i "WARNING" >nul && (
        echo   %YELLOW%[!]%RESET% %WHITE%!LABEL!%RESET% : %YELLOW%!RESULT!%RESET%
    ) || (
        echo   %GREEN%[V]%RESET% %WHITE%!LABEL!%RESET% : %GREEN%!RESULT!%RESET%
    )
)
goto :eof
