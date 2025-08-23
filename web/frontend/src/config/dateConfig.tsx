import { de } from 'date-fns/locale';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import React from 'react';

export const DateLocalizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={de}>
      {children}
    </LocalizationProvider>
  );
}; 