import React from 'react';
import { Container, Paper, Typography, Stack, Button } from '@mui/material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import TableChartIcon from '@mui/icons-material/TableChart';
import FileDownloadIcon from '@mui/icons-material/FileDownload';

const Export: React.FC = () => {
  // Platzhalter für Export-Handler
  const handleExport = (type: 'pdf' | 'excel' | 'csv') => {
    alert(`Export als ${type.toUpperCase()} ist in Arbeit!`);
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 6, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
        <Typography variant="h5" align="center" sx={{ fontWeight: 700, mb: 3 }}>
          Daten exportieren
        </Typography>
        <Typography align="center" sx={{ mb: 4, color: 'text.secondary' }}>
          Wähle das gewünschte Format für den Export deiner Zeiteinträge.
        </Typography>
        <Stack spacing={2} direction={{ xs: 'column', sm: 'row' }} justifyContent="center">
          <Button
            variant="contained"
            color="primary"
            startIcon={<PictureAsPdfIcon />}
            onClick={() => handleExport('pdf')}
            sx={{ minWidth: 120, borderRadius: 2 }}
          >
            PDF
          </Button>
          <Button
            variant="contained"
            color="success"
            startIcon={<TableChartIcon />}
            onClick={() => handleExport('excel')}
            sx={{ minWidth: 120, borderRadius: 2 }}
          >
            Excel
          </Button>
          <Button
            variant="contained"
            color="info"
            startIcon={<FileDownloadIcon />}
            onClick={() => handleExport('csv')}
            sx={{ minWidth: 120, borderRadius: 2 }}
          >
            CSV
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
};

export default Export; 