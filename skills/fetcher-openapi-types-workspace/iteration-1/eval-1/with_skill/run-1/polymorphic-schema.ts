import type { Schema, Discriminator } from '@ahoo-wang/fetcher-openapi';

// Base User schema
const userSchema: Schema = {
  type: 'object',
  properties: {
    id: { type: 'integer', minimum: 1 },
    name: { type: 'string', minLength: 1, maxLength: 100 },
    email: { type: 'string', format: 'email' },
  },
  required: ['id', 'name', 'email'],
};

// Admin schema
const adminSchema: Schema = {
  type: 'object',
  properties: {
    id: { type: 'integer', minimum: 1 },
    name: { type: 'string', minLength: 1, maxLength: 100 },
    email: { type: 'string', format: 'email' },
    permissions: { type: 'array', items: { type: 'string' } },
  },
  required: ['id', 'name', 'email', 'permissions'],
};

// Base type (abstract)
interface UserBase {
  id: number;
  name: string;
  email: string;
}

interface Admin extends UserBase {
  permissions: string[];
}

// Polymorphic schema using oneOf with discriminator
const polymorphicSchema: Schema = {
  oneOf: [
    { $ref: '#/components/schemas/Admin' },
    { $ref: '#/components/schemas/User' },
  ],
  discriminator: {
    propertyName: 'type',
    mapping: {
      admin: '#/components/schemas/Admin',
      user: '#/components/schemas/User',
    },
  },
};

export type { Schema, Discriminator, UserBase, Admin };
