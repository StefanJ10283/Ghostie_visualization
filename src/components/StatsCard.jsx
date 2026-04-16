import { useState, useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

const glowSx = {
  green:  { boxShadow: '0 0 20px hsl(142 69% 58% / 0.15), 0 0 60px hsl(142 69% 58% / 0.05)' },
  purple: { boxShadow: '0 0 20px hsl(262 83% 74% / 0.15), 0 0 60px hsl(262 83% 74% / 0.05)' },
};

function useCountUp(target, duration = 700) {
  const [display, setDisplay] = useState(target);
  const prev = useRef(target);

  useEffect(() => {
    if (typeof target !== 'number') { setDisplay(target); return; }
    const from = typeof prev.current === 'number' ? prev.current : 0;
    prev.current = target;
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      const current = from + (target - from) * eased;
      setDisplay(Number.isInteger(target) ? Math.round(current) : Math.round(current * 10) / 10);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);

  return display;
}

export function StatsCard({ label, value, icon: Icon, trend, glow }) {
  const animated = useCountUp(value);

  return (
    <Box sx={{
      p: 2.5,
      borderRadius: '12px',
      border: '1px solid hsl(230,25%,25%)',
      bgcolor: 'hsl(228,38%,16%)',
      backdropFilter: 'blur(16px)',
      transition: 'box-shadow 0.3s',
      ...(glow ? glowSx[glow] : {}),
    }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="caption" sx={{
            textTransform: 'uppercase', letterSpacing: 1.2,
            color: 'hsl(215,20%,60%)', display: 'block', mb: 0.5, fontSize: 12, fontWeight: 600,
          }}>
            {label}
          </Typography>
          <Typography variant="h4" fontWeight={700} sx={{ color: 'hsl(210,40%,93%)', fontFamily: '"Sora", sans-serif' }}>
            {animated}
          </Typography>
          {trend && (
            <Box sx={{
              display: 'flex', alignItems: 'center', gap: 0.5, mt: 1,
              color: trend.positive ? 'hsl(142,69%,58%)' : 'hsl(0,84%,60%)',
            }}>
              {trend.positive
                ? <TrendingUpIcon sx={{ fontSize: 13 }} />
                : <TrendingDownIcon sx={{ fontSize: 13 }} />}
              <Typography variant="caption" fontWeight={600} sx={{ fontSize: 11 }}>
                {trend.positive ? '+' : ''}{trend.value}%
              </Typography>
            </Box>
          )}
        </Box>
        {Icon && (
          <Box sx={{
            width: 40, height: 40, borderRadius: 2,
            bgcolor: 'rgba(255,255,255,0.05)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon sx={{ fontSize: 20, color: 'hsl(215,20%,60%)' }} />
          </Box>
        )}
      </Box>
    </Box>
  );
}
