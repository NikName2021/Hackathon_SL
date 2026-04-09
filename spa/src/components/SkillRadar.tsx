import React from 'react';

interface SkillData {
  subject: string;
  A: number;
  fullMark: number;
}

interface SkillRadarProps {
  data: SkillData[];
  size?: number;
}

export const SkillRadar: React.FC<SkillRadarProps> = ({ data, size = 300 }) => {
  if (!data || data.length === 0) return null;

  const centerX = size / 2;
  const centerY = size / 2;
  const radius = (size / 2) * 0.7;
  const numPoints = data.length;
  const angleStep = (Math.PI * 2) / numPoints;

  // Points for the outer grid
  const gridPoints = Array.from({ length: 5 }).map((_, i) => {
    const r = (radius / 5) * (i + 1);
    return Array.from({ length: numPoints }).map((_, j) => {
      const angle = j * angleStep - Math.PI / 2;
      return {
        x: centerX + r * Math.cos(angle),
        y: centerY + r * Math.sin(angle),
      };
    });
  });

  // Points for the user's data
  const dataPoints = data.map((d, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const r = (radius * (d.A || 0)) / d.fullMark;
    return {
      x: centerX + r * Math.cos(angle),
      y: centerY + r * Math.sin(angle),
    };
  });

  // Labels
  const labelPoints = data.map((d, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const labelRadius = radius + 25;
    return {
      x: centerX + labelRadius * Math.cos(angle),
      y: centerY + labelRadius * Math.sin(angle),
      text: d.subject,
    };
  });

  return (
    <div className="flex justify-center items-center w-full">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Grids */}
        {gridPoints.map((points, i) => (
          <polygon
            key={i}
            points={points.map(p => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke="currentColor"
            className="text-surface-200 dark:text-white/10"
            strokeWidth="1"
          />
        ))}

        {/* Axis lines */}
        {gridPoints[4].map((p, i) => (
          <line
            key={i}
            x1={centerX}
            y1={centerY}
            x2={p.x}
            y2={p.y}
            stroke="currentColor"
            className="text-surface-200 dark:text-white/10"
            strokeWidth="1"
          />
        ))}

        {/* Data area */}
        <polygon
          points={dataPoints.map(p => `${p.x},${p.y}`).join(' ')}
          fill="rgba(99, 102, 241, 0.4)"
          stroke="#6366f1"
          strokeWidth="2"
          className="transition-all duration-500"
        >
          <animate
             attributeName="points"
             dur="0.5s"
             from={`${centerX},${centerY} `.repeat(numPoints)}
             to={dataPoints.map(p => `${p.x},${p.y}`).join(' ')}
          />
        </polygon>

        {/* Data points */}
        {dataPoints.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="4"
            fill="#6366f1"
            className="neon-glow-primary"
          />
        ))}

        {/* Labels */}
        {labelPoints.map((p, i) => (
          <text
            key={i}
            x={p.x}
            y={p.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="10"
            className="fill-surface-500 font-bold uppercase tracking-tight"
          >
            {p.text}
          </text>
        ))}
      </svg>
    </div>
  );
};
