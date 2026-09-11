/**
 * AI视频课 工作台 - 时间轴工具函数
 */

/** 时间码格式化：00:07.8 / 01:12 */
export function formatTimecode(seconds: number, withTenth = false): string {
  const safe = Math.max(0, seconds);
  if (withTenth) {
    // 先四舍五入到 0.1s，避免 7.8 → 7.7999 的浮点截断误差
    const totalTenths = Math.round(safe * 10);
    const minutes = Math.floor(totalTenths / 600);
    const restTenths = totalTenths - minutes * 600;
    const whole = Math.floor(restTenths / 10);
    const tenth = restTenths % 10;
    return `${minutes.toString().padStart(2, '0')}:${whole.toString().padStart(2, '0')}.${tenth}`;
  }
  const minutes = Math.floor(safe / 60);
  const secs = safe - minutes * 60;
  return `${minutes.toString().padStart(2, '0')}:${Math.floor(secs).toString().padStart(2, '0')}`;
}

/** 选择刻度间隔：保证刻度标签数量不超过 maxLabels */
export function chooseTickInterval(total: number, maxLabels = 14): number {
  const candidates = [1, 2, 5, 10, 15, 30, 60, 120, 300];
  for (const interval of candidates) {
    if (total / interval <= maxLabels) return interval;
  }
  return 600;
}

/** 生成刻度标签序列（含 0 与总时长） */
export function buildTicks(total: number, interval: number): number[] {
  const ticks: number[] = [];
  for (let t = 0; t <= total; t += interval) {
    ticks.push(t);
  }
  if (ticks[ticks.length - 1] !== total) ticks.push(total);
  return ticks;
}

/** 时间 → 时间轴百分比位置 */
export function timeToPercent(time: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(100, Math.max(0, (time / total) * 100));
}
