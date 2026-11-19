import { MOCK_MULTIPLIER } from "./config";

/**
 * Camada de mock: multiplica as métricas de VOLUME logo depois do fetch.
 *
 * É o único lugar do projeto que altera número. Cada cliente de API chama a
 * função dele assim que o JSON é lido, e daí em diante o resto do código —
 * somas, séries, derivadas, gráficos — trabalha com o valor já multiplicado
 * sem saber disso.
 *
 * O que fica de fora, de propósito: derivadas que a fonte entrega prontas
 * (CTR, CPC, CPM, frequência, parcelas de impressão, taxas e médias do GA4),
 * datas, IDs e textos. O orçamento de campanha ENTRA: com o investido dobrado
 * e o orçamento não, o "% consumido" dobraria e passaria de 100%.
 */

const M: number = MOCK_MULTIPLIER;

/** Multiplica preservando o tipo: a Graph API e a Google Ads API mandam número como string. */
function dobrar<T extends string | number | undefined>(v: T): T {
  if (v === undefined || v === null || v === "") return v;
  const n = Number(v);
  if (!Number.isFinite(n)) return v;
  return (typeof v === "string" ? String(n * M) : n * M) as T;
}

// ------------------------------------------------------------------ Meta

/** Campos absolutos da linha de insights. `frequency`, `ctr`, `cpc` e `cpm` ficam. */
const META_VOLUME = ["spend", "impressions", "reach", "clicks"] as const;

interface AcaoMeta {
  action_type: string;
  value: string;
}

/**
 * Linha crua de `/insights` da Marketing API. `actions` (cliques no link,
 * compras, engajamento, views...) são contagens e `action_values` é receita —
 * tudo volume, então todos os itens são multiplicados.
 */
export function mockLinhaMeta<T extends Record<string, unknown>>(row: T): T {
  if (M === 1) return row;
  const out: Record<string, unknown> = { ...row };
  for (const k of META_VOLUME) {
    if (k in out) out[k] = dobrar(out[k] as string | number | undefined);
  }
  for (const k of ["actions", "action_values"]) {
    const lista = out[k];
    if (Array.isArray(lista)) {
      out[k] = (lista as AcaoMeta[]).map((a) => ({ ...a, value: dobrar(a.value) }));
    }
  }
  return out as T;
}

/**
 * Campanha crua de `/campaigns`: só o orçamento é número. Valores em centavos,
 * como string — `dobrar` preserva o formato.
 */
export function mockCampanhaMeta<T extends Record<string, unknown>>(row: T): T {
  if (M === 1) return row;
  const out: Record<string, unknown> = { ...row };
  for (const k of ["lifetime_budget", "daily_budget"]) {
    if (k in out) out[k] = dobrar(out[k] as string | number | undefined);
  }
  return out as T;
}

// ------------------------------------------------------------ Google Ads

/**
 * Métricas absolutas da Google Ads API. A resposta REST vem em camelCase; o
 * snake_case cobre o caso de a API ecoar o nome da GAQL. Parcelas de
 * impressão e percentuais de topo ficam como vieram.
 */
const ADS_VOLUME = new Set([
  "costMicros",
  "cost_micros",
  "impressions",
  "clicks",
  "conversions",
  "conversionsValue",
  "conversions_value",
]);

export function mockLinhaAds<T extends Record<string, unknown>>(row: T): T {
  if (M === 1) return row;
  const out: Record<string, unknown> = { ...row };

  const metrics = row.metrics as Record<string, string | number> | undefined;
  if (metrics) {
    const novo: Record<string, string | number> = {};
    for (const [k, v] of Object.entries(metrics)) {
      novo[k] = ADS_VOLUME.has(k) ? dobrar(v) : v;
    }
    out.metrics = novo;
  }

  // Orçamento (`campaign_budget.amount_micros`), para o consumo seguir coerente.
  const orc = row.campaignBudget as Record<string, string | number> | undefined;
  if (orc && "amountMicros" in orc) {
    out.campaignBudget = { ...orc, amountMicros: dobrar(orc.amountMicros) };
  }

  return out as T;
}

// ------------------------------------------------------------------- GA4

/**
 * Métricas absolutas da GA4 Data API. `engagementRate`,
 * `averageSessionDuration`, `sessionConversionRate` e
 * `averagePurchaseRevenue` (ticket médio) são derivadas e ficam.
 */
const GA4_VOLUME = new Set([
  "sessions",
  "totalUsers",
  "newUsers",
  "activeUsers",
  "screenPageViews",
  "eventCount",
  "engagedSessions",
  "transactions",
  "purchaseRevenue",
  "totalRevenue",
  "addToCarts",
  "checkouts",
  "ecommercePurchases",
  "itemRevenue",
  "itemsPurchased",
  "itemsAddedToCart",
  "itemsCheckedOut",
  "itemsViewed",
]);

/** Valores de uma linha da GA4, na ordem dos nomes de métrica pedidos. */
export function mockValoresGA4(metricas: string[], vals: number[]): number[] {
  if (M === 1) return vals;
  return vals.map((v, i) => (GA4_VOLUME.has(metricas[i]) ? v * M : v));
}
