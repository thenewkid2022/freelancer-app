import { useTheme, useMediaQuery } from '@mui/material';

export const useResponsive = () => {
  const theme = useTheme();
  
  return {
    isMobile: useMediaQuery(theme.breakpoints.down('sm')),
    isTablet: useMediaQuery(theme.breakpoints.down('md')),
    isDesktop: useMediaQuery(theme.breakpoints.up('md')),
    isLargeDesktop: useMediaQuery(theme.breakpoints.up('lg')),
    breakpoint: {
      xs: useMediaQuery(theme.breakpoints.up('xs')),
      sm: useMediaQuery(theme.breakpoints.up('sm')),
      md: useMediaQuery(theme.breakpoints.up('md')),
      lg: useMediaQuery(theme.breakpoints.up('lg')),
      xl: useMediaQuery(theme.breakpoints.up('xl')),
    }
  };
}; 