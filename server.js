// server.js - Node.js Backend Server for Earthquake Dialysis System
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dialysis_system';

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Patient Schema
const patientSchema = new mongoose.Schema({
    patientId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    age: { type: Number, required: true },
    medicalHistory: { type: String },
    emergencyContact: {
        name: String,
        phone: String,
        relationship: String
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Session Schema
const sessionSchema = new mongoose.Schema({
    sessionId: { type: String, unique: true },
    patientId: { type: String, required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date },
    status: { 
        type: String, 
        enum: ['active', 'completed', 'emergency_stopped', 'interrupted'], 
        default: 'active' 
    },
    totalDuration: { type: Number }, // in minutes
    dialysisProgress: { type: Number }, // percentage
    emergencyEvents: [{ 
        timestamp: Date,
        type: String,
        magnitude: Number,
        response: String
    }],
    createdAt: { type: Date, default: Date.now }
});

// Real-time Readings Schema
const readingSchema = new mongoose.Schema({
    sessionId: { type: String, required: true },
    timestamp: { type: Date, required: true },
    vitalSigns: {
        heartRate: Number,
        bloodPressure: String,
        dialysisProgress: Number
    },
    fluidManagement: {
        flowRate: Number,
        pressureDrop: Number,
        ultrafiltration: Number,
        fluidRemoved: Number
    },
    stabilization: {
        gyroStatus: String,
        dampening: Number,
        platformTilt: Number,
        emergencyLocks: String
    },
    environmental: {
        temperature: Number,
        humidity: Number,
        powerSupply: String,
        backupBattery: String
    },
    seismic: {
        magnitude: Number,
        pWaveStatus: String,
        lastEvent: String
    }
});

// Report Schema
const reportSchema = new mongoose.Schema({
    reportId: { type: String, unique: true },
    patientId: { type: String, required: true },
    sessionId: { type: String, required: true },
    timestamp: { type: Date, required: true },
    sessionDuration: String,
    dialysisProgress: String,
    avgHeartRate: String,
    avgBloodPressure: String,
    fluidRemoved: String,
    seismicEvents: String,
    emergencyIncidents: [String],
    recommendations: String,
    createdAt: { type: Date, default: Date.now }
});

// Create Models
const Patient = mongoose.model('Patient', patientSchema);
const Session = mongoose.model('Session', sessionSchema);
const Reading = mongoose.model('Reading', readingSchema);
const Report = mongoose.model('Report', reportSchema);

// API Routes
// Serve static files (index.html and others)
app.use(express.static(path.join(__dirname)));

// Serve modern-dashboard.html for root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'modern-dashboard.html'));
});
// Basic /api endpoint
app.get('/api', (req, res) => {
    res.json({ message: 'API is working' });
});
// Get all patients
app.get('/api/patients', async (req, res) => {
    try {
        const patients = await Patient.find();
        res.json(patients);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch patients' });
    }
});

// Add a new patient
app.post('/api/patients', async (req, res) => {
    try {
        const patient = new Patient(req.body);
        await patient.save();
        res.status(201).json(patient);
    } catch (err) {
        res.status(400).json({ error: 'Failed to add patient', details: err.message });
    }
});

// Create new patient
app.post('/api/patients', async (req, res) => {
    try {
        const patient = new Patient(req.body);
        await patient.save();
        res.status(201).json(patient);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Get patient by ID
app.get('/api/patients/:patientId', async (req, res) => {
    try {
        const patient = await Patient.findOne({ patientId: req.params.patientId });
        if (!patient) {
            return res.status(404).json({ error: 'Patient not found' });
        }
        res.json(patient);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create new session
app.post('/api/sessions', async (req, res) => {
    try {
        const sessionId = `SES_${Date.now()}_${req.body.patientId}`;
        const session = new Session({
            ...req.body,
            sessionId: sessionId
        });
        await session.save();
        res.status(201).json(session);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Update session status
app.patch('/api/sessions/:sessionId', async (req, res) => {
    try {
        const session = await Session.findOneAndUpdate(
            { sessionId: req.params.sessionId },
            { 
                ...req.body, 
                updatedAt: new Date() 
            },
            { new: true }
        );
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }
        res.json(session);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Save real-time readings
app.post('/api/readings', async (req, res) => {
    try {
        const reading = new Reading(req.body);
        await reading.save();
        
        // Also update the session with latest progress
        if (req.body.vitalSigns && req.body.vitalSigns.dialysisProgress) {
            await Session.findOneAndUpdate(
                { sessionId: req.body.sessionId },
                { dialysisProgress: req.body.vitalSigns.dialysisProgress }
            );
        }
        
        res.status(201).json({ success: true, readingId: reading._id });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Get readings for a session
app.get('/api/readings/:sessionId', async (req, res) => {
    try {
        const { limit = 100, startTime, endTime } = req.query;
        let query = { sessionId: req.params.sessionId };
        
        if (startTime || endTime) {
            query.timestamp = {};
            if (startTime) query.timestamp.$gte = new Date(startTime);
            if (endTime) query.timestamp.$lte = new Date(endTime);
        }
        
        const readings = await Reading.find(query)
            .sort({ timestamp: -1 })
            .limit(parseInt(limit));
            
        res.json(readings);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Save treatment report
app.post('/api/reports', async (req, res) => {
    try {
        const reportId = `RPT_${Date.now()}_${req.body.patientId}`;
        const report = new Report({
            ...req.body,
            reportId: reportId,
            timestamp: new Date(req.body.timestamp)
        });
        await report.save();
        res.status(201).json(report);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Get patient's session history
app.get('/api/patients/:patientId/sessions', async (req, res) => {
    try {
        const sessions = await Session.find({ patientId: req.params.patientId })
            .sort({ startTime: -1 });
        res.json(sessions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Emergency event logging
app.post('/api/emergency', async (req, res) => {
    try {
        const { sessionId, type, magnitude, response } = req.body;
        
        const session = await Session.findOneAndUpdate(
            { sessionId: sessionId },
            { 
                $push: { 
                    emergencyEvents: {
                        timestamp: new Date(),
                        type,
                        magnitude,
                        response
                    }
                }
            },
            { new: true }
        );
        
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }
        
        res.json({ success: true, session });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Analytics endpoints
app.get('/api/analytics/patient/:patientId', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const dateFilter = {};
        if (startDate) dateFilter.$gte = new Date(startDate);
        if (endDate) dateFilter.$lte = new Date(endDate);
        
        const pipeline = [
            {
                $match: { 
                    patientId: req.params.patientId,
                    ...(Object.keys(dateFilter).length > 0 && { timestamp: dateFilter })
                }
            },
            {
                $group: {
                    _id: null,
                    avgHeartRate: { $avg: '$vitalSigns.heartRate' },
                    avgDialysisProgress: { $avg: '$vitalSigns.dialysisProgress' },
                    avgFlowRate: { $avg: '$fluidManagement.flowRate' },
                    totalReadings: { $sum: 1 },
                    maxSeismicActivity: { $max: '$seismic.magnitude' }
                }
            }
        ];
        
        const analytics = await Reading.aggregate(pipeline);
        res.json(analytics[0] || {});
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date(),
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Server Error:', error);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Earthquake Dialysis System API server running on port ${PORT}`);
    console.log(`📊 MongoDB URI: ${MONGODB_URI}`);
    console.log(`🏥 API endpoints available at http://localhost:${PORT}/api`);
});

module.exports = app;