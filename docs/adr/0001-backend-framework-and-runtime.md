# ADR 0001: NestJS Monorepo with Kubernetes Deployment
- **Status:** Accepted
- **Date:** 2024-12-11
- **Tags:** backend, framework, runtime

## Context
We must deliver multiple backend capabilities (device onboarding, event ingestion, rules, notifications, API BFF) that share domain models, DTOs, and policy enforcement. The team is TypeScript-proficient, expects heavy use of decorators and metadata for validation, and plans to leverage both REST and GraphQL interfaces. Operational maturity requirements include per-service scaling, zero-downtime deploys, and portable infrastructure across environments.

## Decision
Adopt a NestJS-based monorepo managed with Nx. Each business capability is packaged as an independent NestJS service (REST, GraphQL, gRPC, WebSockets) sharing common libraries via Nx tooling. Services are containerized and deployed to Kubernetes (EKS/GKE) with Istio service mesh for mTLS and traffic management. Stateful dependencies (PostgreSQL, Redis, Kafka) run as managed cloud services, while stateless services run in Kubernetes with horizontal pod autoscaling.

## Consequences
- **Positive:**
  - Shared TypeScript libraries reduce duplication while retaining service isolation.
  - NestJS ecosystem provides batteries-included validation, Swagger/OpenAPI, and WebSocket support.
  - Kubernetes deployment plus service mesh enables blue/green releases, observability, and policy enforcement.
- **Negative:**
  - Nx monorepo adds tooling overhead and requires developer discipline for dependency boundaries.
  - Kubernetes adds operational complexity for a small team; mitigated via managed control planes and GitOps automation.
