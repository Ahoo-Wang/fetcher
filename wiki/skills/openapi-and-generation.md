---
title: OpenAPI and generation skills
description: Choose Fetcher skills for OpenAPI TypeScript types and generated clients.
pageClass: skills-page
---

# OpenAPI and generation skills

The type package describes an OpenAPI document. The generator consumes a
document and writes Fetcher models and clients. They solve different jobs.

## `$fetcher-openapi-types`

**Use for:** typing OpenAPI 3 documents, schemas, paths, operations, parameters,
responses, components, security, references, and extension fields.

```text
$fetcher-openapi-types create a typed OpenAPI document for a user endpoint.
Keep reusable schemas and responses under components and use references.
```

This package has zero runtime behavior. Do not use its types as a substitute
for validation of untrusted JSON.

Continue with the [OpenAPI reference](../reference/openapi.md).

## `$fetcher-openapi-generator`

**Use for:** generator CLI options, configuration, output layout, safe
regeneration, programmatic `CodeGenerator` use, and Wow client discovery rules.

```text
$fetcher-openapi-generator generate TypeScript models and clients from
./openapi.yaml into ./src/generated using ./tsconfig.json. Verify the output
builds and explain any skipped operations.
```

The skill verifies the actual input document and generated output instead of
guessing routes from conventions. For Wow fixtures it also knows the command,
snapshot, count, and aggregation discovery shapes.

Continue with the [Generator reference](../reference/generator.md) or the
[generation recipe](../recipes/openapi-client.md).

## Selection rule

| Outcome                                           | Skill                        |
| ------------------------------------------------- | ---------------------------- |
| Author or transform an in-memory OpenAPI document | `$fetcher-openapi-types`     |
| Generate source files from YAML, JSON, or a URL   | `$fetcher-openapi-generator` |
| Call an API without code generation               | `$fetcher-integration`       |
