/**
 * TypeScript Type Definitions for OpenAPI 3.0+ Specification
 *
 * This file contains complete type definitions for the OpenAPI Specification,
 * enabling type-safe handling of API documentation, code generation, and
 * client implementation in TypeScript projects.
 */

/**
 * HTTP methods as defined in the OpenAPI specification
 */
export type HTTPMethod = 'get' | 'put' | 'post' | 'delete' | 'options' | 'head' | 'patch' | 'trace';

/**
 * Supported parameter locations in HTTP requests
 */
export type ParameterLocation = 'query' | 'header' | 'path' | 'cookie';

/**
 * Primitive data types supported by JSON Schema
 */
export type SchemaType = 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'object';

/**
 * Reference object to allow referencing components in the document
 *
 * @property $ref - JSON Pointer to the target component
 */
export interface Reference {
  $ref: string;
}

/**
 * Metadata about the API
 *
 * @property title - The title of the API
 * @property description - A short description of the API
 * @property termsOfService - A URL to the Terms of Service for the API
 * @property contact - The contact information for the exposed API
 * @property license - The license information for the exposed API
 * @property version - The version of the OpenAPI document
 */
export interface Info {
  title: string;
  description?: string;
  termsOfService?: string;
  contact?: Contact;
  license?: License;
  version: string;
}

/**
 * Contact information for the exposed API
 *
 * @property name - The identifying name of the contact person/organization
 * @property url - The URL pointing to the contact information
 * @property email - The email address of the contact person/organization
 */
export interface Contact {
  name?: string;
  url?: string;
  email?: string;
}

/**
 * License information for the exposed API
 *
 * @property name - The license name used for the API
 * @property url - A URL to the license used for the API
 */
export interface License {
  name: string;
  url?: string;
}

/**
 * Server configuration details
 *
 * @property url - A URL to the target host
 * @property description - An optional string describing the host designated by the URL
 * @property variables - A map between a variable name and its value
 */
export interface Server {
  url: string;
  description?: string;
  variables?: Record<string, ServerVariable>;
}

/**
 * Server variable for URL template substitution
 *
 * @property enum - An enumeration of string values to be used if the substitution options are from a limited set
 * @property default - The default value to use for substitution
 * @property description - An optional description for the server variable
 */
export interface ServerVariable {
  enum?: string[];
  default: string;
  description?: string;
}

/**
 * Holds the relative paths to the individual endpoints and their operations
 */
export interface Paths {
  [path: string]: PathItem;
}

/**
 * Describes the operations available on a single path
 *
 * @property $ref - A reference to another path item
 * @property summary - An optional summary of the path item
 * @property description - An optional description of the path item
 * @property get - Definition of a GET operation on this path
 * @property put - Definition of a PUT operation on this path
 * @property post - Definition of a POST operation on this path
 * @property delete - Definition of a DELETE operation on this path
 * @property options - Definition of an OPTIONS operation on this path
 * @property head - Definition of a HEAD operation on this path
 * @property patch - Definition of a PATCH operation on this path
 * @property trace - Definition of a TRACE operation on this path
 * @property servers - Alternative server array to service all operations in this path
 * @property parameters - List of parameters that are applicable for all operations in this path
 */
export interface PathItem {
  $ref?: string;
  summary?: string;
  description?: string;
  get?: Operation;
  put?: Operation;
  post?: Operation;
  delete?: Operation;
  options?: Operation;
  head?: Operation;
  patch?: Operation;
  trace?: Operation;
  servers?: Server[];
  parameters?: (Parameter | Reference)[];
}

/**
 * Describes a single API operation on a path
 *
 * @property tags - A list of tags for API documentation control
 * @property summary - A short summary of what the operation does
 * @property description - A verbose explanation of the operation behavior
 * @property externalDocs - Additional external documentation for this operation
 * @property operationId - Unique string used to identify the operation
 * @property parameters - List of parameters that are applicable for this operation
 * @property requestBody - The request body applicable for this operation
 * @property responses - The list of possible responses as they are returned from executing this operation
 * @property callbacks - A map of possible out-of band callbacks related to the parent operation
 * @property deprecated - Declares this operation to be deprecated
 * @property security - Declaration of which security mechanisms can be used for this operation
 * @property servers - Alternative server array to service this operation
 */
