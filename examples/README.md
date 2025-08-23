# Fetcher Examples

[![Build Status](https://github.com/Ahoo-Wang/fetcher/actions/workflows/ci.yml/badge.svg)](https://github.com/Ahoo-Wang/fetcher/actions)
[![License](https://img.shields.io/npm/l/@ahoo-wang/fetcher.svg)](https://github.com/Ahoo-Wang/fetcher/blob/main/LICENSE)

This directory contains comprehensive examples demonstrating various usage patterns of the `@fetcher/core` and `@fetcher/eventstream` packages.

## Examples Overview

### Core Package Examples

1. **Basic Usage** (`src/basic-usage.ts`):
   - Demonstrates basic HTTP requests with path parameters and query parameters
   - Shows how to configure the Fetcher instance with baseURL and default settings

2. **Interceptor Usage** (`src/interceptor-usage.ts`):
   - Shows how to use request and response interceptors
   - Demonstrates adding and removing interceptors

3. **Timeout Usage** (`src/timeout-usage.ts`):
   - Illustrates how to configure request timeouts at both global and request levels
   - Shows timeout error handling

4. **Error Handling** (`src/error-handling-usage.ts`):
   - Demonstrates how to handle network errors and timeout errors
   - Shows error interceptor usage

5. **HTTP Methods** (`src/http-methods-usage.ts`):
   - Shows how to use different HTTP methods (POST, PUT, DELETE, PATCH, HEAD, OPTIONS)
   - Demonstrates request body handling for different methods

6. **Custom Headers** (`src/custom-headers-usage.ts`):
   - Illustrates how to set and use custom headers at both global and request levels
   - Shows header merging behavior

7. **Advanced Interceptor Usage** (`src/advanced-interceptor-usage.ts`):
   - Shows advanced interceptor patterns like token authentication
   - Demonstrates conditional request modification
   - Shows response transformation patterns

8. **Timeout Error Handling** (`src/timeout-error-handling-usage.ts`):
   - Demonstrates specific timeout error handling
   - Shows how to differentiate between network and timeout errors

### Event Stream Examples

9. **Event Stream Usage** (`src/event-stream-usage.ts`):
   - Demonstrates Server-Sent Events (SSE) usage with @fetcher/eventstream
   - Shows how to process real-time events
   - Illustrates event type handling
   - Demonstrates manual EventStreamConverter usage
   - Shows async iterator patterns for event processing

## Running the Examples

### Prerequisites

1. Build the `@fetcher/core` and `@fetcher/eventstream` packages first:

```bash
cd ..
pnpm build
```

2. Install example dependencies:

```bash
pnpm install
```

### Running Interactive Examples

To run the interactive examples in your browser:

```bash
pnpm dev
```

Then open your browser to http://localhost:3000

### Running Individual Examples

You can run individual example files using Node.js with ES module support:

```bash
# Run basic usage example
node src/basic-usage.ts

# Run interceptor usage example
node src/interceptor-usage.ts

# Run timeout usage example
node src/timeout-usage.ts
```

Alternatively, you can compile the examples and run them:

```bash
# Build examples
pnpm build

# Run compiled examples
node dist/basic-usage.js
```

### Using in Browser

The examples can also be used in a browser environment that supports ES modules. Simply import the example files in your HTML:

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Fetcher Example</title>
  </head>
  <body>
    <script type="module">
      import './src/basic-usage.ts';
    </script>
  </body>
</html>
```

## Example Server

Some examples may require a test server to demonstrate real HTTP requests. You can use tools like:

- [http-server](https://www.npmjs.com/package/http-server)
- [json-server](https://www.npmjs.com/package/json-server)
- [Postman Mock Server](https://learning.postman.com/docs/designing-and-developing-your-api/mocking-data/)

For SSE examples, you might need a server that supports Server-Sent Events. Here's a simple Node.js example:

```javascript
// sse-server.js
const http = require('http');

const server = http.createServer((req, res) => {
  if (req.url === '/events') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });

    // Send events every 2 seconds
    const interval = setInterval(() => {
      const data = {
        timestamp: new Date().toISOString(),
        message: 'Hello from server!',
      };

      res.write(`data: ${JSON.stringify(data)}\n\n`);
    }, 2000);

    // Clean up when client disconnects
    req.on('close', () => {
      clearInterval(interval);
      res.end();
    });
  } else {
    res.writeHead(404);
    res.end();
  }
});

server.listen(3000, () => {
  console.log('SSE server running on http://localhost:3000');
});
```

## Contributing Examples

To contribute new examples:

1. Create a new TypeScript file in the `src/` directory
2. Follow the naming convention: `<feature>-usage.ts`
3. Add a clear description of what the example demonstrates
4. Include comments explaining key concepts
5. Update this README to include your new example

## License

This project is licensed under the [Apache-2.0 License](../LICENSE).
