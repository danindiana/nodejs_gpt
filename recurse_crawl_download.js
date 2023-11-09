const fs = require('fs');
const path = require('path');

// ... rest of the code ...

callback: function (error, res, done) {
  if (error) {
    console.error(error);
  } else {
    const uri = res.options.uri;
    console.log(`Grabbed from ${uri}`);

    // Check if the response is HTML, and if so, save it
    if (res.headers['content-type'] && res.headers['content-type'].includes('text/html')) {
      const filename = uri.replace(/[^a-zA-Z0-9]/g, '_') + '.html'; // Create a safe filename from the URL
      const filePath = path.join(__dirname, 'downloaded', filename); // Specify the path where files will be saved

      // Ensure the download directory exists
      const downloadDir = path.join(__dirname, 'downloaded');
      if (!fs.existsSync(downloadDir)) {
        fs.mkdirSync(downloadDir, { recursive: true });
      }

      // Write the body to file
      fs.writeFile(filePath, res.body, function(err) {
        if (err) {
          console.error(`Error saving ${uri} to ${filePath}: ${err.message}`);
        } else {
          console.log(`Saved ${uri} to ${filePath}`);
        }
      });
    }

    // ... rest of the existing callback code ...
  }
  done();
}

// ... rest of the code ...
