export const SAT_SECTION_MIN = 200;
export const SAT_SECTION_MAX = 800;

export const SAT_RW_MAX_RAW = 54;
export const SAT_MATH_MAX_RAW = 44;

export const RW_SCALE_HARD: ReadonlyArray<readonly [number, number]> = [
  [0, 200], [3, 230], [6, 260], [9, 290], [12, 320], [15, 360],
  [18, 390], [21, 420], [24, 460], [27, 490], [30, 520], [33, 550],
  [36, 580], [39, 610], [42, 640], [44, 660], [46, 680], [48, 710],
  [50, 740], [52, 770], [53, 790], [54, 800],
];

export const RW_SCALE_EASY: ReadonlyArray<readonly [number, number]> = [
  [0, 200], [3, 220], [6, 250], [9, 270], [12, 300], [15, 330],
  [18, 360], [21, 390], [24, 410], [27, 430], [30, 450], [33, 470],
  [36, 490], [39, 510], [42, 530], [44, 550], [46, 570], [48, 590],
  [50, 610], [52, 630], [54, 650],
];

export const MATH_SCALE_HARD: ReadonlyArray<readonly [number, number]> = [
  [0, 200], [2, 230], [4, 260], [6, 290], [8, 320], [10, 350],
  [12, 380], [14, 410], [16, 440], [18, 470], [20, 500], [22, 530],
  [24, 560], [26, 590], [28, 620], [30, 650], [32, 680], [34, 710],
  [36, 740], [38, 760], [40, 780], [42, 790], [43, 795], [44, 800],
];

export const MATH_SCALE_EASY: ReadonlyArray<readonly [number, number]> = [
  [0, 200], [2, 220], [4, 240], [6, 260], [8, 280], [10, 300],
  [12, 325], [14, 350], [16, 375], [18, 400], [20, 420], [22, 445],
  [24, 465], [26, 480], [28, 500], [30, 515], [32, 530], [34, 545],
  [36, 560], [38, 575], [40, 590], [42, 610], [44, 630],
];

export function rawToScaled(
  raw: number,
  table: ReadonlyArray<readonly [number, number]>,
): number {
  if (raw <= table[0][0]) return table[0][1];
  const last = table[table.length - 1];
  if (raw >= last[0]) return last[1];

  for (let i = 1; i < table.length; i++) {
    if (raw <= table[i][0]) {
      const [x0, y0] = table[i - 1];
      const [x1, y1] = table[i];
      const t = (raw - x0) / (x1 - x0);
      return Math.round(y0 + t * (y1 - y0));
    }
  }
  return last[1];
}

export function computeSectionScaled(
  subject: "RW" | "MATH",
  correct: number,
  total: number,
  hard: boolean,
): number {
  if (total === 0) return SAT_SECTION_MIN;

  const maxRaw = subject === "RW" ? SAT_RW_MAX_RAW : SAT_MATH_MAX_RAW;
  const normalizedRaw =
    total === maxRaw ? correct : Math.round((correct / total) * maxRaw);

  const table =
    subject === "RW"
      ? hard
        ? RW_SCALE_HARD
        : RW_SCALE_EASY
      : hard
        ? MATH_SCALE_HARD
        : MATH_SCALE_EASY;

  const scaled = rawToScaled(normalizedRaw, table);
  const clamped = Math.max(SAT_SECTION_MIN, Math.min(SAT_SECTION_MAX, scaled));
  return Math.round(clamped / 10) * 10;
}