#!/bin/bash

# Create a project directory
mkdir large-file-upload-demo
cd large-file-upload-demo

# Initialize a Node.js project
npm init -y

# Install Express.js for creating a web server
npm install express

# Create a server.js file with the provided JavaScript code
cat <<EOL > server.js
const express = require('express');
const app = express();
const port = 3000;

app.use(express.static('public'));

app.listen(port, () => {
  console.log(\`Server is running on port \${port}\`);
});
EOL

# Create a public directory
mkdir public

# Create an index.html file with the provided JavaScript code
cat <<EOL > public/index.html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Large File Upload Demo</title>
</head>
<body>
  <h1>Large File Upload Demo</h1>
  <input type="file" id="fileInput">
  <button id="uploadButton">Upload File</button>
  <progress id="progressBar" max="100" value="0"></progress>
  <div id="status"></div>

  <script>
    const fileInput = document.getElementById('fileInput');
    const uploadButton = document.getElementById('uploadButton');
    const progressBar = document.getElementById('progressBar');
    const status = document.getElementById('status');

    uploadButton.addEventListener('click', () => {
      const file = fileInput.files[0];
      if (file) {
        const formData = new FormData();
        formData.append('file', file);

        fetch('/upload', {
          method: 'POST',
          body: formData,
        })
        .then(response => response.json())
        .then(data => {
          status.innerHTML = data.message;
        })
        .catch(error => {
          status.innerHTML = 'An error occurred.';
          console.error(error);
        });
      } else {
        status.innerHTML = 'Please select a file.';
      }
    });
  </script>
</body>
</html>
EOL

# Create a public/uploads directory to store uploaded files
mkdir public/uploads

# Create an uploads directory in the project root to store uploaded files temporarily
mkdir uploads

# Create a .gitignore file to exclude node_modules and uploaded files from version control
cat <<EOL > .gitignore
node_modules/
uploads/
EOL

# Install nodemon for automatic server restarts during development (optional)
npm install nodemon --save-dev

# Provide instructions to start the server
echo "Project setup complete. To start the server, run:"
echo "npm start"
