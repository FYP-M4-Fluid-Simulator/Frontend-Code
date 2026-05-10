import type { OptCompleteFrame } from "./socket/OptimizationWebSocket";

export type XfoilMetrics = {
  cl: number | null;
  cd: number | null;
  l_d: number | null;
  status: string;
};

function readFiniteNumber(v: unknown): number | null {
  if (typeof v !== "number" || !Number.isFinite(v)) return null;
  return v;
}

/** True when XFoil lift/drag are finite and not the (0,0) placeholder. */
export function isUsableXfoilPair(
  cl: number | null | undefined,
  cd: number | null | undefined,
): boolean {
  const validCl = cl != null && Number.isFinite(cl) ? cl : null;
  const validCd = cd != null && Number.isFinite(cd) ? cd : null;
  if (validCl === null || validCd === null) return false;
  return !(validCl === 0 && validCd === 0);
}

/** Session / HTTP payloads from the Python backend (`meta` on result). */
export function extractXfoilFromSessionMeta(
  meta: Record<string, unknown> | undefined | null,
): XfoilMetrics {
  if (!meta) {
    return { cl: null, cd: null, l_d: null, status: "not_run" };
  }
  const cl =
    readFiniteNumber(meta.final_xfoil_cl) ??
    readFiniteNumber(meta.xfoil_cl) ??
    readFiniteNumber(meta.xfoilCl) ??
    null;
  const cd =
    readFiniteNumber(meta.final_xfoil_cd) ??
    readFiniteNumber(meta.xfoil_cd) ??
    readFiniteNumber(meta.xfoilCd) ??
    null;
  let l_d =
    readFiniteNumber(meta.final_xfoil_l_d) ??
    readFiniteNumber(meta.xfoil_l_d) ??
    readFiniteNumber(meta.xfoilLd) ??
    null;
  if (l_d == null && cl != null && cd != null && cd !== 0) {
    l_d = cl / cd;
  }
  const statusRaw =
    meta.final_xfoil_status ?? meta.xfoil_status ?? meta.xfoilStatus;
  const status =
    typeof statusRaw === "string" && statusRaw.length > 0
      ? statusRaw
      : "not_run";

  return { cl, cd, l_d, status };
}

export function extractOptXfoilFromCompleteMeta(
  meta: OptCompleteFrame["meta"],
): XfoilMetrics {
  const cl =
    readFiniteNumber(meta.final_xfoil_cl) ??
    readFiniteNumber(meta.xfoil_cl) ??
    null;
  const cd =
    readFiniteNumber(meta.final_xfoil_cd) ??
    readFiniteNumber(meta.xfoil_cd) ??
    null;
  let l_d =
    readFiniteNumber(meta.final_xfoil_l_d) ??
    readFiniteNumber(meta.xfoil_l_d) ??
    null;

  if (l_d == null && cl != null && cd != null && cd !== 0) {
    l_d = cl / cd;
  }

  const statusRaw = meta.final_xfoil_status ?? meta.xfoil_status;
  const status =
    typeof statusRaw === "string" && statusRaw.length > 0
      ? statusRaw
      : "not_run";

  return { cl, cd, l_d, status };
}

/** UI + export shape: primary cl/cd/LD slots mirror XFoil (solver Cl/Cd not used). */
export function displayMetricsFromXfoil(
  xf: XfoilMetrics,
  loss = 0,
): {
  cl: number;
  cd: number;
  liftToDragRatio: number;
  loss: number;
  xfoilCl: number | null;
  xfoilCd: number | null;
  xfoilLd: number | null;
  xfoilStatus: string;
} {
  const cl = xf.cl ?? 0;
  const cd = xf.cd ?? 0;
  const liftToDragRatio =
    xf.l_d != null && Number.isFinite(xf.l_d)
      ? xf.l_d
      : cd !== 0
        ? cl / cd
        : 0;
  return {
    cl,
    cd,
    liftToDragRatio,
    loss,
    xfoilCl: xf.cl,
    xfoilCd: xf.cd,
    xfoilLd: xf.l_d,
    xfoilStatus: xf.status,
  };
}

export function extractOptXfoilFromIterationMeta(meta: {
  xfoil_cl?: number | null;
  xfoil_cd?: number | null;
  xfoil_l_d?: number | null;
  xfoil_status?: string | null;
}): XfoilMetrics {
  const cl = readFiniteNumber(meta.xfoil_cl) ?? null;
  const cd = readFiniteNumber(meta.xfoil_cd) ?? null;
  let l_d = readFiniteNumber(meta.xfoil_l_d) ?? null;
  if (l_d == null && cl != null && cd != null && cd !== 0) {
    l_d = cl / cd;
  }
  const statusRaw = meta.xfoil_status;
  const status =
    typeof statusRaw === "string" && statusRaw.length > 0
      ? statusRaw
      : "not_run";
  return { cl, cd, l_d, status };
}
