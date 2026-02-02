import { intervalToDuration, formatDuration } from "date-fns";

let startedAt: number | null = null;

export function startUptimeCounter(): void {
  startedAt = Date.now();
}

export function resetUptimeCounter(): void {
  startedAt = null;
}

export function getStartedAt(): number | null {
  return startedAt;
}

export function getCurrentUptime(): number {
  if (startedAt === null) return 0;
  return Date.now() - startedAt;
}

export function formatUptime(ms: number): string {
  const start = 0;
  const end = ms < 0 ? 0 : ms;

  const duration = intervalToDuration({ start, end });

  const compact = {
    days: duration.days ?? 0,
    hours: duration.hours ?? 0,
    minutes: duration.minutes ?? 0,
    seconds: duration.seconds ?? 0
  };

  return (
    formatDuration(compact, {
      format: ["days", "hours", "minutes", "seconds"]
    }) || "0s"
  );
}

export function prettyUptime() {
  return formatUptime(getCurrentUptime());
}
