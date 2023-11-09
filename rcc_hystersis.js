const Crawler = require('crawler');
const readline = require('readline');
const fs = require('fs');
const path = require('path');
const validUrl = require('valid-url');

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

// Hysteresis variables
let errorCount = 0;
let lastErrorTime = Date.now();
const errorThreshold = 5; // Number of errors to trigger slowing down
const errorTimeWindow = 30000; // Time window in milliseconds to track errors
const minConnections = 1; // Minimum number of connections
const maxConnections = 20; // Maximum number of connections
let currentConnections = 5; // Start with a moderate number of connections

// Function to adjust the rate of requests based on error rate
function adjustCrawlerRate() {
  const currentTime = Date.now();
  if (currentTime - lastErrorTime < errorTimeWindow && errorCount >= errorThreshold) {
    // Too many errors in a short time, slow down
    currentConnections = Math.max(minConnections, currentConnections / 2);
    errorCount = 0; // Reset error count after adjustment
  } else if (currentTime - lastErrorTime >= errorTimeWindow && currentConnections < maxConnections) {
    // No recent errors, speed up
    currentConnections = Math.min(maxConnections, currentConnections * 2);
  }
  lastErrorTime = currentTime; // Update the last error time
}

// Function to start the crawler
async function startCrawling(url, maxDepth) {
  if (!validUrl.isWebUri(url)) {
    console.error('Invalid URL format');
    rl.close();
    return;
  }

  const timestamp = new Date().toISOString().replace(/[^0-9]/g, '');
  const sanitizedUrl = sanitizeUrlForFilename(url);
  const outputFilename = `crawl_${sanitizedUrl}_${timestamp}.txt`;
  const outputFilePath = path.join(__dirname, outputFilename);

  const c = new Crawler({
    maxConnections: currentConnections,
    // Other options...
  });

  const retryCrawl = async (url, depth, retries = 3) => {
    if (retries === 0) {
      console.error(`Max retries reached for ${url}`);
      return;
    }

    try {
      await crawl(url, depth);
    } catch (error) {
      console.error(`Error crawling ${url}: ${error.message}. Retrying in ${Math.pow(2, 3 - retries)} seconds...`);
      setTimeout(() => {
        retryCrawl(url, depth, retries - 1);
      }, Math.pow(2, 3 - retries) * 1000);
    }
  };

  const crawl = async (url, depth) => {
    if (visitedUrls.has(url)) {
      return Promise.resolve();
    }

    visitedUrls.add(url);

    return new Promise((resolve) => {
      c.queue({
        uri: url,
        depth: depth,
        callback: (error, res, done) => {
          if (error) {
            console.error(error);
            if (error.code === 'ECONNRESET') {
              errorCount++;
              adjustCrawlerRate();
              c.setMaxConnections(currentConnections);
            }
            retryCrawl(url, depth).then(() => done());
            return;
          }

          if (res.$) {
                      const $ = res.$;
                      const result = `Grabbed ${res.body.length} bytes from ${res.options.uri}\n`;
                      fs.appendFileSync(outputFilePath, result);
                      console.log(result.trim());

                      $('a').each(function (index, a) {
                        const toQueueUrl = $(a).attr('href');
                        if (toQueueUrl) {
                          try {
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
                      fs.appendFileSync(outputFilePath, nonHtmlResult);
                      console.log(nonHtmlResult.trim());
                    }
                    done();
                    resolve();
                  },
      });
    });
  };

  await retryCrawl(url, 0);
  c.on('drain', () => {
    console.log(`Finished crawling. Results saved to ${outputFilename}`);
  });
}

rl.question('Enter the initial URL to crawl: ', function (url) {
  rl.question('Enter the maximum depth to crawl: ', function (depth) {
    startCrawling(url, parseInt(depth, 10)).then(() => rl.close());
  });
});
