import { supabase } from './supabase';

export interface PortalStats {
  totalVerified: number;
  approvalRate: number;
  avgReviewHours: number;
  regionsCount: number;
}

export async function fetchPortalStats(): Promise<PortalStats> {
  const { data, error } = await supabase
    .from('worker_verifications')
    .select('status, current_region, submitted_at, reviewed_at');

  if (error || !data || data.length === 0) {
    return { totalVerified: 0, approvalRate: 0, avgReviewHours: 0, regionsCount: 0 };
  }

  const approved = data.filter(d => d.status === 'approved').length;
  const finalized = data.filter(d => d.status === 'approved' || d.status === 'rejected').length;
  const approvalRate = finalized > 0 ? Math.round((approved / finalized) * 100) : 0;

  const regions = new Set(data.map(d => d.current_region).filter(Boolean)).size;

  const reviewed = data.filter(d => d.reviewed_at && d.submitted_at);
  let avgReviewHours = 0;
  if (reviewed.length > 0) {
    const totalMs = reviewed.reduce((acc, d) => {
      return acc + (new Date(d.reviewed_at).getTime() - new Date(d.submitted_at).getTime());
    }, 0);
    avgReviewHours = Math.round(totalMs / reviewed.length / (1000 * 60 * 60));
  }

  return {
    totalVerified: approved,
    approvalRate,
    avgReviewHours,
    regionsCount: regions,
  };
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
