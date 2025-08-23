import React from 'react';
import { Container, Typography, Stack, Button, useTheme, useMediaQuery, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
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
import { useTranslation } from 'react-i18next';

const API_URL = process.env.REACT_APP_API_URL;

interface MergedEntry {
  project: { _id: string };
  date: string;
  totalDuration: number;
  comments: string[];
  entryIds: string[];
}

const Export: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { t } = useTranslation();

  // Zeitfenster-Dialog
  const [dialogOpen, setDialogOpen] = React.useState(false);
  // Standard: aktueller Monat
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const [startDate, setStartDate] = React.useState<string>(format(firstDay, 'yyyy-MM-dd'));
  const [endDate, setEndDate] = React.useState<string>(format(lastDay, 'yyyy-MM-dd'));
  const [exportRange, setExportRange] = React.useState<{start: string, end: string} | null>(null);
  const [pendingExport, setPendingExport] = React.useState<'pdf' | 'excel' | 'csv' | null>(null);
  const [shouldExportNow, setShouldExportNow] = React.useState(false);

  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Query für gemergte Einträge im gewählten Zeitfenster
  const { data: mergedEntries = [] } = useQuery({
    queryKey: ['mergedTimeEntries', exportRange, userTimeZone],
    queryFn: async () => {
      if (!exportRange) return [];
      const token = localStorage.getItem('token');
      const response = await axios.get<MergedEntry[]>(`${API_URL}/time-entries/merged`, {
        params: { startDate: exportRange.start, endDate: exportRange.end, timezone: userTimeZone },
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      return response.data;
    },
    enabled: !!exportRange,
  });

  // Handler für PDF-Export
  const handleExportPDF = () => {
    setPendingExport('pdf');
    setDialogOpen(true);
  };

  // Handler für Excel-Export
  const handleExportExcel = () => {
    if (!exportRange) {
      setPendingExport('excel');
      setDialogOpen(true);
      return;
    }
    doExportExcel();
  };

  // Handler für CSV-Export
  const handleExportCSV = () => {
    if (!exportRange) {
      setPendingExport('csv');
      setDialogOpen(true);
      return;
    }
    doExportCSV();
  };

  // Funktion für den eigentlichen Excel-Export
  const doExportExcel = () => {
    if (!mergedEntries || mergedEntries.length === 0) {
      alert(t('export.noEntriesFound'));
      return;
    }
    const sortedEntries = [...mergedEntries].sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateA.getTime() - dateB.getTime();
    });
    const wsData = [
      [
        'Projektnummer',
        'Datum',
        'Startzeit',
        'Endzeit',
        'Kommentare',
        'Dauer [min]',
        'Korrigiert [min]'
      ],
      ...sortedEntries.map((e: any) => [
        e.projectNumber || e.project?._id || '',
        e.date ? new Date(e.date).toLocaleDateString('de-CH') : '',
        e.startTime ? new Date(e.startTime).toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' }) : '',
        e.endTime ? new Date(e.endTime).toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' }) : '',
        e.comments && e.comments.length > 0
          ? e.comments.map((c: string, i: number) => `${i + 1}. ${c}`).join('\n')
          : '',
        Math.round(e.totalDuration / 60).toString(),
        e.correctedDuration ? Math.round(e.correctedDuration / 60).toString() : ''
      ])
    ];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, 'Zeiteinträge');
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(blob, 'zeiteintraege.xlsx');
  };

  // Funktion für den eigentlichen CSV-Export
  const doExportCSV = () => {
    if (!mergedEntries || mergedEntries.length === 0) {
      alert(t('export.noEntriesFound'));
      return;
    }
    const sortedEntries = [...mergedEntries].sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateA.getTime() - dateB.getTime();
    });
    const header = [
      'Projektnummer',
      'Datum',
      'Startzeit',
      'Endzeit',
      'Kommentare',
      'Dauer [min]',
      'Korrigiert [min]'
    ];
    const rows = sortedEntries.map((e: any) => [
      e.projectNumber || e.project?._id || '',
      e.date ? new Date(e.date).toLocaleDateString('de-CH') : '',
      e.startTime ? new Date(e.startTime).toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' }) : '',
      e.endTime ? new Date(e.endTime).toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' }) : '',
      e.comments && e.comments.length > 0
        ? e.comments.map((c: string, i: number) => `${i + 1}. ${c}`).join('\n')
        : '',
      Math.round(e.totalDuration / 60).toString(),
      e.correctedDuration ? Math.round(e.correctedDuration / 60).toString() : ''
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
  };

  // Nach Dialog-Bestätigung: Export starten
  const handleDialogExport = async () => {
    setDialogOpen(false);
    setExportRange({
      start: format(new Date(startDate), 'yyyy-MM-dd'),
      end: format(new Date(endDate), 'yyyy-MM-dd'),
    });
    setShouldExportNow(true);
  };

  // useEffect für den Export nach Zeitraum-Auswahl
  React.useEffect(() => {
    if (shouldExportNow && pendingExport) {
      if (mergedEntries && mergedEntries.length > 0) {
        if (pendingExport === 'pdf') {
          // ... PDF-Export wie gehabt ...
          const sortedEntries = [...mergedEntries].sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return dateA.getTime() - dateB.getTime();
          });
          const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(20);
          doc.setTextColor(33, 150, 243);
          doc.text('Rapporteinträge', 148, 18, { align: 'center' });
          doc.setFontSize(11);
          doc.setTextColor(80, 80, 80);
          doc.text(`Exportiert am: ${new Date().toLocaleDateString('de-CH')} ${new Date().toLocaleTimeString('de-CH')}`, 148, 26, { align: 'center' });
          const head = [[
            'Projektnummer',
            'Datum',
            'Startzeit',
            'Endzeit',
            'Kommentare',
            'Dauer [min]',
            'Korrigiert [min]'
          ]];
          const body = sortedEntries.map((e: any) => [
            e.projectNumber || e.project?._id || '',
            e.date ? new Date(e.date).toLocaleDateString('de-CH') : '',
            e.startTime ? new Date(e.startTime).toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' }) : '',
            e.endTime ? new Date(e.endTime).toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' }) : '',
            e.comments && e.comments.length > 0
              ? e.comments.map((c: string, i: number) => `${i + 1}. ${c}`).join('\n')
              : '',
            Math.round(e.totalDuration / 60).toString(),
            e.correctedDuration ? Math.round(e.correctedDuration / 60).toString() : ''
          ]);
          autoTable(doc, {
            startY: 38,
            head,
            body,
            columnStyles: {
              0: { cellWidth: 32, halign: 'center' },
              1: { cellWidth: 28, halign: 'center' },
              2: { cellWidth: 24, halign: 'center' },
              3: { cellWidth: 24, halign: 'center' },
              4: { cellWidth: 80 },
              5: { cellWidth: 28, halign: 'center' },
              6: { cellWidth: 32, halign: 'center' },
            },
            styles: {
              font: 'helvetica',
              fontSize: 10,
              cellPadding: { top: 3, right: 2, bottom: 3, left: 2 },
              overflow: 'linebreak',
              valign: 'middle',
              textColor: [33, 33, 33],
            },
            headStyles: {
              fillColor: [33, 150, 243],
              textColor: 255,
              fontSize: 12,
              fontStyle: 'bold',
              halign: 'center',
              lineWidth: 0.5,
              lineColor: [33, 150, 243],
              cellPadding: { top: 4, bottom: 4 },
            },
            alternateRowStyles: { fillColor: [245, 249, 255] },
            rowPageBreak: 'avoid',
            margin: { left: 14, right: 14 },
            didParseCell: function (data) {
              if (data.section === 'body' && data.column.index === 6 && data.cell.raw && data.cell.raw !== '') {
                data.cell.styles.textColor = [255, 193, 7];
                data.cell.styles.fontStyle = 'bold';
              }
            },
            didDrawPage: (data) => {
              if (data.pageNumber === doc.getNumberOfPages()) {
                const total = mergedEntries.reduce((sum: number, e: any) => sum + (e.totalDuration || 0), 0);
                doc.setFontSize(13);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(33, 150, 243);
                doc.text(`Gesamtdauer: ${Math.round(total / 60)} Minuten`, 280, doc.internal.pageSize.getHeight() - 10, { align: 'right' });
              }
            },
          });
          doc.save('zeiteintraege.pdf');
        } else if (pendingExport === 'excel') {
          doExportExcel();
        } else if (pendingExport === 'csv') {
          doExportCSV();
        }
        setShouldExportNow(false);
        setPendingExport(null);
      } else if (mergedEntries && mergedEntries.length === 0) {
        alert(t('export.noEntriesFound'));
        setShouldExportNow(false);
        setPendingExport(null);
      }
    }
  }, [shouldExportNow, mergedEntries, pendingExport]);

  return (
    <Container maxWidth="sm" sx={{ mt: { xs: 7, sm: 8 }, mb: 4 }}>
      <Stack spacing={3}>
        <Typography align="center" sx={{ mb: 4, color: 'text.secondary' }}>
          {t('export.chooseFormat')}
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
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>{t('export.chooseTimeRange')}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label={t('export.startDate')}
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <TextField
              label={t('export.endDate')}
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>{t('export.cancel')}</Button>
          <Button onClick={handleDialogExport} variant="contained">{t('export.export')}</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Export; 