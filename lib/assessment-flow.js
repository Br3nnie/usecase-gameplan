export function nextGateProgress(gateIndex, totalGates) {
  if (gateIndex < totalGates - 1) {
    return { gateIndex: gateIndex + 1, step: "gates" };
  }
  return { gateIndex, step: "scoring" };
}
