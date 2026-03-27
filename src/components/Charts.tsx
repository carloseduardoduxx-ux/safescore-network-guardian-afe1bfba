import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis,
} from "recharts";
import { categoryScores, scanHistory, severityDistribution } from "@/data/mockScanData";

const chartCardClass = "bg-card border border-border rounded-lg p-4";

export const SeverityPieChart = () => (
  <div className={chartCardClass}>
    <h3 className="font-semibold text-foreground text-sm mb-4">Distribuição por Severidade</h3>
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={severityDistribution}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={85}
          paddingAngle={4}
          dataKey="value"
          stroke="none"
        >
          {severityDistribution.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(220, 18%, 10%)",
            border: "1px solid hsl(220, 15%, 18%)",
            borderRadius: "8px",
            color: "hsl(160, 30%, 85%)",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "12px",
          }}
        />
      </PieChart>
    </ResponsiveContainer>
    <div className="flex flex-wrap gap-3 justify-center mt-2">
      {severityDistribution.map((item) => (
        <div key={item.name} className="flex items-center gap-1.5 text-xs">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.fill }} />
          <span className="text-muted-foreground">{item.name} ({item.value})</span>
        </div>
      ))}
    </div>
  </div>
);

export const ScoreHistoryChart = () => (
  <div className={chartCardClass}>
    <h3 className="font-semibold text-foreground text-sm mb-4">Histórico de Score</h3>
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={scanHistory}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 15%)" />
        <XAxis dataKey="date" tick={{ fill: "hsl(220, 10%, 55%)", fontSize: 12, fontFamily: "'JetBrains Mono'" }} />
        <YAxis domain={[0, 100]} tick={{ fill: "hsl(220, 10%, 55%)", fontSize: 12, fontFamily: "'JetBrains Mono'" }} />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(220, 18%, 10%)",
            border: "1px solid hsl(220, 15%, 18%)",
            borderRadius: "8px",
            color: "hsl(160, 30%, 85%)",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "12px",
          }}
        />
        <Line type="monotone" dataKey="score" stroke="hsl(155, 100%, 50%)" strokeWidth={2} dot={{ fill: "hsl(155, 100%, 50%)", r: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  </div>
);

export const CategoryBarChart = () => (
  <div className={chartCardClass}>
    <h3 className="font-semibold text-foreground text-sm mb-4">Score por Categoria</h3>
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={categoryScores} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 15%)" />
        <XAxis type="number" domain={[0, 100]} tick={{ fill: "hsl(220, 10%, 55%)", fontSize: 11, fontFamily: "'JetBrains Mono'" }} />
        <YAxis dataKey="category" type="category" tick={{ fill: "hsl(220, 10%, 55%)", fontSize: 11, fontFamily: "'JetBrains Mono'" }} width={80} />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(220, 18%, 10%)",
            border: "1px solid hsl(220, 15%, 18%)",
            borderRadius: "8px",
            color: "hsl(160, 30%, 85%)",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "12px",
          }}
        />
        <Bar dataKey="score" radius={[0, 4, 4, 0]} fill="hsl(155, 80%, 35%)" />
      </BarChart>
    </ResponsiveContainer>
  </div>
);

export const CategoryRadarChart = () => (
  <div className={chartCardClass}>
    <h3 className="font-semibold text-foreground text-sm mb-4">Radar de Segurança</h3>
    <ResponsiveContainer width="100%" height={260}>
      <RadarChart cx="50%" cy="50%" outerRadius="75%" data={categoryScores}>
        <PolarGrid stroke="hsl(220, 15%, 18%)" />
        <PolarAngleAxis dataKey="category" tick={{ fill: "hsl(220, 10%, 55%)", fontSize: 11, fontFamily: "'JetBrains Mono'" }} />
        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "hsl(220, 10%, 40%)", fontSize: 10 }} />
        <Radar name="Score" dataKey="score" stroke="hsl(155, 100%, 50%)" fill="hsl(155, 100%, 50%)" fillOpacity={0.15} strokeWidth={2} />
      </RadarChart>
    </ResponsiveContainer>
  </div>
);
