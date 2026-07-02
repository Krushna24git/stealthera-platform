import { useEffect, useMemo, useRef, useState } from "react";
import { formatClock, formatDateTime } from "../utils/format.js";

export interface TrendPoint {
  t: number;
  value: number;
}

interface TrendChartProps {
  points: TrendPoint[];
  color: string;
  unit: string;
  height?: number;
  decimals?: number;
}

const MARGIN = { top: 12, right: 56, bottom: 22, left: 44 };

// Round the tick step to 1/2/5 × 10^n so the y axis lands on clean numbers.
function niceStep(span: number, targetTicks: number): number {
  const raw = span / Math.max(1, targetTicks);
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const residual = raw / magnitude;
  if (residual <= 1) return magnitude;
  if (residual <= 2) return 2 * magnitude;
  if (residual <= 5) return 5 * magnitude;
  return 10 * magnitude;
}

function buildTicks(min: number, max: number): number[] {
  if (min === max) {
    min -= 1;
    max += 1;
  }
  const step = niceStep(max - min, 3);
  const start = Math.ceil(min / step) * step;
  const ticks: number[] = [];
  for (let v = start; v <= max + 1e-9; v += step) {
    ticks.push(Number(v.toFixed(6)));
  }
  return ticks;
}

export default function TrendChart({ points, color, unit, height = 180, decimals = 0 }: TrendChartProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(560);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const node = wrapRef.current;
    if (!node) return;
    const observer = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w) setWidth(Math.max(240, w));
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const geometry = useMemo(() => {
    if (points.length === 0) return null;
    const values = points.map((p) => p.value);
    const times = points.map((p) => p.t);
    let vMin = Math.min(...values);
    let vMax = Math.max(...values);
    if (vMin === vMax) {
      vMin -= 1;
      vMax += 1;
    }
    const pad = (vMax - vMin) * 0.12;
    vMin -= pad;
    vMax += pad;
    const tMin = Math.min(...times);
    const tMax = Math.max(...times);
    const spanT = Math.max(1, tMax - tMin);

    const plotW = width - MARGIN.left - MARGIN.right;
    const plotH = height - MARGIN.top - MARGIN.bottom;
    const x = (t: number) => MARGIN.left + ((t - tMin) / spanT) * plotW;
    const y = (v: number) => MARGIN.top + (1 - (v - vMin) / (vMax - vMin)) * plotH;

    const coords = points.map((p) => ({ px: x(p.t), py: y(p.value), point: p }));
    const line = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.px.toFixed(1)},${c.py.toFixed(1)}`).join("");
    const baseline = MARGIN.top + plotH;
    const area = `${line}L${coords[coords.length - 1].px.toFixed(1)},${baseline}L${coords[0].px.toFixed(1)},${baseline}Z`;

    return {
      coords,
      line,
      area,
      ticks: buildTicks(vMin, vMax),
      x,
      y,
      tMin,
      tMax,
      spanT,
      plotW,
      plotH,
      baseline,
    };
  }, [points, width, height]);

  if (!geometry) {
    return <p className="muted chart-empty">No readings in the selected window.</p>;
  }

  const { coords, line, area, ticks, y, tMin, tMax, spanT, baseline } = geometry;
  const last = coords[coords.length - 1];
  const hovered = hover !== null ? coords[hover] : null;

  const onMove = (event: React.MouseEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const px = event.clientX - rect.left;
    let nearest = 0;
    let best = Infinity;
    coords.forEach((c, i) => {
      const d = Math.abs(c.px - px);
      if (d < best) {
        best = d;
        nearest = i;
      }
    });
    setHover(nearest);
  };

  const tooltipLeft = hovered ? Math.min(Math.max(hovered.px, 70), width - 70) : 0;

  return (
    <div className="chart-wrap" ref={wrapRef}>
      <svg
        width={width}
        height={height}
        role="img"
        aria-label={`Trend chart, latest ${last.point.value.toFixed(decimals)} ${unit}`}
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
      >
        {ticks.map((tick) => (
          <g key={tick}>
            <line
              x1={MARGIN.left}
              x2={width - MARGIN.right}
              y1={y(tick)}
              y2={y(tick)}
              className="chart-grid"
            />
            <text x={MARGIN.left - 8} y={y(tick) + 3.5} textAnchor="end" className="chart-tick">
              {tick.toFixed(decimals)}
            </text>
          </g>
        ))}

        <line
          x1={MARGIN.left}
          x2={width - MARGIN.right}
          y1={baseline}
          y2={baseline}
          className="chart-axis"
        />
        <text x={MARGIN.left} y={height - 6} className="chart-tick">
          {formatClock(tMin, spanT)}
        </text>
        <text x={width - MARGIN.right} y={height - 6} textAnchor="end" className="chart-tick">
          {formatClock(tMax, spanT)}
        </text>

        <path d={area} fill={color} opacity={0.1} />
        <path d={line} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

        {hovered && (
          <line x1={hovered.px} x2={hovered.px} y1={MARGIN.top} y2={baseline} className="chart-crosshair" />
        )}
        {hovered && hovered !== last && (
          <circle cx={hovered.px} cy={hovered.py} r={4} fill={color} stroke="var(--card)" strokeWidth={2} />
        )}

        <circle cx={last.px} cy={last.py} r={4.5} fill={color} stroke="var(--card)" strokeWidth={2} />
        <text x={last.px + 10} y={last.py + 4} className="chart-end-label">
          {last.point.value.toFixed(decimals)} {unit}
        </text>
      </svg>

      {hovered && (
        <div className="chart-tooltip" style={{ left: tooltipLeft, top: Math.max(hovered.py - 14, 4) }}>
          <strong>
            {hovered.point.value.toFixed(decimals)} {unit}
          </strong>
          <span>{formatDateTime(new Date(hovered.point.t).toISOString())}</span>
        </div>
      )}
    </div>
  );
}
