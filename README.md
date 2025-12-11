# Security System Database Schema

This repository contains the database schema design for the Security & Access Control System.

## Structure

*   `database/migrations/`: SQL migration files to create the schema.
*   `database/seeds/`: SQL scripts to populate the database with initial data.
*   `docs/`: Detailed documentation and ER diagrams.

## Quick Start

1.  **Initialize Database**:
    Execute the migration files against your PostgreSQL database.
    ```bash
    psql -U your_user -d your_db -f database/migrations/001_initial_schema.sql
    ```

2.  **Seed Data**:
    Populate default roles and settings.
    ```bash
    psql -U your_user -d your_db -f database/seeds/001_seed_data.sql
    ```

## Documentation

See [docs/SCHEMA_DOCUMENTATION.md](docs/SCHEMA_DOCUMENTATION.md) for the ER diagram, detailed table descriptions, and indexing strategies.
