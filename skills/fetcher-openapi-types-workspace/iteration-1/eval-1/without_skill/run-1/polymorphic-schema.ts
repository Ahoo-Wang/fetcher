import type { Schema, Discriminator } from '@ahoo-wang/fetcher-openapi';

// Polymorphic schema with discriminator
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
