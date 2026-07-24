export const todayIso = () => new Date().toISOString().slice(0, 10);

export function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso + 'T00:00:00').toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function daysUntil(iso: string): number {
  const target = new Date(iso + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}
