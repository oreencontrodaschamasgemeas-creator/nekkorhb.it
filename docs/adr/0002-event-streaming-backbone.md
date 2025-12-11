# ADR 0002: Kafka-Centric Event Streaming Backbone
- **Status:** Accepted
- **Date:** 2024-12-11
- **Tags:** data, streaming, telemetry

## Context
The platform must ingest high-volume telemetry from sensors, biometrics, and CCTV metadata, enrich it, and fan it out to rules, analytics, and notification engines with low latency. Workloads are bursty (alarms, evacuations), and downstream services must replay history for investigations. A simple REST pipeline or message queue would either overload upstream services or lack strong ordering and retention guarantees.

## Decision
Use Apache Kafka (managed MSK/Confluent) as the central streaming backbone. Edge and ingestion services publish normalized events to tenant-partitioned Kafka topics using protobuf schemas. Rules engines, notification orchestrators, analytics pipelines, and archival services consume from specific topics, leveraging consumer groups for horizontal scaling. Kafka retention policies and tiered storage back incident replay and forensic exports.

## Consequences
- **Positive:**
  - Durable, ordered event streams decouple device ingestion from downstream processing and support replay.
  - Kafka Connect & Stream processing (Kafka Streams/Flink) simplify enrichment and fan-out logic.
  - Tenant isolation via namespaces/ACLs aligns with compliance requirements.
- **Negative:**
  - Operating Kafka requires expertise; mitigated by opting for managed offerings and Infrastructure as Code automation.
  - Developers must model schemas carefully to avoid breaking consumers; enforced via schema registry and CI contract tests.
