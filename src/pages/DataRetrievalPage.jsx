import { useState, useEffect } from 'react';
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
import Collapse from '@mui/material/Collapse';
import Divider from '@mui/material/Divider';
import LinearProgress from '@mui/material/LinearProgress';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import EyeIcon from '@mui/icons-material/Visibility';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import RateReviewIcon from '@mui/icons-material/RateReview';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import StorageIcon from '@mui/icons-material/Storage';
import BusinessIcon from '@mui/icons-material/Business';
import { StatsCard } from '../components/StatsCard';
import { makeApiClient } from '../api/client';
import { useAuth } from '../auth/AuthContext';

const sourceLabel = (s) => {
  if (s === 'google_maps_reviews') return 'Review';
  if (s === 'newsapi') return 'News';
  if (s === 'reddit') return 'Reddit';
  return s || '—';
};

const sourceColor = (s) => {
  if (s === 'google_maps_reviews') return 'hsl(142,69%,58%)';
  if (s === 'newsapi') return 'hsl(200,80%,60%)';
  if (s === 'reddit') return 'hsl(20,90%,60%)';
  return 'hsl(215,20%,60%)';
};

function StarRating({ rating }) {
  if (!rating) return null;
  const n = Math.round(Number(rating));
  return (
    <Typography variant="caption" sx={{ color: 'hsl(45,93%,58%)', letterSpacing: 1 }}>
      {'★'.repeat(n)}{'☆'.repeat(Math.max(0, 5 - n))}
      <Typography component="span" variant="caption" sx={{ color: 'hsl(215,20%,60%)', ml: 0.5 }}>
        ({rating}/5)
      </Typography>
    </Typography>
  );
}