export interface Operation {
  tags?: string[];
  summary?: string;
  description?: string;
  externalDocs?: ExternalDocumentation;
  operationId?: string;
  parameters?: (Parameter | Reference)[];
  requestBody?: RequestBody | Reference;
  responses: Responses;
  callbacks?: Record<string, Callback | Reference>;
  deprecated?: boolean;
  security?: SecurityRequirement[];
  servers?: Server[];
}

/**
 * Additional external documentation
 *
 * @property description - A description of the target documentation
 * @property url - The URL for the target documentation
 */
export interface ExternalDocumentation {
  description?: string;
  url: string;
}

/**
 * Describes a single operation parameter
 *
 * @property name - The name of the parameter
 * @property in - The location of the parameter
 * @property description - A brief description of the parameter
 * @property required - Determines whether this parameter is mandatory
 * @property deprecated - Specifies that a parameter is deprecated
 * @property allowEmptyValue - Sets the ability to pass empty-valued parameters
 * @property style - Describes how the parameter value will be serialized
 * @property explode - When true, parameter values of type array or object generate separate parameters
 * @property allowReserved - Determines whether the parameter value should allow reserved characters
 * @property schema - The schema defining the type used for the parameter
 * @property example - Example of the parameter's potential value
 * @property examples - Examples of the parameter's potential value
 * @property content - A map containing the representations for the parameter
 */
export interface Parameter {
  name: string;
  in: ParameterLocation;
  description?: string;
  required?: boolean;
  deprecated?: boolean;
  allowEmptyValue?: boolean;
  style?: string;
  explode?: boolean;
  allowReserved?: boolean;
  schema?: Schema | Reference;
  example?: any;
  examples?: Record<string, Example | Reference>;
  content?: Record<string, MediaType>;
}

/**
 * Describes a single request body
 *
 * @property description - A brief description of the request body
 * @property content - The content of the request body
 * @property required - Determines if the request body is required in the request
 */
export interface RequestBody {
  description?: string;
  content: Record<string, MediaType>;
  required?: boolean;
}

/**
 * Each Media Type Object provides schema and examples for the media type identified by its key
 *
 * @property schema - The schema defining the content of the request, response, or parameter
 * @property example - Example of the media type
 * @property examples - Examples of the media type
 * @property encoding - A map between a property name and its encoding information
 */
export interface MediaType {
  schema?: Schema | Reference;
  example?: any;
  examples?: Record<string, Example | Reference>;
  encoding?: Record<string, Encoding>;
}

/**
 * A single encoding definition applied to a single schema property
 *
 * @property contentType - The Content-Type for encoding a specific property
 * @property headers - A map allowing additional information to be provided as headers
 * @property style - Describes how a specific property value will be serialized
 * @property explode - When true, property values of type array or object generate separate parameters
 * @property allowReserved - Determines whether the parameter value should allow reserved characters
 */
export interface Encoding {
  contentType?: string;
  headers?: Record<string, Header | Reference>;
  style?: string;
  explode?: boolean;
  allowReserved?: boolean;
}

/**
 * A container for the expected responses of an operation
 */
export interface Responses {
  default?: Response | Reference;

  [httpCode: string]: Response | Reference | undefined;
}

/**
 * Describes a single response from an API Operation
 *
 * @property description - A description of the response
 * @property headers - Maps a header name to its definition
 * @property content - A map containing descriptions of potential response payloads
 * @property links - A map of operations links that can be followed from the response
 */
export interface Response {
  description: string;
  headers?: Record<string, Header | Reference>;
  content?: Record<string, MediaType>;
  links?: Record<string, Link | Reference>;
}

/**
 * A map of possible out-of-band callbacks related to the parent operation
 */
export interface Callback {
  [expression: string]: PathItem;
}

/**
 * Example object
 *
 * @property summary - Short description for the example
 * @property description - Long description for the example
 * @property value - Embedded literal example
 * @property externalValue - A URL that points to the literal example
 */
export interface Example {
  summary?: string;
  description?: string;
  value?: any;
  externalValue?: string;
}

