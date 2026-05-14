-- TCG Platform Seed Data

INSERT INTO game_types (name, slug, short_name) VALUES
    ('Pokémon TCG', 'pokemon', 'PTCG'),
    ('Yu-Gi-Oh!', 'yugioh', 'YGO'),
    ('One Piece Card Game', 'one-piece', 'OPCG'),
    ('Weiss Schwarz', 'weiss-schwarz', 'WS'),
    ('Dragon Ball Super Card Game', 'dragon-ball-super', 'DBS'),
    ('Digimon Card Game', 'digimon', 'DIGI'),
    ('Magic: The Gathering', 'magic', 'MTG'),
    ('Cardfight!! Vanguard', 'vanguard', 'VG'),
    ('Union Arena', 'union-arena', 'UA');

-- Insert Sets
INSERT INTO card_sets (game_type_id, name, set_code, release_date, total_cards)
SELECT id, 'Scarlet & Violet - 151', 'MEW', '2023-09-22', 207
FROM game_types WHERE slug = 'pokemon';

INSERT INTO card_sets (game_type_id, name, set_code, release_date, total_cards)
SELECT id, 'Paldean Fates', 'PAF', '2024-01-26', 245
FROM game_types WHERE slug = 'pokemon';

INSERT INTO card_sets (game_type_id, name, set_code, release_date, total_cards)
SELECT id, 'Age of Overlord', 'AGOV', '2023-10-20', 100
FROM game_types WHERE slug = 'yugioh';

INSERT INTO card_sets (game_type_id, name, set_code, release_date, total_cards)
SELECT id, 'Kingdom of Intrigue', 'OP04', '2023-09-22', 126
FROM game_types WHERE slug = 'one-piece';

-- Insert Admin User
INSERT INTO users (email, username, password_hash, full_name, role) VALUES
    ('admin@tcgstore.com', 'admin', '$2b$10$YourHashedPasswordHere', 'Admin TCG', 'ADMIN'),
    ('seller@tcgstore.com', 'seller1', '$2b$10$YourHashedPasswordHere', 'TCG Seller', 'SELLER'),
    ('collector@tcgstore.com', 'collector1', '$2b$10$YourHashedPasswordHere', 'Card Collector', 'COLLECTOR');

-- Insert Products (Pokémon Cards)
INSERT INTO products (name, slug, description, price, quantity, sku, game_type_id, set_id, product_type, images)
SELECT 
    'Charizard ex Special Illustration Rare',
    'charizard-ex-sir-151',
    'Charizard ex - 199/165 - Special Illustration Rare',
    1299.99,
    2,
    'PKM-MEW-199',
    gt.id,
    cs.id,
    'SINGLE',
    '["/images/cards/charizard-ex-sir.jpg"]'
FROM game_types gt, card_sets cs
WHERE gt.slug = 'pokemon' AND cs.set_code = 'MEW'
LIMIT 1;

INSERT INTO card_details (product_id, card_number, rarity, card_type, condition, is_holo, market_price, buy_list_price, quantity_sold_30d)
SELECT 
    id, '199/165', 'SPECIAL_ILLUSTRATION_RARE', 'Fire', 'NEAR_MINT', true, 1499.99, 900.00, 47
FROM products WHERE slug = 'charizard-ex-sir-151';

INSERT INTO products (name, slug, description, price, quantity, sku, game_type_id, set_id, product_type, images)
SELECT 
    'Pikachu ex Double Rare',
    'pikachu-ex-double-rare',
    'Pikachu ex - 063/165 - Double Rare',
    89.99,
    5,
    'PKM-MEW-063',
    gt.id,
    cs.id,
    'SINGLE',
    '["/images/cards/pikachu-ex.jpg"]'
FROM game_types gt, card_sets cs
WHERE gt.slug = 'pokemon' AND cs.set_code = 'MEW'
LIMIT 1;

INSERT INTO card_details (product_id, card_number, rarity, card_type, condition, is_holo, market_price, buy_list_price, quantity_sold_30d)
SELECT 
    id, '063/165', 'DOUBLE_RARE', 'Lightning', 'MINT', true, 95.00, 50.00, 123
FROM products WHERE slug = 'pikachu-ex-double-rare';

-- Insert Yu-Gi-Oh! Cards
INSERT INTO products (name, slug, description, price, quantity, sku, game_type_id, set_id, product_type, images)
SELECT 
    'S:P Little Knight',
    'sp-little-knight',
    'S:P Little Knight - Quarter Century Secret Rare',
    249.99,
    1,
    'YGO-AGOV-EN046',
    gt.id,
    cs.id,
    'SINGLE',
    '["/images/cards/sp-little-knight.jpg"]'
