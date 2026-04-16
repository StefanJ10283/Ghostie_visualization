import * as React from 'react';
import PropTypes from 'prop-types';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

import { inputsCustomizations } from './customizations/inputs';
import { dataDisplayCustomizations } from './customizations/dataDisplay';
import { feedbackCustomizations } from './customizations/feedback';
import { navigationCustomizations } from './customizations/navigation';
import { surfacesCustomizations } from './customizations/surfaces';
import { colorSchemes, typography, shadows } from './themePrimitives';

const darkTheme = createTheme({
  cssVariables: {
    colorSchemeSelector: 'data-mui-color-scheme',
    cssVarPrefix: 'template',
  },
  defaultColorScheme: 'dark',
  colorSchemes: { dark: colorSchemes.dark },
  typography: {
    ...typography,
    fontFamily: '"Manrope", "Inter", sans-serif',
    h1: { ...typography.h1, fontFamily: '"Sora", "Inter", sans-serif' },
    h2: { ...typography.h2, fontFamily: '"Sora", "Inter", sans-serif' },
    h3: { ...typography.h3, fontFamily: '"Sora", "Inter", sans-serif' },
    h4: { ...typography.h4, fontFamily: '"Sora", "Inter", sans-serif' },
    h5: { ...typography.h5, fontFamily: '"Sora", "Inter", sans-serif' },
    h6: { ...typography.h6, fontFamily: '"Sora", "Inter", sans-serif' },
  },
  shadows,
  shape: { borderRadius: 12 },
  components: {
    ...inputsCustomizations,
    ...dataDisplayCustomizations,
    ...feedbackCustomizations,
    ...navigationCustomizations,
    ...surfacesCustomizations,
  },
});

export default function AppTheme({ children }) {
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}

AppTheme.propTypes = { children: PropTypes.node };
