import { useMemo } from "react";

interface ScoreGaugeProps {
  score: number;
  size?: number;
}

const ScoreGauge = ({ score, size = 220 }: ScoreGaugeProps) => {
  const { color, label, glowClass } = useMemo(() => {
    if (score <= 30) return { color: "hsl(0, 85%, 55%)", label: "Crítico", glowClass: "glow-danger" };
    if (score <= 50) return { color: "hsl(25, 95%, 55%)", label: "Alto Risco", glowClass: "glow-danger" };
    if (score <= 70) return { color: "hsl(40, 95%, 55%)", label: "Moderado", glowClass: "glow-secondary" };
    return { color: "hsl(155, 80%, 45%)", label: "Seguro", glowClass: "glow-primary" };
  }, [score]);

  const radius = (size - 30) / 2;
  const circumference = 2 * Math.PI * radius * 0.75;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const center = size / 2;

  return (
    <div className={`flex flex-col items-center gap-3 ${glowClass} rounded-full p-1`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="drop-shadow-lg">
        {/* Background arc */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="hsl(220, 15%, 15%)"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * 0.25}
          transform={`rotate(135 ${center} ${center})`}
        />
        {/* Score arc */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform={`rotate(135 ${center} ${center})`}
          style={{
            transition: "stroke-dashoffset 1.5s ease-out",
            filter: `drop-shadow(0 0 8px ${color})`,
          }}
        />
        {/* Score text */}
        <text x={center} y={center - 10} textAnchor="middle" fill={color} fontSize="48" fontWeight="700" fontFamily="'JetBrains Mono', monospace">
          {score}
        </text>
        <text x={center} y={center + 20} textAnchor="middle" fill="hsl(220, 10%, 55%)" fontSize="14" fontFamily="'Inter', sans-serif">
          de 100
        </text>
        <text x={center} y={center + 45} textAnchor="middle" fill={color} fontSize="13" fontWeight="600" fontFamily="'Inter', sans-serif">
          {label}
        </text>
      </svg>
    </div>
  );
};

export default ScoreGauge;
