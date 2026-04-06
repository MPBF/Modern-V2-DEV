CREATE TABLE "admin_decisions" (
        "id" serial PRIMARY KEY NOT NULL,
        "title" varchar(100) NOT NULL,
        "title_ar" varchar(100),
        "description" text,
        "target_type" varchar(20),
        "target_id" integer,
        "date" date NOT NULL,
        "issued_by" varchar(20)
);
--> statement-breakpoint
CREATE TABLE "ai_agent_knowledge" (
        "id" serial PRIMARY KEY NOT NULL,
        "title" varchar(255) NOT NULL,
        "content" text NOT NULL,
        "category" varchar(50) DEFAULT 'general' NOT NULL,
        "is_active" boolean DEFAULT true NOT NULL,
        "created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
        "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
        "created_by" integer
);
--> statement-breakpoint
CREATE TABLE "ai_agent_settings" (
        "id" serial PRIMARY KEY NOT NULL,
        "key" varchar(100) NOT NULL,
        "value" text NOT NULL,
        "description" text,
        "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
        "updated_by" integer,
        CONSTRAINT "ai_agent_settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "alert_rules" (
        "id" serial PRIMARY KEY NOT NULL,
        "name" varchar(100) NOT NULL,
        "name_ar" varchar(100),
        "description" text,
        "description_ar" text,
        "monitor_type" varchar(50) NOT NULL,
        "rule_type" varchar(30) NOT NULL,
        "conditions" json NOT NULL,
        "threshold_value" numeric(15, 4),
        "comparison_operator" varchar(10),
        "check_frequency" varchar(20) DEFAULT '5min' NOT NULL,
        "severity" varchar(20) DEFAULT 'medium' NOT NULL,
        "is_enabled" boolean DEFAULT true,
        "notification_template" text,
        "notification_template_ar" text,
        "escalation_rules" json,
        "suppress_duration" integer DEFAULT 60,
        "created_by" integer,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "attendance" (
        "id" serial PRIMARY KEY NOT NULL,
        "user_id" integer NOT NULL,
        "status" varchar(20) DEFAULT 'غائب' NOT NULL,
        "check_in_time" timestamp,
        "check_out_time" timestamp,
        "lunch_start_time" timestamp,
        "lunch_end_time" timestamp,
        "break_start_time" timestamp,
        "break_end_time" timestamp,
        "work_hours" double precision,
        "overtime_hours" double precision,
        "shift_type" varchar(20) DEFAULT 'صباحي',
        "late_minutes" integer DEFAULT 0,
        "early_leave_minutes" integer DEFAULT 0,
        "location_accuracy" double precision,
        "distance_from_factory" double precision,
        "device_info" text,
        "notes" text,
        "created_by" integer,
        "updated_by" integer,
        "date" date DEFAULT CURRENT_DATE NOT NULL,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "batch_ingredients" (
        "id" serial PRIMARY KEY NOT NULL,
        "batch_id" integer NOT NULL,
        "item_id" varchar(20) NOT NULL,
        "actual_weight_kg" numeric(10, 2) NOT NULL,
        "percentage" numeric(5, 2),
        "notes" text,
        CONSTRAINT "actual_weight_positive" CHECK ("batch_ingredients"."actual_weight_kg" > 0),
        CONSTRAINT "percentage_valid" CHECK ("batch_ingredients"."percentage" IS NULL OR ("batch_ingredients"."percentage" > 0 AND "batch_ingredients"."percentage" <= 100))
);
--> statement-breakpoint
CREATE TABLE "categories" (
        "id" varchar(20) PRIMARY KEY NOT NULL,
        "name" varchar(100) NOT NULL,
        "name_ar" varchar(100),
        "code" varchar(20),
        "parent_id" varchar(20)
);
--> statement-breakpoint
CREATE TABLE "company_profile" (
        "id" serial PRIMARY KEY NOT NULL,
        "name" varchar(100) NOT NULL,
        "name_ar" varchar(100),
        "address" text,
        "tax_number" varchar(20),
        "phone" varchar(20),
        "email" varchar(100),
        "logo_url" varchar(255),
        "working_hours_per_day" integer DEFAULT 8,
        "default_language" varchar(10) DEFAULT 'ar'
);
--> statement-breakpoint
CREATE TABLE "consumable_parts" (
        "id" serial PRIMARY KEY NOT NULL,
        "part_id" varchar(50) NOT NULL,
        "type" varchar(100) NOT NULL,
        "code" varchar(50) NOT NULL,
        "current_quantity" integer DEFAULT 0 NOT NULL,
        "min_quantity" integer DEFAULT 0,
        "max_quantity" integer DEFAULT 0,
        "unit" varchar(20) DEFAULT 'قطعة',
        "barcode" varchar(100),
        "location" varchar(100),
        "notes" text,
        "status" varchar(20) DEFAULT 'active',
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now(),
        CONSTRAINT "consumable_parts_part_id_unique" UNIQUE("part_id"),
        CONSTRAINT "current_quantity_non_negative" CHECK ("consumable_parts"."current_quantity" >= 0),
        CONSTRAINT "min_quantity_non_negative" CHECK ("consumable_parts"."min_quantity" >= 0),
        CONSTRAINT "max_quantity_non_negative" CHECK ("consumable_parts"."max_quantity" >= 0),
        CONSTRAINT "consumable_status_valid" CHECK ("consumable_parts"."status" IN ('active', 'inactive'))
);
--> statement-breakpoint
CREATE TABLE "consumable_parts_transactions" (
        "id" serial PRIMARY KEY NOT NULL,
        "transaction_id" varchar(50) NOT NULL,
        "consumable_part_id" integer NOT NULL,
        "transaction_type" varchar(10) NOT NULL,
        "quantity" integer NOT NULL,
        "barcode_scanned" varchar(100),
        "manual_entry" boolean DEFAULT false,
        "transaction_reason" varchar(100),
        "notes" text,
        "performed_by" integer NOT NULL,
        "created_at" timestamp DEFAULT now(),
        CONSTRAINT "consumable_parts_transactions_transaction_id_unique" UNIQUE("transaction_id"),
        CONSTRAINT "quantity_positive" CHECK ("consumable_parts_transactions"."quantity" > 0),
        CONSTRAINT "transaction_type_valid" CHECK ("consumable_parts_transactions"."transaction_type" IN ('in', 'out'))
);
--> statement-breakpoint
CREATE TABLE "corrective_actions" (
        "id" serial PRIMARY KEY NOT NULL,
        "alert_id" integer,
        "action_type" varchar(30) NOT NULL,
        "action_title" varchar(200) NOT NULL,
        "action_description" text NOT NULL,
        "action_description_ar" text,
        "status" varchar(20) DEFAULT 'pending' NOT NULL,
        "assigned_to" integer,
        "priority" varchar(20) DEFAULT 'medium' NOT NULL,
        "estimated_duration" integer,
        "actual_duration" integer,
        "success_rate" numeric(5, 2),
        "notes" text,
        "created_by" integer,
        "completed_by" integer,
        "completed_at" timestamp,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "customer_products" (
        "id" serial PRIMARY KEY NOT NULL,
        "customer_id" varchar(20),
        "category_id" varchar(20),
        "item_id" varchar(20),
        "size_caption" varchar(50),
        "width" numeric(8, 2),
        "left_facing" numeric(8, 2),
        "right_facing" numeric(8, 2),
        "thickness" numeric(6, 3),
        "printing_cylinder" varchar(10),
        "cutting_length_cm" integer,
        "raw_material" varchar(20),
        "master_batch_id" varchar(20),
        "is_printed" boolean DEFAULT false,
        "cutting_unit" varchar(20),
        "punching" varchar(20),
        "unit_weight_kg" numeric(8, 3),
        "unit_quantity" integer,
        "package_weight_kg" numeric(8, 2),
        "cliche_front_design" text,
        "cliche_back_design" text,
        "notes" text,
        "status" varchar(20) DEFAULT 'active',
        "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "customers" (
        "id" varchar(20) PRIMARY KEY NOT NULL,
        "name" varchar(200) NOT NULL,
        "name_ar" varchar(200),
        "code" varchar(20),
        "user_id" varchar(10),
        "plate_drawer_code" varchar(20),
        "city" varchar(50),
        "address" text,
        "tax_number" varchar(14),
        "commercial_name" varchar(200),
        "unified_number" varchar(10),
        "unique_customer_number" varchar(20),
        "is_active" boolean DEFAULT true,
        "phone" varchar(20),
        "sales_rep_id" integer,
        "created_at" timestamp DEFAULT now(),
        CONSTRAINT "unified_number_format" CHECK ("customers"."unified_number" IS NULL OR "customers"."unified_number" ~ '^7[0-9]{9}$'),
        CONSTRAINT "tax_number_length" CHECK ("customers"."tax_number" IS NULL OR LENGTH("customers"."tax_number") = 14)
);
--> statement-breakpoint
CREATE TABLE "cuts" (
        "id" serial PRIMARY KEY NOT NULL,
        "roll_id" integer NOT NULL,
        "cut_weight_kg" numeric(12, 3) NOT NULL,
        "pieces_count" integer,
        "performed_by" integer,
        "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "display_slides" (
        "id" serial PRIMARY KEY NOT NULL,
        "title" varchar(200) NOT NULL,
        "slide_type" varchar(50) NOT NULL,
        "content" jsonb,
        "duration_seconds" integer DEFAULT 10,
        "sort_order" integer DEFAULT 0,
        "is_active" boolean DEFAULT true,
        "created_by" integer,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "factory_layouts" (
        "id" serial PRIMARY KEY NOT NULL,
        "name" varchar(100) DEFAULT 'default',
        "layout_data" jsonb NOT NULL,
        "updated_at" timestamp DEFAULT now(),
        "updated_by" integer
);
--> statement-breakpoint
CREATE TABLE "factory_locations" (
        "id" serial PRIMARY KEY NOT NULL,
        "name" varchar(100) NOT NULL,
        "name_ar" varchar(100) NOT NULL,
        "latitude" numeric(10, 7) NOT NULL,
        "longitude" numeric(10, 7) NOT NULL,
        "allowed_radius" integer DEFAULT 500 NOT NULL,
        "is_active" boolean DEFAULT true NOT NULL,
        "description" text,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now(),
        "created_by" integer
);
--> statement-breakpoint
CREATE TABLE "factory_snapshots" (
        "id" serial PRIMARY KEY NOT NULL,
        "name" varchar(200) NOT NULL,
        "comment" text,
        "layout_data" jsonb NOT NULL,
        "share_token" varchar(64),
        "created_by" integer,
        "created_at" timestamp DEFAULT now(),
        CONSTRAINT "factory_snapshots_share_token_unique" UNIQUE("share_token")
);
--> statement-breakpoint
CREATE TABLE "finished_goods_vouchers_in" (
        "id" serial PRIMARY KEY NOT NULL,
        "voucher_number" varchar(50) NOT NULL,
        "voucher_type" varchar(30) DEFAULT 'production_receipt' NOT NULL,
        "production_order_id" integer,
        "roll_id" integer,
        "order_id" integer,
        "customer_id" varchar(20),
        "product_description" text,
        "quantity" numeric(12, 3) NOT NULL,
        "unit" varchar(20) DEFAULT 'كيلو' NOT NULL,
        "weight_kg" numeric(12, 3),
        "pieces_count" integer,
        "packages_count" integer,
        "batch_number" varchar(50),
        "barcode" varchar(100),
        "qr_code" text,
        "location_id" varchar(20),
        "from_production_line" varchar(100),
        "quality_check_status" varchar(20) DEFAULT 'pending',
        "notes" text,
        "received_by" integer NOT NULL,
        "delivered_by" varchar(100),
        "voucher_date" date DEFAULT CURRENT_DATE NOT NULL,
        "status" varchar(20) DEFAULT 'completed' NOT NULL,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now(),
        CONSTRAINT "finished_goods_vouchers_in_voucher_number_unique" UNIQUE("voucher_number")
);
--> statement-breakpoint
CREATE TABLE "finished_goods_vouchers_out" (
        "id" serial PRIMARY KEY NOT NULL,
        "voucher_number" varchar(50) NOT NULL,
        "voucher_type" varchar(30) DEFAULT 'customer_delivery' NOT NULL,
        "order_id" integer,
        "production_order_id" integer,
        "customer_id" varchar(20) NOT NULL,
        "driver_name" varchar(100),
        "driver_phone" varchar(20),
        "vehicle_number" varchar(50),
        "product_description" text,
        "quantity" numeric(12, 3) NOT NULL,
        "unit" varchar(20) DEFAULT 'كيلو' NOT NULL,
        "weight_kg" numeric(12, 3),
        "pieces_count" integer,
        "packages_count" integer,
        "batch_number" varchar(50),
        "barcode" varchar(100),
        "from_location_id" varchar(20),
        "delivery_address" text,
        "notes" text,
        "issued_by" integer NOT NULL,
        "received_by_name" varchar(100),
        "received_by_signature" text,
        "voucher_date" date DEFAULT CURRENT_DATE NOT NULL,
        "status" varchar(20) DEFAULT 'completed' NOT NULL,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now(),
        CONSTRAINT "finished_goods_vouchers_out_voucher_number_unique" UNIQUE("voucher_number")
);
--> statement-breakpoint
CREATE TABLE "inventory" (
        "id" serial PRIMARY KEY NOT NULL,
        "item_id" varchar(20) NOT NULL,
        "location_id" varchar(20),
        "current_stock" numeric(10, 2) DEFAULT '0' NOT NULL,
        "min_stock" numeric(10, 2) DEFAULT '0' NOT NULL,
        "max_stock" numeric(10, 2) DEFAULT '0' NOT NULL,
        "unit" varchar(20) DEFAULT 'كيلو' NOT NULL,
        "cost_per_unit" numeric(10, 4),
        "last_updated" timestamp DEFAULT now() NOT NULL,
        CONSTRAINT "current_stock_non_negative" CHECK ("inventory"."current_stock" >= 0),
        CONSTRAINT "min_stock_non_negative" CHECK ("inventory"."min_stock" >= 0),
        CONSTRAINT "max_stock_non_negative" CHECK ("inventory"."max_stock" >= 0),
        CONSTRAINT "stock_threshold_logical" CHECK ("inventory"."max_stock" >= "inventory"."min_stock"),
        CONSTRAINT "cost_per_unit_valid" CHECK ("inventory"."cost_per_unit" IS NULL OR "inventory"."cost_per_unit" >= 0),
        CONSTRAINT "unit_valid" CHECK ("inventory"."unit" IN ('كيلو', 'قطعة', 'رول', 'علبة', 'kg', 'piece', 'roll', 'package')),
        CONSTRAINT "item_location_unique" CHECK (TRUE)
);
--> statement-breakpoint
CREATE TABLE "inventory_count_items" (
        "id" serial PRIMARY KEY NOT NULL,
        "count_id" integer NOT NULL,
        "item_id" varchar(20) NOT NULL,
        "barcode" varchar(100),
        "system_quantity" numeric(12, 3) NOT NULL,
        "counted_quantity" numeric(12, 3) NOT NULL,
        "difference" numeric(12, 3) NOT NULL,
        "unit" varchar(20) DEFAULT 'كيلو' NOT NULL,
        "location_id" varchar(20),
        "notes" text,
        "adjustment_created" boolean DEFAULT false,
        "counted_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "inventory_counts" (
        "id" serial PRIMARY KEY NOT NULL,
        "count_number" varchar(50) NOT NULL,
        "count_type" varchar(30) DEFAULT 'periodic' NOT NULL,
        "count_date" date DEFAULT CURRENT_DATE NOT NULL,
        "location_id" varchar(20),
        "status" varchar(20) DEFAULT 'in_progress' NOT NULL,
        "notes" text,
        "counted_by" integer NOT NULL,
        "approved_by" integer,
        "approved_at" timestamp,
        "total_items_counted" integer DEFAULT 0,
        "total_discrepancies" integer DEFAULT 0,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now(),
        CONSTRAINT "inventory_counts_count_number_unique" UNIQUE("count_number")
);
--> statement-breakpoint
CREATE TABLE "inventory_movements" (
        "id" serial PRIMARY KEY NOT NULL,
        "inventory_id" integer NOT NULL,
        "movement_type" varchar(20) NOT NULL,
        "quantity" numeric(10, 2) NOT NULL,
        "unit_cost" numeric(10, 4),
        "total_cost" numeric(10, 4),
        "reference_number" varchar(50),
        "reference_type" varchar(20),
        "notes" text,
        "created_by" integer NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        CONSTRAINT "quantity_positive" CHECK ("inventory_movements"."quantity" > 0),
        CONSTRAINT "unit_cost_valid" CHECK ("inventory_movements"."unit_cost" IS NULL OR "inventory_movements"."unit_cost" >= 0),
        CONSTRAINT "total_cost_valid" CHECK ("inventory_movements"."total_cost" IS NULL OR "inventory_movements"."total_cost" >= 0),
        CONSTRAINT "movement_type_valid" CHECK ("inventory_movements"."movement_type" IN ('in', 'out', 'transfer', 'adjustment')),
        CONSTRAINT "reference_type_valid" CHECK ("inventory_movements"."reference_type" IS NULL OR "inventory_movements"."reference_type" IN ('purchase', 'sale', 'production', 'adjustment', 'transfer')),
        CONSTRAINT "total_cost_logical" CHECK ("inventory_movements"."total_cost" IS NULL OR "inventory_movements"."unit_cost" IS NULL OR "inventory_movements"."total_cost" = "inventory_movements"."unit_cost" * "inventory_movements"."quantity")
);
--> statement-breakpoint
CREATE TABLE "items" (
        "id" varchar(20) PRIMARY KEY NOT NULL,
        "category_id" varchar(20),
        "name" varchar(100),
        "name_ar" varchar(100),
        "code" varchar(50),
        "status" varchar(20) DEFAULT 'active'
);
--> statement-breakpoint
CREATE TABLE "leave_balances" (
        "id" serial PRIMARY KEY NOT NULL,
        "employee_id" varchar(20) NOT NULL,
        "leave_type_id" integer NOT NULL,
        "year" integer NOT NULL,
        "allocated_days" integer NOT NULL,
        "used_days" integer DEFAULT 0,
        "pending_days" integer DEFAULT 0,
        "remaining_days" integer NOT NULL,
        "carried_forward" integer DEFAULT 0,
        "expires_at" date
);
--> statement-breakpoint
CREATE TABLE "leave_requests" (
        "id" serial PRIMARY KEY NOT NULL,
        "employee_id" varchar(20) NOT NULL,
        "leave_type_id" integer NOT NULL,
        "start_date" date NOT NULL,
        "end_date" date NOT NULL,
        "days_count" integer NOT NULL,
        "reason" text,
        "medical_certificate_url" varchar(500),
        "emergency_contact" varchar(100),
        "work_handover" text,
        "replacement_employee_id" varchar(20),
        "direct_manager_id" varchar(20),
        "direct_manager_status" varchar(20) DEFAULT 'pending',
        "direct_manager_comments" text,
        "direct_manager_action_date" timestamp,
        "hr_status" varchar(20) DEFAULT 'pending',
        "hr_comments" text,
        "hr_action_date" timestamp,
        "hr_reviewed_by" varchar(20),
        "final_status" varchar(20) DEFAULT 'pending',
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "leave_types" (
        "id" serial PRIMARY KEY NOT NULL,
        "name" varchar(100) NOT NULL,
        "name_ar" varchar(100),
        "description" text,
        "description_ar" text,
        "days_per_year" integer,
        "is_paid" boolean DEFAULT true,
        "requires_medical_certificate" boolean DEFAULT false,
        "min_notice_days" integer DEFAULT 1,
        "max_consecutive_days" integer,
        "applicable_after_months" integer DEFAULT 0,
        "color" varchar(20) DEFAULT '#3b82f6',
        "is_active" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "locations" (
        "id" varchar(20) PRIMARY KEY NOT NULL,
        "name" varchar(100) NOT NULL,
        "name_ar" varchar(100),
        "coordinates" varchar(100),
        "tolerance_range" integer
);
--> statement-breakpoint
CREATE TABLE "machine_queues" (
        "id" serial PRIMARY KEY NOT NULL,
        "machine_id" varchar(20) NOT NULL,
        "production_order_id" integer NOT NULL,
        "queue_position" integer NOT NULL,
        "estimated_start_time" timestamp,
        "assigned_at" timestamp DEFAULT now(),
        "assigned_by" integer,
        "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "machines" (
        "id" varchar(20) PRIMARY KEY NOT NULL,
        "name" varchar(100) NOT NULL,
        "name_ar" varchar(100),
        "type" varchar(50) NOT NULL,
        "section_id" varchar(20),
        "status" varchar(20) DEFAULT 'active' NOT NULL,
        "capacity_small_kg_per_hour" numeric(8, 2),
        "capacity_medium_kg_per_hour" numeric(8, 2),
        "capacity_large_kg_per_hour" numeric(8, 2),
        "screw_type" varchar(10) DEFAULT 'A',
        CONSTRAINT "machine_id_format" CHECK ("machines"."id" ~ '^M[0-9]{3}$'),
        CONSTRAINT "type_valid" CHECK ("machines"."type" IN ('extruder', 'printer', 'cutter', 'quality_check')),
        CONSTRAINT "status_valid" CHECK ("machines"."status" IN ('active', 'maintenance', 'down')),
        CONSTRAINT "name_not_empty" CHECK (LENGTH(TRIM("machines"."name")) > 0),
        CONSTRAINT "screw_type_valid" CHECK ("machines"."screw_type" IS NULL OR "machines"."screw_type" IN ('A', 'ABA'))
);
--> statement-breakpoint
CREATE TABLE "maintenance_actions" (
        "id" serial PRIMARY KEY NOT NULL,
        "action_number" varchar(50) NOT NULL,
        "maintenance_request_id" integer NOT NULL,
        "action_type" varchar(50) NOT NULL,
        "description" text,
        "text_report" text,
        "spare_parts_request" text,
        "machining_request" text,
        "operator_negligence_report" text,
        "performed_by" integer NOT NULL,
        "request_created_by" integer,
        "requires_management_action" boolean DEFAULT false,
        "management_notified" boolean DEFAULT false,
        "action_date" timestamp DEFAULT now(),
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now(),
        CONSTRAINT "maintenance_actions_action_number_unique" UNIQUE("action_number")
);
--> statement-breakpoint
CREATE TABLE "maintenance_reports" (
        "id" serial PRIMARY KEY NOT NULL,
        "report_number" varchar(50) NOT NULL,
        "maintenance_action_id" integer NOT NULL,
        "report_type" varchar(30) NOT NULL,
        "title" varchar(200) NOT NULL,
        "description" text NOT NULL,
        "priority" varchar(20) DEFAULT 'normal',
        "status" varchar(20) DEFAULT 'pending',
        "reviewed_by" integer,
        "review_notes" text,
        "review_date" timestamp,
        "created_by" integer NOT NULL,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now(),
        CONSTRAINT "maintenance_reports_report_number_unique" UNIQUE("report_number")
);
--> statement-breakpoint
CREATE TABLE "maintenance_requests" (
        "id" serial PRIMARY KEY NOT NULL,
        "request_number" varchar(50) NOT NULL,
        "machine_id" varchar(20),
        "reported_by" integer,
        "issue_type" varchar(50),
        "description" text,
        "urgency_level" varchar(20) DEFAULT 'normal',
        "status" varchar(20) DEFAULT 'open',
        "assigned_to" integer,
        "action_taken" text,
        "date_reported" timestamp DEFAULT now(),
        "date_resolved" timestamp,
        CONSTRAINT "maintenance_requests_request_number_unique" UNIQUE("request_number")
);
--> statement-breakpoint
CREATE TABLE "master_batch_colors" (
        "id" varchar(20) PRIMARY KEY NOT NULL,
        "name" varchar(100) NOT NULL,
        "name_ar" varchar(100) NOT NULL,
        "color_hex" varchar(20) DEFAULT '#FFFFFF' NOT NULL,
        "text_color" varchar(20) DEFAULT '#000000' NOT NULL,
        "brand" varchar(100),
        "aliases" text,
        "is_active" boolean DEFAULT true NOT NULL,
        "sort_order" integer DEFAULT 0,
        "created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
        "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mixing_batches" (
        "id" serial PRIMARY KEY NOT NULL,
        "batch_number" varchar(50) NOT NULL,
        "production_order_id" integer NOT NULL,
        "machine_id" varchar(20) NOT NULL,
        "screw_assignment" varchar(10) DEFAULT 'A' NOT NULL,
        "operator_id" integer NOT NULL,
        "total_weight_kg" numeric(10, 2) NOT NULL,
        "status" varchar(30) DEFAULT 'completed' NOT NULL,
        "notes" text,
        "created_at" timestamp DEFAULT now() NOT NULL,
        CONSTRAINT "mixing_batches_batch_number_unique" UNIQUE("batch_number"),
        CONSTRAINT "total_weight_positive" CHECK ("mixing_batches"."total_weight_kg" > 0),
        CONSTRAINT "screw_assignment_valid" CHECK ("mixing_batches"."screw_assignment" IN ('A', 'B'))
);
--> statement-breakpoint
CREATE TABLE "note_attachments" (
        "id" serial PRIMARY KEY NOT NULL,
        "note_id" integer NOT NULL,
        "file_name" varchar(255) NOT NULL,
        "file_type" varchar(100) NOT NULL,
        "file_size" integer NOT NULL,
        "file_url" text NOT NULL,
        "uploaded_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "notification_event_logs" (
        "id" serial PRIMARY KEY NOT NULL,
        "event_setting_id" integer,
        "event_key" varchar(100) NOT NULL,
        "trigger_context_type" varchar(50),
        "trigger_context_id" varchar(50),
        "trigger_data" json,
        "message_sent" text,
        "message_sent_ar" text,
        "recipient_phone" varchar(30),
        "recipient_user_id" integer,
        "recipient_name" varchar(200),
        "status" varchar(30) DEFAULT 'pending',
        "error_message" text,
        "external_message_id" varchar(100),
        "triggered_at" timestamp DEFAULT now(),
        "sent_at" timestamp,
        "delivered_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "notification_event_settings" (
        "id" serial PRIMARY KEY NOT NULL,
        "event_key" varchar(100) NOT NULL,
        "event_name" varchar(200) NOT NULL,
        "event_name_ar" varchar(200) NOT NULL,
        "event_description" text,
        "event_description_ar" text,
        "event_category" varchar(50) NOT NULL,
        "is_enabled" boolean DEFAULT true,
        "whatsapp_enabled" boolean DEFAULT false,
        "whatsapp_template_id" integer,
        "message_template" text,
        "message_template_ar" text,
        "recipient_type" varchar(30) DEFAULT 'specific_users',
        "recipient_user_ids" json,
        "recipient_role_ids" json,
        "recipient_phone_numbers" json,
        "notify_customer" boolean DEFAULT false,
        "condition_enabled" boolean DEFAULT false,
        "condition_field" varchar(100),
        "condition_operator" varchar(20),
        "condition_value" varchar(100),
        "priority" varchar(20) DEFAULT 'normal',
        "delay_minutes" integer DEFAULT 0,
        "created_by" integer,
        "updated_by" integer,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now(),
        CONSTRAINT "notification_event_settings_event_key_unique" UNIQUE("event_key")
);
--> statement-breakpoint
CREATE TABLE "notification_templates" (
        "id" serial PRIMARY KEY NOT NULL,
        "name" varchar(100) NOT NULL,
        "name_ar" varchar(100),
        "title_template" varchar(200) NOT NULL,
        "title_template_ar" varchar(200),
        "message_template" text NOT NULL,
        "message_template_ar" text,
        "type" varchar(30) NOT NULL,
        "trigger_event" varchar(50) NOT NULL,
        "is_active" boolean DEFAULT true,
        "variables" json,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "notifications" (
        "id" serial PRIMARY KEY NOT NULL,
        "title" varchar(200) NOT NULL,
        "title_ar" varchar(200),
        "message" text NOT NULL,
        "message_ar" text,
        "type" varchar(30) NOT NULL,
        "priority" varchar(20) DEFAULT 'normal',
        "recipient_type" varchar(20) NOT NULL,
        "recipient_id" varchar(20),
        "phone_number" varchar(20),
        "status" varchar(20) DEFAULT 'pending',
        "sent_at" timestamp,
        "delivered_at" timestamp,
        "read_at" timestamp,
        "twilio_sid" varchar(100),
        "external_status" varchar(30),
        "error_message" text,
        "scheduled_for" timestamp,
        "context_type" varchar(30),
        "context_id" varchar(50),
        "created_by" integer,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "operator_negligence_reports" (
        "id" serial PRIMARY KEY NOT NULL,
        "report_number" varchar(50) NOT NULL,
        "maintenance_action_id" integer,
        "operator_id" integer NOT NULL,
        "machine_id" varchar(20),
        "negligence_type" varchar(50) NOT NULL,
        "description" text NOT NULL,
        "evidence" text,
        "damage_cost" numeric(10, 2),
        "downtime_hours" integer,
        "status" varchar(20) DEFAULT 'reported',
        "action_taken" text,
        "disciplinary_action" varchar(50),
        "reported_by" integer NOT NULL,
        "investigated_by" integer,
        "report_date" timestamp DEFAULT now(),
        "investigation_date" timestamp,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now(),
        CONSTRAINT "operator_negligence_reports_report_number_unique" UNIQUE("report_number")
);
--> statement-breakpoint
CREATE TABLE "orders" (
        "id" serial PRIMARY KEY NOT NULL,
        "order_number" varchar(50) NOT NULL,
        "customer_id" varchar(20) NOT NULL,
        "delivery_days" integer,
        "status" varchar(30) DEFAULT 'waiting' NOT NULL,
        "notes" text,
        "created_by" integer,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "delivery_date" date,
        CONSTRAINT "orders_order_number_unique" UNIQUE("order_number"),
        CONSTRAINT "delivery_days_positive" CHECK ("orders"."delivery_days" IS NULL OR "orders"."delivery_days" > 0),
        CONSTRAINT "status_valid" CHECK ("orders"."status" IN ('waiting', 'in_production', 'for_production', 'paused', 'cancelled', 'completed', 'delivered', 'archived')),
        CONSTRAINT "delivery_date_valid" CHECK ("orders"."delivery_date" IS NULL OR "orders"."delivery_date" >= CURRENT_DATE)
);
--> statement-breakpoint
CREATE TABLE "performance_criteria" (
        "id" serial PRIMARY KEY NOT NULL,
        "name" varchar(100) NOT NULL,
        "name_ar" varchar(100),
        "description" text,
        "description_ar" text,
        "category" varchar(50),
        "weight_percentage" integer DEFAULT 20,
        "applicable_roles" json,
        "is_active" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "performance_ratings" (
        "id" serial PRIMARY KEY NOT NULL,
        "review_id" integer NOT NULL,
        "criteria_id" integer NOT NULL,
        "rating" integer NOT NULL,
        "comments" text
);
--> statement-breakpoint
CREATE TABLE "performance_reviews" (
        "id" serial PRIMARY KEY NOT NULL,
        "employee_id" varchar(20) NOT NULL,
        "reviewer_id" varchar(20) NOT NULL,
        "review_period_start" date NOT NULL,
        "review_period_end" date NOT NULL,
        "review_type" varchar(20),
        "overall_rating" integer,
        "goals_achievement" integer,
        "skills_rating" integer,
        "behavior_rating" integer,
        "strengths" text,
        "areas_for_improvement" text,
        "development_plan" text,
        "goals_for_next_period" text,
        "employee_comments" text,
        "reviewer_comments" text,
        "hr_comments" text,
        "status" varchar(20) DEFAULT 'draft',
        "created_at" timestamp DEFAULT now(),
        "completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "production_orders" (
        "id" serial PRIMARY KEY NOT NULL,
        "production_order_number" varchar(50) NOT NULL,
        "order_id" integer NOT NULL,
        "customer_product_id" integer NOT NULL,
        "quantity_kg" numeric(10, 2) NOT NULL,
        "overrun_percentage" numeric(5, 2) DEFAULT '5.00' NOT NULL,
        "final_quantity_kg" numeric(10, 2) NOT NULL,
        "produced_quantity_kg" numeric(10, 2) DEFAULT '0' NOT NULL,
        "printed_quantity_kg" numeric(10, 2) DEFAULT '0' NOT NULL,
        "net_quantity_kg" numeric(10, 2) DEFAULT '0' NOT NULL,
        "waste_quantity_kg" numeric(10, 2) DEFAULT '0' NOT NULL,
        "film_completion_percentage" numeric(5, 2) DEFAULT '0' NOT NULL,
        "printing_completion_percentage" numeric(5, 2) DEFAULT '0' NOT NULL,
        "cutting_completion_percentage" numeric(5, 2) DEFAULT '0' NOT NULL,
        "assigned_machine_id" varchar(20),
        "assigned_operator_id" integer,
        "production_start_time" timestamp,
        "production_end_time" timestamp,
        "production_time_minutes" integer,
        "film_completed" boolean DEFAULT false,
        "printing_completed" boolean DEFAULT false,
        "cutting_completed" boolean DEFAULT false,
        "is_final_roll_created" boolean DEFAULT false,
        "status" varchar(30) DEFAULT 'pending' NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        CONSTRAINT "production_orders_production_order_number_unique" UNIQUE("production_order_number"),
        CONSTRAINT "quantity_kg_positive" CHECK ("production_orders"."quantity_kg" > 0),
        CONSTRAINT "overrun_percentage_valid" CHECK ("production_orders"."overrun_percentage" >= 0 AND "production_orders"."overrun_percentage" <= 50),
        CONSTRAINT "final_quantity_kg_positive" CHECK ("production_orders"."final_quantity_kg" > 0),
        CONSTRAINT "production_status_valid" CHECK ("production_orders"."status" IN ('pending', 'active', 'completed', 'cancelled', 'archived')),
        CONSTRAINT "produced_quantity_non_negative" CHECK ("production_orders"."produced_quantity_kg" >= 0),
        CONSTRAINT "printed_quantity_non_negative" CHECK ("production_orders"."printed_quantity_kg" >= 0),
        CONSTRAINT "net_quantity_non_negative" CHECK ("production_orders"."net_quantity_kg" >= 0),
        CONSTRAINT "waste_quantity_non_negative" CHECK ("production_orders"."waste_quantity_kg" >= 0),
        CONSTRAINT "film_completion_valid" CHECK ("production_orders"."film_completion_percentage" >= 0 AND "production_orders"."film_completion_percentage" <= 100),
        CONSTRAINT "printing_completion_valid" CHECK ("production_orders"."printing_completion_percentage" >= 0 AND "production_orders"."printing_completion_percentage" <= 100),
        CONSTRAINT "cutting_completion_valid" CHECK ("production_orders"."cutting_completion_percentage" >= 0 AND "production_orders"."cutting_completion_percentage" <= 100)
);
--> statement-breakpoint
CREATE TABLE "production_settings" (
        "id" serial PRIMARY KEY NOT NULL,
        "overrun_tolerance_percent" numeric(5, 2) DEFAULT '3' NOT NULL,
        "allow_last_roll_overrun" boolean DEFAULT true NOT NULL,
        "qr_prefix" varchar(32) DEFAULT 'ROLL' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quality_checks" (
        "id" serial PRIMARY KEY NOT NULL,
        "target_type" varchar(20),
        "target_id" integer,
        "result" varchar(10),
        "score" integer,
        "notes" text,
        "checked_by" integer,
        "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "quick_notes" (
        "id" serial PRIMARY KEY NOT NULL,
        "content" text NOT NULL,
        "note_type" varchar(50) NOT NULL,
        "priority" varchar(20) DEFAULT 'normal',
        "created_by" integer NOT NULL,
        "assigned_to" integer NOT NULL,
        "is_read" boolean DEFAULT false,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "quote_items" (
        "id" serial PRIMARY KEY NOT NULL,
        "quote_id" integer NOT NULL,
        "line_number" integer NOT NULL,
        "item_name" varchar(255) NOT NULL,
        "unit" varchar(20) NOT NULL,
        "unit_price" numeric(12, 2) NOT NULL,
        "quantity" numeric(12, 2) NOT NULL,
        "line_total" numeric(12, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quote_templates" (
        "id" serial PRIMARY KEY NOT NULL,
        "name" varchar(255) NOT NULL,
        "description" text,
        "product_name" varchar(255) NOT NULL,
        "product_description" text,
        "unit_price" numeric(10, 2) NOT NULL,
        "unit" varchar(50) DEFAULT 'كجم' NOT NULL,
        "min_quantity" numeric(10, 2),
        "specifications" jsonb,
        "is_active" boolean DEFAULT true NOT NULL,
        "category" varchar(100),
        "created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
        "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
        "created_by" integer
);
--> statement-breakpoint
CREATE TABLE "quotes" (
        "id" serial PRIMARY KEY NOT NULL,
        "document_number" varchar(50) NOT NULL,
        "customer_name" varchar(255) NOT NULL,
        "tax_number" varchar(14) NOT NULL,
        "quote_date" date DEFAULT CURRENT_DATE NOT NULL,
        "total_before_tax" numeric(12, 2) DEFAULT '0' NOT NULL,
        "tax_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
        "total_with_tax" numeric(12, 2) DEFAULT '0' NOT NULL,
        "status" varchar(20) DEFAULT 'draft' NOT NULL,
        "created_by_name" varchar(255),
        "created_by_phone" varchar(20),
        "notes" text,
        "created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
        "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
        CONSTRAINT "quotes_document_number_unique" UNIQUE("document_number")
);
--> statement-breakpoint
CREATE TABLE "raw_material_vouchers_in" (
        "id" serial PRIMARY KEY NOT NULL,
        "voucher_number" varchar(50) NOT NULL,
        "voucher_type" varchar(30) DEFAULT 'purchase' NOT NULL,
        "supplier_id" integer,
        "item_id" varchar(20) NOT NULL,
        "quantity" numeric(12, 3) NOT NULL,
        "unit" varchar(20) DEFAULT 'كيلو' NOT NULL,
        "unit_price" numeric(10, 4),
        "total_price" numeric(12, 4),
        "batch_number" varchar(50),
        "barcode" varchar(100),
        "location_id" varchar(20),
        "expiry_date" date,
        "notes" text,
        "received_by" integer NOT NULL,
        "voucher_date" date DEFAULT CURRENT_DATE NOT NULL,
        "status" varchar(20) DEFAULT 'completed' NOT NULL,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now(),
        CONSTRAINT "raw_material_vouchers_in_voucher_number_unique" UNIQUE("voucher_number")
);
--> statement-breakpoint
CREATE TABLE "raw_material_vouchers_out" (
        "id" serial PRIMARY KEY NOT NULL,
        "voucher_number" varchar(50) NOT NULL,
        "voucher_type" varchar(30) DEFAULT 'production_transfer' NOT NULL,
        "production_order_id" integer,
        "item_id" varchar(20) NOT NULL,
        "quantity" numeric(12, 3) NOT NULL,
        "unit" varchar(20) DEFAULT 'كيلو' NOT NULL,
        "batch_number" varchar(50),
        "barcode" varchar(100),
        "from_location_id" varchar(20),
        "to_destination" varchar(100),
        "issued_to" varchar(100),
        "notes" text,
        "issued_by" integer NOT NULL,
        "voucher_date" date DEFAULT CURRENT_DATE NOT NULL,
        "status" varchar(20) DEFAULT 'completed' NOT NULL,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now(),
        CONSTRAINT "raw_material_vouchers_out_voucher_number_unique" UNIQUE("voucher_number")
);
--> statement-breakpoint
CREATE TABLE "roles" (
        "id" serial PRIMARY KEY NOT NULL,
        "name" varchar(50) NOT NULL,
        "name_ar" varchar(100),
        "permissions" json
);
--> statement-breakpoint
CREATE TABLE "rolls" (
        "id" serial PRIMARY KEY NOT NULL,
        "roll_seq" integer NOT NULL,
        "roll_number" varchar(64) NOT NULL,
        "production_order_id" integer NOT NULL,
        "qr_code_text" text NOT NULL,
        "qr_png_base64" text,
        "stage" varchar(20) DEFAULT 'film' NOT NULL,
        "weight_kg" numeric(12, 3) NOT NULL,
        "cut_weight_total_kg" numeric(12, 3) DEFAULT '0' NOT NULL,
        "waste_kg" numeric(12, 3) DEFAULT '0' NOT NULL,
        "printed_at" timestamp,
        "cut_completed_at" timestamp,
        "performed_by" integer,
        "film_machine_id" varchar(20) NOT NULL,
        "printing_machine_id" varchar(20),
        "cutting_machine_id" varchar(20),
        "machine_id" varchar(20),
        "employee_id" integer,
        "created_by" integer NOT NULL,
        "printed_by" integer,
        "cut_by" integer,
        "is_last_roll" boolean DEFAULT false,
        "production_time_minutes" integer,
        "roll_created_at" timestamp DEFAULT now(),
        "qr_code" varchar(255),
        "created_at" timestamp DEFAULT now() NOT NULL,
        "completed_at" timestamp,
        CONSTRAINT "rolls_roll_number_unique" UNIQUE("roll_number"),
        CONSTRAINT "roll_seq_positive" CHECK ("rolls"."roll_seq" > 0),
        CONSTRAINT "weight_kg_positive" CHECK ("rolls"."weight_kg" > 0),
        CONSTRAINT "weight_kg_reasonable" CHECK ("rolls"."weight_kg" <= 2000),
        CONSTRAINT "cut_weight_valid" CHECK ("rolls"."cut_weight_total_kg" >= 0 AND "rolls"."cut_weight_total_kg" <= "rolls"."weight_kg"),
        CONSTRAINT "waste_valid" CHECK ("rolls"."waste_kg" >= 0 AND "rolls"."waste_kg" <= "rolls"."weight_kg"),
        CONSTRAINT "stage_valid" CHECK ("rolls"."stage" IN ('film', 'printing', 'cutting', 'done')),
        CONSTRAINT "printed_at_valid" CHECK ("rolls"."printed_at" IS NULL OR "rolls"."printed_at" >= "rolls"."created_at"),
        CONSTRAINT "cut_completed_at_valid" CHECK ("rolls"."cut_completed_at" IS NULL OR ("rolls"."cut_completed_at" >= "rolls"."created_at" AND ("rolls"."printed_at" IS NULL OR "rolls"."cut_completed_at" >= "rolls"."printed_at"))),
        CONSTRAINT "completed_at_valid" CHECK ("rolls"."completed_at" IS NULL OR "rolls"."completed_at" >= "rolls"."created_at"),
        CONSTRAINT "machine_active_for_creation" CHECK (TRUE)
);
--> statement-breakpoint
CREATE TABLE "sections" (
        "id" varchar(20) PRIMARY KEY NOT NULL,
        "name" varchar(100) NOT NULL,
        "name_ar" varchar(100),
        "description" text
);
--> statement-breakpoint
CREATE TABLE "sessions" (
        "sid" varchar PRIMARY KEY NOT NULL,
        "sess" jsonb NOT NULL,
        "expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "spare_parts" (
        "id" serial PRIMARY KEY NOT NULL,
        "part_id" varchar(50) NOT NULL,
        "machine_name" varchar(100) NOT NULL,
        "part_name" varchar(100) NOT NULL,
        "code" varchar(50) NOT NULL,
        "serial_number" varchar(100) NOT NULL,
        "specifications" text,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now(),
        CONSTRAINT "spare_parts_part_id_unique" UNIQUE("part_id")
);
--> statement-breakpoint
CREATE TABLE "suppliers" (
        "id" serial PRIMARY KEY NOT NULL,
        "name" varchar(100) NOT NULL,
        "name_ar" varchar(100),
        "contact_person" varchar(100),
        "phone" varchar(20),
        "email" varchar(100),
        "address" text,
        "materials_supplied" json,
        "is_active" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "system_alerts" (
        "id" serial PRIMARY KEY NOT NULL,
        "title" varchar(200) NOT NULL,
        "title_ar" varchar(200),
        "message" text NOT NULL,
        "message_ar" text,
        "type" varchar(30) NOT NULL,
        "category" varchar(30) NOT NULL,
        "severity" varchar(20) NOT NULL,
        "source" varchar(50) NOT NULL,
        "source_id" varchar(50),
        "status" varchar(20) DEFAULT 'active' NOT NULL,
        "is_automated" boolean DEFAULT true,
        "requires_action" boolean DEFAULT false,
        "action_taken" varchar(500),
        "action_taken_by" integer,
        "action_taken_at" timestamp,
        "resolved_by" integer,
        "resolved_at" timestamp,
        "resolution_notes" text,
        "affected_systems" json,
        "suggested_actions" json,
        "context_data" json,
        "notification_sent" boolean DEFAULT false,
        "notification_methods" json,
        "target_users" json,
        "target_roles" json,
        "expires_at" timestamp,
        "occurrences" integer DEFAULT 1,
        "last_occurrence" timestamp DEFAULT now(),
        "first_occurrence" timestamp DEFAULT now(),
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "system_analytics" (
        "id" serial PRIMARY KEY NOT NULL,
        "date" date DEFAULT CURRENT_DATE NOT NULL,
        "metric_type" varchar(50) NOT NULL,
        "total_alerts" integer DEFAULT 0,
        "critical_alerts" integer DEFAULT 0,
        "resolved_alerts" integer DEFAULT 0,
        "avg_resolution_time" integer,
        "system_uptime_percent" numeric(5, 2),
        "total_health_checks" integer DEFAULT 0,
        "failed_health_checks" integer DEFAULT 0,
        "performance_score" numeric(5, 2),
        "data" json,
        "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "system_health_checks" (
        "id" serial PRIMARY KEY NOT NULL,
        "check_name" varchar(100) NOT NULL,
        "check_name_ar" varchar(100),
        "check_type" varchar(30) NOT NULL,
        "status" varchar(20) DEFAULT 'unknown' NOT NULL,
        "last_check_time" timestamp DEFAULT now(),
        "check_duration_ms" integer,
        "success_rate_24h" numeric(5, 2) DEFAULT '100.00',
        "average_response_time" integer,
        "error_count_24h" integer DEFAULT 0,
        "last_error" text,
        "last_error_time" timestamp,
        "check_details" json,
        "thresholds" json,
        "is_critical" boolean DEFAULT false,
        "auto_recovery" boolean DEFAULT false,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "system_performance_metrics" (
        "id" serial PRIMARY KEY NOT NULL,
        "metric_name" varchar(255) NOT NULL,
        "metric_category" varchar(30) NOT NULL,
        "value" numeric(15, 4) NOT NULL,
        "unit" varchar(20),
        "timestamp" timestamp DEFAULT now(),
        "source" varchar(50),
        "tags" json,
        "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "system_settings" (
        "id" serial PRIMARY KEY NOT NULL,
        "setting_key" varchar(100) NOT NULL,
        "setting_value" text,
        "setting_type" varchar(20) DEFAULT 'string',
        "description" text,
        "is_editable" boolean DEFAULT true,
        "updated_at" timestamp DEFAULT now(),
        "updated_by" varchar(20),
        CONSTRAINT "system_settings_setting_key_unique" UNIQUE("setting_key")
);
--> statement-breakpoint
CREATE TABLE "training_certificates" (
        "id" serial PRIMARY KEY NOT NULL,
        "enrollment_id" integer,
        "employee_id" integer,
        "program_id" integer,
        "certificate_number" varchar(50) NOT NULL,
        "issue_date" date NOT NULL,
        "expiry_date" date,
        "final_score" integer,
        "certificate_status" varchar(20) DEFAULT 'active',
        "issued_by" integer,
        "certificate_file_url" varchar(500),
        "created_at" timestamp DEFAULT now(),
        CONSTRAINT "training_certificates_enrollment_id_unique" UNIQUE("enrollment_id"),
        CONSTRAINT "training_certificates_certificate_number_unique" UNIQUE("certificate_number")
);
--> statement-breakpoint
CREATE TABLE "training_enrollments" (
        "id" serial PRIMARY KEY NOT NULL,
        "program_id" integer,
        "employee_id" integer,
        "enrolled_date" timestamp DEFAULT now(),
        "training_date" date,
        "attendance_status" varchar(20) DEFAULT 'enrolled',
        "completion_status" varchar(20) DEFAULT 'not_started',
        "attendance_notes" text,
        "practical_performance" varchar(20),
        "final_score" integer,
        "certificate_issued" boolean DEFAULT false,
        "certificate_number" varchar(50),
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "training_evaluations" (
        "id" serial PRIMARY KEY NOT NULL,
        "enrollment_id" integer,
        "program_id" integer,
        "employee_id" integer,
        "evaluator_id" integer,
        "evaluation_date" date NOT NULL,
        "theoretical_understanding" integer,
        "practical_skills" integer,
        "safety_compliance" integer,
        "teamwork" integer,
        "communication" integer,
        "overall_rating" integer,
        "strengths" text,
        "areas_for_improvement" text,
        "additional_notes" text,
        "recommendation" varchar(20),
        "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "training_materials" (
        "id" serial PRIMARY KEY NOT NULL,
        "program_id" integer,
        "title" varchar(200) NOT NULL,
        "title_ar" varchar(200),
        "type" varchar(20),
        "content" text,
        "file_url" varchar(500),
        "order_index" integer DEFAULT 0,
        "duration_minutes" integer,
        "is_mandatory" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "training_programs" (
        "id" serial PRIMARY KEY NOT NULL,
        "title" varchar(200) NOT NULL,
        "title_ar" varchar(200),
        "description" text,
        "description_ar" text,
        "type" varchar(20) DEFAULT 'field',
        "category" varchar(50),
        "training_scope" varchar(50),
        "duration_hours" integer,
        "max_participants" integer,
        "location" varchar(200),
        "prerequisites" text,
        "learning_objectives" json,
        "practical_requirements" text,
        "instructor_id" integer,
        "department_id" varchar(20),
        "status" varchar(20) DEFAULT 'active',
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "training_records" (
        "id" serial PRIMARY KEY NOT NULL,
        "employee_id" integer,
        "training_type" varchar(100),
        "training_name" varchar(200),
        "date" date NOT NULL,
        "status" varchar(20) DEFAULT 'completed',
        "instructor" varchar(100),
        "notes" text
);
--> statement-breakpoint
CREATE TABLE "user_requests" (
        "id" serial PRIMARY KEY NOT NULL,
        "user_id" integer NOT NULL,
        "type" varchar(50) NOT NULL,
        "title" varchar(200) NOT NULL,
        "description" text,
        "status" varchar(20) DEFAULT 'معلق' NOT NULL,
        "priority" varchar(20) DEFAULT 'عادي',
        "response" text,
        "reviewed_by" integer,
        "date" timestamp DEFAULT now(),
        "reviewed_date" timestamp,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_settings" (
        "id" serial PRIMARY KEY NOT NULL,
        "user_id" varchar(20) NOT NULL,
        "setting_key" varchar(100) NOT NULL,
        "setting_value" text,
        "setting_type" varchar(20) DEFAULT 'string',
        "updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
        "id" serial PRIMARY KEY NOT NULL,
        "username" varchar(50),
        "password" varchar(100),
        "display_name" varchar(100),
        "display_name_ar" varchar(100),
        "full_name" varchar(200),
        "phone" varchar(20),
        "email" varchar(100),
        "role_id" integer,
        "section_id" integer,
        "status" varchar(20) DEFAULT 'active',
        "created_at" timestamp DEFAULT now(),
        "replit_user_id" varchar(255),
        "first_name" varchar(100),
        "last_name" varchar(100),
        "profile_image_url" varchar(500),
        "updated_at" timestamp DEFAULT now(),
        CONSTRAINT "users_username_unique" UNIQUE("username"),
        CONSTRAINT "users_replit_user_id_unique" UNIQUE("replit_user_id")
);
--> statement-breakpoint
CREATE TABLE "violations" (
        "id" serial PRIMARY KEY NOT NULL,
        "employee_id" integer,
        "violation_type" varchar(50),
        "description" text,
        "date" date NOT NULL,
        "action_taken" text,
        "reported_by" integer
);
--> statement-breakpoint
CREATE TABLE "warehouse_receipts" (
        "id" serial PRIMARY KEY NOT NULL,
        "production_order_id" integer NOT NULL,
        "cut_id" integer,
        "received_weight_kg" numeric(12, 3) NOT NULL,
        "received_by" integer,
        "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "warehouse_transactions" (
        "id" serial PRIMARY KEY NOT NULL,
        "type" varchar(30),
        "item_id" varchar(20),
        "quantity" numeric(10, 2) NOT NULL,
        "from_location" varchar(100),
        "to_location" varchar(100),
        "date" timestamp DEFAULT now(),
        "reference_id" integer,
        "notes" text
);
--> statement-breakpoint
CREATE TABLE "waste" (
        "id" serial PRIMARY KEY NOT NULL,
        "roll_id" integer,
        "production_order_id" integer,
        "quantity_wasted" numeric(8, 2) NOT NULL,
        "reason" varchar(100),
        "stage" varchar(50),
        "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "conversations" (
        "id" serial PRIMARY KEY NOT NULL,
        "title" text NOT NULL,
        "created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
        "id" serial PRIMARY KEY NOT NULL,
        "conversation_id" integer NOT NULL,
        "role" text NOT NULL,
        "content" text NOT NULL,
        "created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
ALTER TABLE "admin_decisions" ADD CONSTRAINT "admin_decisions_issued_by_users_id_fk" FOREIGN KEY ("issued_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_agent_knowledge" ADD CONSTRAINT "ai_agent_knowledge_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_agent_settings" ADD CONSTRAINT "ai_agent_settings_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alert_rules" ADD CONSTRAINT "alert_rules_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batch_ingredients" ADD CONSTRAINT "batch_ingredients_batch_id_mixing_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."mixing_batches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batch_ingredients" ADD CONSTRAINT "batch_ingredients_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consumable_parts_transactions" ADD CONSTRAINT "consumable_parts_transactions_consumable_part_id_consumable_parts_id_fk" FOREIGN KEY ("consumable_part_id") REFERENCES "public"."consumable_parts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consumable_parts_transactions" ADD CONSTRAINT "consumable_parts_transactions_performed_by_users_id_fk" FOREIGN KEY ("performed_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "corrective_actions" ADD CONSTRAINT "corrective_actions_alert_id_system_alerts_id_fk" FOREIGN KEY ("alert_id") REFERENCES "public"."system_alerts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "corrective_actions" ADD CONSTRAINT "corrective_actions_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "corrective_actions" ADD CONSTRAINT "corrective_actions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "corrective_actions" ADD CONSTRAINT "corrective_actions_completed_by_users_id_fk" FOREIGN KEY ("completed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_products" ADD CONSTRAINT "customer_products_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_products" ADD CONSTRAINT "customer_products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_products" ADD CONSTRAINT "customer_products_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_sales_rep_id_users_id_fk" FOREIGN KEY ("sales_rep_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cuts" ADD CONSTRAINT "cuts_roll_id_rolls_id_fk" FOREIGN KEY ("roll_id") REFERENCES "public"."rolls"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cuts" ADD CONSTRAINT "cuts_performed_by_users_id_fk" FOREIGN KEY ("performed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "factory_locations" ADD CONSTRAINT "factory_locations_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finished_goods_vouchers_in" ADD CONSTRAINT "finished_goods_vouchers_in_production_order_id_production_orders_id_fk" FOREIGN KEY ("production_order_id") REFERENCES "public"."production_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finished_goods_vouchers_in" ADD CONSTRAINT "finished_goods_vouchers_in_roll_id_rolls_id_fk" FOREIGN KEY ("roll_id") REFERENCES "public"."rolls"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finished_goods_vouchers_in" ADD CONSTRAINT "finished_goods_vouchers_in_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finished_goods_vouchers_in" ADD CONSTRAINT "finished_goods_vouchers_in_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finished_goods_vouchers_in" ADD CONSTRAINT "finished_goods_vouchers_in_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finished_goods_vouchers_in" ADD CONSTRAINT "finished_goods_vouchers_in_received_by_users_id_fk" FOREIGN KEY ("received_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finished_goods_vouchers_out" ADD CONSTRAINT "finished_goods_vouchers_out_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finished_goods_vouchers_out" ADD CONSTRAINT "finished_goods_vouchers_out_production_order_id_production_orders_id_fk" FOREIGN KEY ("production_order_id") REFERENCES "public"."production_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finished_goods_vouchers_out" ADD CONSTRAINT "finished_goods_vouchers_out_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finished_goods_vouchers_out" ADD CONSTRAINT "finished_goods_vouchers_out_from_location_id_locations_id_fk" FOREIGN KEY ("from_location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finished_goods_vouchers_out" ADD CONSTRAINT "finished_goods_vouchers_out_issued_by_users_id_fk" FOREIGN KEY ("issued_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_count_items" ADD CONSTRAINT "inventory_count_items_count_id_inventory_counts_id_fk" FOREIGN KEY ("count_id") REFERENCES "public"."inventory_counts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_count_items" ADD CONSTRAINT "inventory_count_items_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_count_items" ADD CONSTRAINT "inventory_count_items_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_counts" ADD CONSTRAINT "inventory_counts_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_counts" ADD CONSTRAINT "inventory_counts_counted_by_users_id_fk" FOREIGN KEY ("counted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_counts" ADD CONSTRAINT "inventory_counts_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_inventory_id_inventory_id_fk" FOREIGN KEY ("inventory_id") REFERENCES "public"."inventory"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_balances" ADD CONSTRAINT "leave_balances_employee_id_users_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_balances" ADD CONSTRAINT "leave_balances_leave_type_id_leave_types_id_fk" FOREIGN KEY ("leave_type_id") REFERENCES "public"."leave_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_employee_id_users_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_leave_type_id_leave_types_id_fk" FOREIGN KEY ("leave_type_id") REFERENCES "public"."leave_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_replacement_employee_id_users_id_fk" FOREIGN KEY ("replacement_employee_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_direct_manager_id_users_id_fk" FOREIGN KEY ("direct_manager_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_hr_reviewed_by_users_id_fk" FOREIGN KEY ("hr_reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "machine_queues" ADD CONSTRAINT "machine_queues_machine_id_machines_id_fk" FOREIGN KEY ("machine_id") REFERENCES "public"."machines"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "machine_queues" ADD CONSTRAINT "machine_queues_production_order_id_production_orders_id_fk" FOREIGN KEY ("production_order_id") REFERENCES "public"."production_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "machine_queues" ADD CONSTRAINT "machine_queues_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "machines" ADD CONSTRAINT "machines_section_id_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."sections"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_actions" ADD CONSTRAINT "maintenance_actions_maintenance_request_id_maintenance_requests_id_fk" FOREIGN KEY ("maintenance_request_id") REFERENCES "public"."maintenance_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_actions" ADD CONSTRAINT "maintenance_actions_performed_by_users_id_fk" FOREIGN KEY ("performed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_actions" ADD CONSTRAINT "maintenance_actions_request_created_by_users_id_fk" FOREIGN KEY ("request_created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_reports" ADD CONSTRAINT "maintenance_reports_maintenance_action_id_maintenance_actions_id_fk" FOREIGN KEY ("maintenance_action_id") REFERENCES "public"."maintenance_actions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_reports" ADD CONSTRAINT "maintenance_reports_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_reports" ADD CONSTRAINT "maintenance_reports_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_requests" ADD CONSTRAINT "maintenance_requests_machine_id_machines_id_fk" FOREIGN KEY ("machine_id") REFERENCES "public"."machines"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_requests" ADD CONSTRAINT "maintenance_requests_reported_by_users_id_fk" FOREIGN KEY ("reported_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_requests" ADD CONSTRAINT "maintenance_requests_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mixing_batches" ADD CONSTRAINT "mixing_batches_production_order_id_production_orders_id_fk" FOREIGN KEY ("production_order_id") REFERENCES "public"."production_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mixing_batches" ADD CONSTRAINT "mixing_batches_machine_id_machines_id_fk" FOREIGN KEY ("machine_id") REFERENCES "public"."machines"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mixing_batches" ADD CONSTRAINT "mixing_batches_operator_id_users_id_fk" FOREIGN KEY ("operator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "note_attachments" ADD CONSTRAINT "note_attachments_note_id_quick_notes_id_fk" FOREIGN KEY ("note_id") REFERENCES "public"."quick_notes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_event_logs" ADD CONSTRAINT "notification_event_logs_event_setting_id_notification_event_settings_id_fk" FOREIGN KEY ("event_setting_id") REFERENCES "public"."notification_event_settings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_event_logs" ADD CONSTRAINT "notification_event_logs_recipient_user_id_users_id_fk" FOREIGN KEY ("recipient_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_event_settings" ADD CONSTRAINT "notification_event_settings_whatsapp_template_id_notification_templates_id_fk" FOREIGN KEY ("whatsapp_template_id") REFERENCES "public"."notification_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_event_settings" ADD CONSTRAINT "notification_event_settings_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_event_settings" ADD CONSTRAINT "notification_event_settings_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operator_negligence_reports" ADD CONSTRAINT "operator_negligence_reports_maintenance_action_id_maintenance_actions_id_fk" FOREIGN KEY ("maintenance_action_id") REFERENCES "public"."maintenance_actions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operator_negligence_reports" ADD CONSTRAINT "operator_negligence_reports_operator_id_users_id_fk" FOREIGN KEY ("operator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operator_negligence_reports" ADD CONSTRAINT "operator_negligence_reports_machine_id_machines_id_fk" FOREIGN KEY ("machine_id") REFERENCES "public"."machines"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operator_negligence_reports" ADD CONSTRAINT "operator_negligence_reports_reported_by_users_id_fk" FOREIGN KEY ("reported_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operator_negligence_reports" ADD CONSTRAINT "operator_negligence_reports_investigated_by_users_id_fk" FOREIGN KEY ("investigated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "performance_ratings" ADD CONSTRAINT "performance_ratings_review_id_performance_reviews_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."performance_reviews"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "performance_ratings" ADD CONSTRAINT "performance_ratings_criteria_id_performance_criteria_id_fk" FOREIGN KEY ("criteria_id") REFERENCES "public"."performance_criteria"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "performance_reviews" ADD CONSTRAINT "performance_reviews_employee_id_users_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "performance_reviews" ADD CONSTRAINT "performance_reviews_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_orders" ADD CONSTRAINT "production_orders_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_orders" ADD CONSTRAINT "production_orders_customer_product_id_customer_products_id_fk" FOREIGN KEY ("customer_product_id") REFERENCES "public"."customer_products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_orders" ADD CONSTRAINT "production_orders_assigned_machine_id_machines_id_fk" FOREIGN KEY ("assigned_machine_id") REFERENCES "public"."machines"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_orders" ADD CONSTRAINT "production_orders_assigned_operator_id_users_id_fk" FOREIGN KEY ("assigned_operator_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quality_checks" ADD CONSTRAINT "quality_checks_checked_by_users_id_fk" FOREIGN KEY ("checked_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quick_notes" ADD CONSTRAINT "quick_notes_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quick_notes" ADD CONSTRAINT "quick_notes_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_items" ADD CONSTRAINT "quote_items_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_templates" ADD CONSTRAINT "quote_templates_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "raw_material_vouchers_in" ADD CONSTRAINT "raw_material_vouchers_in_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "raw_material_vouchers_in" ADD CONSTRAINT "raw_material_vouchers_in_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "raw_material_vouchers_in" ADD CONSTRAINT "raw_material_vouchers_in_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "raw_material_vouchers_in" ADD CONSTRAINT "raw_material_vouchers_in_received_by_users_id_fk" FOREIGN KEY ("received_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "raw_material_vouchers_out" ADD CONSTRAINT "raw_material_vouchers_out_production_order_id_production_orders_id_fk" FOREIGN KEY ("production_order_id") REFERENCES "public"."production_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "raw_material_vouchers_out" ADD CONSTRAINT "raw_material_vouchers_out_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "raw_material_vouchers_out" ADD CONSTRAINT "raw_material_vouchers_out_from_location_id_locations_id_fk" FOREIGN KEY ("from_location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "raw_material_vouchers_out" ADD CONSTRAINT "raw_material_vouchers_out_issued_by_users_id_fk" FOREIGN KEY ("issued_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rolls" ADD CONSTRAINT "rolls_production_order_id_production_orders_id_fk" FOREIGN KEY ("production_order_id") REFERENCES "public"."production_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rolls" ADD CONSTRAINT "rolls_performed_by_users_id_fk" FOREIGN KEY ("performed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rolls" ADD CONSTRAINT "rolls_film_machine_id_machines_id_fk" FOREIGN KEY ("film_machine_id") REFERENCES "public"."machines"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rolls" ADD CONSTRAINT "rolls_printing_machine_id_machines_id_fk" FOREIGN KEY ("printing_machine_id") REFERENCES "public"."machines"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rolls" ADD CONSTRAINT "rolls_cutting_machine_id_machines_id_fk" FOREIGN KEY ("cutting_machine_id") REFERENCES "public"."machines"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rolls" ADD CONSTRAINT "rolls_machine_id_machines_id_fk" FOREIGN KEY ("machine_id") REFERENCES "public"."machines"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rolls" ADD CONSTRAINT "rolls_employee_id_users_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rolls" ADD CONSTRAINT "rolls_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rolls" ADD CONSTRAINT "rolls_printed_by_users_id_fk" FOREIGN KEY ("printed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rolls" ADD CONSTRAINT "rolls_cut_by_users_id_fk" FOREIGN KEY ("cut_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_alerts" ADD CONSTRAINT "system_alerts_action_taken_by_users_id_fk" FOREIGN KEY ("action_taken_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_alerts" ADD CONSTRAINT "system_alerts_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_settings" ADD CONSTRAINT "system_settings_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_certificates" ADD CONSTRAINT "training_certificates_enrollment_id_training_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."training_enrollments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_certificates" ADD CONSTRAINT "training_certificates_employee_id_users_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_certificates" ADD CONSTRAINT "training_certificates_program_id_training_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."training_programs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_certificates" ADD CONSTRAINT "training_certificates_issued_by_users_id_fk" FOREIGN KEY ("issued_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_enrollments" ADD CONSTRAINT "training_enrollments_program_id_training_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."training_programs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_enrollments" ADD CONSTRAINT "training_enrollments_employee_id_users_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_evaluations" ADD CONSTRAINT "training_evaluations_enrollment_id_training_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."training_enrollments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_evaluations" ADD CONSTRAINT "training_evaluations_program_id_training_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."training_programs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_evaluations" ADD CONSTRAINT "training_evaluations_employee_id_users_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_evaluations" ADD CONSTRAINT "training_evaluations_evaluator_id_users_id_fk" FOREIGN KEY ("evaluator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_materials" ADD CONSTRAINT "training_materials_program_id_training_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."training_programs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_programs" ADD CONSTRAINT "training_programs_instructor_id_users_id_fk" FOREIGN KEY ("instructor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_programs" ADD CONSTRAINT "training_programs_department_id_sections_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."sections"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_records" ADD CONSTRAINT "training_records_employee_id_users_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_requests" ADD CONSTRAINT "user_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_requests" ADD CONSTRAINT "user_requests_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "violations" ADD CONSTRAINT "violations_employee_id_users_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "violations" ADD CONSTRAINT "violations_reported_by_users_id_fk" FOREIGN KEY ("reported_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse_receipts" ADD CONSTRAINT "warehouse_receipts_production_order_id_production_orders_id_fk" FOREIGN KEY ("production_order_id") REFERENCES "public"."production_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse_receipts" ADD CONSTRAINT "warehouse_receipts_cut_id_cuts_id_fk" FOREIGN KEY ("cut_id") REFERENCES "public"."cuts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse_receipts" ADD CONSTRAINT "warehouse_receipts_received_by_users_id_fk" FOREIGN KEY ("received_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse_transactions" ADD CONSTRAINT "warehouse_transactions_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "waste" ADD CONSTRAINT "waste_roll_id_rolls_id_fk" FOREIGN KEY ("roll_id") REFERENCES "public"."rolls"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "waste" ADD CONSTRAINT "waste_production_order_id_production_orders_id_fk" FOREIGN KEY ("production_order_id") REFERENCES "public"."production_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_attendance_user_id" ON "attendance" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_attendance_date" ON "attendance" USING btree ("date");--> statement-breakpoint
CREATE INDEX "idx_attendance_user_date" ON "attendance" USING btree ("user_id","date");--> statement-breakpoint
CREATE INDEX "idx_customer_products_customer_id" ON "customer_products" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "idx_customer_products_status" ON "customer_products" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_customer_products_created_at" ON "customer_products" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_production_orders_order_id" ON "production_orders" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_production_orders_status" ON "production_orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_production_orders_created_at" ON "production_orders" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_production_orders_assigned_machine_id" ON "production_orders" USING btree ("assigned_machine_id");--> statement-breakpoint
CREATE INDEX "idx_rolls_production_order_id" ON "rolls" USING btree ("production_order_id");--> statement-breakpoint
CREATE INDEX "idx_rolls_stage" ON "rolls" USING btree ("stage");--> statement-breakpoint
CREATE INDEX "idx_rolls_created_at" ON "rolls" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_rolls_film_machine_id" ON "rolls" USING btree ("film_machine_id");--> statement-breakpoint
CREATE INDEX "idx_rolls_created_by" ON "rolls" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");--> statement-breakpoint
CREATE INDEX "idx_users_role_id" ON "users" USING btree ("role_id");--> statement-breakpoint
CREATE INDEX "idx_users_status" ON "users" USING btree ("status");