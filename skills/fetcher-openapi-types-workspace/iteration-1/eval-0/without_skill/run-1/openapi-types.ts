import type { OpenAPI, Info, Paths, Components } from '@ahoo-wang/fetcher-openapi';

// Define a root OpenAPI 3.0 document with full type safety
const doc: OpenAPI = {
  openapi: '3.0.1',
  info: {
    title: 'My API',
    version: '1.0.0',
  } as Info,
  paths: {} as Paths,
  components: {} as Components,
};

export type { OpenAPI, Info, Paths, Components };
