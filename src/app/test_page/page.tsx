"use client";

import CFDCanvas from "@/components/CFD_CANVAS";
import { useRef } from "react";

export default function Page() {
  const frameRef = useRef<any>(null);
  return <CFDCanvas frameRef={frameRef} />;
}
