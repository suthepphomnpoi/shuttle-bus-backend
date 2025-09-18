
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.json({ message: 'Shuttle Bus API is running!' });
});

app.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
});
