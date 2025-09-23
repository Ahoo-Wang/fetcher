/*
 * Copyright [2021-present] [ahoo wang <ahoowang@qq.com> (https://github.com/Ahoo-Wang)].
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *      http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Security scheme type definitions for OpenAPI Specification
 */

import { ParameterLocation } from './base-types';
import { Extensible } from './extensions';

/**
 * Configuration details for a supported OAuth Flow
 *
 * @property authorizationUrl - The authorization URL to be used for this flow
 * @property tokenUrl - The token URL to be used for this flow
 * @property refreshUrl - The URL to be used for obtaining refresh tokens
 * @property scopes - The available scopes for the OAuth2 security scheme
 */
export interface OAuthFlow extends Extensible {
  authorizationUrl?: string;
  tokenUrl?: string;
  refreshUrl?: string;
  scopes: Record<string, string>;
}

/**
 * Allows configuration of the supported OAuth Flows
 *
 * @property implicit - Configuration for the OAuth Implicit flow
 * @property password - Configuration for the OAuth Resource Owner Password flow
 * @property clientCredentials - Configuration for the OAuth Client Credentials flow
 * @property authorizationCode - Configuration for the OAuth Authorization Code flow
 */
export interface OAuthFlows extends Extensible {
  implicit?: OAuthFlow;
  password?: OAuthFlow;
  clientCredentials?: OAuthFlow;
  authorizationCode?: OAuthFlow;
}

/**
 * Defines a security scheme that can be used by the operations
 *
 * @property type - The type of the security scheme
 * @property description - A short description for security scheme
 * @property name - The name of the header, query or cookie parameter to be used
 * @property in - The location of the API key
 * @property scheme - The name of the HTTP Authorization scheme
 * @property bearerFormat - A hint to the client to identify how the bearer token is formatted
 * @property flows - An object containing configuration information for the flow types supported
 * @property openIdConnectUrl - OpenId Connect URL to discover OAuth2 configuration values
 */
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

/**
 * Lists the required security schemes to execute this operation
 */
export interface SecurityRequirement extends Extensible {
  [name: string]: string[];
}
