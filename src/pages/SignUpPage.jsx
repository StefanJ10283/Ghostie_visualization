import { useState } from 'react';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import { useAuth } from '../auth/AuthContext';

const PageStack = styled(Stack)(({ theme }) => ({
  minHeight: '100dvh',
  padding: theme.spacing(2),
  [theme.breakpoints.up('sm')]: { padding: theme.spacing(4) },
  '&::before': {
    content: '""',
    display: 'block',
    position: 'absolute',
    zIndex: -1,
    inset: 0,
    backgroundImage: 'radial-gradient(ellipse at 50% 50%, hsl(210, 100%, 97%), hsl(0, 0%, 100%))',
    backgroundRepeat: 'no-repeat',
    ...theme.applyStyles('dark', {
      backgroundImage: 'radial-gradient(at 50% 50%, hsla(210, 100%, 16%, 0.5), hsl(220, 30%, 5%))',
    }),
  },
}));

const FormCard = styled(Card)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignSelf: 'center',
  width: '100%',
  padding: theme.spacing(4),
  gap: theme.spacing(2),
  margin: 'auto',
  boxShadow:
    'hsla(220, 30%, 5%, 0.05) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.05) 0px 15px 35px -5px',
  [theme.breakpoints.up('sm')]: { width: 450 },
  ...theme.applyStyles('dark', {
    boxShadow:
      'hsla(220, 30%, 5%, 0.5) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.08) 0px 15px 35px -5px',
  }),
}));

export default function SignUpPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const addAccount = location.state?.addAccount ?? false;
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.username || form.username.length < 2) e.username = 'Username must be at least 2 characters.';
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email address.';
    if (!form.password || form.password.length < 6) e.password = 'Password must be at least 6 characters.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setApiError('');
    try {
      await signup(form.email, form.username, form.password);
      navigate('/');
    } catch (err) {
      setApiError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageStack direction="column" sx={{ justifyContent: 'center' }}>
      <FormCard variant="outlined">
        <Typography variant="h4" fontWeight={700}>Ghostie</Typography>
        <Typography component="h1" variant="h4" sx={{ fontSize: 'clamp(2rem, 10vw, 2.15rem)' }}>
          Create account
        </Typography>

        {apiError && <Alert severity="error">{apiError}</Alert>}

        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <FormControl>
            <FormLabel htmlFor="username">Username</FormLabel>
            <TextField
              id="username"
              placeholder="johndoe"
              autoComplete="username"
              autoFocus
              required
              fullWidth
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              error={!!errors.username}
              helperText={errors.username}
            />
          </FormControl>
          <FormControl>
            <FormLabel htmlFor="email">Email</FormLabel>
            <TextField
              id="email"
              type="email"
              placeholder="your@email.com"
              autoComplete="email"
              required
              fullWidth
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              error={!!errors.email}
              helperText={errors.email}
            />
          </FormControl>
          <FormControl>
            <FormLabel htmlFor="password">Password</FormLabel>
            <TextField
              id="password"
              type="password"
              placeholder="••••••"
              autoComplete="new-password"
              required
              fullWidth
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              error={!!errors.password}
              helperText={errors.password}
            />
          </FormControl>
          <Button type="submit" fullWidth variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={20} color="inherit" /> : 'Create account'}
          </Button>
        </Box>

        <Divider />

        <Typography sx={{ textAlign: 'center' }} variant="body2">
          Already have an account?{' '}
          <RouterLink to="/signin" state={{ addAccount }} style={{ color: 'inherit', fontWeight: 500 }}>
            Sign in
          </RouterLink>
        </Typography>
      </FormCard>
    </PageStack>
  );
}