FROM game_types gt, card_sets cs
WHERE gt.slug = 'yugioh' AND cs.set_code = 'AGOV'
LIMIT 1;

INSERT INTO card_details (product_id, card_number, rarity, card_type, condition, is_holo, market_price, buy_list_price, quantity_sold_30d)
SELECT 
    id, 'AGOV-EN046', 'QUARTER_CENTURY_SECRET_RARE', 'Link Monster', 'NEAR_MINT', true, 275.00, 150.00, 89
FROM products WHERE slug = 'sp-little-knight';

-- Insert One Piece Cards
INSERT INTO products (name, slug, description, price, quantity, sku, game_type_id, set_id, product_type, images)
SELECT 
    'Monkey D. Luffy Leader',
    'monkey-d-luffy-leader-op04',
    'Monkey D. Luffy - Parallel Leader Card',
    449.99,
    1,
    'OP-OP04-001',
    gt.id,
    cs.id,
    'SINGLE',
    '["/images/cards/luffy-leader.jpg"]'
FROM game_types gt, card_sets cs
WHERE gt.slug = 'one-piece' AND cs.set_code = 'OP04'
LIMIT 1;

INSERT INTO card_details (product_id, card_number, rarity, card_type, condition, market_price, buy_list_price, quantity_sold_30d)
SELECT 
    id, 'OP04-001', 'SECRET_RARE', 'Leader', 'MINT', 500.00, 275.00, 34
FROM products WHERE slug = 'monkey-d-luffy-leader-op04';

-- Insert Sealed Products
INSERT INTO products (name, slug, description, price, quantity, sku, game_type_id, product_type, images)
SELECT 
    'Scarlet & Violet 151 Booster Bundle',
    'sv151-booster-bundle',
    'Includes 6 booster packs from SV151',
    39.99,
    50,
    'PKM-SEALED-151-BUNDLE',
    id,
    'SEALED',
    '["/images/sealed/151-bundle.jpg"]'
FROM game_types WHERE slug = 'pokemon';

INSERT INTO sealed_details (product_id, product_subtype, packs_per_box, cards_per_pack)
SELECT id, 'BLASTER', 6, 10
FROM products WHERE slug = 'sv151-booster-bundle';

INSERT INTO products (name, slug, description, price, quantity, sku, game_type_id, product_type, images)
SELECT 
    'Paldean Fates Elite Trainer Box',
    'paldean-fates-etb',
    'Includes 9 booster packs, sleeves, dice, and more',
    59.99,
    30,
    'PKM-SEALED-PAF-ETB',
    id,
    'SEALED',
    '["/images/sealed/paf-etb.jpg"]'
FROM game_types WHERE slug = 'pokemon';

INSERT INTO sealed_details (product_id, product_subtype, packs_per_box, cards_per_pack, guaranteed_hits)
SELECT id, 'ELITE_TRAINER_BOX', 9, 10, 2
FROM products WHERE slug = 'paldean-fates-etb';

-- Insert PSA Graded Cards
INSERT INTO products (name, slug, description, price, quantity, sku, game_type_id, product_type, images)
SELECT 
    'Moonbreon Umbreon VMAX PSA 10',
    'umbreon-vmax-psa10',
    'Umbreon VMAX 215/203 Evolving Skies - PSA 10 GEM MINT',
    2499.99,
    1,
    'PKM-GRADED-EVS-215',
    id,
    'GRADED',
    '["/images/graded/umbreon-psa10.jpg"]'
FROM game_types WHERE slug = 'pokemon';

INSERT INTO card_details (product_id, card_number, rarity, card_type, condition, is_graded, grading_company, grade, certification_number, market_price)
SELECT 
    id, '215/203', 'SECRET_RARE', 'Dark', 'MINT', true, 'PSA', 10.0, 'PSA12345678', 2800.00
FROM products WHERE slug = 'umbreon-vmax-psa10';

-- Insert Price History (last 30 days)
INSERT INTO price_history (product_id, price, source, recorded_at)
SELECT id, 1099.99, 'TCGPlayer', NOW() - INTERVAL '30 days'
FROM products WHERE slug = 'charizard-ex-sir-151';

INSERT INTO price_history (product_id, price, source, recorded_at)
SELECT id, 1199.99, 'TCGPlayer', NOW() - INTERVAL '15 days'
FROM products WHERE slug = 'charizard-ex-sir-151';

INSERT INTO price_history (product_id, price, source, recorded_at)
SELECT id, 1299.99, 'TCGPlayer', NOW()
FROM products WHERE slug = 'charizard-ex-sir-151';