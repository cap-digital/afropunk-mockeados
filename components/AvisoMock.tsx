import { AVISO_MOCK } from "@/lib/config";

/**
 * Selo de "dados mockeados". Discreto de propósito — mesma linguagem das
 * faixas de aviso do painel (losango + caixa alta + cor de alerta), sem
 * competir com o título da página.
 */
export function AvisoMock({ className = "" }: { className?: string }) {
  return (
    <p
      role="note"
      className={`inline-flex items-center gap-2 rounded-lg border px-2.5 py-1 text-[var(--fs-micro)] font-semibold uppercase leading-[1.3] tracking-[0.08em] text-[var(--warning)] ${className}`}
      style={{ background: "var(--warning-bg)", borderColor: "var(--warning-bdr)" }}
    >
      <span aria-hidden="true" className="block h-1.5 w-1.5 shrink-0 rotate-45 bg-[var(--warning)]" />
      {AVISO_MOCK}
    </p>
  );
}
