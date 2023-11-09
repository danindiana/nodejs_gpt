const Crawler = require('crawler');
const readline = require('readline');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to start the crawler
function startCrawling(url, maxDepth) {
  const c = new Crawler({
    maxConnections: 10,
    // This will be called for each crawled page
    callback: function (error, res, done) {
      if (error) {
        console.error(error);
      } else {
        // Check if $ is available before trying to use it
        if (res.$) {
          const $ = res.$;
          console.log(`Grabbed ${res.body.length} bytes from ${res.options.uri}`);
          $('a').each(function (index, a) {
            const toQueueUrl = $(a).attr('href');
            if (toQueueUrl) {
              // Resolve relative URLs and filter out non-HTTP(S) protocols
              const absoluteUrl = new URL(toQueueUrl, res.options.uri).href;
              if (absoluteUrl.startsWith('http') && new URL(absoluteUrl).origin === new URL(res.options.uri).origin) {
                c.queue({
                  uri: absoluteUrl,
                  depth: res.options.depth + 1
                });
              }
            }
          });
        } else {
          console.log(`The content of ${res.options.uri} is not HTML.`);
        }
      }
      done();
    }
  });

  // Queue just one URL, with a custom depth variable
  c.queue({
    uri: url,
    depth: 0
  });

  c.on('drain', function () {
    console.log('Finished crawling');
  });

  // Pre-request callback to control the depth
  c.preRequest = function (options, done) {
    if (options.depth > maxDepth) {
      console.log(`Reached max depth of ${maxDepth} at ${options.uri}`);
      return done();
    }
    done();
  };
}

// Prompt the user for the initial URL and max depth
rl.question('Enter the initial URL to crawl: ', function (url) {
  rl.question('Enter the maximum depth to crawl: ', function (depth) {
    startCrawling(url, parseInt(depth, 10));
    rl.close();
  });
});
