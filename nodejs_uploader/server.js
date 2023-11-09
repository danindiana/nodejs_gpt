const express = require('express');
const multer = require('multer');
const path = require('path');
const app = express();

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Configure multer to handle file uploads
const upload = multer({ dest: 'uploads/' });

app.post('/upload', upload.array('files'), (req, res) => {
  // Handle the uploaded files here.
  // No need for progress event listener; this is handled on the client side.
  res.status(200).send('Files uploaded successfully!');
});

// Route to serve the index.html file
app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(3000, () => console.log('Server started on http://localhost:3000'));
