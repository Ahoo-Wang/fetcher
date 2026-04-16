import type { OpenAPI, Info, Paths, Components } from '@ahoo-wang/fetcher-openapi';

// Define a root OpenAPI 3.0 document with full type safety
const doc: OpenAPI = {
  openapi: '3.0.1',
  info: {
    title: 'My API',
    version: '1.0.0',
    description: 'Example API',
    contact: {
      name: 'API Support',
      email: 'support@example.com',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  } as Info,
  servers: [
    {
      url: 'https://api.example.com',
      description: 'Production server',
      variables: {
        env: {
          default: 'production',
          enum: ['production', 'staging'],
        },
      },
    },
  ],
  paths: {} as Paths,
  components: {
    schemas: {},
    parameters: {},
    responses: {},
    securitySchemes: {},
  } as Components,
};

export type { OpenAPI, Info, Paths, Components };
