import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import Collapse from '@mui/material/Collapse';
import Divider from '@mui/material/Divider';
import LinearProgress from '@mui/material/LinearProgress';
import BusinessIcon from '@mui/icons-material/Business';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import RateReviewIcon from '@mui/icons-material/RateReview';
import { makeApiClient } from '../api/client';
import { useAuth } from '../auth/AuthContext';

const GLASS = {
  borderRadius: '12px',
  border: '1px solid hsl(230,25%,25%)',
  bgcolor: 'hsl(228,38%,16%)',
  overflow: 'hidden',
};

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
  const [reviews, setReviews] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleToggle = async () => {
    if (open) { setOpen(false); return; }
    setOpen(true);
    if (reviews !== null) return; // already loaded

    setLoading(true);
    setError('');
    try {
      const res = await api(`/data-retrieval/retrieve/${company.hash_key}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setReviews(json.data ?? []);
    } catch (err) {
      setError(err.message);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const allItems = reviews ?? [];
  const reviewItems = allItems.filter((r) => r.source === 'google_maps_reviews');
  const otherItems = allItems.filter((r) => r.source !== 'google_maps_reviews');

  return (
    <Box>
      {/* Company header row */}
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
          label={`Updated ${new Date(company.updated_at).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: '2-digit' })}`}
          size="small"
          sx={{ bgcolor: 'rgba(255,255,255,0.05)', color: 'hsl(215,20%,60%)', border: '1px solid hsl(230,25%,25%)', fontSize: 11 }}
        />

        {open ? (
          <ExpandLessIcon sx={{ color: 'hsl(215,20%,60%)', flexShrink: 0 }} />
        ) : (
          <ExpandMoreIcon sx={{ color: 'hsl(215,20%,60%)', flexShrink: 0 }} />
        )}
      </Box>

      {/* Expanded content */}
      <Collapse in={open}>
        <Divider sx={{ borderColor: 'hsl(230,25%,25%)' }} />
        <Box sx={{ bgcolor: 'rgba(0,0,0,0.15)', px: 2.5, py: 2 }}>
          {loading && <LinearProgress sx={{ borderRadius: 1, mb: 2 }} />}
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          {reviews !== null && allItems.length === 0 && !loading && (
            <Typography variant="body2" sx={{ color: 'hsl(215,20%,60%)' }}>No data found.</Typography>
          )}

          {reviewItems.length > 0 && (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <RateReviewIcon sx={{ fontSize: 16, color: 'hsl(142,69%,58%)' }} />
                <Typography variant="caption" sx={{ textTransform: 'uppercase', letterSpacing: 1, color: 'hsl(142,69%,58%)', fontWeight: 600 }}>
                  Reviews ({reviewItems.length})
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: otherItems.length ? 2.5 : 0 }}>
                {reviewItems.map((r, i) => (
                  <Box key={i} sx={{
                    p: 1.5, borderRadius: '8px',
                    border: '1px solid hsl(230,25%,25%)',
                    bgcolor: 'rgba(255,255,255,0.03)',
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: r.text || r.body ? 0.75 : 0 }}>
                      <StarRating rating={r.rating} />
                      {r.author && (
                        <Typography variant="caption" sx={{ color: 'hsl(215,20%,50%)', ml: 'auto' }}>
                          {r.author}
                        </Typography>
                      )}
                      {r.date && (
                        <Typography variant="caption" sx={{ color: 'hsl(215,20%,45%)' }}>
                          · {r.date}
                        </Typography>
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

          {otherItems.length > 0 && (
            <>
              <Typography variant="caption" sx={{ textTransform: 'uppercase', letterSpacing: 1, color: 'hsl(215,20%,60%)', fontWeight: 600, display: 'block', mb: 1.5 }}>
                Other Sources ({otherItems.length})
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {otherItems.map((r, i) => (
                  <Box key={i} sx={{
                    p: 1.5, borderRadius: '8px',
                    border: '1px solid hsl(230,25%,25%)',
                    bgcolor: 'rgba(255,255,255,0.03)',
                    display: 'flex', gap: 1.5, alignItems: 'flex-start',
                  }}>
                    <Chip
                      label={sourceLabel(r.source)}
                      size="small"
                      sx={{
                        flexShrink: 0, fontSize: 10, height: 20,
                        bgcolor: `${sourceColor(r.source)}22`,
                        color: sourceColor(r.source),
                        border: `1px solid ${sourceColor(r.source)}44`,
                      }}
                    />
                    <Typography variant="body2" sx={{ color: 'hsl(215,20%,75%)', lineHeight: 1.6 }}>
                      {r.title ? <strong>{r.title} — </strong> : null}
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

export default function CompaniesPage() {
  const { token } = useAuth();
  const api = makeApiClient(token);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/data-retrieval/companies')
      .then((r) => r.json())
      .then((data) => setCompanies(data.companies ?? []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={700} sx={{ fontFamily: '"Sora", sans-serif', color: 'hsl(210,40%,93%)' }}>
          All Companies
        </Typography>
        <Typography variant="body2" sx={{ color: 'hsl(215,20%,60%)', mt: 0.5 }}>
          Click a company to see all its collected reviews and data.
        </Typography>
      </Box>

      {loading && <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}><CircularProgress /></Box>}
      {error && <Alert severity="error">{error}</Alert>}

      {!loading && companies.length === 0 && !error && (
        <Alert severity="info">No companies tracked yet. Run data collection first.</Alert>
      )}

      {companies.length > 0 && (
        <Box sx={{ ...GLASS }}>
          {companies.map((company, i) => (
            <Box key={company.business_key}>
              <CompanyRow company={company} api={api} />
              {i < companies.length - 1 && (
                <Divider sx={{ borderColor: 'hsl(230,25%,25%)' }} />
              )}
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
