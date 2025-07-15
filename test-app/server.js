const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

// Serve static files
app.use(express.static('public'));

// Serve js-exec package from parent directory
app.use('/js-exec', express.static(path.join(__dirname, '../js-exec/dist')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Test app running at http://localhost:${PORT}`);
});