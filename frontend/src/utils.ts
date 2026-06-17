export function toLocalDatetimeString(unixSeconds: number): string {
  const d = new Date(unixSeconds * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fromLocalDatetimeString(s: string): number {
  return Math.floor(new Date(s).getTime() / 1000);
}

export function nowLocalDatetimeString(): string {
  return toLocalDatetimeString(Math.floor(Date.now() / 1000));
}