function CompanyRow({ company, api }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleToggle = async () => {
    if (open) { setOpen(false); return; }
    setOpen(true);
    if (items !== null) return;
    setLoading(true);
    setError('');
    try {
      const res = await api(`/data-retrieval/retrieve/${company.hash_key}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setItems(json.data ?? []);
    } catch (err) {
      setError(err.message);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const reviews = (items ?? []).filter((r) => r.source === 'google_maps_reviews');
  const others  = (items ?? []).filter((r) => r.source !== 'google_maps_reviews');

  return (
    <Box>
      <Box
        onClick={handleToggle}
        sx={{
          display: 'flex', alignItems: 'center', gap: 2,
          px: 2.5, py: 2, cursor: 'pointer',
          '&:hover': { bgcolor: 'rgba(255,255,255,0.03)' },
          transition: 'background 0.15s',
        }}
      >
        <Box sx={{
          width: 36, height: 36, borderRadius: '8px', flexShrink: 0,
          bgcolor: 'rgba(46,200,110,0.1)', border: '1px solid rgba(46,200,110,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <BusinessIcon sx={{ fontSize: 18, color: 'hsl(142,69%,58%)' }} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body2" fontWeight={600} sx={{ color: 'hsl(210,40%,93%)' }}>
            {company.business_name}
          </Typography>
          <Typography variant="caption" sx={{ color: 'hsl(215,20%,60%)' }}>
            {company.location} · {company.category}
          </Typography>
        </Box>
        <Chip
          label={new Date(company.updated_at).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: '2-digit' })}
          size="small"
          sx={{ bgcolor: 'rgba(255,255,255,0.05)', color: 'hsl(215,20%,60%)', border: '1px solid hsl(230,25%,25%)', fontSize: 11 }}
        />
        {open
          ? <ExpandLessIcon sx={{ color: 'hsl(215,20%,60%)', flexShrink: 0 }} />
          : <ExpandMoreIcon sx={{ color: 'hsl(215,20%,60%)', flexShrink: 0 }} />
        }
      </Box>

      <Collapse in={open}>
        <Divider sx={{ borderColor: 'hsl(230,25%,25%)' }} />
        <Box sx={{ bgcolor: 'rgba(0,0,0,0.15)', px: 2.5, py: 2 }}>
          {loading && <LinearProgress sx={{ borderRadius: 1, mb: 2 }} />}
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {items !== null && items.length === 0 && !loading && (
            <Typography variant="body2" sx={{ color: 'hsl(215,20%,60%)' }}>No data found.</Typography>
          )}

          {reviews.length > 0 && (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <RateReviewIcon sx={{ fontSize: 16, color: 'hsl(142,69%,58%)' }} />
                <Typography variant="caption" sx={{ textTransform: 'uppercase', letterSpacing: 1, color: 'hsl(142,69%,58%)', fontWeight: 600 }}>
                  Reviews ({reviews.length})
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: others.length ? 2.5 : 0 }}>
                {reviews.map((r, i) => (
                  <Box key={i} sx={{ p: 1.5, borderRadius: '8px', border: '1px solid hsl(230,25%,25%)', bgcolor: 'rgba(255,255,255,0.03)' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: (r.text || r.body) ? 0.75 : 0 }}>
                      <StarRating rating={r.rating ?? r.metadata?.rating} />
                      {r.author && (
                        <Typography variant="caption" sx={{ color: 'hsl(215,20%,50%)', ml: 'auto' }}>{r.author}</Typography>
                      )}
                      {r.date && (
                        <Typography variant="caption" sx={{ color: 'hsl(215,20%,45%)' }}>· {r.date}</Typography>
                      )}
                    </Box>
                    {(r.text || r.body) && (
                      <Typography variant="body2" sx={{ color: 'hsl(215,20%,75%)', lineHeight: 1.6 }}>
                        {r.text || r.body}
                      </Typography>
                    )}
                  </Box>
                ))}
              </Box>
            </>
          )}

          {others.length > 0 && (
            <>
              <Typography variant="caption" sx={{ textTransform: 'uppercase', letterSpacing: 1, color: 'hsl(215,20%,60%)', fontWeight: 600, display: 'block', mb: 1.5 }}>
                Other Sources ({others.length})
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {others.map((r, i) => (
                  <Box key={i} sx={{ p: 1.5, borderRadius: '8px', border: '1px solid hsl(230,25%,25%)', bgcolor: 'rgba(255,255,255,0.03)', display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                    <Chip
                      label={sourceLabel(r.source)}
                      size="small"
                      sx={{ flexShrink: 0, fontSize: 10, height: 20, bgcolor: `${sourceColor(r.source)}22`, color: sourceColor(r.source), border: `1px solid ${sourceColor(r.source)}44` }}
                    />
                    <Typography variant="body2" sx={{ color: 'hsl(215,20%,75%)', lineHeight: 1.6 }}>
                      {r.title ? <><strong>{r.title}</strong>{' — '}</> : null}
                      {r.text || r.body || r.summary || '—'}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </>
          )}
        </Box>
      </Collapse>
    </Box>
  );
}

const fadeUp = (delay = 0) => ({
  '@keyframes fadeUp': {
    from: { opacity: 0, transform: 'translateY(20px)' },
    to:   { opacity: 1, transform: 'translateY(0)' },
  },
  animation: `fadeUp 0.5s ease ${delay}s both`,
});

export default function DataRetrievalPage() {
  const { token } = useAuth();
  const api = makeApiClient(token);
  const [tab, setTab] = useState(0);
  const [form, setForm] = useState({ business_name: '', location: '', category: '' });
  const [search, setSearch] = useState('');
  const [result, setResult] = useState(null);
  const [companies, setCompanies] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    api('/data-retrieval/companies').then((r) => r.json()).then(setCompanies).catch(() => {});
  }, []);

  const handleRetrieve = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const params = new URLSearchParams(form);
      const res = await api(`/data-retrieval/retrieve?${params}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Retrieval failed');
      }
      setResult(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const items = result?.data ?? [];
  const filtered = items.filter((r) => {
    if (!search) return true;
    const text = `${r.title ?? ''} ${r.body ?? ''}`.toLowerCase();
    return text.includes(search.toLowerCase()) || (r.source ?? '').toLowerCase().includes(search.toLowerCase());
  });

  const newsCount = items.filter((r) => r.source === 'newsapi').length;
  const reviewCount = items.filter((r) => r.source === 'google_maps_reviews').length;

  return (
    <Box>
      <Box sx={{ mb: 3, ...fadeUp(0) }}>
        <Typography variant="h4" fontWeight={700}>Data Retrieval</Typography>
        <Typography variant="body2" color="text.secondary" mt={0.5}>
          Search and explore collected data for any business.
        </Typography>
      </Box>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3, ...fadeUp(0.07) }}>
        <Tab label="Retrieve Data" />
        <Tab label="All Companies" />
      </Tabs>

      {tab === 0 && (
        <>
          <Card variant="outlined" sx={{ mb: 3, ...fadeUp(0.14) }}>
            <CardContent>
              <Box component="form" onSubmit={handleRetrieve} sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <TextField label="Business Name" size="small" required value={form.business_name}
                  onChange={(e) => setForm({ ...form, business_name: e.target.value })} sx={{ flex: 1, minWidth: 160 }} />
                <TextField label="Location" size="small" required value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })} sx={{ flex: 1, minWidth: 140 }} />
                <TextField label="Category" size="small" required value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })} sx={{ flex: 1, minWidth: 140 }} />
                <Button type="submit" variant="contained" disabled={loading} sx={{ minWidth: 120 }}>
                  {loading ? <CircularProgress size={20} color="inherit" /> : 'Retrieve'}
                </Button>
              </Box>
            </CardContent>
          </Card>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          {result && (
            <Box>
              {result.status === 'NO NEW DATA'
                ? (
                  <Alert
                    severity="info"
                    sx={{ mb: 2 }}
                    action={
                      <Button
                        color="inherit"
                        size="small"
                        disabled={loading}
                        onClick={async () => {
                          setLoading(true);
                          try {
                            const res = await api(`/data-retrieval/retrieve/${result.hash_key}`);
                            const cached = await res.json();
                            setResult({ ...cached, status: 'NEW DATA', _fromCache: true });
                          } catch { /* swallowed */ } finally { setLoading(false); }
                        }}
                      >
                        {loading ? <CircularProgress size={14} color="inherit" /> : 'Load anyway'}
                      </Button>
                    }
                  >
                    Data unchanged since last retrieval.
                  </Alert>
                )
                : (
                  <>
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                      <Grid item xs={12} md={4}>
                        <StatsCard label="Total Results" value={result.total_results} icon={StorageIcon} glow="green" />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <StatsCard label="News" value={newsCount} icon={BusinessIcon} />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <StatsCard label="Reviews" value={reviewCount} icon={StorageIcon} glow="purple" />
                      </Grid>
                    </Grid>

                    {/* Search bar */}
                    <Card variant="outlined" sx={{ mb: 2 }}>
                      <CardContent sx={{ py: '12px !important' }}>
                        <TextField
                          size="small" fullWidth
                          placeholder="Search reviews and articles..."
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>
                            ),
                          }}
                        />
                      </CardContent>
                    </Card>

                    {/* Results table */}
                    <Card variant="outlined" sx={{ overflow: 'hidden' }}>
                      <Box sx={{
                        display: 'grid', gridTemplateColumns: '100px 1fr 80px 40px',
                        gap: 2, px: 2.5, py: 1.5,
                        borderBottom: '1px solid', borderColor: 'hsl(230,25%,25%)',
                        bgcolor: 'rgba(255,255,255,0.03)',
                      }}>
                        {['Source', 'Snippet', 'Rating', ''].map((h) => (
                          <Typography key={h} variant="caption" sx={{ textTransform: 'uppercase', letterSpacing: 1, color: 'text.secondary', fontWeight: 600 }}>
                            {h}
                          </Typography>
                        ))}
                      </Box>

                      {filtered.length === 0
                        ? <Box sx={{ px: 2.5, py: 6, textAlign: 'center' }}><Typography variant="body2" color="text.secondary">No results match your search.</Typography></Box>
                        : filtered.map((item, i) => (
                          <Box
                            key={i}
                            sx={{
                              display: 'grid', gridTemplateColumns: '100px 1fr 80px 40px',
                              gap: 2, px: 2.5, py: 2, alignItems: 'center',
                              borderBottom: '1px solid', borderColor: 'hsl(230,25%,25%)',
                              '&:last-child': { borderBottom: 0 },
                              '&:hover': { bgcolor: 'rgba(255,255,255,0.03)' },
                              transition: 'background 0.15s',
                            }}
                          >
                            <Chip label={sourceLabel(item.source)} size="small" variant="outlined" />
                            <Typography variant="body2" color="text.secondary" noWrap>
                              {item.title || item.body?.slice(0, 100) || '—'}
                            </Typography>
                            {(item.metadata?.rating ?? item.rating)
                              ? <Chip label={`${item.metadata?.rating ?? item.rating}★`} size="small" color="warning" />
                              : <Box />
                            }
                            <IconButton size="small" onClick={() => setSelected(item)}>
                              <EyeIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        ))
                      }
                    </Card>
                  </>
                )
              }
            </Box>
          )}
        </>
      )}

      {tab === 1 && (
        <Box sx={fadeUp(0.14)}>
          {!companies
            ? <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}><CircularProgress /></Box>
            : companies.count === 0
              ? <Alert severity="info">No companies tracked yet. Run data collection first.</Alert>
              : (
                <>
                  <Typography variant="body2" sx={{ color: 'hsl(215,20%,60%)', mb: 2 }}>
                    {companies.count} {companies.count === 1 ? 'company' : 'companies'} tracked — click to view reviews
                  </Typography>
                  <Box sx={{ borderRadius: '12px', border: '1px solid hsl(230,25%,25%)', bgcolor: 'hsl(228,38%,16%)', overflow: 'hidden' }}>
                    {companies.companies?.map((c, i) => (
                      <Box key={c.business_key}>
                        <CompanyRow company={c} api={api} />
                        {i < companies.companies.length - 1 && (
                          <Divider sx={{ borderColor: 'hsl(230,25%,25%)' }} />
                        )}
                      </Box>
                    ))}
                  </Box>
                </>
              )
          }
        </Box>
      )}

      {/* Detail dialog */}
      <Dialog open={!!selected} onClose={() => setSelected(null)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selected?.title || 'Detail'}
        </DialogTitle>
        {selected && (
          <DialogContent dividers>
            <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
              <Chip label={sourceLabel(selected.source)} size="small" variant="outlined" />
              {selected.publisher && (
                <Chip label={selected.publisher} size="small" variant="outlined" />
              )}
              {(selected.metadata?.rating ?? selected.rating) && (
                <Chip label={`${selected.metadata?.rating ?? selected.rating}★`} size="small" color="warning" />
              )}
              {selected.timestamp && (
                <Typography variant="caption" color="text.secondary">
                  {new Date(selected.timestamp).toLocaleString()}
                </Typography>
              )}
            </Box>

            {selected.body && (
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8, whiteSpace: 'pre-wrap', mb: 2 }}>
                {selected.body}
              </Typography>
            )}

            {selected.url && (
              <Typography variant="caption">
                <a href={selected.url} target="_blank" rel="noreferrer" style={{ color: 'inherit' }}>
                  {selected.url}
                </a>
              </Typography>
            )}
          </DialogContent>
        )}
      </Dialog>
    </Box>
  );
}
