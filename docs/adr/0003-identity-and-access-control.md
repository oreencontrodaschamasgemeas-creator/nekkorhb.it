# ADR 0003: OAuth2/OIDC with Centralized RBAC Enforcement
- **Status:** Accepted
- **Date:** 2024-12-11
- **Tags:** security, identity, compliance

## Context
Customers require granular control over who can access building devices, CCTV feeds, and incident data. The platform must support web dashboards, mobile apps, machine-to-machine integrations, and on-prem edge gateways. Regulations (SOC2, GDPR) demand auditable authentication, short-lived credentials, and least-privilege authorization. Building a custom auth stack would be costly and risky.

## Decision
Adopt an OAuth2/OIDC identity provider (Keycloak/Auth0) for user federation, MFA, and centralized policy management. All interactive clients use Authorization Code + PKCE; machine clients use Client Credentials; edge gateways use mutual TLS plus signed JWT assertions. A dedicated authorization service evaluates RBAC policies via OPA/Casbin, embedding role, tenant, and site attributes inside JWT claims. Service-to-service calls are mutually authenticated through the service mesh (mTLS) and re-authorized with fine-grained scopes.

## Consequences
- **Positive:**
  - Standards-based flows simplify integration with existing enterprise identity providers and provide SSO/MFA.
  - Centralized policy evaluation reduces drift and ensures consistent RBAC enforcement across web, mobile, and APIs.
  - Short-lived tokens with refresh workflows align with zero-trust and compliance requirements.
- **Negative:**
  - Requires investment in policy authoring tooling and education for customer admins.
  - Edge cases (offline edge gateways) need token bootstrap + rotation workflows to avoid service disruption.
