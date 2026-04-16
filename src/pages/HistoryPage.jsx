import { useState, useMemo } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import TimelineIcon from '@mui/icons-material/Timeline';
import StarIcon from '@mui/icons-material/Star';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import {
  Area,
  Line,
  CartesianGrid,
  ComposedChart,
  Legend,
  ResponsiveContainer,
  Tooltip as ReTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { SentimentBadge } from '../components/SentimentBadge';
import { StatsCard } from '../components/StatsCard';
import { makeApiClient } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { BusinessPicker } from '../components/BusinessPicker';
import { useBusiness } from '../context/BusinessContext';

// Aurora palette — one colour per company slot
const SERIES_COLORS = [
  'hsl(142,69%,58%)',  // green
  'hsl(262,83%,74%)',  // purple
  'hsl(45,93%,58%)',   // yellow
  'hsl(200,80%,60%)',  // blue
  'hsl(0,70%,65%)',    // red
];

// Linear regression over an array of numbers → returns predicted values at same indices
function linearRegression(values) {
  const n = values.length;
  if (n < 2) return values.slice();
  const xMean = (n - 1) / 2;
  const yMean = values.reduce((a, b) => a + b, 0) / n;
  let num = 0, den = 0;
  values.forEach((y, x) => {
    num += (x - xMean) * (y - yMean);
    den += (x - xMean) ** 2;
  });
  const slope = den === 0 ? 0 : num / den;
  const intercept = yMean - slope * xMean;
  return values.map((_, x) => Math.round((slope * x + intercept) * 10) / 10);
}

const GLASS = {
  borderRadius: '12px',
  border: '1px solid hsl(230,25%,25%)',
  bgcolor: 'hsl(228,38%,16%)',
};

const fadeUp = (delay = 0) => ({
  '@keyframes fadeUp': {
    from: { opacity: 0, transform: 'translateY(20px)' },
    to:   { opacity: 1, transform: 'translateY(0)' },
  },
  animation: `fadeUp 0.5s ease ${delay}s both`,
});

export default function HistoryPage() {
  const { token } = useAuth();
  const api = makeApiClient(token);
  const { historyBusiness: business, setHistoryBusiness: setBusiness } = useBusiness();

  // Each company: { key, label, color, data: [{date, score}] }
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showBestFit, setShowBestFit] = useState(false);
  const [dateRange, setDateRange] = useState('all');

  const handleAdd = async (e) => {
    e.preventDefault();
    if (companies.length >= SERIES_COLORS.length) return;
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams(business);
      const res = await api(`/analytical-model/history?${params}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Request failed');
      }
      const result = await res.json();

      // Deduplicate by date
      const byDate = new Map();
      [...result.results].reverse().forEach((r) => {
        const label = new Date(r.date_time).toLocaleDateString('en-AU', {
          day: '2-digit', month: 'short', year: '2-digit',
        });
        byDate.set(label, r.overall_score);
      });
      const data = Array.from(byDate.entries()).map(([date, score]) => ({ date, score }));

      const color = SERIES_COLORS[companies.length];
      const label = business.business_name;
      setCompanies((prev) => [...prev, { key: result.business_key, label, color, data, results: result.results }]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const removeCompany = (key) => setCompanies((prev) => prev.filter((c) => c.key !== key));

  // Merge all companies onto a shared date axis
  const { chartData } = useMemo(() => {
    if (companies.length === 0) return { chartData: [], allDates: [] };

    const dateSet = new Map();
    companies.forEach((c) => c.data.forEach(({ date }) => {
      if (!dateSet.has(date)) dateSet.set(date, true);
    }));
    const allDates = Array.from(dateSet.keys());

    const chartData = allDates.map((date) => {
      const row = { date };
      companies.forEach((c) => {
        const point = c.data.find((d) => d.date === date);
        row[c.key] = point ? point.score : null;
      });
      return row;
    });

    return { chartData };
  }, [companies]);

  // Apply date range filter
  const filteredChartData = useMemo(() => {
    if (dateRange === 'all' || chartData.length === 0) return chartData;
    const days = dateRange === '7d' ? 7 : 30;
    return chartData.slice(-days);
  }, [chartData, dateRange]);

  // Best-fit lines: one per company (over filtered data)
  const bestFitData = useMemo(() => {
    if (!showBestFit || companies.length === 0) return [];
    return companies.map((c) => {
      const scores = filteredChartData.map((row) => row[c.key] ?? null);
      const defined = scores.filter((v) => v !== null);
      if (defined.length < 2) return null;
      const avg = defined.reduce((a, b) => a + b, 0) / defined.length;
      const filled = scores.map((v) => (v !== null ? v : avg));
      const fit = linearRegression(filled);
      return { key: `${c.key}_fit`, color: c.color, fit };
    }).filter(Boolean);
  }, [showBestFit, companies, filteredChartData]);

  // Merge best-fit values into chart rows
  const mergedData = useMemo(() => {
    if (!showBestFit || bestFitData.length === 0) return filteredChartData;
    return filteredChartData.map((row, i) => {
      const extra = {};
      bestFitData.forEach((bf) => { extra[bf.key] = bf.fit[i]; });
      return { ...row, ...extra };
    });
  }, [filteredChartData, bestFitData, showBestFit]);

  // Stats across all loaded companies
  const allScores = companies.flatMap((c) => c.data.map((d) => d.score));
  const avgScore = allScores.length
    ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length * 10) / 10
    : null;
  const peakScore = allScores.length ? Math.max(...allScores) : null;

  const canAddMore = companies.length < SERIES_COLORS.length;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={fadeUp(0)}>
        <Typography variant="h4" fontWeight={700} sx={{ fontFamily: '"Sora", sans-serif', color: 'hsl(210,40%,93%)' }}>
          Sentiment History
        </Typography>
        <Typography variant="body2" sx={{ color: 'hsl(215,20%,60%)', mt: 0.5 }}>
          Compare sentiment trends across multiple companies over time.
        </Typography>
      </Box>

      {/* Add company form */}
      <Card variant="outlined" sx={fadeUp(0.07)}>
        <CardContent sx={{ p: '16px !important' }}>
          <Box component="form" onSubmit={handleAdd} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <BusinessPicker business={business} setBusiness={setBusiness} />
            <Box>
              <Button
                type="submit"
                variant="contained"
                disabled={loading || !canAddMore}
                startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <AddIcon />}
                sx={{ minWidth: 140 }}
              >
                {loading ? 'Loading…' : canAddMore ? 'Add Company' : 'Max reached'}
              </Button>
            </Box>
          </Box>

          {/* Active company chips */}
          {companies.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
              {companies.map((c) => (
                <Chip
                  key={c.key}
                  label={c.label}
                  size="small"
                  onDelete={() => removeCompany(c.key)}
                  sx={{
                    bgcolor: `${c.color}22`,
                    border: `1px solid ${c.color}55`,
                    color: c.color,
                    '& .MuiChip-deleteIcon': { color: c.color },
                  }}
                />
              ))}
            </Box>
          )}
        </CardContent>
      </Card>

      {error && <Alert severity="error">{error}</Alert>}

      {companies.length > 0 && (
        <>
          {/* Stats */}
          <Grid container spacing={2} sx={fadeUp(0.1)}>
            <Grid item xs={12} md={4}>
              <StatsCard label="Avg Score" value={avgScore ?? '—'} icon={TimelineIcon} glow="green" />
            </Grid>
            <Grid item xs={12} md={4}>
              <StatsCard label="Companies" value={companies.length} icon={CalendarMonthIcon} />
            </Grid>
            <Grid item xs={12} md={4}>
              <StatsCard label="Peak Score" value={peakScore ?? '—'} icon={StarIcon} glow="purple" />
            </Grid>
          </Grid>

          {/* Chart */}
          {chartData.length > 1 && (
            <Box sx={{ ...GLASS, p: 3, ...fadeUp(0.17) }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 1.5 }}>
                <Typography variant="subtitle2" fontWeight={600} sx={{ fontFamily: '"Sora", sans-serif', color: 'hsl(210,40%,93%)' }}>
                  Sentiment Trend
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <ToggleButtonGroup
                    value={dateRange}
                    exclusive
                    onChange={(_, v) => { if (v) setDateRange(v); }}
                    size="small"
                    sx={{
                      '& .MuiToggleButton-root': {
                        color: 'hsl(215,20%,60%)', border: '1px solid hsl(230,25%,25%)',
                        fontSize: 11, px: 1.5, py: 0.25,
                        '&.Mui-selected': { color: 'hsl(142,69%,58%)', bgcolor: 'rgba(46,200,110,0.1)', borderColor: 'rgba(46,200,110,0.3)' },
                      },
                    }}
                  >
                    <ToggleButton value="7d">7D</ToggleButton>
                    <ToggleButton value="30d">30D</ToggleButton>
                    <ToggleButton value="all">All</ToggleButton>
                  </ToggleButtonGroup>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={showBestFit}
                        onChange={(e) => setShowBestFit(e.target.checked)}
                        size="small"
                        sx={{ '& .MuiSwitch-thumb': { bgcolor: 'hsl(142,69%,58%)' }, '& .Mui-checked + .MuiSwitch-track': { bgcolor: 'hsl(142,69%,38%)' } }}
                      />
                    }
                    label={<Typography variant="caption" sx={{ color: 'hsl(215,20%,60%)' }}>Best-fit</Typography>}
                    sx={{ m: 0 }}
                  />
                </Box>
              </Box>
              <ResponsiveContainer width="100%" height={320}>
                <ComposedChart data={mergedData}>
                  <defs>
                    {companies.map((c) => (
                      <linearGradient key={c.key} id={`grad_${c.key}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={c.color} stopOpacity={0.25} />
                        <stop offset="95%" stopColor={c.color} stopOpacity={0} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(230,25%,25%)" />
                  <XAxis
                    dataKey="date"
                    stroke="hsl(215,20%,60%)"
                    tick={{ fill: 'hsl(215,20%,60%)', fontSize: 11 }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    stroke="hsl(215,20%,60%)"
                    tick={{ fill: 'hsl(215,20%,60%)', fontSize: 11 }}
                  />
                  <ReTooltip
                    contentStyle={{
                      backgroundColor: 'hsl(228,38%,16%)',
                      border: '1px solid hsl(230,25%,25%)',
                      borderRadius: '8px',
                      color: 'hsl(210,40%,93%)',
                    }}
                    labelStyle={{ color: 'hsl(210,40%,93%)', fontWeight: 600, marginBottom: 4 }}
                  />
                  <Legend
                    wrapperStyle={{ color: 'hsl(215,20%,60%)', fontSize: 12, paddingTop: 12 }}
                    formatter={(value) => {
                      // Hide best-fit entries from legend
                      if (value.endsWith('_fit')) return null;
                      const co = companies.find((c) => c.key === value);
                      return co ? co.label : value;
                    }}
                  />
                  {/* Area series per company */}
                  {companies.map((c) => (
                    <Area
                      key={c.key}
                      type="monotone"
                      dataKey={c.key}
                      name={c.key}
                      stroke={c.color}
                      fill={`url(#grad_${c.key})`}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4, fill: c.color }}
                      connectNulls
                    />
                  ))}
                  {/* Best-fit lines (dashed) */}
                  {showBestFit && bestFitData.map((bf) => (
                    <Line
                      key={bf.key}
                      type="linear"
                      dataKey={bf.key}
                      name={bf.key}
                      stroke={bf.color}
                      strokeWidth={1.5}
                      strokeDasharray="6 3"
                      dot={false}
                      activeDot={false}
                      legendType="none"
                    />
                  ))}
                </ComposedChart>
              </ResponsiveContainer>
            </Box>
          )}

          {/* Per-company timeline tables */}
          {companies.map((c) => (
            <Box key={c.key} sx={{ ...GLASS, overflow: 'hidden' }}>
              <Box sx={{
                px: 2.5, py: 1.5,
                borderBottom: '1px solid hsl(230,25%,25%)',
                bgcolor: 'rgba(255,255,255,0.03)',
                display: 'flex', alignItems: 'center', gap: 1.5,
              }}>
                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: c.color, flexShrink: 0 }} />
                <Typography variant="subtitle1" fontWeight={600} sx={{ fontFamily: '"Sora", sans-serif', color: 'hsl(210,40%,93%)' }}>
                  {c.label} — Analysis Timeline
                </Typography>
                <Tooltip title="Remove company">
                  <IconButton size="small" onClick={() => removeCompany(c.key)} sx={{ ml: 'auto', color: 'hsl(215,20%,60%)' }}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
              {c.results.map((r, i) => (
                <Box
                  key={i}
                  sx={{
                    display: 'flex', alignItems: 'center', gap: 2,
                    px: 2.5, py: 2,
                    borderBottom: '1px solid hsl(230,25%,25%)',
                    '&:last-child': { borderBottom: 0 },
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.03)' },
                    transition: 'background 0.15s',
                  }}
                >
                  <Box sx={{ minWidth: 140, flexShrink: 0 }}>
                    <Typography variant="body2" fontWeight={500} sx={{ color: 'hsl(210,40%,85%)', display: 'block' }}>
                      {new Date(r.date_time).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'hsl(215,20%,55%)' }}>
                      {new Date(r.date_time).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}
                    </Typography>
                  </Box>
                  <SentimentBadge score={r.overall_score} size="md" />
                  <Typography variant="body1" sx={{ flex: 1, color: 'hsl(215,20%,75%)' }}>
                    {'⭐'.repeat(r.overall_rating)} · {r.overall_sentiment}
                  </Typography>
                </Box>
              ))}
            </Box>
          ))}
        </>
      )}
    </Box>
  );
}
