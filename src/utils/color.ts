export interface PaletteColor {
  name: string;
  color: string;
  tint?: string;
  /** 배지 글자색 (밝은 색은 대비 확보용으로 따로 지정) */
  tagFg?: string;
}

/** 2-3. 과목 색상 팔레트 */
export const PALETTE: PaletteColor[] = [
  { name: '와인', color: '#AD4A5D' },
  { name: '블루', color: '#4079A8', tint: '#EDF3F8' },
  { name: '그린', color: '#4E8C69', tint: '#EEF5F1' },
  { name: '퍼플', color: '#7A5DA3' },
  { name: '오렌지', color: '#B5652E' },
  { name: '틸', color: '#3A8C92', tint: '#EAF4F5' },
  { name: '머스터드', color: '#A08030', tint: '#F6F1E4', tagFg: '#6E5718' },
  { name: '그레이', color: '#6B6F76' },
];

const byColor = new Map(PALETTE.map((p) => [p.color.toLowerCase(), p]));

/** 칩·배지 배경용 옅은 색. 팔레트에 tint가 없으면 color-mix로 생성 */
export function tintOf(color: string): string {
  return byColor.get(color.toLowerCase())?.tint ?? `color-mix(in srgb, ${color} 10%, white)`;
}

export function tagFgOf(color: string): string {
  return byColor.get(color.toLowerCase())?.tagFg ?? color;
}

export const UNCATEGORIZED_COLOR = '#B5ABAF';

/** 아직 안 쓴 팔레트 색 중 첫 번째 (모두 쓰였으면 개수 기준 순환) */
export function nextPaletteColor(used: string[]): string {
  const set = new Set(used.map((c) => c.toLowerCase()));
  const free = PALETTE.find((p) => !set.has(p.color.toLowerCase()));
  return (free ?? PALETTE[used.length % PALETTE.length]).color;
}
