-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('owner', 'admin', 'viewer');

-- CreateEnum
CREATE TYPE "SystemStatus" AS ENUM ('active', 'disabled');

-- CreateEnum
CREATE TYPE "ClientStatus" AS ENUM ('active', 'revoked');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('pending', 'processing', 'success', 'retrying', 'fail', 'dead');

-- CreateEnum
CREATE TYPE "ProgressStatus" AS ENUM ('not_started', 'in_progress', 'done', 'blocked');

-- CreateTable
CREATE TABLE "users" (
    "id" BIGSERIAL NOT NULL,
    "ref" VARCHAR(64) NOT NULL,
    "email" VARCHAR(320) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'viewer',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "systems" (
    "id" BIGSERIAL NOT NULL,
    "ref" VARCHAR(64) NOT NULL,
    "code" VARCHAR(64) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "base_url" VARCHAR(500),
    "secret_ref" VARCHAR(200),
    "status" "SystemStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "systems_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_clients" (
    "id" BIGSERIAL NOT NULL,
    "ref" VARCHAR(64) NOT NULL,
    "system_id" BIGINT NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "scopes" TEXT[],
    "ip_allowlist" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "ClientStatus" NOT NULL DEFAULT 'active',
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "api_clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_keys" (
    "id" BIGSERIAL NOT NULL,
    "ref" VARCHAR(64) NOT NULL,
    "client_id" BIGINT NOT NULL,
    "key_hash" VARCHAR(255) NOT NULL,
    "key_prefix" VARCHAR(32) NOT NULL,
    "last_used_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inbound_events" (
    "id" BIGSERIAL NOT NULL,
    "ref" VARCHAR(64) NOT NULL,
    "idempotency_key" VARCHAR(256) NOT NULL,
    "payload_hash" VARCHAR(64) NOT NULL,
    "event_type" VARCHAR(128) NOT NULL,
    "source_system_id" BIGINT NOT NULL,
    "resource_type" VARCHAR(64) NOT NULL,
    "resource_id" VARCHAR(128) NOT NULL,
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "payload" JSONB NOT NULL,
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inbound_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "routes" (
    "id" BIGSERIAL NOT NULL,
    "ref" VARCHAR(64) NOT NULL,
    "source_system_id" BIGINT NOT NULL,
    "target_system_id" BIGINT NOT NULL,
    "event_type" VARCHAR(128) NOT NULL,
    "destination_path" VARCHAR(500) NOT NULL,
    "destination_key_tpl" VARCHAR(256) NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "routes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transform_rules" (
    "id" BIGSERIAL NOT NULL,
    "ref" VARCHAR(64) NOT NULL,
    "route_id" BIGINT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "input_schema" JSONB,
    "mapping" JSONB NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transform_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "id_mappings" (
    "id" BIGSERIAL NOT NULL,
    "ref" VARCHAR(64) NOT NULL,
    "system_id" BIGINT NOT NULL,
    "entity_type" VARCHAR(64) NOT NULL,
    "local_id" VARCHAR(128) NOT NULL,
    "remote_system" VARCHAR(64) NOT NULL,
    "remote_id" VARCHAR(128) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "id_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jobs" (
    "id" BIGSERIAL NOT NULL,
    "ref" VARCHAR(64) NOT NULL,
    "inbound_event_id" BIGINT NOT NULL,
    "route_id" BIGINT NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'pending',
    "destination_key" VARCHAR(256) NOT NULL,
    "transformed_body" JSONB,
    "last_error_code" VARCHAR(64),
    "last_error_msg" TEXT,
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "next_retry_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_attempts" (
    "id" BIGSERIAL NOT NULL,
    "ref" VARCHAR(64) NOT NULL,
    "job_id" BIGINT NOT NULL,
    "attempt_no" INTEGER NOT NULL,
    "status" "JobStatus" NOT NULL,
    "request_body" JSONB,
    "response_code" INTEGER,
    "response_body" TEXT,
    "error_code" VARCHAR(64),
    "error_msg" TEXT,
    "duration_ms" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" BIGSERIAL NOT NULL,
    "ref" VARCHAR(64) NOT NULL,
    "actor_label" VARCHAR(200) NOT NULL,
    "action" VARCHAR(64) NOT NULL,
    "target_type" VARCHAR(64) NOT NULL,
    "target_id" VARCHAR(128) NOT NULL,
    "ip" VARCHAR(64),
    "reason" TEXT,
    "meta" JSONB,
    "user_id" BIGINT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "progress_items" (
    "id" BIGSERIAL NOT NULL,
    "ref" VARCHAR(64) NOT NULL,
    "project_code" VARCHAR(64) NOT NULL,
    "wbs_code" VARCHAR(64) NOT NULL,
    "title" VARCHAR(300) NOT NULL,
    "status" "ProgressStatus" NOT NULL DEFAULT 'not_started',
    "percent" INTEGER NOT NULL DEFAULT 0,
    "note" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "progress_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "health_check_targets" (
    "id" BIGSERIAL NOT NULL,
    "ref" VARCHAR(64) NOT NULL,
    "code" VARCHAR(64) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "url" VARCHAR(500) NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "health_check_targets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "health_check_runs" (
    "id" BIGSERIAL NOT NULL,
    "ref" VARCHAR(64) NOT NULL,
    "target_id" BIGINT NOT NULL,
    "ok" BOOLEAN NOT NULL,
    "status_code" INTEGER,
    "latency_ms" INTEGER,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "health_check_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "operation_logs" (
    "id" BIGSERIAL NOT NULL,
    "ref" VARCHAR(64) NOT NULL,
    "category" VARCHAR(64) NOT NULL,
    "level" VARCHAR(16) NOT NULL,
    "message" TEXT NOT NULL,
    "meta" JSONB,
    "request_id" VARCHAR(64),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "operation_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "idempotency_records" (
    "id" BIGSERIAL NOT NULL,
    "idempotency_key" VARCHAR(256) NOT NULL,
    "payload_hash" VARCHAR(64) NOT NULL,
    "response_body" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "idempotency_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_ref_key" ON "users"("ref");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "systems_ref_key" ON "systems"("ref");

-- CreateIndex
CREATE UNIQUE INDEX "systems_code_key" ON "systems"("code");

-- CreateIndex
CREATE UNIQUE INDEX "api_clients_ref_key" ON "api_clients"("ref");

-- CreateIndex
CREATE INDEX "api_clients_system_id_idx" ON "api_clients"("system_id");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_ref_key" ON "api_keys"("ref");

-- CreateIndex
CREATE INDEX "api_keys_client_id_idx" ON "api_keys"("client_id");

-- CreateIndex
CREATE INDEX "api_keys_key_prefix_idx" ON "api_keys"("key_prefix");

-- CreateIndex
CREATE UNIQUE INDEX "inbound_events_ref_key" ON "inbound_events"("ref");

-- CreateIndex
CREATE INDEX "inbound_events_source_system_id_event_type_idx" ON "inbound_events"("source_system_id", "event_type");

-- CreateIndex
CREATE UNIQUE INDEX "inbound_events_idempotency_key_key" ON "inbound_events"("idempotency_key");

-- CreateIndex
CREATE UNIQUE INDEX "routes_ref_key" ON "routes"("ref");

-- CreateIndex
CREATE UNIQUE INDEX "routes_source_system_id_event_type_target_system_id_key" ON "routes"("source_system_id", "event_type", "target_system_id");

-- CreateIndex
CREATE UNIQUE INDEX "transform_rules_ref_key" ON "transform_rules"("ref");

-- CreateIndex
CREATE INDEX "transform_rules_route_id_idx" ON "transform_rules"("route_id");

-- CreateIndex
CREATE UNIQUE INDEX "id_mappings_ref_key" ON "id_mappings"("ref");

-- CreateIndex
CREATE INDEX "id_mappings_system_id_entity_type_local_id_idx" ON "id_mappings"("system_id", "entity_type", "local_id");

-- CreateIndex
CREATE UNIQUE INDEX "id_mappings_system_id_entity_type_local_id_remote_system_key" ON "id_mappings"("system_id", "entity_type", "local_id", "remote_system");

-- CreateIndex
CREATE UNIQUE INDEX "jobs_ref_key" ON "jobs"("ref");

-- CreateIndex
CREATE INDEX "jobs_status_next_retry_at_idx" ON "jobs"("status", "next_retry_at");

-- CreateIndex
CREATE INDEX "jobs_inbound_event_id_idx" ON "jobs"("inbound_event_id");

-- CreateIndex
CREATE UNIQUE INDEX "job_attempts_ref_key" ON "job_attempts"("ref");

-- CreateIndex
CREATE INDEX "job_attempts_job_id_idx" ON "job_attempts"("job_id");

-- CreateIndex
CREATE UNIQUE INDEX "audit_logs_ref_key" ON "audit_logs"("ref");

-- CreateIndex
CREATE INDEX "audit_logs_target_type_target_id_idx" ON "audit_logs"("target_type", "target_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "progress_items_ref_key" ON "progress_items"("ref");

-- CreateIndex
CREATE UNIQUE INDEX "progress_items_project_code_wbs_code_key" ON "progress_items"("project_code", "wbs_code");

-- CreateIndex
CREATE UNIQUE INDEX "health_check_targets_ref_key" ON "health_check_targets"("ref");

-- CreateIndex
CREATE UNIQUE INDEX "health_check_targets_code_key" ON "health_check_targets"("code");

-- CreateIndex
CREATE UNIQUE INDEX "health_check_runs_ref_key" ON "health_check_runs"("ref");

-- CreateIndex
CREATE INDEX "health_check_runs_target_id_created_at_idx" ON "health_check_runs"("target_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "operation_logs_ref_key" ON "operation_logs"("ref");

-- CreateIndex
CREATE INDEX "operation_logs_category_created_at_idx" ON "operation_logs"("category", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "idempotency_records_idempotency_key_key" ON "idempotency_records"("idempotency_key");

-- AddForeignKey
ALTER TABLE "api_clients" ADD CONSTRAINT "api_clients_system_id_fkey" FOREIGN KEY ("system_id") REFERENCES "systems"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "api_clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inbound_events" ADD CONSTRAINT "inbound_events_source_system_id_fkey" FOREIGN KEY ("source_system_id") REFERENCES "systems"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routes" ADD CONSTRAINT "routes_source_system_id_fkey" FOREIGN KEY ("source_system_id") REFERENCES "systems"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routes" ADD CONSTRAINT "routes_target_system_id_fkey" FOREIGN KEY ("target_system_id") REFERENCES "systems"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transform_rules" ADD CONSTRAINT "transform_rules_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "routes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "id_mappings" ADD CONSTRAINT "id_mappings_system_id_fkey" FOREIGN KEY ("system_id") REFERENCES "systems"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_inbound_event_id_fkey" FOREIGN KEY ("inbound_event_id") REFERENCES "inbound_events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "routes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_attempts" ADD CONSTRAINT "job_attempts_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "health_check_runs" ADD CONSTRAINT "health_check_runs_target_id_fkey" FOREIGN KEY ("target_id") REFERENCES "health_check_targets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

