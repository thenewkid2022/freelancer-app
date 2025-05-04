import React from 'react';
import { Container, Paper, Typography, Stack, Button } from '@mui/material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import TableChartIcon from '@mui/icons-material/TableChart';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const API_URL = process.env.REACT_APP_API_URL;

const Export: React.FC = () => {
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
        'Dauer (Sekunden)',
        'Korrigierte Dauer (Sekunden)'
      ];
      const rows = entries.map((e: any) => [
        e.projectName || e.project?.name || '',
        e.projectNumber || e.project?._id || '',
        e.description || '',
        e.startTime ? new Date(e.startTime).toLocaleString('de-DE') : '',
        e.endTime ? new Date(e.endTime).toLocaleString('de-DE') : '',
        e.duration || '',
        e.correctedDuration ?? ''
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
          'Dauer (Sekunden)',
          'Korrigierte Dauer (Sekunden)'
        ]],
        body: entries.map((e: any) => [
          e.projectName || e.project?.name || '',
          e.projectNumber || e.project?._id || '',
          e.description || '',
          e.startTime ? new Date(e.startTime).toLocaleString('de-DE') : '',
          e.endTime ? new Date(e.endTime).toLocaleString('de-DE') : '',
          e.duration || '',
          e.correctedDuration ?? ''
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
          'Dauer (Sekunden)',
          'Korrigierte Dauer (Sekunden)'
        ],
        ...entries.map((e: any) => [
          e.projectName || e.project?.name || '',
          e.projectNumber || e.project?._id || '',
          e.description || '',
          e.startTime ? new Date(e.startTime).toLocaleString('de-DE') : '',
          e.endTime ? new Date(e.endTime).toLocaleString('de-DE') : '',
          e.duration || '',
          e.correctedDuration ?? ''
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
      </Paper>
    </Container>
  );
};

export default Export; 