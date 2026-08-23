import { apiGet } from './api';

export interface PortalStats {
  totalVerified: number;
  approvalRate: number;
  avgReviewHours: number;
  regionsCount: number;
}

export async function fetchPortalStats(): Promise<PortalStats> {
  try {
    const data = await apiGet<PortalStats>('/verification/stats');
    return data;
  } catch (_) {
    return { totalVerified: 0, approvalRate: 0, avgReviewHours: 0, regionsCount: 0 };
  }
}

function formatHours(h: number): string {
  if (h < 1) return '<1hr';
  if (h < 24) return `${h}hrs`;
  const days = Math.round(h / 24);
  return `${days}d`;
}

export function formatPortalStats(stats: PortalStats) {
  return [
    { value: stats.totalVerified.toLocaleString(), label: 'Verified Artisans' },
    { value: `${stats.approvalRate}%`,             label: 'Approval Rate' },
    { value: formatHours(stats.avgReviewHours),    label: 'Avg. Review Time' },
    { value: String(stats.regionsCount),           label: 'Regions Covered' },
  ];
}
