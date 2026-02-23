-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'ADMIN',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "must_change_password" BOOLEAN NOT NULL DEFAULT true,
    "profile_photo_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_proposal_access" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "proposal" TEXT NOT NULL,
    "access_token" TEXT NOT NULL,
    "dispatched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dispatch_mode" TEXT NOT NULL,
    "dispatched_by" TEXT,
    "deadline" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_proposal_access_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_orders" (
    "id" TEXT NOT NULL,
    "proposal" TEXT NOT NULL,
    "line_number" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT '',
    "client_name" TEXT NOT NULL DEFAULT '',
    "client_email" TEXT NOT NULL DEFAULT '',
    "game" TEXT NOT NULL DEFAULT '',
    "hotel" TEXT NOT NULL DEFAULT '',
    "room_type" TEXT NOT NULL DEFAULT '',
    "number_of_rooms" INTEGER NOT NULL DEFAULT 0,
    "number_of_pax" INTEGER NOT NULL DEFAULT 0,
    "check_in" TEXT NOT NULL DEFAULT '',
    "check_out" TEXT NOT NULL DEFAULT '',
    "ticket_category" TEXT NOT NULL DEFAULT '',
    "seller" TEXT NOT NULL DEFAULT '',
    "raw_data" JSONB NOT NULL,
    "raw_hash" TEXT NOT NULL,
    "last_synced_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_logs" (
    "id" TEXT NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'RUNNING',
    "rows_read" INTEGER NOT NULL DEFAULT 0,
    "rows_upserted" INTEGER NOT NULL DEFAULT 0,
    "rows_skipped" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,

    CONSTRAINT "sync_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_field_definitions" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label_pt" TEXT NOT NULL,
    "label_en" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "fillable_by" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "options" JSONB,
    "placeholder_pt" TEXT,
    "placeholder_en" TEXT,

    CONSTRAINT "form_field_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_instances" (
    "id" TEXT NOT NULL,
    "proposal" TEXT NOT NULL,
    "access_id" TEXT NOT NULL,
    "capture_status" TEXT NOT NULL DEFAULT 'AWAITING_FILL',
    "total_slots" INTEGER NOT NULL DEFAULT 0,
    "filled_slots" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "form_instances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "passenger_slots" (
    "id" TEXT NOT NULL,
    "form_instance_id" TEXT NOT NULL,
    "room_label" TEXT NOT NULL,
    "slot_index" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "passenger_slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_responses" (
    "id" TEXT NOT NULL,
    "passenger_slot_id" TEXT NOT NULL,
    "answers" JSONB NOT NULL,
    "submitted_by" TEXT,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "form_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" TEXT,
    "user_role" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT,
    "entity_id" TEXT,
    "ip_address" TEXT,
    "payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "client_proposal_access_access_token_key" ON "client_proposal_access"("access_token");

-- CreateIndex
CREATE UNIQUE INDEX "client_proposal_access_user_id_proposal_key" ON "client_proposal_access"("user_id", "proposal");

-- CreateIndex
CREATE INDEX "sales_orders_proposal_idx" ON "sales_orders"("proposal");

-- CreateIndex
CREATE INDEX "sales_orders_status_idx" ON "sales_orders"("status");

-- CreateIndex
CREATE INDEX "sales_orders_client_email_idx" ON "sales_orders"("client_email");

-- CreateIndex
CREATE INDEX "sales_orders_game_idx" ON "sales_orders"("game");

-- CreateIndex
CREATE INDEX "sales_orders_hotel_idx" ON "sales_orders"("hotel");

-- CreateIndex
CREATE INDEX "sales_orders_seller_idx" ON "sales_orders"("seller");

-- CreateIndex
CREATE UNIQUE INDEX "sales_orders_proposal_line_number_key" ON "sales_orders"("proposal", "line_number");

-- CreateIndex
CREATE UNIQUE INDEX "form_field_definitions_key_key" ON "form_field_definitions"("key");

-- CreateIndex
CREATE UNIQUE INDEX "form_instances_access_id_key" ON "form_instances"("access_id");

-- CreateIndex
CREATE INDEX "form_instances_proposal_idx" ON "form_instances"("proposal");

-- CreateIndex
CREATE UNIQUE INDEX "form_responses_passenger_slot_id_key" ON "form_responses"("passenger_slot_id");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_timestamp_idx" ON "audit_logs"("timestamp");

-- AddForeignKey
ALTER TABLE "client_proposal_access" ADD CONSTRAINT "client_proposal_access_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_instances" ADD CONSTRAINT "form_instances_access_id_fkey" FOREIGN KEY ("access_id") REFERENCES "client_proposal_access"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "passenger_slots" ADD CONSTRAINT "passenger_slots_form_instance_id_fkey" FOREIGN KEY ("form_instance_id") REFERENCES "form_instances"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_responses" ADD CONSTRAINT "form_responses_passenger_slot_id_fkey" FOREIGN KEY ("passenger_slot_id") REFERENCES "passenger_slots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
