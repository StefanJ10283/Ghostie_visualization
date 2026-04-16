import { useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import WifiIcon from '@mui/icons-material/Wifi';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import NewspaperIcon from '@mui/icons-material/Newspaper';
import ReviewsIcon from '@mui/icons-material/Reviews';
import ForumIcon from '@mui/icons-material/Forum';
import RssFeedIcon from '@mui/icons-material/RssFeed';
import RefreshIcon from '@mui/icons-material/Refresh';
import DatabaseIcon from '@mui/icons-material/Storage';
import { StatsCard } from '../components/StatsCard';
import { makeApiClient } from '../api/client';
import { useAuth } from '../auth/AuthContext';

const SOURCES = [
  { key: 'news_count',        name: 'NewsAPI',       sub: 'newsapi.org',         icon: NewspaperIcon },
  { key: 'news_review_count', name: 'News Reviews',  sub: 'newsapi.org/reviews', icon: RssFeedIcon },
  { key: 'review_count',      name: 'Google Maps',   sub: 'google.com/maps',     icon: ReviewsIcon },
  { key: 'reddit_count',      name: 'Reddit',        sub: 'reddit.com',          icon: ForumIcon },
];

function SourceStatus({ count }) {
  if (count === null) return { icon: RemoveCircleIcon, color: 'text.disabled',  label: 'Not run',  chipColor: 'default' };
  if (count > 0)      return { icon: CheckCircleIcon,  color: 'success.main',   label: 'Active',   chipColor: 'success' };
  return               { icon: ErrorIcon,             color: 'warning.main',   label: 'No data',  chipColor: 'warning' };
}

export default function DataCollectionPage() {
  const { token } = useAuth();
  const api = makeApiClient(token);
  const [form, setForm] = useState({ business_name: '', location: '', category: '' });
  const [result, setResult] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const addActivity = (text, type = 'success') => {
    const time = new Date().toLocaleTimeString();
    setActivity((prev) => [{ text, time, type }, ...prev].slice(0, 20));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    addActivity(`Starting collection for ${form.business_name} (${form.location})...`, 'info');
    try {
      const res = await api('/data-collection/collect', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Collection failed');
      }
      const data = await res.json();
      setResult(data);
      SOURCES.forEach((s) => {
        const count = data[s.key] ?? 0;
        if (count > 0) {
          addActivity(`${s.name}: collected ${count} item${count !== 1 ? 's' : ''}`, 'success');
        } else {
          addActivity(`${s.name}: no data found`, 'warning');
        }
      });
      addActivity(`Collection complete — ${data.total_results} total results`, 'success');
    } catch (err) {
      setError(err.message);
      addActivity(`Collection failed: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    addActivity('Refreshing all companies...', 'info');
    try {
      const res = await api('/data-collection/refresh', { method: 'POST' });
      const data = await res.json();
      addActivity(`Refresh complete — ${data.collected} collected, ${data.skipped} skipped, ${data.failed} failed`, 'success');
    } catch {
      addActivity('Refresh failed', 'error');
    } finally {
      setRefreshing(false);
    }
  };

  const feedDotColor = { success: 'success.main', info: 'primary.main', warning: 'warning.main', error: 'error.main' };

  const fadeUp = (delay = 0) => ({
    '@keyframes fadeUp': {
      from: { opacity: 0, transform: 'translateY(20px)' },
      to:   { opacity: 1, transform: 'translateY(0)' },
    },
    animation: `fadeUp 0.5s ease ${delay}s both`,
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, ...fadeUp(0) }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>Data Collection</Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Monitor sources and collect news, reviews and Reddit posts.
          </Typography>
        </Box>
        <Button
          startIcon={refreshing ? <CircularProgress size={16} color="inherit" /> : <RefreshIcon />}
          variant="outlined" size="small"
          disabled={refreshing}
          onClick={handleRefresh}
        >
          Refresh All
        </Button>
      </Box>

      {/* Collect form */}
      <Card variant="outlined" sx={{ mb: 3, ...fadeUp(0.07) }}>
        <CardContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField label="Business Name" size="small" required value={form.business_name}
              onChange={(e) => setForm({ ...form, business_name: e.target.value })} sx={{ flex: 1, minWidth: 160 }} />
            <TextField label="Location" size="small" required value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })} sx={{ flex: 1, minWidth: 140 }} />
            <TextField label="Category" size="small" required value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })} sx={{ flex: 1, minWidth: 140 }} />
            <Button type="submit" variant="contained" disabled={loading} sx={{ minWidth: 120 }}>
              {loading ? <CircularProgress size={20} color="inherit" /> : 'Collect'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {loading && <Alert severity="info" sx={{ mb: 2 }}>Collecting data — this may take up to 60 seconds...</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Stats row — only after a collect */}
      {result && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <StatsCard label="Total Collected" value={result.total_results} icon={DatabaseIcon} glow="green" />
          </Grid>
          <Grid item xs={12} md={4}>
            <StatsCard label="News Articles" value={(result.news_count ?? 0) + (result.news_review_count ?? 0)} icon={NewspaperIcon} />
          </Grid>
          <Grid item xs={12} md={4}>
            <StatsCard label="Reviews & Posts" value={(result.review_count ?? 0) + (result.reddit_count ?? 0)} icon={ReviewsIcon} glow="purple" />
          </Grid>
        </Grid>
      )}

      <Grid container spacing={2} sx={fadeUp(0.14)}>
        {/* Sources panel */}
        <Grid item xs={12} md={6}>
          <Card variant="outlined" sx={{ overflow: 'hidden', height: '100%' }}>
            <Box sx={{
              px: 2.5, py: 1.5,
              borderBottom: '1px solid', borderColor: 'hsl(230,25%,25%)',
              bgcolor: 'rgba(255,255,255,0.03)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <Typography variant="subtitle2" fontWeight={600}>Sources</Typography>
              <WifiIcon sx={{ fontSize: 16, color: 'primary.main' }} />
            </Box>
            {SOURCES.map((source) => {
              const count = result ? (result[source.key] ?? 0) : null;
              const status = SourceStatus({ count });
              const StatusIcon = status.icon;
              return (
                <Box
                  key={source.key}
                  sx={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    px: 2.5, py: 1.75,
                    borderBottom: '1px solid', borderColor: 'hsl(230,25%,25%)',
                    '&:last-child': { borderBottom: 0 },
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.03)' },
                    transition: 'background 0.15s',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <StatusIcon sx={{ fontSize: 18, color: status.color }} />
                    <Box>
                      <Typography variant="body2" fontWeight={500}>{source.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{source.sub}</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    {count !== null && (
                      <Typography variant="caption" color="text.secondary">{count} items</Typography>
                    )}
                    <Chip label={status.label} size="small" color={status.chipColor} variant="outlined" />
                  </Box>
                </Box>
              );
            })}
          </Card>
        </Grid>

        {/* Activity feed */}
        <Grid item xs={12} md={6}>
          <Card variant="outlined" sx={{ overflow: 'hidden', height: '100%' }}>
            <Box sx={{ px: 2.5, py: 1.5, borderBottom: '1px solid', borderColor: 'hsl(230,25%,25%)', bgcolor: 'rgba(255,255,255,0.03)' }}>
              <Typography variant="subtitle2" fontWeight={600}>Activity Feed</Typography>
            </Box>
            {activity.length === 0 ? (
              <Box sx={{ px: 2.5, py: 4, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">No activity yet. Run a collection to get started.</Typography>
              </Box>
            ) : (
              activity.map((item, i) => (
                <Box
                  key={i}
                  sx={{
                    display: 'flex', alignItems: 'flex-start', gap: 1.5,
                    px: 2.5, py: 1.5,
                    borderBottom: '1px solid', borderColor: 'hsl(230,25%,25%)',
                    '&:last-child': { borderBottom: 0 },
                  }}
                >
                  <Box sx={{
                    width: 8, height: 8, borderRadius: '50%', mt: 0.6, flexShrink: 0,
                    bgcolor: feedDotColor[item.type] || 'text.secondary',
                  }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2">{item.text}</Typography>
                    <Typography variant="caption" color="text.secondary">{item.time}</Typography>
                  </Box>
                </Box>
              ))
            )}
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
