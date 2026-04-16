import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Skeleton from '@mui/material/Skeleton';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import TrophyIcon from '@mui/icons-material/EmojiEvents';
import StarIcon from '@mui/icons-material/Star';
import BarChartIcon from '@mui/icons-material/BarChart';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { SentimentBadge } from '../components/SentimentBadge';
import { StatsCard } from '../components/StatsCard';
import { ScoreGauge } from '../components/ScoreGauge';
import { EmptyState } from '../components/EmptyState';
import { makeApiClient } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { useBusiness } from '../context/BusinessContext';

// Animation helpers
const fadeUp = (delay = 0) => ({
  '@keyframes fadeUp': {
    from: { opacity: 0, transform: 'translateY(24px)' },
    to: { opacity: 1, transform: 'translateY(0)' },
  },
  animation: 'fadeUp 0.55s ease-out forwards',
  animationDelay: `${delay}s`,
  opacity: 0,
});

const GLASS = {
  borderRadius: '16px',
  border: '1px solid hsl(230,25%,25%)',
  bgcolor: 'hsl(228,38%,16%)',
  overflow: 'hidden',
};

async function computeKey(name, location, category) {
  const raw = `${name}${location}${category}`.toLowerCase().replace(/ /g, '');
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function ScoreBar({ score }) {
  const color = score >= 57.5 ? 'hsl(142,69%,58%)' : score >= 42.5 ? 'hsl(45,93%,58%)' : 'hsl(0,84%,60%)';
  return (
    <Box sx={{ flex: 1, height: 4, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
      <Box sx={{
        height: '100%', borderRadius: 2, bgcolor: color,
        width: `${score}%`,
        transition: 'width 1s cubic-bezier(0.4,0,0.2,1)',
        boxShadow: `0 0 8px ${color}66`,
      }} />
    </Box>
  );
}

export default function DashboardPage() {
  const { token, user } = useAuth();
  const api = makeApiClient(token);
  const navigate = useNavigate();
  const { setSentimentBusiness } = useBusiness();

  const [leaderboard, setLeaderboard] = useState([]);
  const [favourites, setFavourites] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api('/analytical-model/leaderboard').then((r) => r.json()),
      api('/users/me/favourites').then((r) => r.json()),
      api('/data-retrieval/companies').then((r) => r.json()),
    ]).then(([lb, favs, comps]) => {
      setLeaderboard(lb.leaderboard ?? []);
      setFavourites(favs.favourited ?? []);
      setCompanies(comps.companies ?? []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const [favouritedCompanies, setFavouritedCompanies] = useState([]);
  useEffect(() => {
    if (companies.length === 0 || favourites.length === 0) { setFavouritedCompanies([]); return; }
    Promise.all(companies.map(async (c) => ({ ...c, key: await computeKey(c.business_name, c.location, c.category) })))
      .then((withKeys) => setFavouritedCompanies(withKeys.filter((c) => favourites.includes(c.key)).slice(0, 4)));
  }, [companies, favourites]);

  const avgScore = leaderboard.length
    ? Math.round(leaderboard.reduce((a, b) => a + (Number(b.overall_score) || 0), 0) / leaderboard.length * 10) / 10
    : 0;

  const goToSentiment = (biz) => {
    setSentimentBusiness({ business_name: biz.business_name, location: biz.location, category: biz.category });
    navigate('/sentiment');
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

      {/* ── Hero ── */}
      <Box sx={{
        ...fadeUp(0),
        position: 'relative', borderRadius: '20px', overflow: 'hidden',
        p: { xs: 3, md: 4 },
        background: 'linear-gradient(135deg, hsl(234,45%,18%) 0%, hsl(258,40%,18%) 50%, hsl(234,45%,14%) 100%)',
        border: '1px solid hsl(230,25%,25%)',
      }}>
        {/* Decorative blobs */}
        <Box sx={{
          position: 'absolute', top: -60, right: -60, width: 240, height: 240, borderRadius: '50%',
          background: 'radial-gradient(circle, hsl(142,69%,58%,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <Box sx={{
          position: 'absolute', bottom: -40, left: '40%', width: 180, height: 180, borderRadius: '50%',
          background: 'radial-gradient(circle, hsl(262,83%,74%,0.1) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: { xs: 3, md: 5 } }}>
          <Box sx={{ flex: 1, minWidth: 260, maxWidth: 520 }}>
            <Typography variant="h3" fontWeight={800} sx={{
              fontFamily: '"Sora", sans-serif',
              background: 'linear-gradient(135deg, hsl(210,40%,93%) 0%, hsl(142,69%,78%) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              lineHeight: 1.1,
              mb: 1,
            }}>
              {greeting}{user?.username ? `, ${user.username}` : ''}
            </Typography>
            <Typography variant="body1" sx={{ color: 'hsl(215,20%,60%)', maxWidth: 460 }}>
              Your business intelligence platform. Track sentiment, monitor trends, and discover insights.
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
              <Chip
                icon={<TrendingUpIcon sx={{ fontSize: '14px !important' }} />}
                label={`${leaderboard.length} companies tracked`}
                size="small"
                sx={{ bgcolor: 'rgba(46,200,110,0.12)', color: 'hsl(142,69%,68%)', border: '1px solid rgba(46,200,110,0.25)', fontSize: 12 }}
              />
              <Chip
                icon={<StarIcon sx={{ fontSize: '14px !important' }} />}
                label={`${favourites.length} favourites`}
                size="small"
                sx={{ bgcolor: 'rgba(250,185,0,0.1)', color: 'hsl(45,93%,68%)', border: '1px solid rgba(250,185,0,0.2)', fontSize: 12 }}
              />
            </Box>
          </Box>

          {/* Gauge */}
          <Box sx={{ flexShrink: 0 }}>
            {loading
              ? <Skeleton variant="circular" width={160} height={160} sx={{ bgcolor: 'rgba(255,255,255,0.06)' }} />
              : <ScoreGauge score={avgScore} size={170} label="Platform Avg Sentiment" />
            }
          </Box>
        </Box>
      </Box>

      {/* ── Stat cards ── */}
      <Grid container spacing={2}>
        {[
          { label: 'Avg Sentiment', value: loading ? 0 : avgScore, icon: BarChartIcon, glow: 'green', delay: 0.1 },
          { label: 'Companies Tracked', value: loading ? 0 : leaderboard.length, icon: TrophyIcon, glow: 'purple', delay: 0.18 },
          { label: 'Favourites', value: loading ? 0 : favourites.length, icon: StarIcon, delay: 0.26 },
        ].map(({ label, value, icon, glow, delay }) => (
          <Grid item xs={12} md={4} key={label} sx={fadeUp(delay)}>
            <StatsCard label={label} value={value} icon={icon} glow={glow} />
          </Grid>
        ))}
      </Grid>

      {/* ── Top companies + Favourites ── */}
      <Grid container spacing={3}>

        {/* Top companies */}
        <Grid item xs={12} md={7} sx={fadeUp(0.3)}>
          <Box sx={{ ...GLASS, height: '100%' }}>
            <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid hsl(230,25%,25%)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrophyIcon sx={{ fontSize: 18, color: 'hsl(45,93%,58%)' }} />
                <Typography variant="subtitle2" fontWeight={700} sx={{ fontFamily: '"Sora", sans-serif', color: 'hsl(210,40%,93%)' }}>
                  Top Companies
                </Typography>
              </Box>
              <Button size="small" endIcon={<ArrowForwardIcon />} onClick={() => navigate('/leaderboard')}
                sx={{ color: 'hsl(142,69%,58%)', fontSize: 12, '&:hover': { bgcolor: 'rgba(46,200,110,0.08)' } }}>
                Full leaderboard
              </Button>
            </Box>

            {loading ? (
              <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                {[1, 2, 3].map((i) => (
                  <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Skeleton variant="circular" width={28} height={28} sx={{ bgcolor: 'rgba(255,255,255,0.06)', flexShrink: 0 }} />
                    <Box sx={{ flex: 1 }}>
                      <Skeleton variant="text" width="45%" sx={{ bgcolor: 'rgba(255,255,255,0.06)' }} />
                      <Skeleton variant="rounded" height={4} sx={{ bgcolor: 'rgba(255,255,255,0.04)', borderRadius: 2, mt: 0.5 }} />
                    </Box>
                    <Skeleton variant="rounded" width={52} height={22} sx={{ bgcolor: 'rgba(255,255,255,0.06)', borderRadius: '6px' }} />
                  </Box>
                ))}
              </Box>
            ) : leaderboard.length === 0 ? (
              <EmptyState icon={TrophyIcon} title="No data yet" message="Run sentiment analysis to populate the leaderboard." />
            ) : (
              <Box sx={{ p: 1 }}>
                {leaderboard.slice(0, 5).map((biz, i) => (
                  <Box
                    key={i}
                    onClick={() => goToSentiment(biz)}
                    sx={{
                      display: 'flex', alignItems: 'center', gap: 2,
                      px: 1.5, py: 1.5, borderRadius: '10px', cursor: 'pointer',
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.04)' },
                      transition: 'background 0.15s',
                    }}
                  >
                    <Typography variant="caption" sx={{
                      width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: 11,
                      bgcolor: i === 0 ? 'rgba(250,185,0,0.15)' : i === 1 ? 'rgba(180,180,180,0.1)' : i === 2 ? 'rgba(180,100,0,0.1)' : 'rgba(255,255,255,0.05)',
                      color: i === 0 ? '#fab900' : i === 1 ? '#b4b4b4' : i === 2 ? '#b46400' : 'hsl(215,20%,55%)',
                    }}>
                      {i + 1}
                    </Typography>

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" fontWeight={600} sx={{ color: 'hsl(210,40%,93%)' }} noWrap>
                        {biz.business_name}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                        <ScoreBar score={Number(biz.overall_score) || 0} />
                        <Typography variant="caption" sx={{ color: 'hsl(215,20%,55%)', flexShrink: 0, fontSize: 11 }}>
                          {biz.location}
                        </Typography>
                      </Box>
                    </Box>

                    <SentimentBadge score={Number(biz.overall_score) || 0} size="sm" />
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        </Grid>

        {/* Favourites */}
        <Grid item xs={12} md={5} sx={fadeUp(0.38)}>
          <Box sx={{ ...GLASS, height: '100%' }}>
            <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid hsl(230,25%,25%)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <StarIcon sx={{ fontSize: 18, color: 'hsl(45,93%,58%)' }} />
                <Typography variant="subtitle2" fontWeight={700} sx={{ fontFamily: '"Sora", sans-serif', color: 'hsl(210,40%,93%)' }}>
                  Your Favourites
                </Typography>
              </Box>
              <Button size="small" endIcon={<ArrowForwardIcon />} onClick={() => navigate('/favourites')}
                sx={{ color: 'hsl(215,20%,60%)', fontSize: 12 }}>
                View all
              </Button>
            </Box>

            {loading ? (
              <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
                {[1, 2].map((i) => (
                  <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Skeleton variant="rounded" width={36} height={36} sx={{ bgcolor: 'rgba(255,255,255,0.06)', borderRadius: '10px', flexShrink: 0 }} />
                    <Box sx={{ flex: 1 }}>
                      <Skeleton variant="text" width="60%" sx={{ bgcolor: 'rgba(255,255,255,0.06)' }} />
                      <Skeleton variant="text" width="40%" sx={{ bgcolor: 'rgba(255,255,255,0.04)' }} />
                    </Box>
                  </Box>
                ))}
              </Box>
            ) : favouritedCompanies.length === 0 ? (
              <EmptyState icon={StarIcon} title="No favourites yet" message="Star businesses on the leaderboard to pin them here." />
            ) : (
              <Box sx={{ p: 1 }}>
                {favouritedCompanies.map((c) => (
                  <Box
                    key={c.key}
                    onClick={() => goToSentiment(c)}
                    sx={{
                      display: 'flex', alignItems: 'center', gap: 1.5,
                      px: 1.5, py: 1.5, borderRadius: '10px', cursor: 'pointer',
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.04)' },
                      transition: 'background 0.15s',
                    }}
                  >
                    <Box sx={{
                      width: 36, height: 36, borderRadius: '10px', flexShrink: 0,
                      background: `linear-gradient(135deg, rgba(250,185,0,0.15), rgba(250,185,0,0.05))`,
                      border: '1px solid rgba(250,185,0,0.2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 16, fontWeight: 700, color: 'hsl(45,93%,58%)',
                      fontFamily: '"Sora", sans-serif',
                    }}>
                      {c.business_name[0].toUpperCase()}
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" fontWeight={600} sx={{ color: 'hsl(210,40%,93%)' }} noWrap>
                        {c.business_name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'hsl(215,20%,55%)' }} noWrap>
                        {c.location} · {c.category}
                      </Typography>
                    </Box>
                    <ArrowForwardIcon sx={{ fontSize: 14, color: 'hsl(215,20%,45%)', flexShrink: 0 }} />
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        </Grid>
      </Grid>

      {/* ── CTA ── */}
      <Box sx={{
        ...fadeUp(0.44),
        borderRadius: '16px', p: 3,
        background: 'linear-gradient(135deg, rgba(46,200,110,0.1) 0%, rgba(120,80,200,0.1) 100%)',
        border: '1px solid rgba(46,200,110,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, flexWrap: 'wrap',
      }}>
        <Box sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
          <Typography variant="h6" fontWeight={700} sx={{ color: 'hsl(210,40%,93%)', fontFamily: '"Sora", sans-serif' }}>
            Ready to analyse a business?
          </Typography>
          <Typography variant="body2" sx={{ color: 'hsl(215,20%,60%)', mt: 0.25 }}>
            Get a full sentiment breakdown from reviews, news, and Reddit in seconds.
          </Typography>
        </Box>
        <Button
          variant="contained"
          size="large"
          endIcon={<AnalyticsIcon />}
          onClick={() => navigate('/sentiment')}
          sx={{
            flexShrink: 0, borderRadius: '10px',
            background: 'linear-gradient(135deg, hsl(142,69%,45%), hsl(142,69%,38%))',
            boxShadow: '0 4px 20px rgba(46,200,110,0.3)',
            '&:hover': { boxShadow: '0 6px 28px rgba(46,200,110,0.4)' },
          }}
        >
          Start Analysis
        </Button>
      </Box>
    </Box>
  );
}
