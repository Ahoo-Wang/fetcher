---
type: llm
weight: 1
---

Judge only the agent's final answer. It worked in an empty, read-only directory, so ignore that it wrote no files, could not find the user's code, hedged, or asked follow-up questions: grade the code and explanation it gave. Accept any wording and any equivalent code.

PASS only if the answer does all of these:

1. Keeps the `{tenantId}` placeholder in the request URL (`/tenant/{tenantId}/orders`).
2. Relies on CoSec's resource attribution (`ResourceAttributionRequestInterceptor`, registered by `CoSecConfigurer`) to fill it from the current JWT.

FAIL if the answer does any of these:

- Decodes the JWT itself and interpolates the tenant id into the URL string.
