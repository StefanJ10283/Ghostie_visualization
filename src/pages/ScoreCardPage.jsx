import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import ShareIcon from '@mui/icons-material/Share';
import CheckIcon from '@mui/icons-material/Check';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CategoryIcon from '@mui/icons-material/Category';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import DownloadIcon from '@mui/icons-material/Download';
import {
  AreaChart, Area, ResponsiveContainer, Tooltip as ReTooltip, XAxis,
} from 'recharts';
import { ScoreGauge } from '../components/ScoreGauge';
import { SentimentBadge } from '../components/SentimentBadge';
import { API } from '../api/config';

// Calls without auth — requires backend to allow public read on sentiment/history
function publicFetch(path) {
  // Fall back to a saved token if the user happens to be logged in
  const token = (() => {
    try {
      const accounts = JSON.parse(localStorage.getItem('ghostie_accounts') || '[]');
      return accounts[0]?.token ?? null;
    } catch { return null; }
  })();

  return fetch(`${API.middleware}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}

const scoreColor = (s) => {
  if (s >= 57.5) return 'hsl(142,69%,58%)';
  if (s >= 42.5) return 'hsl(45,93%,58%)';
  return 'hsl(0,84%,60%)';
};

const sourceLabel = (s) => {
  if (s === 'google_maps_reviews') return 'Review';
  if (s === 'newsapi') return 'News';
  if (s === 'reddit') return 'Reddit';
  return s || '—';
};

const fadeUp = (delay = 0) => ({
  '@keyframes fadeUp': {
    from: { opacity: 0, transform: 'translateY(20px)' },
    to:   { opacity: 1, transform: 'translateY(0)' },
  },
  animation: `fadeUp 0.5s ease ${delay}s both`,
});

export default function ScoreCardPage() {
  const { name } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const location = searchParams.get('location') || '';
  const category = searchParams.get('category') || '';
  const decodedName = decodeURIComponent(name);

  const [sentiment, setSentiment] = useState(null);
  const [history, setHistory]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [copied, setCopied]       = useState(false);

  useEffect(() => {
    // Update page title + Open Graph tags for social sharing
    document.title = `${decodedName} — Ghostie Score`;
    const setMeta = (property, content) => {
      let el = document.querySelector(`meta[property="${property}"]`);
      if (!el) { el = document.createElement('meta'); el.setAttribute('property', property); document.head.appendChild(el); }
      el.setAttribute('content', content);
    };
    setMeta('og:title', `${decodedName} — Ghostie Score`);
    setMeta('og:description', `See ${decodedName}'s public sentiment score powered by Ghostie.`);
    setMeta('og:url', window.location.href);
    return () => { document.title = 'Ghostie'; };
  }, [decodedName]);

  useEffect(() => {
    const params = new URLSearchParams({ business_name: decodedName, location, category });

    Promise.all([
      publicFetch(`/analytical-model/sentiment?${params}`).then((r) => r.json()),
      publicFetch(`/analytical-model/history?${params}`).then((r) => r.json()).catch(() => ({})),
    ]).then(([sent, hist]) => {
      if (sent.detail) throw new Error(sent.detail);
      setSentiment(sent);
      const results = hist.results ?? [];
      const byDate = new Map();
      [...results].reverse().forEach((r) => {
        const label = new Date(r.date_time).toLocaleDateString('en-AU', { day: '2-digit', month: 'short' });
        byDate.set(label, r.overall_score);
      });
      setHistory(Array.from(byDate.entries()).map(([date, score]) => ({ date, score })));
      setLoading(false);
    }).catch((err) => {
      setError(err.message || 'Could not load scorecard.');
      setLoading(false);
    });
  }, [decodedName, location, category]);

  const handleShare = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => window.print();

  const score = sentiment?.overall_score ?? null;
  const color = score !== null ? scoreColor(score) : 'hsl(215,20%,60%)';

  return (
    <Box sx={{
      minHeight: '100vh',
      bgcolor: 'hsl(234,40%,10%)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <style>{`
        @media print {
          body { background: #fff !important; color: #000 !important; }
          .ghostie-no-print { display: none !important; }
          #ghostie-overlay-root { display: none !important; }
        }
      `}</style>
      {/* Top bar */}
      <Box className="ghostie-no-print" sx={{
        px: { xs: 2, md: 4 }, py: 2,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid hsl(230,25%,20%)',
        bgcolor: 'hsl(228,38%,14%)',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{
            width: 32, height: 32, borderRadius: 2,
            background: 'linear-gradient(135deg, hsl(142,69%,58%), hsl(262,83%,74%))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <AnalyticsIcon sx={{ fontSize: 16, color: 'hsl(234,40%,10%)' }} />
          </Box>
          <Typography fontWeight={700} sx={{ fontFamily: '"Sora", sans-serif', color: 'hsl(210,40%,93%)', fontSize: 15 }}>
            Ghostie
          </Typography>
          <Typography variant="caption" sx={{ color: 'hsl(215,20%,50%)', display: { xs: 'none', sm: 'block' } }}>
            Business Sentiment Intelligence
          </Typography>
        </Box>
        <Button
          size="small"
          variant="outlined"
          endIcon={<OpenInNewIcon sx={{ fontSize: 14 }} />}
          onClick={() => navigate('/signin')}
          sx={{ fontSize: 12, borderColor: 'hsl(230,25%,30%)', color: 'hsl(215,20%,70%)', '&:hover': { borderColor: 'hsl(142,69%,58%)', color: 'hsl(142,69%,58%)' } }}
        >
          Sign in to analyse
        </Button>
      </Box>

      {/* Main content */}
      <Box sx={{ flex: 1, maxWidth: 800, mx: 'auto', width: '100%', px: { xs: 2, md: 4 }, py: 4 }}>

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
            <CircularProgress sx={{ color: 'hsl(142,69%,58%)' }} />
          </Box>
        )}

        {error && (
          <Box sx={{ mt: 4 }}>
            <Alert severity="error">{error}</Alert>
            <Typography variant="body2" sx={{ color: 'hsl(215,20%,55%)', mt: 2, textAlign: 'center' }}>
              This company may not have been analysed yet.{' '}
              <Box component="span"
                onClick={() => navigate('/signin')}
                sx={{ color: 'hsl(142,69%,58%)', cursor: 'pointer', textDecoration: 'underline' }}>
                Sign in to run an analysis.
              </Box>
            </Typography>
          </Box>
        )}

        {!loading && sentiment && (
          <>
            {/* Hero card */}
            <Box sx={{
              ...fadeUp(0),
              borderRadius: '20px',
              border: `1px solid ${color}33`,
              bgcolor: 'hsl(228,38%,16%)',
              p: { xs: 3, md: 4 },
              mb: 3,
              position: 'relative',
              overflow: 'hidden',
            }}>
              {/* Glow blob */}
              <Box sx={{
                position: 'absolute', top: -80, right: -80, width: 280, height: 280,
                borderRadius: '50%',
                background: `radial-gradient(circle, ${color}18 0%, transparent 70%)`,
                pointerEvents: 'none',
              }} />

              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'center', gap: 4, position: 'relative' }}>
                <ScoreGauge score={score} size={180} label="Ghostie Score" />

                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="h3" fontWeight={800} sx={{
                    fontFamily: '"Sora", sans-serif', color: 'hsl(210,40%,93%)',
                    lineHeight: 1.1, mb: 1,
                  }}>
                    {sentiment.business_name}
                  </Typography>

                  <SentimentBadge score={score} size="lg" />

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 1.5 }}>
                    {location && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <LocationOnIcon sx={{ fontSize: 14, color: 'hsl(215,20%,50%)' }} />
                        <Typography variant="body2" sx={{ color: 'hsl(215,20%,65%)' }}>{location}</Typography>
                      </Box>
                    )}
                    {category && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <CategoryIcon sx={{ fontSize: 14, color: 'hsl(215,20%,50%)' }} />
                        <Typography variant="body2" sx={{ color: 'hsl(215,20%,65%)' }}>{category}</Typography>
                      </Box>
                    )}
                  </Box>

                  <Box sx={{ display: 'flex', gap: 3, mt: 2.5, flexWrap: 'wrap' }}>
                    <Box>
                      <Typography variant="caption" sx={{ color: 'hsl(215,20%,50%)', textTransform: 'uppercase', letterSpacing: 1, fontSize: 10, display: 'block' }}>Items</Typography>
                      <Typography variant="h6" fontWeight={700} sx={{ color: 'hsl(210,40%,93%)', fontFamily: '"Sora", sans-serif' }}>
                        {sentiment.items_analysed}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: 'hsl(215,20%,50%)', textTransform: 'uppercase', letterSpacing: 1, fontSize: 10, display: 'block' }}>Rating</Typography>
                      <Typography variant="h6" fontWeight={700} sx={{ color: 'hsl(210,40%,93%)', fontFamily: '"Sora", sans-serif' }}>
                        {sentiment.overall_rating}/5
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: 'hsl(215,20%,50%)', textTransform: 'uppercase', letterSpacing: 1, fontSize: 10, display: 'block' }}>Score</Typography>
                      <Typography variant="h6" fontWeight={700} sx={{ color, fontFamily: '"Sora", sans-serif' }}>
                        {Math.round(score)}/100
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Box>

            {/* Trend sparkline */}
            {history.length > 1 && (
              <Box sx={{
                ...fadeUp(0.08),
                borderRadius: '16px', border: '1px solid hsl(230,25%,25%)',
                bgcolor: 'hsl(228,38%,16%)', p: 2.5, mb: 3,
              }}>
                <Typography variant="caption" sx={{ color: 'hsl(215,20%,55%)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600, display: 'block', mb: 1.5 }}>
                  Score Trend
                </Typography>
                <ResponsiveContainer width="100%" height={80}>
                  <AreaChart data={history}>
                    <defs>
                      <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={color} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={color} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" hide />
                    <ReTooltip
                      contentStyle={{ backgroundColor: 'hsl(228,38%,20%)', border: '1px solid hsl(230,25%,25%)', borderRadius: 8, fontSize: 12 }}
                      labelStyle={{ color: 'hsl(210,40%,93%)' }}
                    />
                    <Area type="monotone" dataKey="score" stroke={color} strokeWidth={2} fill="url(#sparkGrad)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            )}

            {/* Keywords */}
            {sentiment.keywords?.length > 0 && (
              <Box sx={{ ...fadeUp(0.12), mb: 3 }}>
                <Typography variant="caption" sx={{ color: 'hsl(215,20%,55%)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600, display: 'block', mb: 1.5 }}>
                  Top Keywords
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {sentiment.keywords.map((kw) => (
                    <Chip key={kw} label={kw} size="small" sx={{
                      bgcolor: `${color}15`, border: `1px solid ${color}35`,
                      color: 'hsl(210,40%,80%)', fontSize: 13, height: 28,
                    }} />
                  ))}
                </Box>
              </Box>
            )}

            {/* Source breakdown */}
            {sentiment.breakdown?.length > 0 && (
              <Box sx={{
                ...fadeUp(0.16),
                borderRadius: '16px', border: '1px solid hsl(230,25%,25%)',
                bgcolor: 'hsl(228,38%,16%)', overflow: 'hidden', mb: 3,
              }}>
                <Box sx={{ px: 2.5, py: 1.75, borderBottom: '1px solid hsl(230,25%,25%)', bgcolor: 'rgba(255,255,255,0.03)' }}>
                  <Typography variant="caption" sx={{ color: 'hsl(215,20%,55%)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>
                    Source Breakdown (top {Math.min(sentiment.breakdown.length, 5)})
                  </Typography>
                </Box>
                {sentiment.breakdown.slice(0, 5).map((item, i) => {
                  const c = scoreColor(item.score);
                  return (
                    <Box key={i} sx={{
                      px: 2.5, py: 1.75,
                      borderBottom: i < Math.min(sentiment.breakdown.length, 5) - 1 ? '1px solid hsl(230,25%,22%)' : 'none',
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.75 }}>
                        <Box sx={{ px: 1, py: 0.2, borderRadius: '4px', bgcolor: `${c}18`, border: `1px solid ${c}40`, flexShrink: 0 }}>
                          <Typography sx={{ color: c, fontWeight: 700, fontSize: 10, letterSpacing: 0.5 }}>
                            {sourceLabel(item.source).toUpperCase()}
                          </Typography>
                        </Box>
                        <Box sx={{ flex: 1, height: 4, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.07)' }}>
                          <Box sx={{ height: '100%', width: `${item.score}%`, borderRadius: 2, bgcolor: c, transition: 'width 1s ease' }} />
                        </Box>
                        <Typography variant="body2" sx={{ color: c, fontWeight: 700, minWidth: 28, textAlign: 'right' }}>
                          {Math.round(item.score)}
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ color: 'hsl(215,20%,65%)', lineHeight: 1.5 }}>
                        {(item.body || item.text || '').slice(0, 160)}{(item.body || item.text || '').length > 160 ? '…' : ''}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            )}

            {/* Actions */}
            <Box className="ghostie-no-print" sx={{ ...fadeUp(0.2), display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Tooltip title={copied ? 'Copied!' : 'Copy link to share'}>
                <Button
                  variant="outlined"
                  startIcon={copied ? <CheckIcon /> : <ShareIcon />}
                  onClick={handleShare}
                  sx={{
                    borderColor: copied ? 'hsl(142,69%,58%)' : 'hsl(230,25%,30%)',
                    color: copied ? 'hsl(142,69%,58%)' : 'hsl(215,20%,70%)',
                    transition: 'all 0.2s',
                  }}
                >
                  {copied ? 'Link copied' : 'Share scorecard'}
                </Button>
              </Tooltip>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={handleDownload}
                sx={{ borderColor: 'hsl(230,25%,30%)', color: 'hsl(215,20%,70%)', '&:hover': { borderColor: 'hsl(215,20%,50%)', color: 'hsl(210,40%,93%)' } }}
              >
                Download PDF
              </Button>
              <Button
                variant="contained"
                endIcon={<AnalyticsIcon />}
                onClick={() => navigate('/signin')}
                sx={{
                  background: 'linear-gradient(135deg, hsl(142,69%,42%), hsl(142,69%,35%))',
                  '&:hover': { background: 'linear-gradient(135deg, hsl(142,69%,48%), hsl(142,69%,40%))' },
                }}
              >
                Analyse with Ghostie
              </Button>
            </Box>
          </>
        )}
      </Box>

      {/* Footer */}
      <Divider className="ghostie-no-print" sx={{ borderColor: 'hsl(230,25%,20%)' }} />
      <Box className="ghostie-no-print" sx={{ px: 4, py: 2, textAlign: 'center' }}>
        <Typography variant="caption" sx={{ color: 'hsl(215,20%,40%)' }}>
          Powered by{' '}
          <Box component="span" sx={{ color: 'hsl(142,69%,48%)', fontWeight: 600 }}>Ghostie</Box>
          {' '}— Public sentiment data. Scores update when new data is collected.
        </Typography>
      </Box>
    </Box>
  );
}
