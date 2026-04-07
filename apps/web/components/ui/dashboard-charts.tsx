import { formatNumber } from '@/features/dashboard/lib/format';

const primaryColor = 'hsl(var(--primary))';
const borderColor = 'hsl(var(--border))';
const mutedTextColor = 'hsl(var(--muted-foreground))';
const foregroundColor = 'hsl(var(--foreground))';

type AreaPoint = {
  label: string;
  fullLabel: string;
  value: number;
};

type BarPoint = {
  id: string;
  label: string;
  engagement: number;
  reach: number;
  likes: number;
  comments: number;
};

type DonutSegment = {
  label: string;
  value: number;
  percentage: number;
  color: string;
};

function buildAreaPath(points: AreaPoint[], height: number, width: number) {
  const max = Math.max(...points.map(point => point.value), 1);
  const step = width / Math.max(points.length - 1, 1);

  const coordinates = points.map((point, index) => {
    const x = index * step;
    const y = height - (point.value / max) * height;
    return { x, y };
  });

  const line = coordinates
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');
  const area = `${line} L ${width} ${height} L 0 ${height} Z`;

  return { line, area };
}

export function AreaTrendChart({
  points,
  label
}: {
  points: AreaPoint[];
  label: string;
}) {
  const width = 620;
  const height = 180;
  const { line, area } = buildAreaPath(points, height, width);
  const latest = points.at(-1)?.value ?? 0;
  const hasData = points.some(point => point.value > 0);

  return (
    <div
      className="space-y-4"
      role="img"
      aria-label={`${label}. Latest value ${formatNumber(latest)} across ${points.length} data points.`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold">{label}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.16em] text-muted-foreground">
            Latest value {formatNumber(latest)}
          </p>
        </div>
        <div className="rounded-full border border-[var(--line)] bg-[var(--panel-strong)] px-3 py-1 text-xs text-muted-foreground">
          {points.length} points
        </div>
      </div>

      <div className="rounded-[1rem] border border-[var(--line)] bg-[var(--panel-contrast)] p-4">
        {hasData ? (
          <>
            <svg
              viewBox={`0 0 ${width} ${height + 8}`}
              className="h-52 w-full"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="area-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor={primaryColor}
                    stopOpacity="0.34"
                  />
                  <stop
                    offset="100%"
                    stopColor={primaryColor}
                    stopOpacity="0"
                  />
                </linearGradient>
              </defs>

              {[0.2, 0.4, 0.6, 0.8].map(multiplier => (
                <line
                  key={multiplier}
                  x1="0"
                  x2={width}
                  y1={height * multiplier}
                  y2={height * multiplier}
                  stroke={borderColor}
                  strokeDasharray="4 8"
                />
              ))}

              <path d={area} fill="url(#area-fill)" />
              <path
                d={line}
                fill="none"
                stroke={primaryColor}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {points.map((point, index) => {
                const step = width / Math.max(points.length - 1, 1);
                const max = Math.max(...points.map(entry => entry.value), 1);
                const x = index * step;
                const y = height - (point.value / max) * height;

                return (
                  <circle
                    key={point.label}
                    cx={x}
                    cy={y}
                    r="4"
                    fill="var(--panel-strong)"
                    stroke={primaryColor}
                    strokeWidth="2"
                  />
                );
              })}
            </svg>

            <div className="mt-4 grid grid-cols-4 gap-2 text-xs text-muted-foreground sm:grid-cols-7">
              {points
                .filter((_, index) => {
                  const step =
                    points.length > 14 ? 4 : points.length > 7 ? 2 : 1;
                  return index % step === 0 || index === points.length - 1;
                })
                .map(point => (
                  <div key={point.label} className="truncate">
                    {point.label}
                  </div>
                ))}
            </div>
          </>
        ) : (
          <div className="flex h-52 items-center justify-center rounded-[0.85rem] border border-dashed border-[var(--line)] bg-[var(--panel)] px-6 text-center text-sm text-muted-foreground">
            Reach data is not available yet for the selected window.
          </div>
        )}
      </div>
    </div>
  );
}

export function PostPerformanceBars({ bars }: { bars: BarPoint[] }) {
  const max = Math.max(...bars.map(bar => bar.engagement), 1);

  return (
    <div
      className="space-y-3"
      role="img"
      aria-label="Post performance bars comparing engagement and reach."
    >
      {bars.map(bar => (
        <div
          key={bar.id}
          className="rounded-[1rem] border border-[var(--line)] bg-[var(--panel-contrast)] p-4"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-semibold">{bar.label}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Likes {formatNumber(bar.likes)} • Comments{' '}
                {formatNumber(bar.comments)}
              </p>
            </div>
            <p className="text-sm font-semibold text-primary">
              {formatNumber(bar.engagement)}
            </p>
          </div>

          <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--panel)]">
            <div
              className="h-full rounded-full bg-primary"
              style={{
                width: `${
                  bar.engagement <= 0
                    ? 0
                    : Math.max((bar.engagement / max) * 100, 8)
                }%`
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function DonutChart({
  segments,
  centerLabel
}: {
  segments: DonutSegment[];
  centerLabel: string;
}) {
  const radius = 74;
  const circumference = 2 * Math.PI * radius;
  const segmentRings = segments.reduce(
    (result, segment) => {
      const dash = (segment.percentage / 100) * circumference;

      return {
        offset: result.offset + dash,
        items: [
          ...result.items,
          {
            segment,
            dash,
            offset: result.offset
          }
        ]
      };
    },
    {
      offset: 0,
      items: [] as Array<{
        segment: DonutSegment;
        dash: number;
        offset: number;
      }>
    }
  ).items;

  return (
    <div
      className="grid gap-6 lg:grid-cols-[220px_1fr] lg:items-center"
      role="img"
      aria-label={`Engagement distribution chart with total ${centerLabel}.`}
    >
      <div className="mx-auto flex h-[220px] w-[220px] items-center justify-center rounded-[1.25rem] border border-[var(--line)] bg-[var(--panel-contrast)]">
        <svg viewBox="0 0 220 220" className="h-full w-full" aria-hidden="true">
          <g transform="translate(110 110) rotate(-90)">
            <circle
              r={radius}
              fill="none"
              stroke="var(--panel)"
              strokeWidth="24"
            />
            {segmentRings.map(({ segment, dash, offset }) => {
              return (
                <circle
                  key={segment.label}
                  r={radius}
                  fill="none"
                  stroke={segment.color}
                  strokeWidth="24"
                  strokeDasharray={`${dash} ${circumference - dash}`}
                  strokeDashoffset={-offset}
                  strokeLinecap="round"
                />
              );
            })}
          </g>
          <text
            x="110"
            y="104"
            textAnchor="middle"
            fill={mutedTextColor}
            className="text-xs uppercase tracking-[0.14em]"
          >
            Mix
          </text>
          <text
            x="110"
            y="128"
            textAnchor="middle"
            fill={foregroundColor}
            className="text-lg font-semibold"
          >
            {centerLabel}
          </text>
        </svg>
      </div>

      <div className="space-y-3">
        {segments.map(segment => (
          <div
            key={segment.label}
            className="rounded-[1rem] border border-[var(--line)] bg-[var(--panel-contrast)] px-4 py-3"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: segment.color }}
                />
                <span className="font-medium">{segment.label}</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {formatNumber(segment.value)}
              </span>
            </div>
            <p className="mt-2 text-xs uppercase tracking-[0.14em] text-muted-foreground">
              {segment.percentage.toFixed(0)}% of total
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
