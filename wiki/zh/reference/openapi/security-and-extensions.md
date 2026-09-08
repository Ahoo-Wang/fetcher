---
title: '安全与扩展'
description: '安全与扩展 — Fetcher 5.0.0'
---

# 安全与扩展

这些类型描述安全要求和供应商元数据，不为请求鉴权，也不执行访问策略。运行时 CoSec 集成见 [CoSec 配置](../cosec/configuration)。

## 安全对象

| 类型                  | 契约                                                                                                                   |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `SecurityScheme`      | 必填 type：apiKey/http/oauth2/openIdConnect；可选 description、name、in、scheme、bearerFormat、flows、openIdConnectUrl |
| `OAuthFlow`           | 必填 scopes 映射（`scope → 描述`）；可选 authorizationUrl、tokenUrl、refreshUrl                                        |
| `OAuthFlows`          | 可选 implicit、password、clientCredentials、authorizationCode 流对象                                                   |
| `SecurityRequirement` | 将方案名映射到 string[] 权限范围名称                                                                                   |

声明不会针对方案或流程让特定字段成为条件必填。例如缺少 name/in 的 apiKey 方案不会被 TypeScript 拒绝。数组和 scope 映射只是数据，没有默认值、返回值、网络效果或清理方法。

## 扩展

`Extensible` 允许模板键族 `x-${string}`，值为 any。多数文档对象继承它。`CommonExtensions` 单独命名 `x-internal`、`x-deprecated`（message/since/removedIn/replacement）、`x-tags`、`x-examples`、`x-order`、`x-group`。它不会自动合并到每个 Extensible 对象，也不实现生成器行为。生成器专用 Wow 扩展见[识别规则](../generator/wow-discovery)。

## 完整示例

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
