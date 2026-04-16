import Box from '@mui/material/Box';

export function SentimentBadge({ score, size = 'md' }) {
  // positive >= 57.5, neutral >= 42.5, negative < 42.5
  const palette =
    score >= 57.5
      ? { bg: 'hsl(142 69% 58% / 0.15)', border: 'hsl(142 69% 58% / 0.35)', text: 'hsl(142,69%,58%)' }
      : score >= 42.5
      ? { bg: 'hsl(45 93% 58% / 0.15)',  border: 'hsl(45 93% 58% / 0.35)',  text: 'hsl(45,93%,58%)' }
      : { bg: 'hsl(0 84% 60% / 0.15)',   border: 'hsl(0 84% 60% / 0.35)',   text: 'hsl(0,84%,60%)' };

  const sizes = {
    sm: { fontSize: 11, px: 1,   py: 0.25, minWidth: 36 },
    md: { fontSize: 13, px: 1.5, py: 0.5,  minWidth: 44 },
    lg: { fontSize: 15, px: 2,   py: 0.75, minWidth: 54, fontWeight: 700 },
  }[size];

  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 99,
        border: '1px solid',
        borderColor: palette.border,
        bgcolor: palette.bg,
        color: palette.text,
        fontWeight: 600,
        fontVariantNumeric: 'tabular-nums',
        ...sizes,
      }}
    >
      {score}
    </Box>
  );
}
