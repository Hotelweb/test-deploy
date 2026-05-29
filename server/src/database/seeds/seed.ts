import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as bcrypt from 'bcryptjs';

dotenv.config({ path: ['.env.production', '.env.local', '.env'] });

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'a25_db',
  ssl:
    process.env.DB_SSL?.toLowerCase() === 'true'
      ? { rejectUnauthorized: false }
      : false,
});

async function seed() {
  await dataSource.initialize();
  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();

  console.log('🌱 Starting database seed...');

  try {
    await queryRunner.startTransaction();

    // ============================================================
    // EXTENSIONS
    // ============================================================
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);

    // ============================================================
    // ENUMS
    // ============================================================
    console.log('Creating enums...');

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE chat_session_status AS ENUM ('OPEN', 'ASSIGNED', 'BOOKED', 'CLOSED');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE message_sender_type AS ENUM ('CUSTOMER', 'STAFF');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE message_type AS ENUM ('TEXT', 'IMAGE', 'SYSTEM', 'ORDER');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE order_status AS ENUM ('PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE order_source_type AS ENUM ('CHAT', 'WALKIN', 'PHONE', 'QR');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE notification_type AS ENUM ('NEW_ORDER', 'NEW_MESSAGE', 'ORDER_STATUS', 'SYSTEM');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE language_code AS ENUM ('vi', 'en', 'ja', 'zh', 'ko', 'th');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);
    await queryRunner.query(
      `ALTER TYPE language_code ADD VALUE IF NOT EXISTS 'th';`,
    );
    await queryRunner.query(
      `ALTER TYPE chat_session_status ADD VALUE IF NOT EXISTS 'BOOKED';`,
    );

    // Translation pipeline + message delivery state. Originally introduced
    // as `001_chat_translation.sql` migration; folded into the seed so a
    // fresh database boots with a complete schema.
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE translation_status AS ENUM ('PENDING', 'TRANSLATED', 'FAILED', 'SKIPPED');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE message_status AS ENUM ('SENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE service_type AS ENUM ('content', 'food_order');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE menu_category AS ENUM ('food', 'drink');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE food_order_status AS ENUM ('new', 'accepted', 'preparing', 'delivering', 'completed', 'cancelled', 'rejected');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);

    // ============================================================
    // TABLES
    // ============================================================
    console.log('Creating tables...');

    // Hotels
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS hotels (
        id BIGSERIAL PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        slug VARCHAR(150) NOT NULL UNIQUE,
        phone VARCHAR(20),
        email VARCHAR(255),
        address TEXT,
        map_url TEXT,
        description TEXT,
        logo_url TEXT,
        banner_url TEXT,
        gallery TEXT[] NOT NULL DEFAULT '{}',
        qr_token UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // Idempotent: existing databases (created before the gallery column
    // was introduced) get the new column added in place. Mirrors the
    // 002_hotel_gallery.sql migration so a fresh `pnpm run seed` is enough.
    await queryRunner.query(`
      ALTER TABLE hotels
        ADD COLUMN IF NOT EXISTS gallery TEXT[] NOT NULL DEFAULT '{}';
    `);

    await queryRunner.query(`
      ALTER TABLE hotels
        ADD COLUMN IF NOT EXISTS map_url TEXT;
    `);

    await queryRunner.query(`
      ALTER TABLE hotels
        ALTER COLUMN qr_token SET DEFAULT gen_random_uuid();
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS hotel_qr_open_events (
        id BIGSERIAL PRIMARY KEY,
        hotel_id BIGINT NOT NULL,
        source VARCHAR(20) NOT NULL,
        room_token VARCHAR(120),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // System Admins
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS system_admins (
        id BIGSERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR NOT NULL,
        full_name VARCHAR(100) NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // Hotel Users (per-hotel admins). Only one user type lives here:
    // the hotel admin / manager. There are no other roles.
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS hotel_users (
        id BIGSERIAL PRIMARY KEY,
        hotel_id BIGINT NOT NULL,
        email VARCHAR(255) NOT NULL,
        password_hash VARCHAR NOT NULL,
        full_name VARCHAR(100) NOT NULL,
        avatar_url TEXT,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        deleted_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // ----------------------------------------------------------------
    // Migrate existing hotel_users tables that still carry the old role
    // column / enum. Idempotent — does nothing on a fresh install.
    // ----------------------------------------------------------------
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_hotel_users_hotel_role;
    `);
    await queryRunner.query(`
      ALTER TABLE hotel_users DROP COLUMN IF EXISTS role;
    `);
    await queryRunner.query(`
      DROP TYPE IF EXISTS hotel_user_role;
    `);

    // Services
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS services (
        id BIGSERIAL PRIMARY KEY,
        hotel_id BIGINT NOT NULL,
        icon_url TEXT,
        image_url TEXT,
        sort_order INT NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        service_type service_type NOT NULL DEFAULT 'content',
        deleted_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await queryRunner.query(`
      ALTER TABLE services
        ADD COLUMN IF NOT EXISTS service_type service_type NOT NULL DEFAULT 'content';
    `);

    // Service Translations
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS service_translations (
        id BIGSERIAL PRIMARY KEY,
        service_id BIGINT NOT NULL,
        language language_code NOT NULL,
        title VARCHAR(200) NOT NULL,
        description TEXT
      );
    `);

    // Customer Sessions — chat conversations with a guest. Includes the
    // booking-flow fields (check-in/out dates, room type, …) so the new
    // chat_translation pipeline doesn't need a follow-up migration.
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS customer_sessions (
        id BIGSERIAL PRIMARY KEY,
        hotel_id BIGINT NOT NULL,
        customer_token UUID NOT NULL,
        assigned_user_id BIGINT,
        customer_name VARCHAR(100),
        customer_first_name VARCHAR(50),
        customer_last_name VARCHAR(50),
        customer_phone VARCHAR(20),
        customer_email VARCHAR(255),
        customer_country VARCHAR(80),
        room_number VARCHAR(20),
        room_type VARCHAR(80),
        check_in_date DATE,
        check_out_date DATE,
        guest_count INT CONSTRAINT ck_customer_sessions_guest_count_positive
          CHECK (guest_count IS NULL OR guest_count > 0),
        initial_request TEXT,
        privacy_consent BOOLEAN NOT NULL DEFAULT FALSE,
        analytics_consent BOOLEAN NOT NULL DEFAULT FALSE,
        customer_language language_code NOT NULL,
        status chat_session_status NOT NULL DEFAULT 'OPEN',
        unread_count INT NOT NULL DEFAULT 0
          CONSTRAINT ck_customer_sessions_unread_count_nonnegative CHECK (unread_count >= 0),
        last_message_at TIMESTAMPTZ,
        closed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT ck_customer_sessions_date_range
          CHECK (check_in_date IS NULL OR check_out_date IS NULL OR check_out_date >= check_in_date)
      );
    `);

    await queryRunner.query(`
      ALTER TABLE customer_sessions
        ADD COLUMN IF NOT EXISTS customer_first_name VARCHAR(50),
        ADD COLUMN IF NOT EXISTS customer_last_name VARCHAR(50),
        ADD COLUMN IF NOT EXISTS privacy_consent BOOLEAN NOT NULL DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS analytics_consent BOOLEAN NOT NULL DEFAULT FALSE;
    `);

    // Chat Messages — every utterance, with its translation pipeline state.
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id BIGSERIAL PRIMARY KEY,
        hotel_id BIGINT NOT NULL,
        session_id BIGINT NOT NULL,
        sender_type message_sender_type NOT NULL,
        sender_user_id BIGINT,
        message_type message_type NOT NULL DEFAULT 'TEXT',
        source_language language_code NOT NULL,
        target_language language_code,
        original_message TEXT,
        translated_message TEXT,
        translation_status translation_status NOT NULL DEFAULT 'PENDING',
        translation_provider VARCHAR(30),
        translation_duration_ms INT,
        image_url TEXT,
        status message_status NOT NULL DEFAULT 'SENT',
        client_message_id VARCHAR(80),
        is_read BOOLEAN NOT NULL DEFAULT FALSE,
        read_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // Menu Categories
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS menu_categories (
        id BIGSERIAL PRIMARY KEY,
        hotel_id BIGINT NOT NULL,
        image_url TEXT,
        sort_order INT NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        deleted_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // Menu Category Translations
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS menu_category_translations (
        id BIGSERIAL PRIMARY KEY,
        category_id BIGINT NOT NULL,
        language language_code NOT NULL,
        name VARCHAR(200) NOT NULL
      );
    `);

    // Menu Items
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS menu_items (
        id BIGSERIAL PRIMARY KEY,
        hotel_id BIGINT NOT NULL,
        category_id BIGINT,
        category menu_category NOT NULL DEFAULT 'food',
        name VARCHAR(200) NOT NULL DEFAULT '',
        name_en VARCHAR(200),
        description TEXT,
        description_en TEXT,
        image_url TEXT,
        price DECIMAL(12,2) NOT NULL CHECK (price >= 0),
        sort_order INT NOT NULL DEFAULT 0,
        is_available BOOLEAN NOT NULL DEFAULT TRUE,
        deleted_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await queryRunner.query(`
      ALTER TABLE menu_items
        ADD COLUMN IF NOT EXISTS category_id BIGINT,
        ADD COLUMN IF NOT EXISTS category menu_category,
        ADD COLUMN IF NOT EXISTS name VARCHAR(200),
        ADD COLUMN IF NOT EXISTS name_en VARCHAR(200),
        ADD COLUMN IF NOT EXISTS description TEXT,
        ADD COLUMN IF NOT EXISTS description_en TEXT,
        ADD COLUMN IF NOT EXISTS sort_order INT NOT NULL DEFAULT 0;
    `);

    await queryRunner.query(`
      ALTER TABLE menu_items ALTER COLUMN category_id DROP NOT NULL;
    `);

    // Menu Item Translations
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS menu_item_translations (
        id BIGSERIAL PRIMARY KEY,
        menu_item_id BIGINT NOT NULL,
        language language_code NOT NULL,
        name VARCHAR(200) NOT NULL,
        description TEXT
      );
    `);

    // Orders
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id BIGSERIAL PRIMARY KEY,
        hotel_id BIGINT NOT NULL,
        session_id BIGINT,
        order_source order_source_type NOT NULL,
        customer_name VARCHAR(100),
        customer_phone VARCHAR(20),
        room_number VARCHAR(20),
        note TEXT,
        total_amount DECIMAL(12,2) NOT NULL CHECK (total_amount >= 0),
        status order_status NOT NULL DEFAULT 'PENDING',
        confirmed_at TIMESTAMPTZ,
        ready_at TIMESTAMPTZ,
        completed_at TIMESTAMPTZ,
        cancelled_at TIMESTAMPTZ,
        cancel_reason TEXT,
        created_by BIGINT,
        updated_by BIGINT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // Order Items
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id BIGSERIAL PRIMARY KEY,
        order_id BIGINT NOT NULL,
        menu_item_id BIGINT NOT NULL,
        item_name VARCHAR(200) NOT NULL,
        item_price DECIMAL(12,2) NOT NULL CHECK (item_price >= 0),
        quantity INT NOT NULL CHECK (quantity > 0),
        subtotal DECIMAL(12,2) NOT NULL CHECK (subtotal >= 0),
        note TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // Notifications
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id BIGSERIAL PRIMARY KEY,
        hotel_id BIGINT NOT NULL,
        recipient_user_id BIGINT,
        type notification_type NOT NULL,
        reference_id BIGINT,
        title VARCHAR(200) NOT NULL,
        content TEXT,
        is_read BOOLEAN NOT NULL DEFAULT FALSE,
        read_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // Food order module tables. These replace the old generic orders/order_items
    // migration path for the local app.
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS food_orders (
        id BIGSERIAL PRIMARY KEY,
        hotel_id BIGINT NOT NULL,
        service_id BIGINT,
        order_code VARCHAR(30) UNIQUE,
        idempotency_key VARCHAR(80),
        room_number VARCHAR(50),
        customer_name VARCHAR(120),
        customer_phone VARCHAR(50),
        note TEXT,
        status VARCHAR(20) NOT NULL DEFAULT 'new',
        total_amount DECIMAL(12,2) NOT NULL DEFAULT 0
          CONSTRAINT ck_food_orders_total_amount_nonnegative CHECK (total_amount >= 0),
        rejected_reason TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS food_order_items (
        id BIGSERIAL PRIMARY KEY,
        order_id BIGINT NOT NULL,
        menu_item_id BIGINT,
        item_name VARCHAR(200) NOT NULL,
        category menu_category NOT NULL DEFAULT 'food',
        unit_price DECIMAL(12,2) NOT NULL
          CONSTRAINT ck_food_order_items_unit_price_nonnegative CHECK (unit_price >= 0),
        quantity INT NOT NULL DEFAULT 1
          CONSTRAINT ck_food_order_items_quantity_positive CHECK (quantity > 0)
      );
    `);

    // Media Files
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS media_files (
        id BIGSERIAL PRIMARY KEY,
        hotel_id BIGINT NOT NULL,
        uploaded_by BIGINT,
        file_name VARCHAR(255),
        storage_provider VARCHAR(50),
        bucket_name VARCHAR(100),
        storage_key TEXT,
        file_url TEXT NOT NULL,
        mime_type VARCHAR(100),
        file_size BIGINT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // ============================================================
    // INDEXES
    // ============================================================
    console.log('Creating indexes...');

    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_hotel_users_hotel_email;
      CREATE UNIQUE INDEX IF NOT EXISTS uq_hotel_users_hotel_email_active ON hotel_users (hotel_id, email) WHERE deleted_at IS NULL;
      CREATE INDEX IF NOT EXISTS idx_hotel_users_active_email ON hotel_users (email) WHERE deleted_at IS NULL AND is_active = TRUE;
      CREATE INDEX IF NOT EXISTS idx_services_hotel_active_sort ON services (hotel_id, is_active, sort_order);
      CREATE UNIQUE INDEX IF NOT EXISTS idx_service_translations_service_lang ON service_translations (service_id, language);
      CREATE INDEX IF NOT EXISTS idx_customer_sessions_hotel_status_msg ON customer_sessions (hotel_id, status, last_message_at);
      CREATE INDEX IF NOT EXISTS idx_customer_sessions_hotel_activity ON customer_sessions (hotel_id, (COALESCE(last_message_at, created_at)) DESC);
      CREATE INDEX IF NOT EXISTS idx_customer_sessions_hotel_phone ON customer_sessions (hotel_id, customer_phone);
      CREATE INDEX IF NOT EXISTS idx_customer_sessions_hotel_token ON customer_sessions (hotel_id, customer_token);
      CREATE INDEX IF NOT EXISTS idx_chat_messages_hotel_session_created ON chat_messages (hotel_id, session_id, created_at);
      CREATE INDEX IF NOT EXISTS idx_chat_messages_session_read ON chat_messages (session_id, is_read);
      CREATE INDEX IF NOT EXISTS idx_chat_messages_session_sender_unread ON chat_messages (session_id, sender_type) WHERE is_read = FALSE;
      CREATE INDEX IF NOT EXISTS idx_menu_categories_hotel_active_sort ON menu_categories (hotel_id, is_active, sort_order);
      CREATE UNIQUE INDEX IF NOT EXISTS idx_menu_category_translations_cat_lang ON menu_category_translations (category_id, language);
      CREATE INDEX IF NOT EXISTS idx_menu_items_hotel_cat_avail ON menu_items (hotel_id, category_id, is_available);
      CREATE INDEX IF NOT EXISTS idx_menu_items_hotel ON menu_items(hotel_id);
      CREATE INDEX IF NOT EXISTS idx_menu_items_hotel_available ON menu_items(hotel_id, is_available) WHERE deleted_at IS NULL;
      CREATE INDEX IF NOT EXISTS idx_menu_items_public_sort ON menu_items(hotel_id, is_available, sort_order, id) WHERE deleted_at IS NULL;
      CREATE UNIQUE INDEX IF NOT EXISTS idx_menu_item_translations_item_lang ON menu_item_translations (menu_item_id, language);
      CREATE INDEX IF NOT EXISTS idx_orders_hotel_status_created ON orders (hotel_id, status, created_at);
      CREATE INDEX IF NOT EXISTS idx_orders_session ON orders (session_id);
      CREATE INDEX IF NOT EXISTS idx_orders_hotel_phone ON orders (hotel_id, customer_phone);
      CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items (order_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_hotel_user_read ON notifications (hotel_id, recipient_user_id, is_read);
      CREATE INDEX IF NOT EXISTS idx_media_files_hotel_created ON media_files (hotel_id, created_at);
      CREATE INDEX IF NOT EXISTS idx_food_orders_hotel_status ON food_orders(hotel_id, status);
      CREATE INDEX IF NOT EXISTS idx_food_orders_hotel_status_created ON food_orders(hotel_id, status, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_food_orders_created ON food_orders(hotel_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_food_order_items_order ON food_order_items(order_id);
    `);

    // ============================================================
    // FOREIGN KEYS
    // ============================================================
    console.log('Creating foreign keys...');

    // Helper to add FK only if it doesn't exist
    const addFK = async (
      name: string,
      table: string,
      column: string,
      refTable: string,
      refColumn: string,
      onDelete: string,
    ) => {
      await queryRunner.query(`
        DO $$ BEGIN
          ALTER TABLE ${table} ADD CONSTRAINT ${name}
            FOREIGN KEY (${column}) REFERENCES ${refTable}(${refColumn}) ON DELETE ${onDelete};
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
      `);
    };

    const addCheck = async (
      table: string,
      name: string,
      expression: string,
    ) => {
      await queryRunner.query(`
        DO $$ BEGIN
          ALTER TABLE ${table}
            ADD CONSTRAINT ${name} CHECK (${expression}) NOT VALID;
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
      `);
    };

    await addFK(
      'fk_hotel_users_hotel',
      'hotel_users',
      'hotel_id',
      'hotels',
      'id',
      'RESTRICT',
    );
    await addFK(
      'fk_services_hotel',
      'services',
      'hotel_id',
      'hotels',
      'id',
      'CASCADE',
    );
    await addFK(
      'fk_service_translations_service',
      'service_translations',
      'service_id',
      'services',
      'id',
      'CASCADE',
    );
    await addFK(
      'fk_customer_sessions_hotel',
      'customer_sessions',
      'hotel_id',
      'hotels',
      'id',
      'CASCADE',
    );
    await addFK(
      'fk_customer_sessions_user',
      'customer_sessions',
      'assigned_user_id',
      'hotel_users',
      'id',
      'SET NULL',
    );
    await addFK(
      'fk_chat_messages_hotel',
      'chat_messages',
      'hotel_id',
      'hotels',
      'id',
      'CASCADE',
    );
    await addFK(
      'fk_chat_messages_session',
      'chat_messages',
      'session_id',
      'customer_sessions',
      'id',
      'CASCADE',
    );
    await addFK(
      'fk_chat_messages_sender',
      'chat_messages',
      'sender_user_id',
      'hotel_users',
      'id',
      'SET NULL',
    );
    await addFK(
      'fk_menu_categories_hotel',
      'menu_categories',
      'hotel_id',
      'hotels',
      'id',
      'CASCADE',
    );
    await addFK(
      'fk_menu_category_translations_cat',
      'menu_category_translations',
      'category_id',
      'menu_categories',
      'id',
      'CASCADE',
    );
    await addFK(
      'fk_menu_items_hotel',
      'menu_items',
      'hotel_id',
      'hotels',
      'id',
      'CASCADE',
    );
    await addFK(
      'fk_menu_items_category',
      'menu_items',
      'category_id',
      'menu_categories',
      'id',
      'RESTRICT',
    );
    await addFK(
      'fk_menu_item_translations_item',
      'menu_item_translations',
      'menu_item_id',
      'menu_items',
      'id',
      'CASCADE',
    );
    await addFK(
      'fk_orders_hotel',
      'orders',
      'hotel_id',
      'hotels',
      'id',
      'CASCADE',
    );
    await addFK(
      'fk_orders_session',
      'orders',
      'session_id',
      'customer_sessions',
      'id',
      'SET NULL',
    );
    await addFK(
      'fk_orders_created_by',
      'orders',
      'created_by',
      'hotel_users',
      'id',
      'SET NULL',
    );
    await addFK(
      'fk_orders_updated_by',
      'orders',
      'updated_by',
      'hotel_users',
      'id',
      'SET NULL',
    );
    await addFK(
      'fk_order_items_order',
      'order_items',
      'order_id',
      'orders',
      'id',
      'CASCADE',
    );
    await addFK(
      'fk_order_items_menu_item',
      'order_items',
      'menu_item_id',
      'menu_items',
      'id',
      'RESTRICT',
    );
    await addFK(
      'fk_notifications_hotel',
      'notifications',
      'hotel_id',
      'hotels',
      'id',
      'CASCADE',
    );
    await addFK(
      'fk_notifications_user',
      'notifications',
      'recipient_user_id',
      'hotel_users',
      'id',
      'SET NULL',
    );
    await addFK(
      'fk_media_files_hotel',
      'media_files',
      'hotel_id',
      'hotels',
      'id',
      'CASCADE',
    );
    await addFK(
      'fk_media_files_uploaded_by',
      'media_files',
      'uploaded_by',
      'hotel_users',
      'id',
      'SET NULL',
    );
    await addFK(
      'fk_food_orders_hotel',
      'food_orders',
      'hotel_id',
      'hotels',
      'id',
      'CASCADE',
    );
    await addFK(
      'fk_food_orders_service',
      'food_orders',
      'service_id',
      'services',
      'id',
      'SET NULL',
    );
    await addFK(
      'fk_food_order_items_order',
      'food_order_items',
      'order_id',
      'food_orders',
      'id',
      'CASCADE',
    );
    await addFK(
      'fk_food_order_items_menu_item',
      'food_order_items',
      'menu_item_id',
      'menu_items',
      'id',
      'SET NULL',
    );

    // ============================================================
    // CHECK CONSTRAINTS
    // ============================================================
    console.log('Creating check constraints...');

    await addCheck(
      'customer_sessions',
      'ck_customer_sessions_unread_count_nonnegative',
      'unread_count >= 0',
    );
    await addCheck(
      'customer_sessions',
      'ck_customer_sessions_guest_count_positive',
      'guest_count IS NULL OR guest_count > 0',
    );
    await addCheck(
      'customer_sessions',
      'ck_customer_sessions_date_range',
      'check_in_date IS NULL OR check_out_date IS NULL OR check_out_date >= check_in_date',
    );
    await addCheck(
      'food_orders',
      'ck_food_orders_total_amount_nonnegative',
      'total_amount >= 0',
    );
    await addCheck(
      'food_order_items',
      'ck_food_order_items_unit_price_nonnegative',
      'unit_price >= 0',
    );
    await addCheck(
      'food_order_items',
      'ck_food_order_items_quantity_positive',
      'quantity > 0',
    );

    // ============================================================
    // SEED DATA
    // ============================================================
    console.log('Inserting seed data...');

    // Hotels
    await queryRunner.query(`
      INSERT INTO hotels (name, slug, phone, email, address, description, qr_token)
      VALUES
        ('Grand Palace Hotel', 'grand-palace-hotel', '+84-28-1234-5678', 'info@grandpalace.vn', '123 Nguyen Hue, District 1, HCMC', 'Luxury 5-star hotel in the heart of Ho Chi Minh City', gen_random_uuid()),
        ('Seaside Resort Da Nang', 'seaside-resort-danang', '+84-236-9876-543', 'hello@seasidedanang.vn', '456 Vo Nguyen Giap, Son Tra, Da Nang', 'Beautiful beachfront resort with ocean views', gen_random_uuid())
      ON CONFLICT (slug) DO NOTHING;
    `);

    // System Admins
    const adminEmail = process.env.SYSTEM_ADMIN_EMAIL || 'admin@system.com';
    const adminPassword = process.env.SYSTEM_ADMIN_PASSWORD || 'admin123';
    const adminName = process.env.SYSTEM_ADMIN_NAME || 'System Admin';
    const adminPasswordHash = await bcrypt.hash(adminPassword, 10);

    await queryRunner.query(
      `INSERT INTO system_admins (email, password_hash, full_name)
       VALUES ($1, $2, $3)
       ON CONFLICT (email) DO NOTHING;`,
      [adminEmail, adminPasswordHash, adminName],
    );

    // Hotel Users — one admin per hotel. The seeded password is `staff123`
    // (hashed at runtime so we don't ship a stale placeholder hash).
    //
    // Note: re-running the seed against an existing database will not delete
    // legacy non-admin rows that may still be present (receptionist, kitchen,
    // staff). Drop the rows manually or re-create the database if you want
    // a clean slate.
    const hotelAdminPasswordHash = await bcrypt.hash('staff123', 10);
    await queryRunner.query(
      `INSERT INTO hotel_users (hotel_id, email, password_hash, full_name)
       VALUES
         (1, 'manager@grandpalace.vn',   $1, 'Nguyen Van A'),
         (2, 'manager@seasidedanang.vn', $1, 'Pham Thi D')
       ON CONFLICT DO NOTHING;`,
      [hotelAdminPasswordHash],
    );

    // Services
    await queryRunner.query(`
      INSERT INTO services (hotel_id, sort_order)
      VALUES (1, 1), (1, 2), (1, 3), (2, 1), (2, 2)
      ON CONFLICT DO NOTHING;
    `);

    // Service Translations
    await queryRunner.query(`
      INSERT INTO service_translations (service_id, language, title, description)
      VALUES
        (1, 'vi', 'Dịch vụ phòng', 'Phục vụ tại phòng 24/7'),
        (1, 'en', 'Room Service', '24/7 in-room dining service'),
        (2, 'vi', 'Spa & Massage', 'Thư giãn với liệu pháp spa cao cấp'),
        (2, 'en', 'Spa & Massage', 'Relax with premium spa treatments'),
        (3, 'vi', 'Đưa đón sân bay', 'Dịch vụ xe đưa đón sân bay'),
        (3, 'en', 'Airport Transfer', 'Airport pickup and drop-off service'),
        (4, 'vi', 'Tour biển', 'Khám phá bãi biển và đảo'),
        (4, 'en', 'Beach Tour', 'Explore beaches and islands'),
        (5, 'vi', 'Thuê xe máy', 'Thuê xe máy khám phá thành phố'),
        (5, 'en', 'Motorbike Rental', 'Rent a motorbike to explore the city')
      ON CONFLICT DO NOTHING;
    `);

    // Menu Categories
    await queryRunner.query(`
      INSERT INTO menu_categories (hotel_id, sort_order)
      VALUES (1, 1), (1, 2), (1, 3), (2, 1), (2, 2)
      ON CONFLICT DO NOTHING;
    `);

    // Menu Category Translations
    await queryRunner.query(`
      INSERT INTO menu_category_translations (category_id, language, name)
      VALUES
        (1, 'vi', 'Món khai vị'),
        (1, 'en', 'Appetizers'),
        (2, 'vi', 'Món chính'),
        (2, 'en', 'Main Courses'),
        (3, 'vi', 'Đồ uống'),
        (3, 'en', 'Beverages'),
        (4, 'vi', 'Hải sản'),
        (4, 'en', 'Seafood'),
        (5, 'vi', 'Tráng miệng'),
        (5, 'en', 'Desserts')
      ON CONFLICT DO NOTHING;
    `);

    // Menu Items
    await queryRunner.query(`
      INSERT INTO menu_items (
        id,
        hotel_id,
        category_id,
        category,
        name,
        name_en,
        description,
        description_en,
        price,
        sort_order
      )
      VALUES
        (1, 1, 1, 'food',  'Gỏi cuốn tôm',       'Fresh Spring Rolls', 'Gỏi cuốn tươi với tôm và rau sống',       'Fresh rolls with shrimp and vegetables',       85000,  1),
        (2, 1, 1, 'food',  'Súp bí đỏ',           'Pumpkin Soup',       'Súp bí đỏ kem tươi',                      'Creamy pumpkin soup',                          120000, 2),
        (3, 1, 2, 'food',  'Bò lúc lắc',          'Shaking Beef',       'Bò Úc xào với rau củ',                    'Australian beef stir-fried with vegetables',   250000, 3),
        (4, 1, 2, 'food',  'Cơm chiên hải sản',   'Seafood Fried Rice', 'Cơm chiên với tôm, mực, nghêu',           'Fried rice with shrimp, squid, and clams',     320000, 4),
        (5, 1, 3, 'drink', 'Trà sen',             'Lotus Tea',          'Trà sen Tây Hồ',                          'West Lake lotus tea',                          45000,  5),
        (6, 1, 3, 'drink', 'Sinh tố bơ',          'Avocado Smoothie',   'Sinh tố bơ tươi',                         'Fresh avocado smoothie',                       65000,  6),
        (7, 2, 4, 'food',  'Tôm hùm nướng',       'Grilled Lobster',    'Tôm hùm nướng bơ tỏi',                    'Garlic butter grilled lobster',                450000, 1),
        (8, 2, 4, 'food',  'Cua rang me',         'Tamarind Crab',      'Cua biển rang me chua ngọt',              'Sweet and sour tamarind crab',                 380000, 2),
        (9, 2, 5, 'food',  'Chè bưởi',            'Pomelo Dessert',     'Chè bưởi truyền thống',                   'Traditional pomelo sweet soup',                95000,  3),
        (10, 2, 5, 'food', 'Kem dừa',             'Coconut Ice Cream',  'Kem dừa tươi Bến Tre',                    'Fresh Ben Tre coconut ice cream',              110000, 4)
      ON CONFLICT (id) DO NOTHING;
    `);

    await queryRunner.query(`
      SELECT setval(
        pg_get_serial_sequence('menu_items', 'id'),
        GREATEST((SELECT COALESCE(MAX(id), 1) FROM menu_items), 1)
      );
    `);

    // Menu Item Translations
    await queryRunner.query(`
      INSERT INTO menu_item_translations (menu_item_id, language, name, description)
      VALUES
        (1, 'vi', 'Gỏi cuốn tôm', 'Gỏi cuốn tươi với tôm và rau sống'),
        (1, 'en', 'Fresh Spring Rolls', 'Fresh rolls with shrimp and vegetables'),
        (2, 'vi', 'Súp bí đỏ', 'Súp bí đỏ kem tươi'),
        (2, 'en', 'Pumpkin Soup', 'Creamy pumpkin soup'),
        (3, 'vi', 'Bò lúc lắc', 'Bò Úc xào với rau củ'),
        (3, 'en', 'Shaking Beef', 'Australian beef stir-fried with vegetables'),
        (4, 'vi', 'Cơm chiên hải sản', 'Cơm chiên với tôm, mực, nghêu'),
        (4, 'en', 'Seafood Fried Rice', 'Fried rice with shrimp, squid, and clams'),
        (5, 'vi', 'Trà sen', 'Trà sen Tây Hồ'),
        (5, 'en', 'Lotus Tea', 'West Lake lotus tea'),
        (6, 'vi', 'Sinh tố bơ', 'Sinh tố bơ tươi'),
        (6, 'en', 'Avocado Smoothie', 'Fresh avocado smoothie'),
        (7, 'vi', 'Tôm hùm nướng', 'Tôm hùm nướng bơ tỏi'),
        (7, 'en', 'Grilled Lobster', 'Garlic butter grilled lobster'),
        (8, 'vi', 'Cua rang me', 'Cua biển rang me chua ngọt'),
        (8, 'en', 'Tamarind Crab', 'Sweet and sour tamarind crab'),
        (9, 'vi', 'Chè bưởi', 'Chè bưởi truyền thống'),
        (9, 'en', 'Pomelo Dessert', 'Traditional pomelo sweet soup'),
        (10, 'vi', 'Kem dừa', 'Kem dừa tươi Bến Tre'),
        (10, 'en', 'Coconut Ice Cream', 'Fresh Ben Tre coconut ice cream')
      ON CONFLICT DO NOTHING;
    `);

    await queryRunner.query(`
      UPDATE menu_items mi
      SET
        name = COALESCE(
          NULLIF(mi.name, ''),
          (SELECT t.name FROM menu_item_translations t WHERE t.menu_item_id = mi.id AND t.language = 'vi' LIMIT 1),
          'Món #' || mi.id::text
        ),
        name_en = COALESCE(
          mi.name_en,
          (SELECT t.name FROM menu_item_translations t WHERE t.menu_item_id = mi.id AND t.language = 'en' LIMIT 1)
        ),
        description = COALESCE(
          mi.description,
          (SELECT t.description FROM menu_item_translations t WHERE t.menu_item_id = mi.id AND t.language = 'vi' LIMIT 1)
        ),
        description_en = COALESCE(
          mi.description_en,
          (SELECT t.description FROM menu_item_translations t WHERE t.menu_item_id = mi.id AND t.language = 'en' LIMIT 1)
        ),
        category = COALESCE(
          mi.category,
          CASE
            WHEN EXISTS (
              SELECT 1
              FROM menu_category_translations mct
              WHERE mct.category_id = mi.category_id
                AND (
                  lower(mct.name) LIKE '%uống%'
                  OR lower(mct.name) LIKE '%drink%'
                  OR lower(mct.name) LIKE '%beverage%'
                  OR lower(mct.name) LIKE '%coffee%'
                  OR lower(mct.name) LIKE '%tea%'
                )
            )
            THEN 'drink'::menu_category
            ELSE 'food'::menu_category
          END
        );
    `);

    await queryRunner.query(`
      UPDATE menu_items
      SET
        category = COALESCE(category, 'food'::menu_category),
        name = COALESCE(NULLIF(name, ''), 'Món #' || id::text);
    `);

    await queryRunner.query(`
      ALTER TABLE menu_items ALTER COLUMN category SET DEFAULT 'food';
      ALTER TABLE menu_items ALTER COLUMN category SET NOT NULL;
      ALTER TABLE menu_items ALTER COLUMN name SET NOT NULL;
      ALTER TABLE menu_items ALTER COLUMN name DROP DEFAULT;
    `);

    await queryRunner.commitTransaction();
    console.log('✅ Database seeded successfully!');
  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error('❌ Seed failed:', error);
    throw error;
  } finally {
    await queryRunner.release();
    await dataSource.destroy();
  }
}

void seed();
