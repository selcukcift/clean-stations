# AI Agent Database Interaction Guide

This guide is for AI coding agents interacting with the PostgreSQL database in the Torvan Medical CleanStation Production Workflow Application.

## 1. Database Access & Prisma

*   **Prisma ORM:** This project uses Prisma as its primary ORM for database interactions. You should leverage the Prisma Client for all database queries and mutations.
*   **Schema:** The Prisma schema is defined in `prisma/schema.prisma`. Familiarize yourself with the models and relations defined here.
*   **Prisma Client Generation:** After any changes to `prisma/schema.prisma`, the Prisma Client must be regenerated. Use the command:
    ```bash
    npx prisma generate
    ```
    (Note: The project also has `npm run prisma:generate` which might be equivalent).
*   **DATABASE_URL:** The database connection string is specified by the `DATABASE_URL` environment variable. This is typically loaded from a `.env` file (e.g., copied from `.env.home` or `.env.work`). Ensure this variable is correctly set in your environment for Prisma CLI and application runtime.
    *   The current production-like setup seems to expect PostgreSQL on `localhost:5433`. For example: `DATABASE_URL="postgresql://postgres:postgres@localhost:5433/torvan-db?schema=public"`

## 2. Migrations

*   **Running Migrations:** Database schema changes are managed by Prisma Migrate. To apply existing migrations or create new ones after schema changes, use:
    ```bash
    npx prisma migrate dev --name <descriptive_migration_name>
    ```
    (The project also has `npm run prisma:migrate`).
*   **Database Connectivity for Migrations:** The `prisma migrate dev` command **requires a running and accessible PostgreSQL server** as defined in `DATABASE_URL`. If the server is not running or accessible, migrations will fail.
    *   **Troubleshooting Connection Issues:**
        1.  Verify the `DATABASE_URL` in your active `.env` file is correct (especially host, port, user, password, database name).
        2.  Ensure the PostgreSQL server is running and listening on the specified host and port. Use `ss -tulnp | grep <port>` or similar tools to check.
        3.  If the server is not running, you'll need to start it. The method for starting PostgreSQL depends on the specific environment (e.g., `sudo systemctl start postgresql`, `pg_ctl start`, Docker commands, etc.). This project's exact start mechanism for the AI agent's environment needs to be clarified if not standard.
*   **Seeding:** After migrations, data seeding is often necessary. Use:
    ```bash
    npx prisma db seed
    ```
    (The project has `npm run prisma:seed` and `npm run prisma:seed:all`). The `scripts/` directory contains various seeding scripts.

## 3. Querying Data

*   Use the Prisma Client instance (e.g., `import { prisma } from 'lib/prisma';`) for type-safe database access.
*   Example:
    ```typescript
    // In an async function
    const orders = await prisma.order.findMany({
      where: { orderStatus: 'READY_FOR_PRE_QC' },
      include: { customer: true }, // Assuming a relation named 'customer'
    });
    ```

## 4. Modifying Data

*   Use Prisma Client methods like `create`, `update`, `delete`, `upsert`.
*   All data modifications should go through Prisma to maintain consistency and leverage its features.

## 5. Important Considerations for AI Agents

*   **Environment Variables:** Always ensure your execution environment has the `DATABASE_URL` correctly loaded for any database operations.
*   **Schema Synchronization:** If you modify `prisma/schema.prisma`, always run `npx prisma migrate dev` (with a running DB) and `npx prisma generate` to keep the database schema, Prisma Client, and your expectations aligned. If direct database access for migrations is problematic, this needs to be communicated.
*   **Error Handling:** Implement proper error handling for database operations, especially for connection issues, query failures, or constraint violations.
*   **Data Integrity:** Be mindful of data relationships, constraints, and cascading effects defined in the schema when writing data.
*   **Security:** Avoid constructing raw SQL queries if possible. Stick to Prisma Client's generated methods to prevent SQL injection vulnerabilities.

This guide should help you, the AI agent, interact with the database more effectively. If specific procedures for starting/managing the PostgreSQL instance in your sandboxed environment are available, they should be added here.
