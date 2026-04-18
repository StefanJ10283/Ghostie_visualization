import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import TagIcon from '@mui/icons-material/Tag';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CategoryIcon from '@mui/icons-material/Category';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import ShareIcon from '@mui/icons-material/Share';
import CheckIcon from '@mui/icons-material/Check';
import { SentimentBadge } from '../components/SentimentBadge';
import { StatsCard } from '../components/StatsCard';
import { ScoreGauge } from '../components/ScoreGauge';
import { makeApiClient } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { useFavourites } from '../hooks/useFavourites';
import { BusinessPicker } from '../components/BusinessPicker';
import { useBusiness } from '../context/BusinessContext';
import { useToast } from '../context/ToastContext';

const sourceLabel = (s) => {
  if (s === 'google_maps_reviews') return 'Review';
  if (s === 'newsapi') return 'News';
  if (s === 'reddit') return 'Reddit';
  return s || '—';
};

const sourceColor = (s) => {
  if (s === 'google_maps_reviews') return 'hsl(200,80%,60%)';
  if (s === 'newsapi') return 'hsl(262,83%,74%)';
  if (s === 'reddit') return 'hsl(20,90%,60%)';
  return 'hsl(215,20%,60%)';
};

const scoreColor = (s) => {
  if (s >= 57.5) return 'hsl(142,69%,58%)';
  if (s >= 42.5) return 'hsl(45,93%,58%)';
  return 'hsl(0,84%,60%)';
};

