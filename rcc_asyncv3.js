const Crawler = require('crawler');
const readline = require('readline');
const fs = require('fs');
const path = require('path');
const validUrl = require('valid-url'); // Import the valid-url library

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to sanitize URL for use in filename
function sanitizeUrlForFilename(url) {
  return url.replace(/[^a-zA-Z0-9]/g, '_');
}

// Set to store visited URLs
const visitedUrls = new Set();

// Function to start the crawler
async function startCrawling(url, maxDepth) {
  // Validate the URL before proceeding
  if (!validUrl.isWebUri(url)) {
    console.error('Invalid URL format');
    rl.close();
    return;
  }

  // Generate a unique filename for the output
  const timestamp = new Date().toISOString().replace(/[^0-9]/g, '');
  const sanitizedUrl = sanitizeUrlForFilename(url);
  const outputFilename = `crawl_${sanitizedUrl}_${timestamp}.txt`;
  const outputFilePath = path.join(__dirname, outputFilename);

  const crawl = async (url, depth, c) => {
    // Check if the URL has already been visited
    if (visitedUrls.has(url)) {
      return Promise.resolve();
    }

    // Mark the URL as visited
    visitedUrls.add(url);

    return new Promise((resolve) => {
      c.queue({
        uri: url,
        depth: depth,
        callback: (error, res, done) => {
          if (error) {
            console.error(error);
          } else {
            // Check if $ is available before trying to use it
            if (res.$) {
              const $ = res.$;
              const result = `Grabbed ${res.body.length} bytes from ${res.options.uri}\n`;
              // Append the result to the output file
              fs.appendFileSync(outputFilePath, result);

              // Output the result to the terminal
              console.log(result.trim());

              $('a').each(function (index, a) {
                const toQueueUrl = $(a).attr('href');
                if (toQueueUrl) {
                  try {
                    // Ensure the URL is absolute and encode it to handle any special characters
                    const absoluteUrl = new URL(encodeURI(toQueueUrl), res.options.uri).href;
                    if (
                      absoluteUrl.startsWith('http') &&
                      new URL(absoluteUrl).origin === new URL(res.options.uri).origin &&
                      depth < maxDepth
                    ) {
                      crawl(absoluteUrl, depth + 1, c).then(() => done());
                    }
                  } catch (e) {
                    console.error(`Error processing URL: ${toQueueUrl}`, e.message);
                  }
                }
              });

            } else {
              const nonHtmlResult = `The content of ${res.options.uri} is not HTML.\n`;
              // Append the result to the output file
              fs.appendFileSync(outputFilePath, nonHtmlResult);

              // Output the result to the terminal
              console.log(nonHtmlResult.trim());
            }
          }
          done();
          resolve();
        },
      });
    });
  };

  const c = new Crawler({ maxConnections: 6 });
  await crawl(url, 0, c);

  c.on('drain', function () {
    console.log(`Finished crawling. Results saved to ${outputFilename}`);
  });
}

// Prompt the user for the initial URL and max depth
rl.question('Enter the initial URL to crawl: ', function (url) {
  rl.question('Enter the maximum depth to crawl: ', function (depth) {
    startCrawling(url, parseInt(depth, 10)).then(() => rl.close());
  });
});
