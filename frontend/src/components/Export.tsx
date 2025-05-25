import React from 'react';
import { Container, Paper, Typography, Stack, Button, useTheme, useMediaQuery } from '@mui/material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import TableChartIcon from '@mui/icons-material/TableChart';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';

const API_URL = process.env.REACT_APP_API_URL;

interface MergedEntry {
  project: { _id: string };
  date: string;
  totalDuration: number;
  comments: string[];
  entryIds: string[];
}

// Hilfsfunktion: UTC-Grenzen für lokalen Tag berechnen
function getUTCRangeForLocalDay(localDate: Date) {
  const start = new Date(localDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(localDate);
  end.setHours(23, 59, 59, 999);
  return {
    startUTC: start.toISOString(),
    endUTC: end.toISOString()
  };
}

const Export: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Für den Export: Datumsauswahl und Formatierung
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(new Date());
  const selectedDateStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null;

  // Für mergedEntries Query: UTC-Grenzen berechnen und verwenden
  const selectedDateRange = selectedDate ? getUTCRangeForLocalDay(selectedDate) : null;

  const { data: mergedEntries = [], isLoading: isLoadingMerged } = useQuery({
    queryKey: ['mergedTimeEntries', selectedDateRange],
    queryFn: async () => {
      if (!selectedDateRange) return [];
      const response = await axios.get<MergedEntry[]>('/time-entries/merged', {
        params: { startDate: selectedDateRange.startUTC, endDate: selectedDateRange.endUTC },
      });
      return response.data;
    },
    enabled: !!selectedDateRange,
  });

  // CSV-Export-Handler
  const handleExportCSV = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/time-entries`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const entries = response.data;
      if (!Array.isArray(entries) || entries.length === 0) {
        alert('Keine Zeiteinträge zum Exportieren gefunden.');
        return;
      }
      const header = [
        'Projektname',
        'Projektnummer',
        'Beschreibung',
        'Startzeit',
        'Endzeit',
        'Dauer (h)',
        'Korrigierte Dauer (h)'
      ];
      const rows = entries.map((e: any) => [
        e.projectName || e.project?.name || '',
        e.projectNumber || e.project?._id || '',
        e.description || '',
        e.startTime ? new Date(e.startTime).toLocaleString('de-DE') : '',
        e.endTime ? new Date(e.endTime).toLocaleString('de-DE') : '',
        e.duration ? (e.duration / 3600).toFixed(2) : '',
        e.correctedDuration ? (e.correctedDuration / 3600).toFixed(2) : ''
      ]);
      const csvContent = [header, ...rows]
        .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'zeiteintraege.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Fehler beim Export: ' + (err instanceof Error ? err.message : 'Unbekannter Fehler'));
    }
  };

  // PDF-Export-Handler
  const handleExportPDF = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/time-entries`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const entries = response.data;
      if (!Array.isArray(entries) || entries.length === 0) {
        alert('Keine Zeiteinträge zum Exportieren gefunden.');
        return;
      }
      const doc = new jsPDF();
      doc.text('Zeiteinträge', 14, 16);
      autoTable(doc, {
        startY: 22,
        head: [[
          'Projektname',
          'Projektnummer',
          'Beschreibung',
          'Startzeit',
          'Endzeit',
          'Dauer (h)',
          'Korrigierte Dauer (h)'
        ]],
        body: entries.map((e: any) => [
          e.projectName || e.project?.name || '',
          e.projectNumber || e.project?._id || '',
          e.description || '',
          e.startTime ? new Date(e.startTime).toLocaleString('de-DE') : '',
          e.endTime ? new Date(e.endTime).toLocaleString('de-DE') : '',
          e.duration ? (e.duration / 3600).toFixed(2) : '',
          e.correctedDuration ? (e.correctedDuration / 3600).toFixed(2) : ''
        ]),
        styles: { fontSize: 9 },
        headStyles: { fillColor: [33, 150, 243] },
      });
      doc.save('zeiteintraege.pdf');
    } catch (err) {
      alert('Fehler beim PDF-Export: ' + (err instanceof Error ? err.message : 'Unbekannter Fehler'));
    }
  };

  // Excel-Export-Handler
  const handleExportExcel = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/time-entries`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const entries = response.data;
      if (!Array.isArray(entries) || entries.length === 0) {
        alert('Keine Zeiteinträge zum Exportieren gefunden.');
        return;
      }
      const wsData = [
        [
          'Projektname',
          'Projektnummer',
          'Beschreibung',
          'Startzeit',
          'Endzeit',
          'Dauer (h)',
          'Korrigierte Dauer (h)'
        ],
        ...entries.map((e: any) => [
          e.projectName || e.project?.name || '',
          e.projectNumber || e.project?._id || '',
          e.description || '',
          e.startTime ? new Date(e.startTime).toLocaleString('de-DE') : '',
          e.endTime ? new Date(e.endTime).toLocaleString('de-DE') : '',
          e.duration ? (e.duration / 3600).toFixed(2) : '',
          e.correctedDuration ? (e.correctedDuration / 3600).toFixed(2) : ''
        ])
      ];
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      XLSX.utils.book_append_sheet(wb, ws, 'Zeiteinträge');
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
      saveAs(blob, 'zeiteintraege.xlsx');
    } catch (err) {
      alert('Fehler beim Excel-Export: ' + (err instanceof Error ? err.message : 'Unbekannter Fehler'));
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: { xs: 7, sm: 8 }, mb: 4 }}>
      <Stack spacing={3}>
        <Typography align="center" sx={{ mb: 4, color: 'text.secondary' }}>
          Wähle das gewünschte Format für den Export deiner Zeiteinträge.
        </Typography>
        <Stack spacing={2} direction={isMobile ? 'column' : { xs: 'column', sm: 'row' }} justifyContent="center" alignItems={isMobile ? 'center' : 'flex-start'}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<PictureAsPdfIcon />}
            onClick={handleExportPDF}
            sx={{ minWidth: 120, borderRadius: 2 }}
          >
            PDF
          </Button>
          <Button
            variant="contained"
            color="success"
            startIcon={<TableChartIcon />}
            onClick={handleExportExcel}
            sx={{ minWidth: 120, borderRadius: 2 }}
          >
            Excel
          </Button>
          <Button
            variant="contained"
            color="info"
            startIcon={<FileDownloadIcon />}
            onClick={handleExportCSV}
            sx={{ minWidth: 120, borderRadius: 2 }}
          >
            CSV
          </Button>
        </Stack>
      </Stack>
    </Container>
  );
};

export default Export; 