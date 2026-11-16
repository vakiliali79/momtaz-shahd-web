import { cn } from "@/lib/utils";

// Simplified outline of Iran as [longitude, latitude] pairs. Illustrative
// only: good enough for a teaser, not for navigation.
const OUTLINE: readonly (readonly [number, number])[] = [
  [44.0, 39.4], [44.8, 39.7], [46.0, 38.9], [47.9, 39.7], [48.4, 39.0],
  [48.9, 38.4], [49.1, 37.6], [50.2, 37.4], [51.1, 36.7], [52.8, 36.7],
  [53.9, 37.0], [53.9, 37.3], [54.8, 37.4], [56.2, 38.1], [57.3, 38.2],
  [58.4, 37.6], [59.3, 37.5], [60.4, 36.6], [61.2, 36.6], [61.1, 35.6],
  [60.5, 34.3], [60.9, 33.5], [60.6, 32.2], [61.8, 31.0], [60.9, 29.8],
  [61.9, 28.5], [62.8, 27.2], [63.3, 26.8], [61.9, 26.2], [61.6, 25.2],
  [59.0, 25.4], [57.3, 25.8], [56.9, 27.1], [56.3, 27.2], [54.8, 26.5],
  [53.4, 26.8], [52.6, 27.5], [51.4, 27.9], [50.8, 28.9], [50.1, 30.2],
  [49.0, 30.5], [48.6, 29.9], [48.0, 30.5], [47.7, 31.0], [47.9, 31.8],
  [47.4, 32.5], [46.1, 33.0], [45.4, 34.0], [45.5, 34.6], [46.2, 35.1],
  [45.4, 36.0], [44.8, 37.2], [44.2, 38.0],
];

const WIDTH = 400;
const HEIGHT = 330;
const BOUNDS = { west: 43.3, east: 64, north: 40.4, south: 24.6 };

function project(lng: number, lat: number): [number, number] {
  return [
    ((lng - BOUNDS.west) / (BOUNDS.east - BOUNDS.west)) * WIDTH,
    ((BOUNDS.north - lat) / (BOUNDS.north - BOUNDS.south)) * HEIGHT,
  ];
}

export type MapPoint = { id: string; lat: number; lng: number; label: string };

export function IranMap({
  points,
  label,
  className,
}: {
  points: readonly MapPoint[];
  label: string;
  className?: string;
}) {
  const path =
    OUTLINE.map(([lng, lat], index) => {
      const [x, y] = project(lng, lat);
      return `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    }).join(" ") + " Z";

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-label={label}
      className={cn("h-auto w-full", className)}
    >
      <path
        d={path}
        className="fill-secondary stroke-brand-gold/60"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {points.map((point) => {
        const [x, y] = project(point.lng, point.lat);
        return (
          <g key={point.id}>
            <title>{point.label}</title>
            <circle cx={x} cy={y} r="11" className="fill-brand-red/20" />
            <circle
              cx={x}
              cy={y}
              r="5"
              className="fill-brand-red stroke-background"
              strokeWidth="2"
            />
          </g>
        );
      })}
    </svg>
  );
}
