require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const path = require('path');
const { getPool } = require('./config/db');

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || '*', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/auth',     require('./routes/auth'));
app.use('/api/users',    require('./routes/users'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders',   require('./routes/orders'));
app.use('/api/customers',require('./routes/customers'));
app.use('/api/reports',  require('./routes/reports'));
app.use('/api/settings', require('./routes/settings'));
app.get('/api/health',   (req, res) => res.json({ status: 'ok', db: 'mssql' }));

const PORT = process.env.PORT || 5001;

getPool()
  .then(() => app.listen(PORT, () => console.log(`POS MSSQL Server running on port ${PORT}`)))
  .catch(err => { console.error('DB connection failed:', err.message); process.exit(1); });
