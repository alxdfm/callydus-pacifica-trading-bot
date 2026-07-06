// Formatadores numéricos/data compartilhados pelas páginas do produto.
// Números monetários e datas sempre passam por aqui — nunca renderizar cru.

export function formatUsd(value: number): string {
  const sign = value < 0 ? "−" : "";
  return `${sign}$${Math.abs(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatSignedUsd(value: number): string {
  return `${value >= 0 ? "+" : ""}${formatUsd(value)}`;
}

export function formatPrice(value: number | null): string {
  if (value === null) return "—";
  return value.toLocaleString("en-US", { maximumFractionDigits: 6 });
}

export function formatQty(value: number): string {
  return value.toLocaleString("en-US", { maximumFractionDigits: 8 });
}

export function formatWhen(iso: string): string {
  const date = new Date(iso);
  return `${date.toLocaleDateString("en-US", { month: "short", day: "2-digit" })} ${date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}`;
}
