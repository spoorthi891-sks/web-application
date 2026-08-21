import { useId } from "react";

export default function Sparkline({
  points,
  stroke = "#00FF9D",
  className = "",
  label,
}) {
  const gradientId = useId();
  const width = 100;
  const height = 36;
  const pad = 2;

  if (!Array.isArray(points) || points.length < 2) {
    return (
      <div
        className={`flex items-center justify-center font-mono text-[10px] uppercase tracking-wider text-slate-600 ${className}`}
      >
        NO DATA
      </div>
    );
  }

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const coords = points.map((value, index) => [
    pad + (index / (points.length - 1)) * (width - pad * 2),
    height - pad - ((value - min) / range) * (height - pad * 2),
  ]);
  const linePath = coords
    .map(([x, y], index) => `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`)
    .join(" ");
  const areaPath = `${linePath} L${(width - pad).toFixed(2)} ${height} L${pad} ${height} Z`;
  const [lastX, lastY] = coords[coords.length - 1];

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      role="img"
      aria-label={label ?? "usage trend"}
      className={className}
    >
      <defs>
        <linearGradient
          id={gradientId}
          x1="0"
          y1="0"
          x2="0"
          y2="1"
        >
          <stop offset="0%" stopColor={stroke} stopOpacity="0.25" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradientId})`} />
      <path
        d={linePath}
        fill="none"
        stroke={stroke}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle cx={lastX} cy={lastY} r="1.6" fill={stroke} />
    </svg>
  );
}
