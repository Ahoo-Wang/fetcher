---
title: Integration Testing
description: How integration tests work in the Fetcher monorepo - real API calls, JSONPlaceholder testing, setup and teardown, and environment configuration.
---

# Integration Testing

Integration tests validate that the Fetcher ecosystem works correctly against real HTTP APIs. The `integration-test` workspace contains tests that make actual network calls to public APIs and running backend services.

## Workspace Structure

```
integration-test/
  src/
    fetcher/
      typicodeFetcher.ts          # NamedFetcher for JSONPlaceholder
    decorator/
      typicodeUserService.ts      # Decorator-based API client
      typicodePostService.ts
      resultExtractorService.ts
    wow/
      cart/
        cartCommandClient.ts      # CQRS command client
        cartClientOptions.ts
      exampleFetcher.ts
    generated/
      example/                    # Auto-generated from OpenAPI spec
  test/
    fetcher/
      typicodeFetcher.test.ts     # Fetcher integration tests
    decorator/
      typicodeUserService.test.ts # Decorator integration tests
      typicodePostService.test.ts
      resultExtractorService.test.ts
    wow/
      cart/
        cartCommandClient.test.ts
    openai/
      openai.test.ts
```

**Source:** [`integration-test/`](https://github.com/Ahoo-Wang/fetcher/blob/main/integration-test)

## Test API: JSONPlaceholder

The primary test API used for integration tests is [JSONPlaceholder](https://jsonplaceholder.typicode.com), a free public REST API. It provides realistic CRUD endpoints without requiring authentication.

### Fetcher Setup

```typescript
import { NamedFetcher } from '@ahoo-wang/fetcher';

export const typicodeFetcher = new NamedFetcher('typicode', {
  baseURL: 'https://jsonplaceholder.typicode.com',
});

// Optional: add interceptors
typicodeFetcher.interceptors.request.use(cosecRequestInterceptor);
typicodeFetcher.interceptors.response.use(authorizationResponseInterceptor);
```

**Source:** [`integration-test/src/fetcher/typicodeFetcher.ts`](https://github.com/Ahoo-Wang/fetcher/blob/main/integration-test/src/fetcher/typicodeFetcher.ts)

## Integration Test Examples

### Fetcher-Level Tests

Tests using the Fetcher class directly against JSONPlaceholder:

```typescript
import { describe, it, expect } from 'vitest';
import { typicodeFetcher } from '../../src';
import { HttpMethod, ResultExtractors } from '@ahoo-wang/fetcher';

describe('typicodeFetcher Integration Test', () => {
  it('should fetch posts from typicode API', async () => {
    const response = await typicodeFetcher.get('/posts');
    expect(response).toBeDefined();
    const posts = await response.json();
    expect(Array.isArray(posts)).toBe(true);
    expect(posts.length).toBeGreaterThan(0);

    const post = posts[0];
    expect(post).toHaveProperty('id');
    expect(post).toHaveProperty('userId');
    expect(post).toHaveProperty('title');
    expect(post).toHaveProperty('body');
  });

  it('should create a new post', async () => {
    const newPost = { userId: 1, title: 'Test Post', body: 'Content' };
    const response = await typicodeFetcher.post('/posts', {
      body: JSON.stringify(newPost),
    });
    const post = await response.json();
    expect(post).toHaveProperty('id');
    expect(post.title).toBe(newPost.title);
  });

  it('should update a post', async () => {
    const response = await typicodeFetcher.put('/posts/1', {
      body: { userId: 1, title: 'Updated', body: 'Updated content' },
    });
    const post = await response.json();
    expect(post.title).toBe('Updated');
  });

  it('should delete a post', async () => {
    const response = await typicodeFetcher.delete('/posts/1');
    const result = await response.json();
    expect(result).toEqual({});
  });
});
```

**Source:** [`integration-test/test/fetcher/typicodeFetcher.test.ts`](https://github.com/Ahoo-Wang/fetcher/blob/main/integration-test/test/fetcher/typicodeFetcher.test.ts)

### Decorator-Level Tests

Tests using decorator-based API services:

```typescript
import { describe, it, expect } from 'vitest';
import { typicodeUserService } from '../../src';

describe('TypicodeUserService Integration Test', () => {
  it('should get user albums', async () => {
    const albums = await typicodeUserService.getAlbums('1');
    expect(albums).toBeDefined();
    expect(Array.isArray(albums)).toBe(true);
    if (albums.length > 0) {
      expect(albums[0]).toHaveProperty('id');
      expect(albums[0]).toHaveProperty('userId');
      expect(albums[0]).toHaveProperty('title');
    }
  });

  it('should get user todos', async () => {
    const todos = await typicodeUserService.getTodos('1');
    expect(todos).toBeDefined();
    expect(Array.isArray(todos)).toBe(true);
  });

  it('should get user posts', async () => {
    const posts = await typicodeUserService.getPosts('1');
    expect(posts).toBeDefined();
    expect(Array.isArray(posts)).toBe(true);
  });
});
```

**Source:** [`integration-test/test/decorator/typicodeUserService.test.ts`](https://github.com/Ahoo-Wang/fetcher/blob/main/integration-test/test/decorator/typicodeUserService.test.ts)

## Test Execution Flow

```mermaid
sequenceDiagram
autonumber

    participant VT as Vitest
    participant FT as Fetcher Tests
    participant DT as Decorator Tests
    participant WT as Wow Tests
    participant API as JSONPlaceholder API

    VT->>FT: Run fetcher tests
    FT->>API: GET /posts
    API-->>FT: Posts array
    FT->>API: POST /posts
    API-->>FT: Created post
    FT->>API: PUT /posts/1
    API-->>FT: Updated post
    FT->>API: DELETE /posts/1
    API-->>FT: Empty object
    FT-->>VT: Results

    VT->>DT: Run decorator tests
    DT->>API: GET /users/1/albums
    API-->>DT: Albums array
    DT->>API: GET /users/1/todos
    API-->>DT: Todos array
    DT-->>VT: Results

    VT->>WT: Run Wow tests
    Note over WT: Requires running<br>Wow backend server
    WT-->>VT: Results
```

## Environment Configuration

### Package Configuration

```json
{
  "scripts": {
    "test": "vitest run --coverage",
    "generate": "pnpm exec fetcher-generator generate -i http://localhost:8080/v3/api-docs"
  }
}
```

**Source:** [`integration-test/package.json`](https://github.com/Ahoo-Wang/fetcher/blob/main/integration-test/package.json)

### Vite Configuration

```typescript
// integration-test/vite.config.ts
export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'FetcherIt',
      fileName: format => `index.${format}.js`,
    },
    rollupOptions: {
      external: [
        '@ahoo-wang/fetcher',
        '@ahoo-wang/fetcher-decorator',
        '@ahoo-wang/fetcher-eventstream',
        '@ahoo-wang/fetcher-cosec',
        '@ahoo-wang/fetcher-wow',
      ],
    },
  },
});
```

**Source:** [`integration-test/vite.config.ts`](https://github.com/Ahoo-Wang/fetcher/blob/main/integration-test/vite.config.ts)

## Running Integration Tests

```bash
# From root
pnpm test:it

# From integration-test directory
cd integration-test && pnpm test

# Specific test file
pnpm --filter @ahoo-wang/fetcher-integration-test vitest run test/fetcher/typicodeFetcher.test.ts
```

## Integration Test Categories

```mermaid
graph TD
    subgraph sg_1 ["No Backend Required"]
        A1["Fetcher CRUD tests<br>(JSONPlaceholder)"]
        A2["Decorator service tests<br>(JSONPlaceholder)"]
        A3["Result extractor tests<br>(JSONPlaceholder)"]
    end

    subgraph sg_2 ["Backend Required"]
        B1["Wow Command tests<br>(localhost:8080)"]
        B2["Wow Query tests<br>(localhost:8080)"]
        B3["CoSec tests<br>(localhost:8080)"]
        B4["Generated client tests<br>(localhost:8080)"]
    end

    A1 --> C["Public API"]
    A2 --> C
    A3 --> C
    B1 --> D["Local Wow Server"]
    B2 --> D
    B3 --> D
    B4 --> D

    style A1 fill:#2d333b,stroke:#6d5dfc,color:#e6edf3
    style A2 fill:#2d333b,stroke:#6d5dfc,color:#e6edf3
    style A3 fill:#2d333b,stroke:#6d5dfc,color:#e6edf3
    style B1 fill:#2d333b,stroke:#6d5dfc,color:#e6edf3
    style B2 fill:#2d333b,stroke:#6d5dfc,color:#e6edf3
    style B3 fill:#2d333b,stroke:#6d5dfc,color:#e6edf3
    style B4 fill:#2d333b,stroke:#6d5dfc,color:#e6edf3
    style C fill:#2d333b,stroke:#6d5dfc,color:#e6edf3
    style D fill:#2d333b,stroke:#6d5dfc,color:#e6edf3
```

## Wow CQRS Integration Tests

The Wow integration tests validate command/event-sourcing patterns against a running Wow backend:

- **CartCommandClient**: Sends commands (AddCartItem, RemoveCartItem, ChangeQuantity)
- **EventStreamQueryClient**: Queries event streams via SSE
- **SnapshotQueryClient**: Queries aggregate snapshots
- **Generated clients**: Tests auto-generated code from OpenAPI spec

These tests require a running backend server at `localhost:8080` and are typically skipped in CI unless the server is available.

## Integration Test Coverage Map

```mermaid
graph LR
    subgraph sg_1 ["Fetcher Package"]
        F1["GET requests"]
        F2["POST requests"]
        F3["PUT requests"]
        F4["DELETE requests"]
        F5["PATCH requests"]
        F6["Result extractors"]
    end

    subgraph sg_2 ["Decorator Package"]
        D1["@api + @get"]
        D2["@path + @query"]
        D3["@body + @post"]
        D4["Result extractor<br>override"]
    end

    subgraph sg_3 ["Wow Package"]
        W1["Command clients"]
        W2["Event stream queries"]
        W3["Snapshot queries"]
    end

    A["JSONPlaceholder<br>API"] --> F1
    A --> F2
    A --> F3
    A --> F4
    A --> D1
    A --> D2
    A --> D3
    B["Wow Backend<br>Server"] --> W1
    B --> W2
    B --> W3

    style A fill:#2d333b,stroke:#6d5dfc,color:#e6edf3
    style B fill:#2d333b,stroke:#6d5dfc,color:#e6edf3
    style F1 fill:#2d333b,stroke:#6d5dfc,color:#e6edf3
    style D1 fill:#2d333b,stroke:#6d5dfc,color:#e6edf3
    style W1 fill:#2d333b,stroke:#6d5dfc,color:#e6edf3
```

## Related Pages

- [Testing Overview](./index.md) -- Testing strategy overview
- [Unit Testing](./unit-testing.md) -- Unit testing guide
- [Browser Testing](./browser-testing.md) -- Browser and component testing
- [Fetcher Client API](../api/fetcher-client.md) -- API being tested
