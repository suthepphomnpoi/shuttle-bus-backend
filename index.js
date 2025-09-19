
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const db = require('./database/connection');

const authRoutes = require('./routes/auth.route.js');
const employeeAuthRoutes = require('./routes/employee-auth.route.js');


const app = express();
const port = process.env.PORT || 3000;

app.use(cors({ origin: "*", credentials: true }));

app.use(express.json());
app.use(cookieParser());




app.use('/auth/users/', authRoutes);
app.use('/auth/employees/', employeeAuthRoutes);


app.use((err, req, res, next) => {
    const status = err.status || 500;
    res.status(status).json({ error: err.message || 'Internal Server Error' });
});


db.initPool().catch((err) => {
    console.error('DB pool init failed (server will still run):', err.message);
});

app.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
});