/**
 * The Link object represents a possible design-time link for a response
 *
 * @property operationRef - A relative or absolute reference to an OAS operation
 * @property operationId - The name of an existing, resolvable OAS operation
 * @property parameters - A map representing parameters to pass to an operation
 * @property requestBody - A literal value or expression to use as a request body
 * @property description - A description of the link
 * @property server - A server object to be used by the target operation
 */
export interface Link {
  operationRef?: string;
  operationId?: string;
  parameters?: Record<string, any>;
  requestBody?: any;
  description?: string;
  server?: Server;
}

/**
 * The Header Object follows the structure of the Parameter Object
 */
export interface Header {
  description?: string;
  required?: boolean;
  deprecated?: boolean;
  allowEmptyValue?: boolean;
  style?: string;
  explode?: boolean;
  allowReserved?: boolean;
  schema?: Schema | Reference;
  example?: any;
  examples?: Record<string, Example | Reference>;
  content?: Record<string, MediaType>;
}

/**
 * Holds a set of reusable objects for different aspects of the OAS
 *
 * @property schemas - An object to hold reusable Schema Objects
 * @property responses - An object to hold reusable Response Objects
 * @property parameters - An object to hold reusable Parameter Objects
 * @property examples - An object to hold reusable Example Objects
 * @property requestBodies - An object to hold reusable Request Body Objects
 * @property headers - An object to hold reusable Header Objects
 * @property securitySchemes - An object to hold reusable Security Scheme Objects
 * @property links - An object to hold reusable Link Objects
 * @property callbacks - An object to hold reusable Callback Objects
 */
export interface Components {
  schemas?: Record<string, Schema | Reference>;
  responses?: Record<string, Response | Reference>;
  parameters?: Record<string, Parameter | Reference>;
  examples?: Record<string, Example | Reference>;
  requestBodies?: Record<string, RequestBody | Reference>;
  headers?: Record<string, Header | Reference>;
  securitySchemes?: Record<string, SecurityScheme | Reference>;
  links?: Record<string, Link | Reference>;
  callbacks?: Record<string, Callback | Reference>;
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
export interface SecurityScheme {
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
 * Allows configuration of the supported OAuth Flows
 *
 * @property implicit - Configuration for the OAuth Implicit flow
 * @property password - Configuration for the OAuth Resource Owner Password flow
 * @property clientCredentials - Configuration for the OAuth Client Credentials flow
 * @property authorizationCode - Configuration for the OAuth Authorization Code flow
 */
export interface OAuthFlows {
  implicit?: OAuthFlow;
  password?: OAuthFlow;
  clientCredentials?: OAuthFlow;
  authorizationCode?: OAuthFlow;
}

/**
 * Configuration details for a supported OAuth Flow
 *
 * @property authorizationUrl - The authorization URL to be used for this flow
 * @property tokenUrl - The token URL to be used for this flow
 * @property refreshUrl - The URL to be used for obtaining refresh tokens
 * @property scopes - The available scopes for the OAuth2 security scheme
 */
export interface OAuthFlow {
  authorizationUrl?: string;
  tokenUrl?: string;
  refreshUrl?: string;
  scopes: Record<string, string>;
}

/**
 * Lists the required security schemes to execute this operation
 */
export interface SecurityRequirement {
  [name: string]: string[];
}

/**
 * Adds metadata to a single tag that is used by the Operation Object
 *
 * @property name - The name of the tag
 * @property description - A description for the tag
 * @property externalDocs - Additional external documentation for this tag
 */
export interface Tag {
  name: string;
  description?: string;
  externalDocs?: ExternalDocumentation;
}

/**
 * The Schema Object allows the definition of input and output data types
 *
 * @property title - The title of the schema
 * @property description - A description of the schema
 * @property type - The data type of the schema
 * @property format - The extending format for the previously mentioned type
 * @property nullable - Allows sending a null value for the defined schema
 * @property readOnly - Relevant only for Schema "properties" definitions
 * @property writeOnly - Relevant only for Schema "properties" definitions
 * @property deprecated - Specifies that a schema is deprecated
 * @property example - A free-form property to include an example of an instance for this schema
 * @property minimum - The minimum value of the range (for numeric types)
 * @property maximum - The maximum value of the range (for numeric types)
 * @property exclusiveMinimum - Whether the minimum value is excluded from the range
 * @property exclusiveMaximum - Whether the maximum value is excluded from the range
 * @property multipleOf - A number that must be a multiple of this value
 * @property minLength - The minimum length of a string value
 * @property maxLength - The maximum length of a string value
 * @property pattern - The regular expression pattern that a string value must match
 * @property items - The type definition for array items
 * @property minItems - The minimum number of items in an array
 * @property maxItems - The maximum number of items in an array
 * @property uniqueItems - Whether all items in an array must be unique
 * @property properties - The property definitions for an object type
 * @property required - The list of required properties for an object type
 * @property minProperties - The minimum number of properties for an object type
 * @property maxProperties - The maximum number of properties for an object type
 * @property additionalProperties - Defines whether additional properties are allowed
 * @property allOf - Must be valid against all of the subschemas
 * @property anyOf - Must be valid against any of the subschemas
 * @property oneOf - Must be valid against exactly one of the subschemas
 * @property not - Must not be valid against the supplied schema
 * @property enum - The enumeration of possible values
 * @property discriminator - Adds support for polymorphism
 * @property xml - Additional metadata for XML formatting
 * @property externalDocs - Additional external documentation for this schema
 */
export interface Schema {
  // General properties
  title?: string;
  description?: string;
  type?: SchemaType;
  format?: string;
  nullable?: boolean;
  readOnly?: boolean;
  writeOnly?: boolean;
  deprecated?: boolean;
  example?: any;

