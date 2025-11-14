# Node.js GPT - Web Crawler & File Upload Suite

A comprehensive Node.js project featuring multiple web crawler implementations with progressive enhancements and a file upload server with progress tracking.

## Table of Contents

- [Repository Structure](#repository-structure)
- [Web Crawler Architecture](#web-crawler-architecture)
- [Crawler Evolution](#crawler-evolution)
- [File Upload Server](#file-upload-server)
- [Data Flow](#data-flow)
- [Git Workflow](#git-workflow)
- [Installation](#installation)
- [Usage](#usage)
- [Code Review & Improvements](#code-review--improvements)

## Repository Structure

```mermaid
graph TD
    A[nodejs_gpt Repository] --> B[Web Crawlers]
    A --> C[File Upload Server]
    A --> D[Documentation]

    B --> B1[recurse_crawler.js<br/>Basic Crawler]
    B --> B2[rcc_async.js<br/>Async + File Output]
    B --> B3[rcc_asyncv3.js<br/>+ URL Deduplication]
    B --> B4[rcc_hystersis.js<br/>+ Rate Limiting]
    B --> B5[recurse_crawl_download.js<br/>Download Fragment]

    C --> C1[server.js<br/>Express Server]
    C --> C2[index.html<br/>Upload UI]
    C --> C3[package.json<br/>Dependencies]
    C --> C4[nodeupservnabox.sh<br/>Setup Script]

    D --> D1[README.md]
    D --> D2[rcc_async_readme.txt]
    D --> D3[LICENSE]

    style A fill:#e1f5ff
    style B fill:#fff3e0
    style C fill:#f3e5f5
    style D fill:#e8f5e9
```

## Web Crawler Architecture

### Crawler Evolution Timeline

```mermaid
timeline
    title Web Crawler Evolution
    section V1 : Basic
        recurse_crawler.js : Simple recursive crawling
                           : Max connections: 10
                           : Depth-based limiting
                           : In-memory processing
    section V2 : Async
        rcc_async.js : Async/await support
                     : File output logging
                     : URL validation
                     : Timestamped results
    section V3 : Optimized
        rcc_asyncv3.js : URL deduplication
                       : Visited URLs cache
                       : Better error handling
                       : Reduced connections: 6
    section V4 : Advanced
        rcc_hystersis.js : Dynamic rate limiting
                         : Retry mechanism
                         : Error-based throttling
                         : Hysteresis control
```

### Web Crawler Flow Diagram

```mermaid
flowchart TD
    Start([User Input]) --> Validate{Valid URL?}
    Validate -->|No| Error1[Display Error<br/>Exit]
    Validate -->|Yes| Init[Initialize Crawler<br/>Create Output File]

    Init --> Queue[Queue Initial URL<br/>Depth = 0]
    Queue --> Process{Process URL}

    Process --> Visited{URL Visited?}
    Visited -->|Yes| Skip[Skip URL]
    Visited -->|No| Mark[Mark as Visited]

    Mark --> Fetch[Fetch Page Content]
    Fetch --> FetchError{Error?}

    FetchError -->|Yes| ErrorType{Error Type}
    ErrorType -->|ECONNRESET| RateLimit[Adjust Rate<br/>Increase Error Count]
    ErrorType -->|Other| Log1[Log Error]
    RateLimit --> Retry{Retries<br/>Remaining?}
    Log1 --> Retry
    Retry -->|Yes| Wait[Exponential Backoff<br/>Wait 2^n seconds]
    Retry -->|No| Skip
    Wait --> Fetch

    FetchError -->|No| ContentType{HTML<br/>Content?}
    ContentType -->|No| LogNonHTML[Log Non-HTML Content]
    ContentType -->|Yes| Parse[Parse HTML<br/>Extract Links]

    LogNonHTML --> Save1[Append to Output File]
    Parse --> Save2[Log Bytes Grabbed<br/>Append to Output File]

    Save2 --> ExtractLinks[Extract All 'a' Tags]
    ExtractLinks --> FilterLinks{For Each Link}

    FilterLinks --> CheckOrigin{Same Origin?}
    CheckOrigin -->|No| FilterNext[Next Link]
    CheckOrigin -->|Yes| CheckDepth{Depth < Max?}
    CheckDepth -->|No| FilterNext
    CheckDepth -->|Yes| QueueNew[Queue New URL<br/>Depth + 1]

    QueueNew --> FilterNext
    FilterNext --> MoreLinks{More Links?}
    MoreLinks -->|Yes| FilterLinks
    MoreLinks -->|No| Done1[Done Processing]

    Save1 --> Done1
    Skip --> Done1
    Done1 --> MoreURLs{URLs in Queue?}

    MoreURLs -->|Yes| Process
    MoreURLs -->|No| Complete[Crawl Complete<br/>Close Output File]
    Complete --> End([Exit])

    style Start fill:#a5d6a7
    style End fill:#ef9a9a
    style Error1 fill:#ef9a9a
    style Complete fill:#a5d6a7
    style RateLimit fill:#fff59d
```

### Crawler Component Architecture

```mermaid
graph LR
    subgraph "Input Layer"
        UI[Readline Interface] --> Input[User Input<br/>URL + Depth]
    end

    subgraph "Validation Layer"
        Input --> Validator[URL Validator<br/>valid-url lib]
        Validator --> Sanitizer[URL Sanitizer<br/>Filename Safe]
    end

    subgraph "Core Crawler Engine"
        Sanitizer --> CrawlerInit[Crawler Instance]
        CrawlerInit --> QueueMgr[Queue Manager]
        QueueMgr --> ConnMgr[Connection Manager<br/>maxConnections]
        ConnMgr --> RateLimiter[Rate Limiter<br/>Hysteresis Control]
        RateLimiter --> Fetcher[HTTP Fetcher]
        Fetcher --> Parser[HTML Parser<br/>Cheerio]
    end

    subgraph "State Management"
        VisitedCache[(Visited URLs<br/>Set Cache)] <--> QueueMgr
        ErrorTracker[Error Counter<br/>Time Window] <--> RateLimiter
    end

    subgraph "Output Layer"
        Parser --> FileWriter[File Writer<br/>fs.appendFileSync]
        FileWriter --> OutputFile[(Output File<br/>crawl_*.txt)]
        Parser --> Console[Console Logger]
    end

    subgraph "Retry Mechanism"
        Fetcher --> ErrorHandler{Error?}
        ErrorHandler -->|Yes| RetryLogic[Retry Logic<br/>Exponential Backoff]
        RetryLogic --> Fetcher
        ErrorHandler -->|No| Parser
    end

    style CrawlerInit fill:#bbdefb
    style QueueMgr fill:#c5cae9
    style RateLimiter fill:#fff59d
    style VisitedCache fill:#c8e6c9
    style ErrorTracker fill:#ffccbc
```

## File Upload Server

### Server Architecture

```mermaid
graph TD
    subgraph "Client Layer"
        Browser[Web Browser] --> HTML[index.html]
        HTML --> Form[File Upload Form<br/>Multiple Files]
        Form --> JS[JavaScript Handler<br/>XMLHttpRequest]
        JS --> Progress[Progress Bar<br/>Visual Feedback]
    end

    subgraph "Network Layer"
        JS -->|POST /upload| HTTP[HTTP Request<br/>FormData]
        HTTP -->|multipart/form-data| Express[Express.js Server<br/>Port 3000]
    end

    subgraph "Server Layer"
        Express --> Router[Route Handler<br/>POST /upload]
        Express --> Static[Static File Server<br/>Serve HTML/CSS/JS]
        Router --> Multer[Multer Middleware<br/>File Processing]
    end

    subgraph "Storage Layer"
        Multer --> Disk[(uploads/ Directory<br/>File Storage)]
    end

    subgraph "Response Layer"
        Multer --> Response{Success?}
        Response -->|Yes| Success[200 OK<br/>Success Message]
        Response -->|No| Fail[Error Response]
        Success --> JS
        Fail --> JS
    end

    Progress -.->|Upload Events| JS

    style Browser fill:#e1f5ff
    style Express fill:#fff3e0
    style Multer fill:#f3e5f5
    style Disk fill:#c8e6c9
    style Success fill:#a5d6a7
    style Fail fill:#ef9a9a
```

### Upload Data Flow

```mermaid
sequenceDiagram
    participant User
    participant Browser
    participant Form
    participant XHR as XMLHttpRequest
    participant Server as Express Server
    participant Multer
    participant FileSystem as File System

    User->>Browser: Select Files
    User->>Form: Click Upload
    Form->>XHR: Create FormData
    loop For Each File
        Form->>XHR: Append File to FormData
    end

    XHR->>Server: POST /upload (multipart/form-data)

    activate Server
    Server->>Multer: Process Upload
    activate Multer

    loop For Each File
        Multer->>Multer: Validate File
        Multer->>FileSystem: Write to uploads/
        FileSystem-->>Multer: Confirm Write
        Multer->>XHR: Progress Event
        XHR->>Browser: Update Progress Bar
    end

    Multer-->>Server: Files Processed
    deactivate Multer

    Server-->>XHR: 200 OK + Success Message
    deactivate Server

    XHR->>Browser: Upload Complete
    Browser->>User: Show Alert + Reload
```

## Data Flow

### Crawler Data Flow

```mermaid
flowchart LR
    subgraph Input
        A1[URL] --> A2[Max Depth]
    end

    subgraph Processing
        A2 --> B1[URL Validation]
        B1 --> B2[Sanitize URL]
        B2 --> B3[Create Output File]
        B3 --> B4[Initialize Crawler]
        B4 --> B5[Queue URLs]
        B5 --> B6{Fetch & Parse}
        B6 --> B7[Extract Links]
        B7 --> B5
    end

    subgraph Output
        B6 --> C1[Console Logs]
        B6 --> C2[crawl_*.txt File]
        C2 --> C3[Byte Counts]
        C2 --> C4[URLs Crawled]
        C2 --> C5[Non-HTML Content]
    end

    style Input fill:#e3f2fd
    style Processing fill:#fff3e0
    style Output fill:#e8f5e9
```

## Git Workflow

```mermaid
gitGraph
    commit id: "Initial Commit"
    commit id: "Add LICENSE"

    branch feature/crawlers
    checkout feature/crawlers
    commit id: "Add recurse_crawler.js"
    commit id: "Add rcc_async.js"
    commit id: "Add rcc_asyncv3.js"
    commit id: "Add rcc_hystersis.js"

    checkout main
    branch feature/uploader
    checkout feature/uploader
    commit id: "Add server.js"
    commit id: "Add index.html"
    commit id: "Add package.json"
    commit id: "Add nodeupservnabox.sh"

    checkout main
    merge feature/crawlers
    merge feature/uploader

    branch claude/add-mermaid-git-diagrams-01GiUx4cwoZt8wcRfHishAgx
    checkout claude/add-mermaid-git-diagrams-01GiUx4cwoZt8wcRfHishAgx
    commit id: "Add README with Mermaid diagrams"
    commit id: "Update documentation"
```

## Installation

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Web Crawler Setup

```bash
# Install crawler dependencies
npm install crawler readline fs path valid-url

# Or install all at once
npm install
```

### File Upload Server Setup

```bash
# Navigate to the uploader directory
cd nodejs_uploader

# Install dependencies
npm install

# Or use the setup script
chmod +x nodeupservnabox.sh
./nodeupservnabox.sh
```

## Usage

### Running Web Crawlers

#### Basic Crawler
```bash
node recurse_crawler.js
# Enter URL when prompted
# Enter max depth when prompted
```

#### Async Crawler with File Output
```bash
node rcc_async.js
# Results saved to crawl_<sanitized_url>_<timestamp>.txt
```

#### Optimized Crawler (Recommended)
```bash
node rcc_asyncv3.js
# Includes URL deduplication and better error handling
```

#### Advanced Crawler with Rate Limiting
```bash
node rcc_hystersis.js
# Automatic rate adjustment based on errors
# Retry mechanism with exponential backoff
```

### Running File Upload Server

```bash
cd nodejs_uploader
node server.js
# Server starts on http://localhost:3000
```

Then open your browser to `http://localhost:3000` and use the upload interface.

## Code Review & Improvements

### Identified Issues

#### 1. **Web Crawlers**

**Issue: Memory Leaks**
- **Location**: All crawler files
- **Problem**: `visitedUrls` Set grows unbounded for large crawls
- **Recommendation**: Implement LRU cache or periodic cleanup

**Issue: Error Handling**
- **Location**: `recurse_crawler.js:16-17`
- **Problem**: Errors are only logged, not properly handled
- **Recommendation**: Add retry logic and graceful degradation

**Issue: Callback Management**
- **Location**: `rcc_async.js:62-75`
- **Problem**: Mixing promises with callbacks causes potential race conditions
- **Recommendation**: Fully convert to async/await or use promises consistently

**Issue: Security**
- **Location**: `rcc_asyncv3.js:68`
- **Problem**: `encodeURI()` insufficient for malicious URLs
- **Recommendation**: Use `encodeURIComponent()` for path segments and add URL whitelist

**Issue: Rate Limiting Logic**
- **Location**: `rcc_hystersis.js:31-42`
- **Problem**: Hysteresis algorithm too aggressive, can deadlock at minConnections
- **Recommendation**: Add gradual recovery and minimum successful requests threshold

**Issue: File I/O**
- **Location**: All async crawlers
- **Problem**: Synchronous `fs.appendFileSync()` blocks event loop
- **Recommendation**: Use `fs.promises.appendFile()` for async operations

**Issue: URL Deduplication**
- **Location**: `rcc_asyncv3.js:19`
- **Problem**: Case-sensitive URL comparison misses duplicates
- **Recommendation**: Normalize URLs (lowercase, remove trailing slashes, sort params)

#### 2. **File Upload Server**

**Issue: Security - File Upload**
- **Location**: `server.js:10`
- **Problem**: No file type validation or size limits
- **Recommendation**:
  ```javascript
  const upload = multer({
    dest: 'uploads/',
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
      const allowedTypes = /jpeg|jpg|png|pdf/;
      const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
      const mimetype = allowedTypes.test(file.mimetype);
      if (mimetype && extname) {
        return cb(null, true);
      }
      cb(new Error('Invalid file type'));
    }
  });
  ```

**Issue: Missing Error Handling**
- **Location**: `server.js:12-16`
- **Problem**: No error handling in upload route
- **Recommendation**: Add try-catch and validate request

**Issue: CORS**
- **Location**: `server.js`
- **Problem**: No CORS configuration for cross-origin requests
- **Recommendation**: Add `cors` middleware

**Issue: Missing Uploads Directory**
- **Location**: `server.js:10`
- **Problem**: No check if `uploads/` directory exists
- **Recommendation**: Create directory on startup

**Issue: Static File Serving**
- **Location**: `server.js:19-21`
- **Problem**: Serves index.html from both root route and static middleware (potential conflict)
- **Recommendation**: Remove duplicate route or adjust middleware

**Issue: Frontend - XSS Risk**
- **Location**: `index.html:44`
- **Problem**: `alert()` with server response could be XSS vector
- **Recommendation**: Sanitize server response before display

#### 3. **General Issues**

**Issue: No package.json in Root**
- **Location**: Repository root
- **Problem**: Crawler dependencies not managed
- **Recommendation**: Create root `package.json` with all dependencies

**Issue: No Error Logging**
- **Location**: All files
- **Problem**: No centralized logging mechanism
- **Recommendation**: Implement Winston or Pino for structured logging

**Issue: No Tests**
- **Location**: Repository
- **Problem**: No unit or integration tests
- **Recommendation**: Add Jest/Mocha tests for critical functions

**Issue: Configuration Hardcoded**
- **Location**: All files
- **Problem**: No configuration file for settings
- **Recommendation**: Create `config.js` or use environment variables

### Recommended Improvements

#### High Priority

1. **Add Security Measures**
   - File upload validation and sanitization
   - URL whitelist for crawler
   - Rate limiting on upload endpoint
   - Input validation across all user inputs

2. **Fix Async/Promise Handling**
   - Fully migrate to async/await
   - Remove callback/promise mixing
   - Proper error propagation

3. **Add Resource Management**
   - LRU cache for visited URLs
   - Async file I/O
   - Connection pooling

#### Medium Priority

4. **Implement Proper Logging**
   - Structured logging with log levels
   - Separate error logs
   - Rotation for log files

5. **Add Configuration Management**
   - Environment variables
   - Config files for different environments
   - Validation of configuration

6. **Create Root Package Management**
   - Single `package.json` for workspace
   - Unified dependency management
   - npm scripts for common tasks

#### Low Priority

7. **Add Testing**
   - Unit tests for utility functions
   - Integration tests for crawlers
   - E2E tests for upload server

8. **Documentation**
   - JSDoc comments for functions
   - API documentation
   - Architecture decision records (ADRs)

9. **Monitoring & Observability**
   - Performance metrics
   - Crawler statistics
   - Upload analytics

### Security Checklist

- [ ] File upload type validation
- [ ] File size limits
- [ ] Malicious filename sanitization
- [ ] Path traversal prevention
- [ ] CSRF protection for upload endpoint
- [ ] Rate limiting on all endpoints
- [ ] URL validation and sanitization in crawler
- [ ] Prevent SSRF attacks in crawler
- [ ] Add helmet.js for HTTP security headers
- [ ] Environment variable validation
- [ ] Secrets management (if needed)
- [ ] Input sanitization across all user inputs

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the terms specified in the LICENSE file.

## Author

See git history for contributors.

---

**Note**: This README was generated with comprehensive Mermaid diagrams to visualize the project architecture, data flows, and workflows. The code review section identifies critical security and performance issues that should be addressed before production use.
