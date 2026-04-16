import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

const scoreColor = (s) => {
  if (s >= 57.5) return 'hsl(142,69%,58%)';
  if (s >= 42.5) return 'hsl(45,93%,58%)';
  return 'hsl(0,84%,60%)';
};

const scoreLabel = (s) => {
  if (s >= 57.5) return 'Positive';
  if (s >= 42.5) return 'Neutral';
  return 'Negative';
};

export function ScoreGauge({ score, size = 200, label = 'Overall Score', showLabel = true }) {
  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    if (typeof score !== 'number') return;
    const t = setTimeout(() => setAnimated(score), 150);
    return () => clearTimeout(t);
  }, [score]);

  const strokeWidth = 12;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const arcFraction = 0.75; // 270° arc
  const arcLength = circumference * arcFraction;
  const fill = arcLength * (animated / 100);
  const color = scoreColor(score);
  const glow = `drop-shadow(0 0 12px ${color}88)`;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Box sx={{ position: 'relative', width: size, height: size }}>
        <svg
          width={size}
          height={size}
          style={{ transform: 'rotate(135deg)', overflow: 'visible' }}
        >
          {/* Track */}
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.07)"
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeLinecap="round"
          />
          {/* Filled arc */}
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${fill} ${circumference}`}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dasharray 1.4s cubic-bezier(0.4, 0, 0.2, 1)',
              filter: glow,
            }}
          />
        </svg>

        {/* Center content */}
        <Box sx={{
          position: 'absolute', top: '46%', left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
        }}>
          <Typography
            variant="h2"
            fontWeight={800}
            sx={{ color, fontFamily: '"Sora", sans-serif', lineHeight: 1, letterSpacing: '-2px' }}
          >
            {Math.round(animated)}
          </Typography>
          <Typography variant="caption" sx={{ color: 'hsl(215,20%,50%)', fontSize: 12 }}>
            out of 100
          </Typography>
        </Box>
      </Box>

      {showLabel && (
        <Box sx={{ textAlign: 'center', mt: -2.5 }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ color, fontFamily: '"Sora", sans-serif' }}>
            {scoreLabel(score)}
          </Typography>
          <Typography variant="caption" sx={{ color: 'hsl(215,20%,55%)' }}>
            {label}
          </Typography>
        </Box>
      )}
    </Box>
  );
}
