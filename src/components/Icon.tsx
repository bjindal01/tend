import Svg, { Circle, Path } from 'react-native-svg';

export type IconName =
  | 'today' | 'people' | 'map' | 'rhythm' | 'search' | 'plus' | 'message' | 'call'
  | 'meet' | 'video' | 'email' | 'back' | 'check' | 'bulb' | 'more' | 'close' | 'sliders';

const PATHS: Record<IconName, string[]> = {
  today: ['M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4'],
  people: ['M2.5 20a6.5 6.5 0 0 1 13 0', 'M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 3.5 6'],
  map: ['M10.2 10.2L6.4 6.4M14.2 10.8l3.2-3.2M13.3 14.2l2.6 3.2'],
  rhythm: ['M3 12h4l3-7 4 14 3-7h4'],
  search: ['M20 20l-3.5-3.5'],
  plus: ['M12 5v14M5 12h14'],
  message: ['M4 5h16v11H9l-5 4z'],
  call: ['M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1z'],
  meet: ['M5 10h12v5a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4zM17 11h1.5a2.5 2.5 0 0 1 0 5H17M9 3v3M13 3v3'],
  video: ['M3 7h12v10H3zM15 10l6-3v10l-6-3'],
  email: ['M3 6h18v12H3zM3 6l9 7 9-7'],
  back: ['M15 5l-7 7 7 7'],
  check: ['M8 12.5l2.5 2.5L16 9.5'],
  bulb: ['M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9V16h7v-2.1A6 6 0 0 0 12 3z'],
  more: ['M5 12h.01M12 12h.01M19 12h.01'],
  close: ['M6 6l12 12M18 6L6 18'],
  sliders: ['M4 7h10M18 7h2M4 17h4M12 17h8'],
};

const CIRCLES: Partial<Record<IconName, [number, number, number][]>> = {
  today: [[12, 12, 4]],
  people: [[9, 8, 3.5]],
  map: [[12, 12, 2.5], [5, 5, 2], [19, 6, 2], [17, 19, 2]],
  search: [[11, 11, 7]],
  check: [[12, 12, 9]],
  sliders: [[16, 7, 2], [10, 17, 2]],
};

export function Icon({ name, size = 20, color = '#1B1F1C', strokeWidth = 1.9 }: { name: IconName; size?: number; color?: string; strokeWidth?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={name === 'more' ? 3 : strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      {(CIRCLES[name] ?? []).map(([cx, cy, r], i) => (
        <Circle key={`c${i}`} cx={cx} cy={cy} r={r} />
      ))}
      {PATHS[name].map((d, i) => (
        <Path key={`p${i}`} d={d} />
      ))}
    </Svg>
  );
}
