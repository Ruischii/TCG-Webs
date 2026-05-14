-- TCG Platform Database Schema

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    phone VARCHAR(20),
    avatar_url TEXT,
    role VARCHAR(20) DEFAULT 'COLLECTOR' CHECK (role IN ('COLLECTOR', 'SELLER', 'ADMIN', 'SUPER_ADMIN')),
    kiotviet_customer_id INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TCG Game Types
CREATE TABLE game_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    short_name VARCHAR(10),
    logo_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Card Sets/Expansions
CREATE TABLE card_sets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_type_id UUID REFERENCES game_types(id),
    name VARCHAR(255) NOT NULL,
    set_code VARCHAR(20) NOT NULL,
    release_date DATE,
    total_cards INTEGER,
    logo_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(game_type_id, set_code)
);

-- Products (Cards Only)
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(500) NOT NULL,
    slug VARCHAR(500) UNIQUE NOT NULL,
    description TEXT,
    price DECIMAL(12,2) NOT NULL,
    sale_price DECIMAL(12,2),
    quantity INTEGER DEFAULT 0,
    sku VARCHAR(100) UNIQUE,
    barcode VARCHAR(100),
    images JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    is_preorder BOOLEAN DEFAULT false,
    release_date DATE,
    game_type_id UUID REFERENCES game_types(id),
    set_id UUID REFERENCES card_sets(id),
    product_type VARCHAR(20) CHECK (product_type IN ('SINGLE', 'SEALED', 'GRADED')),
    kiotviet_product_id INTEGER,
    last_sync_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TCG Card Details
CREATE TABLE card_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID UNIQUE REFERENCES products(id) ON DELETE CASCADE,
    card_number VARCHAR(20) NOT NULL,
    rarity VARCHAR(30) NOT NULL CHECK (rarity IN (
        'COMMON', 'UNCOMMON', 'RARE', 'DOUBLE_RARE', 'SUPER_RARE', 
        'ULTRA_RARE', 'SECRET_RARE', 'PROMO', 'SPECIAL_RARE',
        'AMAZING_RARE', 'RADIANT_RARE', 'ILLUSTRATION_RARE',
        'SPECIAL_ILLUSTRATION_RARE', 'HYPER_RARE', 'GOLD_RARE'
    )),
    card_type VARCHAR(50),
    condition VARCHAR(30) CHECK (condition IN (
        'MINT', 'NEAR_MINT', 'LIGHTLY_PLAYED', 
        'MODERATELY_PLAYED', 'HEAVILY_PLAYED', 'DAMAGED'
    )),
    is_holo BOOLEAN DEFAULT false,
    is_reverse_holo BOOLEAN DEFAULT false,
    is_first_edition BOOLEAN DEFAULT false,
    is_graded BOOLEAN DEFAULT false,
    grading_company VARCHAR(20) CHECK (grading_company IN ('PSA', 'BGS', 'CGC', 'SGC')),
    grade DECIMAL(3,1),
    certification_number VARCHAR(50),
    market_price DECIMAL(12,2),
    buy_list_price DECIMAL(12,2),
    quantity_sold_30d INTEGER DEFAULT 0,
    price_change_24h DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sealed Product Details
CREATE TABLE sealed_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID UNIQUE REFERENCES products(id) ON DELETE CASCADE,
    product_subtype VARCHAR(30) CHECK (product_subtype IN (
        'BOOSTER_BOX', 'ELITE_TRAINER_BOX', 'BOOSTER_PACK',
        'STRUCTURE_DECK', 'STARTER_DECK', 'TIN', 'COLLECTION_BOX',
        'PREMIUM_COLLECTION', 'BLASTER', 'SPECIAL_SET'
    )),
    packs_per_box INTEGER,
    cards_per_pack INTEGER,
    guaranteed_hits INTEGER,
    pull_rates JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Price History
CREATE TABLE price_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    price DECIMAL(12,2) NOT NULL,
    source VARCHAR(50),
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN (
        'PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'
    )),
    total_amount DECIMAL(12,2) NOT NULL,
    shipping_address JSONB,
    shipping_method VARCHAR(50),
    payment_method VARCHAR(50),
    payment_status VARCHAR(20) DEFAULT 'PENDING',
    kiotviet_order_id INTEGER,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Order Items
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    quantity INTEGER NOT NULL,
    price DECIMAL(12,2) NOT NULL,
    product_name VARCHAR(500)
);

-- Cart
CREATE TABLE cart_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, product_id)
);

-- Wishlist
CREATE TABLE wishlist_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    target_price DECIMAL(12,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, product_id)
);

-- Collections
CREATE TABLE collections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 1,
    condition VARCHAR(30),
    is_graded BOOLEAN DEFAULT false,
    grade DECIMAL(3,1),
    purchase_price DECIMAL(12,2),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, product_id)
);

-- Decks
CREATE TABLE decks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    game_type_id UUID REFERENCES game_types(id),
    format VARCHAR(50),
    is_public BOOLEAN DEFAULT false,
    cards JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trades
CREATE TABLE trades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    initiator_id UUID REFERENCES users(id),
    receiver_id UUID REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN (
        'PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'COMPLETED'
    )),
    initiator_cards JSONB,
    receiver_cards JSONB,
    cash_difference DECIMAL(12,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- KiotViet Sync Logs
CREATE TABLE sync_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(255),
    kiotviet_id INTEGER,
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN (
        'PENDING', 'SYNCING', 'SYNCED', 'FAILED'
    )),
    message TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Branches
CREATE TABLE branches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kiotviet_branch_id INTEGER UNIQUE,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Branch Inventory
CREATE TABLE branch_inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(branch_id, product_id)
);

-- Reviews
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    product_id UUID REFERENCES products(id),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, product_id)
);

-- Create Indexes
CREATE INDEX idx_products_game_type ON products(game_type_id);
CREATE INDEX idx_products_set ON products(set_id);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_products_type ON products(product_type);
CREATE INDEX idx_card_rarity ON card_details(rarity);
CREATE INDEX idx_card_condition ON card_details(condition);
CREATE INDEX idx_card_market_price ON card_details(market_price);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_sync_logs_status ON sync_logs(status, entity_type);
CREATE INDEX idx_price_history_product ON price_history(product_id);
CREATE INDEX idx_price_history_date ON price_history(recorded_at);