async function computeKey(name, location, category) {
  const raw = `${name}${location}${category}`.toLowerCase().replace(/ /g, '');
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

const fadeUp = (delay = 0) => ({
  '@keyframes fadeUp': {
    from: { opacity: 0, transform: 'translateY(20px)' },
    to:   { opacity: 1, transform: 'translateY(0)' },
  },
  animation: `fadeUp 0.5s ease ${delay}s both`,
});

export default function SentimentPage() {
  const { token } = useAuth();
  const api = makeApiClient(token);
  const navigate = useNavigate();
  const { favourites, toggle } = useFavourites(api);
  const { sentimentBusiness: business, setSentimentBusiness: setBusiness } = useBusiness();
  const { showToast } = useToast();
  const [result, setResult] = useState(null);
  const [businessKey, setBusinessKey] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    if (!result) return;
    const url = `${window.location.origin}/score/${encodeURIComponent(result.business_name)}?location=${encodeURIComponent(result.location)}&category=${encodeURIComponent(result.category)}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    setBusinessKey(null);
    try {
      const params = new URLSearchParams(business);
      const res = await api(`/analytical-model/sentiment?${params}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Request failed');
      }
      const json = await res.json();
      setResult(json);
      const key = await computeKey(business.business_name, business.location, business.category);
      setBusinessKey(key);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const displayScore = result ? result.overall_score : null;
  const isFav = favourites.has(businessKey);

  return (
    <Box>
      {/* Page header */}
      <Box sx={{ mb: 3, ...fadeUp(0) }}>
        <Typography variant="h4" fontWeight={700} sx={{ fontFamily: '"Sora", sans-serif', color: 'hsl(210,40%,93%)' }}>
          Sentiment Analysis
        </Typography>
        <Typography variant="body2" sx={{ color: 'hsl(215,20%,60%)', mt: 0.5 }}>
          Analyse the public sentiment of any business based on reviews, news and social media.
        </Typography>
      </Box>

      {/* Input card */}
      <Card variant="outlined" sx={{ mb: 3, ...fadeUp(0.05) }}>
        <CardContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <BusinessPicker business={business} setBusiness={setBusiness} />
            <Box>
              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                sx={{
                  minWidth: 140,
                  background: 'linear-gradient(135deg, hsl(142,69%,40%), hsl(142,69%,35%))',
                  '&:hover': { background: 'linear-gradient(135deg, hsl(142,69%,46%), hsl(142,69%,40%))' },
                }}
              >
                {loading ? <CircularProgress size={20} color="inherit" /> : 'Analyse'}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {result && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

          {/* Hero: gauge + business info side by side */}
          <Box sx={{
            borderRadius: '16px',
            border: '1px solid hsl(230,25%,25%)',
            bgcolor: 'hsl(228,38%,16%)',
            overflow: 'hidden',
            position: 'relative',
            ...fadeUp(0),
          }}>
            {/* Decorative glow blob */}
            <Box sx={{
              position: 'absolute', top: -60, right: -60,
              width: 300, height: 300, borderRadius: '50%',
              background: `radial-gradient(circle, ${scoreColor(displayScore)}18 0%, transparent 70%)`,
              pointerEvents: 'none',
            }} />

            <Box sx={{
              display: 'flex', flexDirection: { xs: 'column', md: 'row' },
              alignItems: 'center', gap: 4, p: { xs: 3, md: 4 },
            }}>
              {/* Gauge */}
              <Box sx={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <ScoreGauge score={displayScore} size={200} label="Sentiment Score" />
              </Box>

              <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' }, borderColor: 'hsl(230,25%,25%)' }} />

              {/* Business details */}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1, mb: 1.5 }}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="h4" fontWeight={800} sx={{
                      fontFamily: '"Sora", sans-serif',
                      color: 'hsl(210,40%,93%)',
                      lineHeight: 1.15,
                      mb: 0.75,
                    }}>
                      {result.business_name}
                    </Typography>
                    <SentimentBadge score={displayScore} size="md" />
                  </Box>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Tooltip title={isFav ? 'Remove from favourites' : 'Add to favourites'}>
                      <span>
                        <IconButton
                          size="small"
                          disabled={!businessKey}
                          onClick={() => {
                            toggle(businessKey);
                            showToast(isFav ? 'Removed from favourites' : 'Added to favourites', isFav ? 'info' : 'success');
                          }}
                          sx={{
                            color: isFav ? 'hsl(45,93%,58%)' : 'hsl(215,20%,60%)',
                            bgcolor: isFav ? 'rgba(250,185,0,0.1)' : 'rgba(255,255,255,0.05)',
                            '&:hover': { bgcolor: isFav ? 'rgba(250,185,0,0.18)' : 'rgba(255,255,255,0.1)' },
                            transition: 'all 0.2s',
                          }}
                        >
                          {isFav ? <StarIcon /> : <StarBorderIcon />}
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title={copied ? 'Link copied!' : 'Share public scorecard'}>
                      <IconButton
                        size="small"
                        onClick={handleShare}
                        sx={{
                          color: copied ? 'hsl(142,69%,58%)' : 'hsl(215,20%,60%)',
                          bgcolor: copied ? 'rgba(46,200,110,0.1)' : 'rgba(255,255,255,0.05)',
                          '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
                          transition: 'all 0.2s',
                        }}
                      >
                        {copied ? <CheckIcon fontSize="small" /> : <ShareIcon fontSize="small" />}
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, mb: 2.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocationOnIcon sx={{ fontSize: 16, color: 'hsl(215,20%,55%)' }} />
                    <Typography variant="body1" sx={{ color: 'hsl(215,20%,75%)' }}>{result.location}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CategoryIcon sx={{ fontSize: 16, color: 'hsl(215,20%,55%)' }} />
                    <Typography variant="body1" sx={{ color: 'hsl(215,20%,75%)' }}>{result.category}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TagIcon sx={{ fontSize: 16, color: 'hsl(215,20%,55%)' }} />
                    <Typography variant="body1" sx={{ color: 'hsl(215,20%,75%)' }}>
                      {'⭐'.repeat(result.overall_rating)} ({result.overall_rating}/5)
                    </Typography>
                  </Box>
                </Box>

                {/* Keywords */}
                {result.keywords?.length > 0 && (
                  <Box>
                    <Typography variant="body2" sx={{ color: 'hsl(215,20%,55%)', textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 600, display: 'block', mb: 1, fontSize: 12 }}>
                      Top Keywords
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                      {result.keywords.map((kw) => (
                        <Chip
                          key={kw}
                          label={kw}
                          size="small"
                          sx={{
                            bgcolor: 'rgba(255,255,255,0.06)',
                            border: '1px solid hsl(230,25%,28%)',
                            color: 'hsl(215,20%,75%)',
                            fontSize: 11,
                            height: 24,
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>
            </Box>
          </Box>

          {/* Stats row */}
          <Grid container spacing={2} sx={fadeUp(0.1)}>
            <Grid item xs={12} md={4}>
              <StatsCard
                label="Overall Score"
                value={displayScore}
                icon={AnalyticsIcon}
                glow={displayScore >= 57.5 ? 'green' : undefined}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <StatsCard label="Items Analysed" value={result.items_analysed} icon={CheckCircleIcon} />
            </Grid>
            <Grid item xs={12} md={4}>
              <StatsCard label="Star Rating" value={result.overall_rating} icon={TagIcon} glow="purple" />
            </Grid>
          </Grid>

          {/* Breakdown */}
          {result.breakdown?.length > 0 && (
            <Box sx={{
              borderRadius: '12px',
              border: '1px solid hsl(230,25%,25%)',
              bgcolor: 'hsl(228,38%,16%)',
              overflow: 'hidden',
              ...fadeUp(0.15),
            }}>
              <Box sx={{ px: 2.5, py: 1.5, borderBottom: '1px solid hsl(230,25%,25%)', bgcolor: 'rgba(255,255,255,0.03)' }}>
                <Typography variant="subtitle2" fontWeight={600} sx={{ fontFamily: '"Sora", sans-serif', color: 'hsl(210,40%,93%)' }}>
                  Source Breakdown
                </Typography>
                <Typography variant="caption" sx={{ color: 'hsl(215,20%,55%)' }}>
                  {result.breakdown.length} items from reviews, news and social media
                </Typography>
              </Box>

              {result.breakdown.map((item, i) => {
                const ds = item.score;
                const color = scoreColor(ds);
                const src = sourceLabel(item.source);
                const srcColor = sourceColor(item.source);

                return (
                  <Box
                    key={i}
                    sx={{
                      px: 2.5, py: 2,
                      borderBottom: i < result.breakdown.length - 1 ? '1px solid hsl(230,25%,22%)' : 'none',
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' },
                      transition: 'background 0.15s',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                      {/* Source pill */}
                      <Box sx={{
                        px: 1, py: 0.25, borderRadius: '4px',
                        bgcolor: `${srcColor}18`,
                        border: `1px solid ${srcColor}40`,
                        flexShrink: 0,
                      }}>
                        <Typography variant="caption" sx={{ color: srcColor, fontWeight: 600, fontSize: 12, letterSpacing: 0.5 }}>
                          {src.toUpperCase()}
                        </Typography>
                      </Box>

                      {/* Score badge */}
                      <SentimentBadge score={ds} size="sm" />

                      {/* Score bar */}
                      <Box sx={{ flex: 1, height: 5, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                        <Box sx={{
                          height: '100%',
                          width: `${ds}%`,
                          borderRadius: 3,
                          bgcolor: color,
                          boxShadow: `0 0 8px ${color}60`,
                          transition: 'width 1s cubic-bezier(0.4,0,0.2,1)',
                        }} />
                      </Box>

                      <Typography variant="body2" sx={{ color, fontWeight: 700, minWidth: 28, textAlign: 'right', flexShrink: 0 }}>
                        {Math.round(ds)}
                      </Typography>
                    </Box>

                    <Typography variant="body1" sx={{ color: 'hsl(215,20%,70%)', lineHeight: 1.6, pl: 0.5 }}>
                      {item.body || item.text || '—'}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}
