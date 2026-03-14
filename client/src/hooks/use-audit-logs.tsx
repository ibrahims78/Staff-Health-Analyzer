import { useQuery } from "@tanstack/react-query";
import { type AuditLog, type User } from "@shared/schema";

export interface AuditLogEntry {
  log: AuditLog;
  user: User | null;
}

export interface AuditLogsResponse {
  logs: AuditLogEntry[];
  total: number;
  page: number;
  limit: number;
  actionCounts: Record<string, number>;
}

export function useAuditLogs(
  page = 1,
  limit = 50,
  action?: string,
  search?: string,
) {
  return useQuery<AuditLogsResponse>({
    queryKey: ['/api/audit-logs', { page, limit, action, search }],
    queryFn: async () => {
      const url = new URL('/api/audit-logs', window.location.origin);
      url.searchParams.set('page', String(page));
      url.searchParams.set('limit', String(limit));
      if (action && action !== 'all') url.searchParams.set('action', action);
      if (search && search.trim()) url.searchParams.set('search', search.trim());
      const res = await fetch(url.toString(), { credentials: 'include' });
      if (!res.ok) throw new Error("Failed to fetch audit logs");
      return await res.json();
    },
    placeholderData: (prev) => prev,
  });
}
