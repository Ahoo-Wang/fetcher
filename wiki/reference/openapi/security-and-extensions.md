---
title: 'Security and extensions'
description: 'Security and extensions — Fetcher 5.0.0'
---

# Security and extensions

These types describe security requirements and vendor metadata. They do not authenticate requests or enforce access policies. For runtime CoSec integration see [CoSec configuration](../cosec/configuration).

## Security objects

| Type                  | Contract                                                                                                                       |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `SecurityScheme`      | Required type: apiKey/http/oauth2/openIdConnect; optional description, name, in, scheme, bearerFormat, flows, openIdConnectUrl |
| `OAuthFlow`           | Required scopes map (`scope → description`); optional authorizationUrl, tokenUrl, refreshUrl                                   |
| `OAuthFlows`          | Optional implicit, password, clientCredentials, authorizationCode flow objects                                                 |
| `SecurityRequirement` | Scheme-name keys mapped to string[] scope names                                                                                |

The declaration does not make fields conditionally required for each scheme or flow. For example, TypeScript does not reject an apiKey scheme missing name/in. Arrays and scope maps are passed through as data; there are no defaults, return values, network effects, or cleanup methods.

## Extensions

`Extensible` permits only the template-key family `x-${string}`, with any values. Most document objects extend it. `CommonExtensions` separately names `x-internal`, `x-deprecated` (message/since/removedIn/replacement), `x-tags`, `x-examples`, `x-order`, and `x-group`. It is not automatically merged into every Extensible object and does not implement generator behavior. Generator-specific Wow extensions are documented in [discovery](../generator/wow-discovery).

## Complete example

```ts
import type { OpenAPI, CommonExtensions } from '@ahoo-wang/fetcher-openapi';
const extensions: CommonExtensions = { 'x-internal': true, 'x-order': 1 };
const document: OpenAPI = {
  openapi: '3.0.3',
  info: { title: 'Secure API', version: '1' },
  paths: {},
  components: {
    securitySchemes: {
      bearer: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
  },
  security: [{ bearer: [] }],
  ...extensions,
};
console.log(document.security);
```

### OAuthFlow {#oauthflow}

[packages/openapi/src/security.ts:29](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openapi/src/security.ts#L29)

```ts
export interface OAuthFlow extends Extensible {
  authorizationUrl?: string;
  tokenUrl?: string;
  refreshUrl?: string;
  scopes: Record<string, string>;
}
```

### OAuthFlows {#oauthflows}

[packages/openapi/src/security.ts:44](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openapi/src/security.ts#L44)

```ts
export interface OAuthFlows extends Extensible {
  implicit?: OAuthFlow;
  password?: OAuthFlow;
  clientCredentials?: OAuthFlow;
  authorizationCode?: OAuthFlow;
}
```

### SecurityScheme {#securityscheme}

[packages/openapi/src/security.ts:63](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openapi/src/security.ts#L63)

```ts
export interface SecurityScheme extends Extensible {
  type: 'apiKey' | 'http' | 'oauth2' | 'openIdConnect';
  description?: string;
  name?: string;
  in?: ParameterLocation;
  scheme?: string;
  bearerFormat?: string;
  flows?: OAuthFlows;
  openIdConnectUrl?: string;
}
```

### SecurityRequirement {#securityrequirement}

[packages/openapi/src/security.ts:77](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openapi/src/security.ts#L77)

```ts
export interface SecurityRequirement extends Extensible {
  [name: string]: string[];
}
```

### Extensible {#extensible}

[packages/openapi/src/extensions.ts:22](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openapi/src/extensions.ts#L22)

```ts
export interface Extensible {
  [extension: `x-${string}`]: any;
}
```

### CommonExtensions {#commonextensions}

[packages/openapi/src/extensions.ts:33](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/openapi/src/extensions.ts#L33)

```ts
export interface CommonExtensions {
  'x-internal'?: boolean;

  'x-deprecated'?: {
    message?: string;
    since?: string;
    removedIn?: string;
    replacement?: string;
  };

  'x-tags'?: string[];

  'x-examples'?: any[];

  'x-order'?: number;

  'x-group'?: string;
}
```
