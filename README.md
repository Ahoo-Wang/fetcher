# Fetcher

[![npm version](https://img.shields.io/npm/v/@ahoo-wang/fetcher.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher)
[![Build Status](https://github.com/Ahoo-Wang/fetcher/actions/workflows/ci.yml/badge.svg)](https://github.com/Ahoo-Wang/fetcher/actions)
[![codecov](https://codecov.io/gh/Ahoo-Wang/Fetcher/graph/badge.svg?token=CUPgk8DmH5)](https://codecov.io/gh/Ahoo-Wang/Fetcher)
[![License](https://img.shields.io/npm/l/@ahoo-wang/fetcher.svg)](https://github.com/Ahoo-Wang/fetcher/blob/main/LICENSE)
[![npm downloads](https://img.shields.io/npm/dm/@ahoo-wang/fetcher.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher)

A modern HTTP client library based on the Fetch API, designed to simplify and optimize interactions with backend RESTful APIs. It provides an Axios-like API with support for path parameters, query parameters, timeout settings, and request/response interceptors.

## Features

- **Fetch API Compatible**: Fetcher's API is fully compatible with the native Fetch API, making it easy to get started.
- **Path and Query Parameters**: Supports path parameters and query parameters in requests, with path parameters wrapped in `{}`.
- **Timeout Settings**: Request timeout can be configured.
- **Request Interceptors**: Supports modifying requests before they are sent.
- **Response Interceptors**: Supports processing responses after they are returned.
- **Error Interceptors**: Supports handling errors during the request lifecycle.
- **Modular Design**: Clear code structure for easy maintenance and extension.
- **Event Stream Support**: Built-in support for Server-Sent Events (SSE) through the `@ahoo-wang/fetcher-eventstream` package.
- **Automatic Request Body Conversion**: Automatically converts plain objects to JSON and sets appropriate Content-Type headers.
- **TypeScript Support**: Complete TypeScript type definitions for enhanced development experience.

## Packages

- [`@ahoo-wang/fetcher`](packages/fetcher): The core HTTP client library.
- [`@ahoo-wang/fetcher-eventstream`](./packages/eventstream): Event stream support for real-time data with Server-Sent Events (SSE).

## Examples

The [examples](./examples) directory contains various usage examples of the `@ahoo-wang/fetcher` package:

1. **Basic Usage**: Demonstrates basic HTTP requests with path parameters and query parameters.
2. **Interceptor Usage**: Shows how to use request and response interceptors.
3. **Timeout Usage**: Illustrates how to configure request timeouts.
4. **Error Handling**: Demonstrates how to handle network and timeout errors.
5. **HTTP Methods**: Shows how to use different HTTP methods (POST, PUT, DELETE, etc.).
6. **Custom Headers**: Illustrates how to set and use custom headers.
7. **Advanced Interceptor Usage**: Shows advanced interceptor patterns like token authentication.
8. **Timeout Error Handling**: Demonstrates specific timeout error handling.

## Installation

### Core Package

Using pnpm:

```bash
pnpm add @ahoo-wang/fetcher
```

Using npm:

```bash
npm install @ahoo-wang/fetcher
```

Using yarn:

```bash
yarn add @ahoo-wang/fetcher
```

### Event Stream Package

For Server-Sent Events support:

```bash
pnpm add @ahoo-wang/fetcher-eventstream
```

## Quick Start

### Basic HTTP Requests

```typescript
import { Fetcher } from '@ahoo-wang/fetcher';

const fetcher = new Fetcher({
  baseURL: 'https://api.example.com',
  timeout: 5000,
});

// GET request with path and query parameters
fetcher
  .get('/users/{id}', {
    pathParams: { id: 123 },
    queryParams: { include: 'profile' },
  })
  .then(response => {
    console.log(response.data);
  })
  .catch(error => {
    console.error(error);
  });

// POST request with JSON body (automatically converted to JSON string)
fetcher
  .post('/users', {
    body: { name: 'John Doe', email: 'john@example.com' },
  })
  .then(response => {
    console.log(response.data);
  })
  .catch(error => {
    console.error(error);
  });
```

### Server-Sent Events

```typescript
import { Fetcher } from '@ahoo-wang/fetcher';
import { EventStreamInterceptor } from '@ahoo-wang/fetcher-eventstream';

const fetcher = new Fetcher({
  baseURL: 'https://api.example.com',
});

fetcher.interceptors.response.use(new EventStreamInterceptor());

// Using the eventStream method on responses with text/event-stream content type
const response = await fetcher.get('/events');
if (response.eventStream) {
  for await (const event of response.eventStream()) {
    console.log('Received event:', event);
  }
}
```

## Development

### Prerequisites

- Node.js >= 16
- pnpm >= 8

### Building the Project

To build all packages:

```bash
pnpm build
```

### Running Tests

To run tests for all packages:

```bash
pnpm test
```

### Code Formatting

To format the codebase:

```bash
pnpm format
```

## Contributing

Contributions are welcome! Please see the [contributing guide](./CONTRIBUTING.md) for more details.

## License

This project is licensed under the [Apache-2.0 License](./LICENSE).
