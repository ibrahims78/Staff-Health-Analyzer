import { useState } from "react";
import { useAuditLogs } from "@/hooks/use-audit-logs";
import { Layout } from "@/components/Layout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Eye, Trash2, AlertTriangle, ClipboardList, Loader2, Search,
  LogIn, LogOut, UserPlus, UserPen, UserMinus, FilePlus, FilePen,
  FileX, Paperclip, DatabaseBackup, ArchiveRestore, Archive, Filter
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// --- تعريف أنواع العمليات ---
const ACTION_META: Record<string, {
  label: string;
  color: string;
  icon: any;
  description: string;
}> = {
  CREATE:           { label: 'إضافة',             color: 'bg-green-500/15 text-green-700 border-green-500/30 dark:text-green-400',   icon: FilePlus,       description: 'إضافة سجل جديد' },
  UPDATE:           { label: 'تعديل',             color: 'bg-blue-500/15 text-blue-700 border-blue-500/30 dark:text-blue-400',       icon: FilePen,        description: 'تعديل بيانات سجل' },
  DELETE:           { label: 'حذف',               color: 'bg-red-500/15 text-red-700 border-red-500/30 dark:text-red-400',           icon: FileX,          description: 'حذف سجل' },
  DELETE_ATTACHMENT:{ label: 'حذف مرفق',          color: 'bg-rose-500/15 text-rose-700 border-rose-500/30 dark:text-rose-400',       icon: Paperclip,      description: 'حذف مرفق من ملف الموظف' },
  LOGIN:            { label: 'تسجيل دخول',        color: 'bg-violet-500/15 text-violet-700 border-violet-500/30 dark:text-violet-400', icon: LogIn,         description: 'دخول المستخدم إلى النظام' },
  LOGOUT:           { label: 'تسجيل خروج',        color: 'bg-gray-500/15 text-gray-600 border-gray-400/30',                          icon: LogOut,         description: 'خروج المستخدم من النظام' },
  IMPORT:           { label: 'استيراد',           color: 'bg-cyan-500/15 text-cyan-700 border-cyan-500/30 dark:text-cyan-400',       icon: Archive,        description: 'استيراد بيانات من Excel' },
  BACKUP_CREATED:   { label: 'نسخ احتياطي',      color: 'bg-indigo-500/15 text-indigo-700 border-indigo-500/30 dark:text-indigo-400', icon: DatabaseBackup, description: 'إنشاء نسخة احتياطية' },
  BACKUP_RESTORED:  { label: 'استعادة نسخة',     color: 'bg-orange-500/15 text-orange-700 border-orange-500/30 dark:text-orange-400', icon: ArchiveRestore, description: 'استعادة نسخة احتياطية' },
  BACKUP_DELETED:   { label: 'حذف نسخة',         color: 'bg-amber-500/15 text-amber-700 border-amber-500/30 dark:text-amber-400',   icon: Trash2,         description: 'حذف نسخة احتياطية' },
  RESTORE:          { label: 'استعادة',           color: 'bg-orange-500/15 text-orange-700 border-orange-500/30 dark:text-orange-400', icon: ArchiveRestore, description: 'استعادة بيانات' },
};

const ENTITY_LABELS: Record<string, string> = {
  EMPLOYEE: 'موظف',
  USER:     'مستخدم',
  SETTING:  'إعداد',
  BACKUP:   'نسخة احتياطية',
  SYSTEM:   'النظام',
};

