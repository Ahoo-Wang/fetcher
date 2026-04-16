import type { Operation, Parameter, RequestBody, Response, MediaType, ParameterLocation } from '@ahoo-wang/fetcher-openapi';

// Path parameter
const userIdParam: Parameter = {
  name: 'userId',
  in: 'path' as ParameterLocation,
  required: true,
  schema: { type: 'integer', minimum: 1 },
  description: 'The user ID',
};

// Query parameter for search
const searchParam: Parameter = {
  name: 'search',
  in: 'query' as ParameterLocation,
  schema: { type: 'string', minLength: 1 },
  description: 'Search query',
};

// Request body schema
const createUserRequestBody: RequestBody = {
  required: true,
  content: {
    'application/json': {
      schema: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 100 },
          email: { type: 'string', format: 'email' },
          role: { type: 'string', enum: ['admin', 'user', 'guest'] },
        },
        required: ['name', 'email'],
      },
    } as MediaType,
  },
};

// Success response
const createdResponse: Response = {
  description: 'User created successfully',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          name: { type: 'string' },
          email: { type: 'string' },
          role: { type: 'string' },
        },
      },
    },
  },
};

// POST /users operation
const createUserOperation: Operation = {
  operationId: 'createUser',
  summary: 'Create a new user',
  tags: ['users'],
  parameters: [userIdParam, searchParam],
  requestBody: createUserRequestBody,
  responses: {
    '201': createdResponse,
    '400': {
      description: 'Invalid request',
    },
  },
};

export type { Operation, Parameter, RequestBody, Response, MediaType, ParameterLocation };
