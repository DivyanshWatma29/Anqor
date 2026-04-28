import { useEffect, useState, useRef } from "react";

interface RiskMeterProps {
  score: number;
}

const RiskMeter = ({ score }: RiskMeterProps) => {
  const [animatedScore, setAnimatedScore] = useState(0);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    let start = 0;
    const duration = 1500;
    const startTime = performance.now();

    const animate = (time: number) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(eased * score));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [score]);

  const circumference = 2 * Math.PI * 54;
  const arcLength = circumference * 0.75;
  const offset = arcLength - (animatedScore / 100) * arcLength;

  const getGradientId = () => {
    if (score < 40) return "gradient-success";
    if (score < 70) return "gradient-warning";
    return "gradient-danger";
  };

  return (
    <div className="relative w-48 h-48 mx-auto">
      {/* Glow effect */}
      <div
        className="absolute inset-4 rounded-full blur-2xl opacity-20"
        style={{
          background: score < 40
            ? "hsl(var(--success))"
            : score < 70
            ? "hsl(var(--warning))"
            : "hsl(var(--danger))",
        }}
      />
      <svg className="w-full h-full -rotate-[135deg]" viewBox="0 0 120 120">
        <defs>
          <linearGradient id="gradient-success" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(160, 84%, 39%)" />
            <stop offset="100%" stopColor="hsl(180, 80%, 45%)" />
          </linearGradient>
          <linearGradient id="gradient-warning" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(38, 92%, 50%)" />
            <stop offset="100%" stopColor="hsl(25, 90%, 55%)" />
          </linearGradient>
          <linearGradient id="gradient-danger" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(347, 77%, 50%)" />
            <stop offset="100%" stopColor="hsl(330, 80%, 55%)" />
          </linearGradient>
        </defs>
        {/* Background track */}
        <circle
          cx="60" cy="60" r="54"
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth="6"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * 0.25}
          strokeLinecap="round"
        />
        {/* Score arc */}
        <circle
          cx="60" cy="60" r="54"
          fill="none"
          stroke={`url(#${getGradientId()})`}
          strokeWidth="6"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-100"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-extrabold text-foreground tabular-nums">{animatedScore}</span>
        <span className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-widest">Risk Score</span>
      </div>
    </div>
  );
};

export default RiskMeter;
