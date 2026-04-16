import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useBusiness } from '../context/BusinessContext';

export function BusinessPicker({ business, setBusiness }) {
  const { companies } = useBusiness();

  const handleSelect = (_, value) => {
    if (value && typeof value === 'object') {
      // Tracked company selected — fill all three fields
      setBusiness({
        business_name: value.business_name,
        location: value.location,
        category: value.category,
      });
    } else {
      // Free text typed — only update the name
      setBusiness({ ...business, business_name: value ?? '' });
    }
  };

  return (
    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
      <Autocomplete
        freeSolo
        options={companies}
        getOptionLabel={(opt) => (typeof opt === 'string' ? opt : opt.business_name)}
        filterOptions={(opts, { inputValue }) => {
          const lower = inputValue.toLowerCase();
          return opts.filter(
            (o) =>
              o.business_name.toLowerCase().includes(lower) ||
              o.location.toLowerCase().includes(lower) ||
              o.category.toLowerCase().includes(lower)
          );
        }}
        renderOption={(props, opt) => (
          <li {...props} key={`${opt.business_name}-${opt.location}-${opt.category}`}>
            <Box>
              <Typography variant="body2" fontWeight={500}>{opt.business_name}</Typography>
              <Typography variant="caption" color="text.secondary">
                {opt.location} · {opt.category}
              </Typography>
            </Box>
          </li>
        )}
        inputValue={business.business_name}
        onInputChange={(_, val) => setBusiness({ ...business, business_name: val })}
        onChange={handleSelect}
        sx={{ flex: 2, minWidth: 200 }}
        renderInput={(params) => (
          <TextField {...params} label="Business Name" size="small" required />
        )}
      />
      <TextField
        label="Location"
        size="small"
        required
        value={business.location}
        onChange={(e) => setBusiness({ ...business, location: e.target.value })}
        sx={{ flex: 1, minWidth: 140 }}
      />
      <TextField
        label="Category"
        size="small"
        required
        value={business.category}
        onChange={(e) => setBusiness({ ...business, category: e.target.value })}
        sx={{ flex: 1, minWidth: 140 }}
      />
    </Box>
  );
}
