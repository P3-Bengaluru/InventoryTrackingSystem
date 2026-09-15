const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const { checkConnection } = require('./models/db');
const { errorHandler } = require('./middleware/errorHandler');
const { startCronJobs } = require('./utils/cron');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const assetRoutes = require('./routes/assets');
const assignmentRoutes = require('./routes/assignments');
const reallocationRoutes = require('./routes/reallocations');
const procurementRoutes = require('./routes/procurement');
const activityLogRoutes = require('./routes/activity-logs');
const categoryRoutes = require('./routes/categories');
const locationRoutes = require('./routes/locations');
const supplierRoutes = require('./routes/suppliers');
const customerRoutes = require('./routes/customers');
const reportRoutes = require('./routes/reports');
const notificationRoutes = require('./routes/notifications');
const dashboardRoutes = require('./routes/dashboard');
const settingsRoutes = require('./routes/settings');
const publicRoutes = require('./routes/public');

const app = express();

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Client-Info', 'Apikey'],
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('combined'));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api/', apiLimiter);

const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests to public endpoint.' },
});
app.use('/public/', publicLimiter);

app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/reallocations', reallocationRoutes);
app.use('/api/procurement', procurementRoutes);
app.use('/api/activity-logs', activityLogRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/public', publicRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 3001;

checkConnection().then(() => {
  app.listen(PORT, () => {
    console.log(`[Server] Running on port ${PORT}`);
    startCronJobs();
  });
});

module.exports = app;