  // Numeric constraints
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: boolean | number;
  exclusiveMaximum?: boolean | number;
  multipleOf?: number;

  // String constraints
  minLength?: number;
  maxLength?: number;
  pattern?: string;

  // Array constraints
  items?: Schema | Reference;
  minItems?: number;
  maxItems?: number;
  uniqueItems?: boolean;

  // Object constraints
  properties?: Record<string, Schema | Reference>;
  required?: string[];
  minProperties?: number;
  maxProperties?: number;
  additionalProperties?: boolean | Schema | Reference;

  // Composition
  allOf?: Array<Schema | Reference>;
  anyOf?: Array<Schema | Reference>;
  oneOf?: Array<Schema | Reference>;
  not?: Schema | Reference;

  // Enumeration
  enum?: any[];

  // Polymorphism support
  discriminator?: Discriminator;

  // XML serialization
  xml?: XML;

  // External documentation
  externalDocs?: ExternalDocumentation;
}

/**
 * Adds support for polymorphism using discriminator
 *
 * @property propertyName - The name of the property in the payload that will hold the discriminator value
 * @property mapping - An object to hold mappings between payload values and schema names or references
 */
export interface Discriminator {
  propertyName: string;
  mapping?: Record<string, string>;
}

/**
 * A metadata object that allows for more fine-tuned XML model definitions
 *
 * @property name - Replaces the name of the element/attribute used for the described schema property
 * @property namespace - The URI of the namespace definition
 * @property prefix - The prefix to be used for the name
 * @property attribute - Declares whether the property definition translates to an attribute instead of an element
 * @property wrapped - MAY be used only for an array definition and signifies whether the array is wrapped
 */
export interface XML {
  name?: string;
  namespace?: string;
  prefix?: string;
  attribute?: boolean;
  wrapped?: boolean;
}

/**
 * Root document object for the OpenAPI specification
 *
 * @property openapi - This string must be the version number of the OpenAPI Specification
 * @property info - Provides metadata about the API
 * @property servers - An array of Server Objects which provide connectivity information
 * @property paths - The available paths and operations for the API
 * @property components - An element to hold various schemas for the specification
 * @property security - A declaration of which security mechanisms can be used across the API
 * @property tags - A list of tags used by the specification with additional metadata
 * @property externalDocs - Additional external documentation
 */
export interface OpenAPIDocument {
  openapi: string;
  info: Info;
  servers?: Server[];
  paths: Paths;
  components?: Components;
  security?: SecurityRequirement[];
  tags?: Tag[];
  externalDocs?: ExternalDocumentation;
}

/**
 * Utility type to check if an object is a reference
 */
export type IsReference<T> = T extends { $ref: string } ? T : never;

/**
 * Utility type to extract component type from a reference string
 */
export type ExtractComponentTypeFromRef<T> =
  T extends { $ref: `#/components/${infer ComponentType}/${string}` }
    ? ComponentType
    : never;

/**
 * Mapping of component types to their respective interfaces
 */
export type ComponentTypeMap = {
  schemas: Schema;
  responses: Response;
  parameters: Parameter;
  examples: Example;
  requestBodies: RequestBody;
  headers: Header;
  securitySchemes: SecurityScheme;
  links: Link;
  callbacks: Callback;
};

/**
 * Utility type to convert path templates with parameters to TypeScript compatible types
 */
export type PathWithParams<T extends string> =
  T extends `${infer Start}{${infer Param}}${infer Rest}`
    ? `${Start}${string}${PathWithParams<Rest>}`
    : T;

/**
 * Utility type to extract parameter names from path templates
 */
export type ExtractPathParams<T extends string> =
  T extends `${string}{${infer Param}}${infer Rest}`
    ? Param | ExtractPathParams<Rest>
    : never;

/**
 * Configuration type for API clients based on OpenAPI specification
 */
export type APIClientConfig<T extends OpenAPIDocument> = {
  baseURL?: string;
  // Additional configuration options like authentication, timeouts, etc.
} & {
  [K in keyof T['paths']]: {
    [M in HTTPMethod]?: M extends keyof T['paths'][K]
      ? OperationHandler<T, K, M>
      : never;
  };
};

/**
 * Type for operation handlers in API clients
 */
type OperationHandler<T extends OpenAPIDocument, Path extends keyof T['paths'], Method extends HTTPMethod> =
  Method extends keyof T['paths'][Path]
    ? T['paths'][Path][Method] extends Operation
      ? (params: OperationParams<T['paths'][Path][Method]>) => Promise<OperationResponse<T['paths'][Path][Method]>>
      : never
    : never;

/**
 * Type for operation parameters extracted from OpenAPI specification
 */
type OperationParams<Op extends Operation> =
  (Op['parameters'] extends Array<infer P>
    ? ParametersToObject<P>
    : {}) &
  (Op['requestBody'] extends RequestBody
    ? { body: RequestBodyContent<Op['requestBody']> }
    : {});

/**
 * Utility type to convert parameter arrays to parameter objects
 */
type ParametersToObject<P> =
  P extends Parameter
    ? P extends { in: 'path'; name: infer N extends string; required: true }
      ? { [K in N]: any }
      : P extends { in: 'path'; name: infer N extends string }
        ? { [K in N]?: any }
        : P extends { in: 'query'; name: infer N extends string; required: true }
          ? { [K in N]: any }
          : P extends { in: 'query'; name: infer N extends string }
            ? { [K in N]?: any }
            : P extends { in: 'header'; name: infer N extends string; required: true }
              ? { [K in N]: any }
              : P extends { in: 'header'; name: infer N extends string }
                ? { [K in N]?: any }
                : P extends { in: 'cookie'; name: infer N extends string; required: true }
                  ? { [K in N]: any }
                  : P extends { in: 'cookie'; name: infer N extends string }
                    ? { [K in N]?: any }
                    : {}
    : {};

/**
 * Type for request body content with proper content type specification
 */
type RequestBodyContent<RB extends RequestBody> =
  RB['content'] extends Record<string, MediaType>
    ? keyof RB['content'] extends infer ContentType
      ? ContentType extends string
        ? { contentType: ContentType; data: any }
        : never
      : never
    : never;

/**
 * Type for operation responses extracted from OpenAPI specification
 */
type OperationResponse<Op extends Operation> =
  Op['responses'] extends Record<string, infer R>
    ? R extends Response
      ? { status: number; data: ResponseContent<R> }
      : never
    : never;

/**
 * Type for response content with proper content type specification
 */
type ResponseContent<R extends Response> =
  R['content'] extends Record<string, MediaType>
    ? keyof R['content'] extends infer ContentType
      ? ContentType extends string
        ? { contentType: ContentType; data: any }
        : never
      : never
    : never;

export default OpenAPIDocument;