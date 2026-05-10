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
  ld: number | null | undefined = null,
): boolean {
  const a = cl != null && Number.isFinite(cl) ? cl : null;
  const b = cd != null && Number.isFinite(cd) ? cd : null;
  const c = ld != null && Number.isFinite(ld) ? ld : null;

  if (a === null || b === null) return false;

  // Reject zero placeholders
  if (a === 0 && b === 0) return false;

  // Reject common backend error placeholders (like -1.0 or very negative L/D)
  if (c !== null && c <= -0.99 && c >= -1.01) return false;
  if (c !== null && c < -10) return false; // unreasonable drag-to-lift or failure

  return true;
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
  const cl = readFiniteNumber(meta.final_cl) ?? null;
  const cd = readFiniteNumber(meta.final_cd) ?? null;
  let l_d = readFiniteNumber(meta.final_cl_cd) ?? null;

  if (l_d == null && cl != null && cd != null && cd !== 0) {
    l_d = cl / cd;
  }

  const status = isUsableXfoilPair(cl, cd, l_d) ? "converged" : "failed";

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
