export type Look = "dark" | "red" | "motion" | "steady" | "flat";

/** Tiny on-device read of a frame. No text, no pixels leave this function. */
export function lookAt(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  previous: Uint8ClampedArray | null,
): { kind: Look; motion: number } {
  const count = width * height;
  let luma = 0;
  let red = 0;
  let motion = 0;
  for (let i = 0, pixel = 0; i < data.length; i += 4, pixel += 1) {
    const y = (data[i] * 3 + data[i + 1] * 6 + data[i + 2]) / 10;
    luma += y;
    if (data[i] > 170 && data[i] > data[i + 1] + 45 && data[i] > data[i + 2] + 45) red += 1;
    if (previous) {
      const py = (previous[i] * 3 + previous[i + 1] * 6 + previous[i + 2]) / 10;
      motion += Math.abs(y - py);
    }
  }
  luma /= count;
  red /= count;
  motion = previous ? motion / count : 0;
  let kind: Look = "steady";
  if (luma < 26) kind = "dark";
  else if (red > 0.12) kind = "red";
  else if (motion > 22) kind = "motion";
  return { kind, motion };
}

export function lookLabel(kind: Look): string {
  if (kind === "dark") return "偏暗";
  if (kind === "red") return "有醒目的红";
  if (kind === "motion") return "在动";
  return "正常";
}