const FIELD_NAMES: Record<string, string> = {
  fullName: "الاسم الكامل",
  fatherName: "اسم الأب",
  motherName: "اسم الأم",
  placeOfBirth: "مكان الولادة",
  dateOfBirth: "تاريخ الولادة",
  nationalId: "الرقم الوطني",
  shamCashNumber: "رقم شام كاش",
  jobTitle: "الصفة الوظيفية",
  currentStatus: "الوضع الحالي",
  category: "الفئة",
  employmentStatus: "الوضع الوظيفي",
  specialization: "الاختصاص",
  assignedWork: "العمل المكلف به",
  mobile: "رقم الجوال",
  address: "العنوان",
  notes: "ملاحظات",
  certificate: "الشهادة",
  certificateType: "نوع الشهادة",
  appointmentDecisionNumber: "رقم قرار التعيين",
  appointmentDecisionDate: "تاريخ قرار التعيين",
  firstStateStart: "أول مباشرة بالدولة",
  firstDirectorateStart: "أول مباشرة بالمديرية",
  firstDepartmentStart: "أول مباشرة بالقسم",
  gender: "الجنس",
  registryPlaceAndNumber: "محل ورقم القيد",
  loginTime: "وقت الدخول",
  logoutTime: "وقت الخروج",
  username: "اسم المستخدم",
  role: "الصلاحية",
  isDeleted: "محذوف",
  documentPaths: "المرفقات",
  password: "كلمة المرور",
};

function buildChangeSummary(action: string, oldV: any, newV: any): string {
  if (action === 'LOGIN') {
    return `تسجيل دخول إلى النظام${newV?.loginTime ? ' في ' + format(new Date(newV.loginTime), 'HH:mm:ss') : ''}`;
  }
  if (action === 'LOGOUT') {
    return `تسجيل خروج من النظام${newV?.logoutTime ? ' في ' + format(new Date(newV.logoutTime), 'HH:mm:ss') : ''}`;
  }
  if (action === 'BACKUP_CREATED') {
    return `تم إنشاء نسخة احتياطية${newV?.filename ? ': ' + newV.filename : ''}`;
  }
  if (action === 'BACKUP_RESTORED') {
    return `تمت استعادة نسخة احتياطية${newV?.filename ? ': ' + newV.filename : ''}`;
  }
  if (action === 'BACKUP_DELETED') {
    return `تم حذف نسخة احتياطية${newV?.filename ? ': ' + newV.filename : ''}`;
  }
  if (action === 'RESTORE') {
    return 'تمت استعادة النسخة الاحتياطية';
  }
  if (action === 'DELETE_ATTACHMENT') {
    return `تم حذف مرفق${oldV?.path ? ': ' + oldV.path.split('/').pop() : ''}`;
  }
  if (action === 'CREATE') {
    if (newV?.source === 'excel_import') return `استيراد موظف من Excel: ${newV?.fullName || ''}`;
    const name = newV?.fullName || newV?.username || '';
    return `تمت إضافة سجل جديد${name ? ': ' + name : ''}`;
  }
  if (action === 'DELETE') {
    const name = oldV?.fullName || oldV?.username || newV?.fullName || '';
    return `تم حذف${name ? ': ' + name : ' السجل'}`;
  }

  // UPDATE — قائمة الحقول المتغيّرة
  const old = oldV || {};
  const nw = newV || {};
  const skip = new Set(['updatedAt', 'createdAt', 'id', 'isDeleted', 'deletedAt']);
  const changes: string[] = [];
  for (const key of Object.keys(nw)) {
    if (skip.has(key)) continue;
    if (JSON.stringify(old[key]) !== JSON.stringify(nw[key])) {
      const label = FIELD_NAMES[key] || key;
      if (key === 'documentPaths') {
        changes.push('تحديث المرفقات');
        continue;
      }
      if (key === 'password') {
        changes.push('تغيير كلمة المرور');
        continue;
      }
      const from = old[key] !== undefined && old[key] !== null && old[key] !== '' ? String(old[key]) : 'فارغ';
      const to = nw[key] !== undefined && nw[key] !== null && nw[key] !== '' ? String(nw[key]) : 'فارغ';
      changes.push(`${label}: "${from}" ← "${to}"`);
    }
  }
  return changes.length > 0 ? changes.join('\n') : 'لم يتم تغيير أي بيانات جوهرية';
}

function getEntityLabel(entityType: string) {
  return ENTITY_LABELS[entityType] || entityType;
}

function getActionMeta(action: string) {
  return ACTION_META[action] || {
    label: action,
    color: 'bg-gray-100 text-gray-700 border-gray-300',
    icon: ClipboardList,
    description: 'عملية غير معروفة',
  };
}

