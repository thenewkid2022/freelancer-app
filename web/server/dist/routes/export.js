"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const TimeEntry_1 = require("../models/TimeEntry");
const errors_1 = require("../utils/errors");
const mongoose_1 = require("mongoose");
const router = (0, express_1.Router)();
// Hilfsfunktion für CSV-Export
function toCSV(rows, columns) {
    const escape = (val) => {
        if (val == null)
            return '';
        const str = String(val).replace(/"/g, '""');
        if (str.search(/[",\n]/g) >= 0) {
            return `"${str}"`;
        }
        return str;
    };
    const header = columns.join(',');
    const data = rows.map(row => columns.map(col => escape(row[col])).join(','));
    return [header, ...data].join('\n');
}
/**
 * @swagger
 * /api/export/merged:
 *   get:
 *     tags: [Export]
 *     summary: Exportiert zusammengeführte Zeiteinträge als CSV
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Startdatum im Format YYYY-MM-DD (lokale Zeit)
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Enddatum im Format YYYY-MM-DD (lokale Zeit)
 *     responses:
 *       200:
 *         description: CSV-Datei mit zusammengeführten Zeiteinträgen
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *       400:
 *         description: Fehlende oder ungültige Parameter
 *       401:
 *         description: Nicht authentifiziert
 */
router.get('/merged', auth_1.auth, async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;
        if (!startDate || !endDate) {
            throw new errors_1.BadRequestError('startDate und endDate sind erforderlich');
        }
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            throw new errors_1.BadRequestError('Ungültiges Datumsformat');
        }
        // Aggregation wie bei /api/time-entries/merged
        const mergedEntries = await TimeEntry_1.TimeEntry.aggregate([
            {
                $match: {
                    userId: new mongoose_1.Types.ObjectId(req.user._id),
                },
            },
            {
                $group: {
                    _id: {
                        projectNumber: "$projectNumber",
                        date: {
                            $dateToString: {
                                format: "%Y-%m-%d",
                                date: "$startTime",
                                timezone: "Europe/Zurich",
                            },
                        },
                    },
                    totalDuration: { $sum: "$duration" },
                    comments: { $push: "$description" },
                    entryIds: { $push: "$_id" },
                },
            },
            {
                $match: {
                    "_id.date": { $gte: startDate, $lte: endDate },
                },
            },
            {
                $sort: { "_id.date": 1, "_id.projectNumber": 1 },
            },
        ]);
        // CSV-Zeilen vorbereiten
        const rows = mergedEntries.map(entry => ({
            date: entry._id.date,
            project: entry._id.projectNumber,
            totalDuration: entry.totalDuration,
            comments: entry.comments.filter(Boolean).join(' | '),
            entryIds: entry.entryIds.join(','),
        }));
        const columns = ['date', 'project', 'totalDuration', 'comments', 'entryIds'];
        const csv = toCSV(rows, columns);
        res.header('Content-Type', 'text/csv');
        res.attachment('merged-time-entries.csv');
        res.send(csv);
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
