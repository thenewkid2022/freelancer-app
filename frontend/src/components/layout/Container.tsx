import React from 'react';
import { Container as MuiContainer, ContainerProps } from '@mui/material';
import { useResponsive } from '../../hooks/useResponsive';

interface ResponsiveContainerProps extends Omit<ContainerProps, 'maxWidth'> {
  children: React.ReactNode;
  fullHeight?: boolean;
  noPadding?: boolean;
  centered?: boolean;
}

export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  fullHeight = false,
  noPadding = false,
  centered = false,
  ...props
}) => {
  const { isMobile } = useResponsive();

  return (
    <MuiContainer
      maxWidth="lg"
      {...props}
      sx={{
        flex: 1,
        overflow: 'auto',
        px: noPadding ? 0 : { xs: 1, sm: 2, md: 3 },
        py: noPadding ? 0 : { xs: 1, sm: 2 },
        height: fullHeight ? '100%' : 'auto',
        display: 'flex',
        flexDirection: 'column',
        ...(centered && {
          justifyContent: 'center',
          alignItems: 'center',
        }),
        ...props.sx,
      }}
    >
      {children}
    </MuiContainer>
  );
};

export const PageContainer: React.FC<ResponsiveContainerProps> = (props) => (
  <ResponsiveContainer
    fullHeight
    sx={{
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      '& > *': {
        flex: 1,
        width: '100%',
      },
      ...props.sx,
    }}
    {...props}
  />
); 