export default function AuditLogs() {
  const { data: logs, isLoading } = useAuditLogs();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('all');
  const [confirmClear, setConfirmClear] = useState(false);

  const clearMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/audit-logs', { method: 'DELETE', credentials: 'include' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'خطأ في المسح' }));
        throw new Error(err.message);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/audit-logs'] });
      toast({ title: 'تم مسح سجل العمليات بنجاح' });
      setConfirmClear(false);
    },
    onError: (e: any) => {
      toast({ title: 'فشل المسح', description: e.message, variant: 'destructive' });
    },
  });

  const filteredLogs = (logs || []).filter(({ log, user: u }) => {
    const matchesAction = filterAction === 'all' || log.action === filterAction;
    if (!matchesAction) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const action = getActionMeta(log.action).label;
    const entity = getEntityLabel(log.entityType);
    const username = u?.username || '';
    const summary = buildChangeSummary(log.action, log.oldValues, log.newValues);
    return (
      action.includes(q) ||
      entity.includes(q) ||
      username.toLowerCase().includes(q) ||
      String(log.entityId || '').includes(q) ||
      summary.includes(q)
    );
  });

  // إحصائيات سريعة
  const totalLogs = logs?.length || 0;
  const actionCounts = (logs || []).reduce((acc, { log }) => {
    acc[log.action] = (acc[log.action] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (isLoading) {
    return (
      <Layout>
        <div className="flex h-96 items-center justify-center gap-3 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>جاري تحميل السجلات...</span>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* رأس الصفحة */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground">سجل العمليات</h1>
            <p className="mt-1 text-muted-foreground font-medium">
              تتبع جميع التغييرات والإجراءات التي تمت على النظام
              {totalLogs > 0 && (
                <span className="mr-2 inline-flex items-center px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold">
                  {totalLogs} عملية مسجّلة
                </span>
              )}
            </p>
          </div>
          {user?.role === 'admin' && (
            <Button
              variant="destructive"
              className="gap-2 font-bold shrink-0"
              onClick={() => setConfirmClear(true)}
              disabled={!logs || logs.length === 0}
              data-testid="btn-clear-audit-logs"
            >
              <Trash2 className="h-4 w-4" />
              مسح السجل
            </Button>
          )}
        </div>

        {/* بطاقات الإحصائيات السريعة */}
        {totalLogs > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {[
              { action: 'CREATE',  label: 'إضافة' },
              { action: 'UPDATE',  label: 'تعديل' },
              { action: 'DELETE',  label: 'حذف' },
              { action: 'LOGIN',   label: 'دخول' },
              { action: 'LOGOUT',  label: 'خروج' },
            ].map(({ action, label }) => {
              const meta = getActionMeta(action);
              const Icon = meta.icon;
              const count = actionCounts[action] || 0;
              return (
                <button
                  key={action}
                  onClick={() => setFilterAction(filterAction === action ? 'all' : action)}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-right hover:shadow-md ${
                    filterAction === action
                      ? 'ring-2 ring-primary/50 ' + meta.color
                      : 'bg-card border-border/50 hover:border-border'
                  }`}
                >
                  <div className={`p-1.5 rounded-lg ${meta.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xl font-black">{count}</p>
                    <p className="text-xs text-muted-foreground">{label}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* أدوات البحث والفلترة */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث في السجل..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pr-9 text-right"
              data-testid="input-audit-search"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
            <Select value={filterAction} onValueChange={setFilterAction}>
              <SelectTrigger className="w-[160px]" data-testid="select-audit-filter">
                <SelectValue placeholder="فلترة بالعملية" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع العمليات</SelectItem>
                {Object.entries(ACTION_META).map(([key, meta]) => (
                  <SelectItem key={key} value={key}>
                    {meta.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(search || filterAction !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setSearch(''); setFilterAction('all'); }}
                className="text-muted-foreground"
              >
                مسح الفلاتر
              </Button>
            )}
          </div>
        </div>

        {/* الجدول */}
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="text-right font-bold w-12">#</TableHead>
                <TableHead className="text-right font-bold">المستخدم</TableHead>
                <TableHead className="text-right font-bold">نوع العملية</TableHead>
                <TableHead className="text-right font-bold">السجل المتأثر</TableHead>
                <TableHead className="text-right font-bold">ملخص التغيير</TableHead>
                <TableHead className="text-right font-bold">التاريخ والوقت</TableHead>
                <TableHead className="text-center font-bold w-20">التفاصيل</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
                      <ClipboardList className="h-12 w-12 opacity-20" />
                      <p className="font-medium">
                        {search || filterAction !== 'all'
                          ? 'لا توجد نتائج مطابقة للبحث'
                          : 'لا توجد سجلات عمليات بعد'}
                      </p>
                      {(search || filterAction !== 'all') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setSearch(''); setFilterAction('all'); }}
                        >
                          مسح الفلاتر
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map(({ log, user: u }, i) => {
                  const meta = getActionMeta(log.action);
                  const ActionIcon = meta.icon;
                  const entityLabel = getEntityLabel(log.entityType);
                  const summary = buildChangeSummary(log.action, log.oldValues, log.newValues);
                  const firstLine = summary.split('\n')[0];
                  const hasMoreLines = summary.split('\n').length > 1;

                  return (
                    <TableRow key={log.id} className="hover:bg-muted/20 transition-colors">
                      <TableCell className="text-muted-foreground text-xs font-mono">{i + 1}</TableCell>

                      {/* المستخدم */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                            {u?.username?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <span className="font-bold text-sm">
                            {u
                              ? u.username
                              : <span className="text-muted-foreground italic text-xs">مستخدم محذوف</span>
                            }
                          </span>
                        </div>
                      </TableCell>

                      {/* نوع العملية */}
                      <TableCell>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${meta.color}`}>
                          <ActionIcon className="h-3 w-3" />
                          {meta.label}
                        </span>
                      </TableCell>

                      {/* نوع السجل */}
                      <TableCell>
                        <span className="text-sm text-foreground font-medium bg-muted/50 px-2 py-0.5 rounded-md">
                          {entityLabel}
                        </span>
                      </TableCell>

                      {/* ملخص */}
                      <TableCell>
                        <div className="max-w-xs">
                          <p className="text-sm text-foreground truncate" title={firstLine}>
                            {firstLine}
                          </p>
                          {hasMoreLines && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              +{summary.split('\n').length - 1} تغيير آخر...
                            </p>
                          )}
                        </div>
                      </TableCell>

                      {/* التاريخ */}
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap" dir="ltr">
                        {format(new Date(log.createdAt), 'yyyy/MM/dd HH:mm', { locale: ar })}
                      </TableCell>

                      {/* زر التفاصيل */}
                      <TableCell className="text-center">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-primary/10"
                              data-testid={`btn-view-log-${log.id}`}
                            >
                              <Eye className="h-4 w-4 text-primary" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="w-[95vw] max-w-2xl rounded-xl">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-3 text-xl font-bold">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${meta.color}`}>
                                  <ActionIcon className="h-3 w-3" />
                                  {meta.label}
                                </span>
                                تفاصيل العملية
                              </DialogTitle>
                            </DialogHeader>

                            <div className="mt-2 space-y-4">
                              {/* معلومات العملية */}
                              <div className="grid grid-cols-2 gap-3 text-sm">
                                <div className="bg-muted/40 rounded-lg p-3 space-y-1">
                                  <p className="text-xs text-muted-foreground font-medium">المستخدم المنفّذ</p>
                                  <p className="font-bold">{u?.username || 'مستخدم محذوف'}</p>
                                </div>
                                <div className="bg-muted/40 rounded-lg p-3 space-y-1">
                                  <p className="text-xs text-muted-foreground font-medium">نوع السجل المتأثر</p>
                                  <p className="font-bold">{entityLabel}</p>
                                </div>
                                <div className="bg-muted/40 rounded-lg p-3 space-y-1">
                                  <p className="text-xs text-muted-foreground font-medium">نوع العملية</p>
                                  <p className="font-bold">{meta.label}</p>
                                  <p className="text-xs text-muted-foreground">{meta.description}</p>
                                </div>
                                <div className="bg-muted/40 rounded-lg p-3 space-y-1">
                                  <p className="text-xs text-muted-foreground font-medium">التاريخ والوقت</p>
                                  <p className="font-bold font-mono text-sm" dir="ltr">
                                    {format(new Date(log.createdAt), 'yyyy/MM/dd HH:mm:ss')}
                                  </p>
                                </div>
                              </div>

                              {/* ملخص التغييرات */}
                              <div className="p-4 rounded-xl bg-primary/5 border border-primary/15">
                                <h4 className="font-bold text-sm mb-3 text-primary flex items-center gap-2">
                                  <ClipboardList className="h-4 w-4" />
                                  ملخص التغييرات
                                </h4>
                                <div className="space-y-2">
                                  {summary.split('\n').map((line, idx) => (
                                    <div key={idx} className="flex items-start gap-2">
                                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary/50 shrink-0" />
                                      <p className="text-sm leading-relaxed text-foreground">{line}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* القيم قبل وبعد التغيير */}
                              {(!!log.oldValues || !!log.newValues) && (
                                <div className="grid grid-cols-2 gap-3" dir="ltr">
                                  <div className="rounded-xl border border-red-200 dark:border-red-900 p-3 bg-red-50/50 dark:bg-red-950/20">
                                    <h4 className="font-bold text-xs mb-2 text-red-600 dark:text-red-400 flex items-center gap-1">
                                      <span className="h-2 w-2 rounded-full bg-red-500 inline-block" />
                                      قبل التغيير
                                    </h4>
                                    <ScrollArea className="h-[160px]">
                                      <pre className="text-xs text-muted-foreground whitespace-pre-wrap break-all leading-relaxed">
                                        {log.oldValues ? JSON.stringify(log.oldValues, null, 2) : '—'}
                                      </pre>
                                    </ScrollArea>
                                  </div>
                                  <div className="rounded-xl border border-green-200 dark:border-green-900 p-3 bg-green-50/50 dark:bg-green-950/20">
                                    <h4 className="font-bold text-xs mb-2 text-green-600 dark:text-green-400 flex items-center gap-1">
                                      <span className="h-2 w-2 rounded-full bg-green-500 inline-block" />
                                      بعد التغيير
                                    </h4>
                                    <ScrollArea className="h-[160px]">
                                      <pre className="text-xs text-muted-foreground whitespace-pre-wrap break-all leading-relaxed">
                                        {log.newValues ? JSON.stringify(log.newValues, null, 2) : '—'}
                                      </pre>
                                    </ScrollArea>
                                  </div>
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>

          {/* تذييل الجدول */}
          {filteredLogs.length > 0 && (
            <div className="border-t px-4 py-3 bg-muted/20 flex items-center justify-between text-sm text-muted-foreground">
              <span>
                عرض <span className="font-bold text-foreground">{filteredLogs.length}</span> من أصل{' '}
                <span className="font-bold text-foreground">{totalLogs}</span> سجل
              </span>
              {(search || filterAction !== 'all') && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setSearch(''); setFilterAction('all'); }}
                  className="h-7 text-xs"
                >
                  عرض الكل
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* نافذة تأكيد المسح */}
      <AlertDialog open={confirmClear} onOpenChange={setConfirmClear}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <AlertDialogTitle className="text-center text-xl font-black">مسح سجل العمليات</AlertDialogTitle>
            <AlertDialogDescription className="text-center leading-relaxed">
              هل أنت متأكد من رغبتك في مسح{' '}
              <span className="font-bold text-foreground">جميع سجلات العمليات ({totalLogs} سجل)</span> نهائياً؟
              <br />
              <span className="text-destructive font-bold text-sm mt-2 block">
                لا يمكن التراجع عن هذه العملية.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="font-bold">إلغاء</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground font-bold hover:bg-destructive/90"
              onClick={() => clearMutation.mutate()}
              disabled={clearMutation.isPending}
            >
              {clearMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : null}
              نعم، مسح السجل
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
