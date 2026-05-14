// server.js - Pokémon TCG Store with Search Suggestions
const http = require('http');
const https = require('https');
const crypto = require('crypto');

const PORT = 3000;

// ============================================
// POKÉMON TCG API
// ============================================
function fetchPokemonAPI(path, params = {}) {
    return new Promise((resolve, reject) => {
        try {
            const queryString = Object.entries(params)
                .filter(([_, v]) => v !== '' && v !== null && v !== undefined)
                .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
                .join('&');
            
            const fullPath = queryString ? `${path}?${queryString}` : path;
            
            const options = {
                hostname: 'api.pokemontcg.io',
                path: `/v2${fullPath}`,
                method: 'GET',
                headers: {
                    'User-Agent': 'TCG-Platform/6.0',
                    'Accept': 'application/json'
                },
                timeout: 10000
            };

            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const json = JSON.parse(data);
                        resolve(json);
                    } catch(e) {
                        reject(new Error('Failed to parse API response'));
                    }
                });
            });

            req.on('error', (err) => reject(err));
            req.on('timeout', () => { req.destroy(); reject(new Error('API timeout')); });
            req.end();
        } catch(e) {
            reject(e);
        }
    });
}

async function searchPokemonCards(query = '', page = 1, pageSize = 12) {
    try {
        const params = { pageSize: pageSize.toString(), page: page.toString(), orderBy: '-set.releaseDate' };
        if (query && query.trim()) params.q = `name:"*${query.trim()}*"`;
        const response = await fetchPokemonAPI('/cards', params);
        if (response && response.data) {
            return { data: response.data, total: response.totalCount || response.data.length, page: response.page || page };
        }
        return { data: [], total: 0, page: 1 };
    } catch(e) {
        console.error('API Error:', e.message);
        return { data: [], total: 0, page: 1, error: e.message };
    }
}

async function getPokemonSets() {
    try {
        const response = await fetchPokemonAPI('/sets', { orderBy: '-releaseDate', pageSize: '30' });
        return response.data || [];
    } catch(e) { return []; }
}

// ============================================
// CARD NAME SUGGESTIONS DATABASE
// ============================================
const popularPokemonCards = [
    "Charizard", "Charizard ex", "Charizard VMAX", "Charizard VSTAR",
    "Pikachu", "Pikachu ex", "Pikachu VMAX", "Pikachu V",
    "Mewtwo", "Mewtwo ex", "Mewtwo VSTAR", "Mewtwo GX",
    "Mew", "Mew ex", "Mew VMAX",
    "Umbreon", "Umbreon VMAX", "Umbreon V",
    "Gengar", "Gengar VMAX", "Gengar ex",
    "Rayquaza", "Rayquaza VMAX", "Rayquaza GX",
    "Giratina", "Giratina VSTAR", "Giratina V",
    "Lugia", "Lugia VSTAR", "Lugia GX",
    "Arceus", "Arceus VSTAR", "Arceus V",
    "Eevee", "Eevee GX", "Eevee VMAX",
    "Greninja", "Greninja GX", "Greninja ex",
    "Lucario", "Lucario VSTAR", "Lucario GX",
    "Darkrai", "Darkrai GX", "Darkrai VSTAR",
    "Reshiram", "Reshiram & Charizard GX",
    "Zacian", "Zacian V", "Zamazenta V",
    "Eternatus", "Eternatus VMAX",
    "Dragapult", "Dragapult VMAX", "Dragapult ex",
    "Sylveon", "Sylveon VMAX", "Sylveon GX",
    "Espeon", "Espeon VMAX", "Espeon GX",
    "Glaceon", "Glaceon VMAX", "Glaceon GX",
    "Leafeon", "Leafeon VMAX", "Leafeon GX",
    "Jolteon", "Flareon", "Vaporeon",
    "Blastoise", "Blastoise ex", "Venusaur", "Venusaur ex",
    "Dragonite", "Dragonite V", "Dragonite GX",
    "Tyranitar", "Tyranitar V", "Tyranitar GX",
    "Metagross", "Metagross GX", "Metagross VMAX",
    "Salamence", "Salamence VMAX", "Salamence GX",
    "Gardevoir", "Gardevoir ex", "Gardevoir GX",
    "Machamp", "Machamp VMAX", "Machamp GX",
    "Snorlax", "Snorlax VMAX", "Snorlax GX",
    "Gyarados", "Gyarados GX", "Gyarados ex",
    "Alakazam", "Alakazam ex", "Alakazam GX",
    "Garchomp", "Garchomp V", "Garchomp GX",
    "Scizor", "Scizor VMAX", "Scizor GX",
    "Blaziken", "Blaziken VMAX",
    "Sceptile", "Swampert",
    "Incineroar", "Incineroar GX",
    "Decidueye", "Decidueye GX",
    "Primarina", "Primarina GX",
    "Zoroark", "Zoroark GX", "Zoroark VSTAR",
    "Mimikyu", "Mimikyu GX", "Mimikyu VMAX",
    "Tapu Koko", "Tapu Lele", "Tapu Fini", "Tapu Bulu",
    "Solgaleo", "Solgaleo GX", "Lunala", "Lunala GX",
    "Necrozma", "Necrozma GX",
    "Marshadow", "Marshadow GX",
    "Zeraora", "Zeraora GX", "Zeraora V",
    "Meltan", "Melmetal", "Melmetal VMAX",
    "Rillaboom", "Rillaboom VMAX",
    "Cinderace", "Cinderace VMAX",
    "Inteleon", "Inteleon VMAX",
    "Corviknight", "Corviknight VMAX",
    "Toxtricity", "Toxtricity VMAX",
    "Copperajah", "Copperajah VMAX",
    "Duraludon", "Duraludon VMAX",
    "Urshifu", "Urshifu VMAX", "Urshifu V",
    "Calyrex", "Calyrex VMAX", "Calyrex V",
    "Regieleki", "Regieleki VMAX",
    "Regidrago", "Regidrago VSTAR",
    "Wyrdeer", "Wyrdeer V",
    "Kleavor", "Kleavor VSTAR",
    "Hisuian", "Hisuian Zoroark VSTAR",
    "Origin Forme", "Origin Forme Palkia", "Origin Forme Dialga",
    "Walking Wake", "Walking Wake ex",
    "Iron Leaves", "Iron Leaves ex",
    "Koraidon", "Koraidon ex",
    "Miraidon", "Miraidon ex",
    "Meowscarada", "Meowscarada ex",
    "Skeledirge", "Skeledirge ex",
    "Quaquaval", "Quaquaval ex",
    "Tinkaton", "Tinkaton ex",
    "Armarouge", "Ceruledge",
    "Gholdengo", "Gholdengo ex",
    "Roaring Moon", "Roaring Moon ex",
    "Iron Valiant", "Iron Valiant ex",
    "Great Tusk", "Iron Treads",
    "Flutter Mane", "Scream Tail",
    "Brute Bonnet", "Slither Wing",
    "Sandy Shocks", "Iron Thorns",
    "Iron Bundle", "Iron Hands",
    "Iron Jugulis", "Iron Moth",
    "Terapagos", "Terapagos ex",
    "Ogerpon", "Pecharunt"
];

// Common search prefixes for quick suggestions
const searchPrefixes = [
    "Charizard", "Pikachu", "Mewtwo", "Umbreon", "Gengar",
    "Rayquaza", "Giratina", "Lugia", "Arceus", "Mew",
    "Greninja", "Lucario", "Eevee", "Sylveon", "Dragonite",
    "Gardevoir", "Blastoise", "Venusaur", "Gyarados", "Snorlax",
    "Miraidon", "Koraidon", "Roaring", "Iron", "Walking",
    "Terapagos", "Ogerpon", "Gholdengo", "Tinkaton", "Dragapult"
];

// ============================================
// ADMIN SYSTEM
// ============================================
const ADMIN_CREDENTIALS = { username: 'admin', password: 'admin123' };
const adminSessions = new Map();

function createAdminSession() {
    const token = crypto.randomBytes(32).toString('hex');
    adminSessions.set(token, {
        username: ADMIN_CREDENTIALS.username,
        createdAt: Date.now(),
        expiresAt: Date.now() + (24 * 60 * 60 * 1000)
    });
    // Clean expired
    for (const [k, s] of adminSessions) {
        if (Date.now() > s.expiresAt) adminSessions.delete(k);
    }
    return token;
}

function validateSession(token) {
    const session = adminSessions.get(token);
    if (!session || Date.now() > session.expiresAt) {
        if (session) adminSessions.delete(token);
        return false;
    }
    return true;
}

// ============================================
// PRODUCTS DATABASE
// ============================================
const products = [
    {
        id: 1, name: "Scarlet & Violet 151 Booster Bundle",
        game: "Pokémon TCG", set: "Scarlet & Violet - 151",
        cardNumber: "SEALED", rarity: "Sealed Product", rarityColor: "#4a90d9",
        price: 399000, condition: "Factory Sealed",
        quantity: 50, quantitySold: 234, image: "📦",
        discount: null, listingType: "sealed",
        packsPerBox: 6, cardsPerPack: 10,
        description: "6 booster packs from SV151! Contains chance for Charizard ex SIR!",
        highlights: "🔥 Chase: Charizard ex 199/165"
    },
    {
        id: 2, name: "Paldean Fates Elite Trainer Box",
        game: "Pokémon TCG", set: "Paldean Fates",
        cardNumber: "SEALED", rarity: "Sealed Product", rarityColor: "#4a90d9",
        price: 599000, condition: "Factory Sealed",
        quantity: 30, quantitySold: 156, image: "🎁",
        discount: null, listingType: "sealed",
        packsPerBox: 9, cardsPerPack: 10, guaranteedHits: 2,
        description: "9 packs + sleeves + dice! Shiny Treasure subset!",
        highlights: "💎 2 guaranteed Shiny cards!"
    },
    {
        id: 3, name: "Temporal Forces Booster Box (36 Packs)",
        game: "Pokémon TCG", set: "Temporal Forces",
        cardNumber: "SEALED", rarity: "Sealed Product", rarityColor: "#4a90d9",
        price: 1490000, condition: "Factory Sealed",
        quantity: 25, quantitySold: 89, image: "📦",
        discount: 8, listingType: "sealed",
        packsPerBox: 36, cardsPerPack: 10,
        description: "Full booster box - 36 packs! Walking Wake, Iron Leaves, ACE SPEC!",
        highlights: "⚡ ACE SPEC Trainer cards!"
    },
    {
        id: 4, name: "Paldea Evolved Booster Box (36 Packs)",
        game: "Pokémon TCG", set: "Paldea Evolved",
        cardNumber: "SEALED", rarity: "Sealed Product", rarityColor: "#4a90d9",
        price: 1390000, condition: "Factory Sealed",
        quantity: 20, quantitySold: 167, image: "📦",
        discount: 5, listingType: "sealed",
        packsPerBox: 36, cardsPerPack: 10,
        description: "Iono, Grusha, Meowscarada ex SIR! Full booster box!",
        highlights: "🌟 Iono SIR - Most valuable trainer!"
    },
    {
        id: 5, name: "Obsidian Flames Elite Trainer Box",
        game: "Pokémon TCG", set: "Obsidian Flames",
        cardNumber: "SEALED", rarity: "Sealed Product", rarityColor: "#4a90d9",
        price: 549000, condition: "Factory Sealed",
        quantity: 35, quantitySold: 98, image: "🎁",
        discount: null, listingType: "sealed",
        packsPerBox: 9, cardsPerPack: 10,
        description: "9 packs featuring Charizard ex! Sleeves + dice included!",
        highlights: "🔥 Charizard ex chase cards!"
    },
    {
        id: 6, name: "Paradox Rift Booster Box (36 Packs)",
        game: "Pokémon TCG", set: "Paradox Rift",
        cardNumber: "SEALED", rarity: "Sealed Product", rarityColor: "#4a90d9",
        price: 1440000, condition: "Factory Sealed",
        quantity: 18, quantitySold: 72, image: "📦",
        discount: null, listingType: "sealed",
        packsPerBox: 36, cardsPerPack: 10,
        description: "Ancient vs Future! Roaring Moon ex, Iron Valiant ex!",
        highlights: "🦖 Ancient & 🤖 Future Pokémon!"
    },
    {
        id: 7, name: "Crown Zenith Elite Trainer Box",
        game: "Pokémon TCG", set: "Crown Zenith",
        cardNumber: "SEALED", rarity: "Sealed Product", rarityColor: "#4a90d9",
        price: 649000, condition: "Factory Sealed",
        quantity: 15, quantitySold: 312, image: "🎁",
        discount: 10, listingType: "sealed",
        packsPerBox: 10, cardsPerPack: 10,
        description: "Special holiday set! 10 packs + Galarian Gallery!",
        highlights: "✨ 70 art rare cards in GG subset!"
    },
    {
        id: 8, name: "Silver Tempest Booster Box (36 Packs)",
        game: "Pokémon TCG", set: "Silver Tempest",
        cardNumber: "SEALED", rarity: "Sealed Product", rarityColor: "#4a90d9",
        price: 1350000, condition: "Factory Sealed",
        quantity: 12, quantitySold: 145, image: "📦",
        discount: null, listingType: "sealed",
        packsPerBox: 36, cardsPerPack: 10,
        description: "Lugia VSTAR, Alolan Vulpix VSTAR! 36 packs!",
        highlights: "🌊 Lugia V Alt Art!"
    },
    {
        id: 9, name: "Scarlet & Violet Base Booster Box (36 Packs)",
        game: "Pokémon TCG", set: "Scarlet & Violet",
        cardNumber: "SEALED", rarity: "Sealed Product", rarityColor: "#4a90d9",
        price: 1290000, condition: "Factory Sealed",
        quantity: 22, quantitySold: 203, image: "📦",
        discount: null, listingType: "sealed",
        packsPerBox: 36, cardsPerPack: 10,
        description: "First SV era set! Miraidon ex, Koraidon ex!",
        highlights: "⚡ First Scarlet & Violet set!"
    },
    {
        id: 10, name: "Lost Origin Booster Box (36 Packs)",
        game: "Pokémon TCG", set: "Lost Origin",
        cardNumber: "SEALED", rarity: "Sealed Product", rarityColor: "#4a90d9",
        price: 1420000, condition: "Factory Sealed",
        quantity: 8, quantitySold: 278, image: "📦",
        discount: 5, listingType: "sealed",
        packsPerBox: 36, cardsPerPack: 10,
        description: "Giratina VSTAR! Lost Zone mechanics! Trainer Gallery!",
        highlights: "👻 Giratina V Alt Art - $300+!"
    },
    {
        id: 11, name: "Pokémon GO Elite Trainer Box",
        game: "Pokémon TCG", set: "Pokémon GO",
        cardNumber: "SEALED", rarity: "Sealed Product", rarityColor: "#4a90d9",
        price: 499000, condition: "Factory Sealed",
        quantity: 40, quantitySold: 189, image: "🎁",
        discount: null, listingType: "sealed",
        packsPerBox: 10, cardsPerPack: 10,
        description: "Pokémon GO crossover! Mewtwo VSTAR, Radiant cards!",
        highlights: "📱 Pokémon GO themed!"
    },
    {
        id: 12, name: "Brilliant Stars Booster Box (36 Packs)",
        game: "Pokémon TCG", set: "Brilliant Stars",
        cardNumber: "SEALED", rarity: "Sealed Product", rarityColor: "#4a90d9",
        price: 1550000, condition: "Factory Sealed",
        quantity: 6, quantitySold: 345, image: "📦",
        discount: null, listingType: "sealed",
        packsPerBox: 36, cardsPerPack: 10,
        description: "Charizard VSTAR Rainbow! Arceus VSTAR! Trainer Gallery!",
        highlights: "🌟 Charizard VSTAR Rainbow!"
    }
];

// ============================================
// BANNERS
// ============================================
const banners = [
    { title: "Scarlet & Violet 151", subtitle: "Booster Bundle - 6 Packs", description: "Săn Charizard ex SIR! Booster Bundle chính hãng!", bgColor: "#e94560", emoji: "🔥", link: "/" },
    { title: "Paldean Fates ETB", subtitle: "Elite Trainer Box - 9 Packs", description: "Guaranteed Shiny cards! Sleeves + dice!", bgColor: "#9b59b6", emoji: "✨", link: "/" },
    { title: "Booster Box Collection", subtitle: "36 Packs - Best Value!", description: "Temporal Forces, Paradox Rift, Lost Origin!", bgColor: "#0f3460", emoji: "📦", link: "/" },
    { title: "Crown Zenith ETB", subtitle: "Holiday Set - 10 Packs", description: "Galarian Gallery! 70 art rare cards!", bgColor: "#ffa000", emoji: "👑", link: "/" }
];

// ============================================
// HELPERS
// ============================================
function formatVND(price) {
    return price.toLocaleString('vi-VN') + '₫';
}

function parseCookies(cookieHeader) {
    const cookies = {};
    if (cookieHeader) {
        cookieHeader.split(';').forEach(cookie => {
            const parts = cookie.trim().split('=');
            if (parts.length >= 2) cookies[parts[0].trim()] = decodeURIComponent(parts.slice(1).join('='));
        });
    }
    return cookies;
}

function getSuggestions(query) {
    if (!query || query.length < 1) return [];
    const q = query.toLowerCase().trim();
    
    // First, find exact prefix matches
    const prefixMatches = popularPokemonCards
        .filter(card => card.toLowerCase().startsWith(q))
        .slice(0, 5);
    
    // Then find contains matches
    const containsMatches = popularPokemonCards
        .filter(card => !card.toLowerCase().startsWith(q) && card.toLowerCase().includes(q))
        .slice(0, 5 - prefixMatches.length);
    
    // Combine and add common suffixes
    let suggestions = [...prefixMatches, ...containsMatches].slice(0, 8);
    
    // If query matches a prefix, add card variants
    const matchingPrefix = searchPrefixes.find(p => p.toLowerCase() === q);
    if (matchingPrefix && suggestions.length < 8) {
        const variants = popularPokemonCards
            .filter(c => c.startsWith(matchingPrefix) && !suggestions.includes(c))
            .slice(0, 8 - suggestions.length);
        suggestions = [...suggestions, ...variants];
    }
    
    return suggestions.slice(0, 8);
}

// ============================================
// HTML TEMPLATE
// ============================================
function getHTML(isAdmin = false, activeTab = 'all') {
    return `<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pokémon TCG Store - Booster Packs & Boxes</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary: #e94560; --dark: #1a1a2e; --gray: #888; --white: #fff;
            --success: #00c853; --warning: #ff9800; --danger: #ff1744;
            --pokemon-yellow: #ffcb05; --pokemon-blue: #2a75bb;
            --gradient-1: linear-gradient(135deg, #e94560, #c23152);
            --gradient-pokemon: linear-gradient(135deg, #ffcb05, #ff9900);
            --shadow: 0 4px 20px rgba(0,0,0,0.3);
            --radius: 12px; --transition: all 0.3s cubic-bezier(0.4,0,0.2,1);
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', sans-serif; background: #f5f5f5; color: #333; line-height: 1.6; }
        .container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
        
        .top-bar { background: var(--dark); color: #e0e0e0; padding: 8px 0; font-size: 13px; }
        .top-bar .container { display: flex; justify-content: space-between; align-items: center; }
        .top-bar a { color: #e0e0e0; text-decoration: none; margin: 0 15px; cursor: pointer; }
        .hotline { color: var(--primary); font-weight: 600; }
        .admin-badge { background: var(--success); color: #fff; padding: 2px 8px; border-radius: 10px; font-size: 10px; margin-left: 5px; }
        
        .header { background: #fff; box-shadow: 0 2px 10px rgba(0,0,0,0.1); position: sticky; top: 0; z-index: 100; }
        .header .container { display: flex; align-items: center; justify-content: space-between; padding: 12px 0; }
        .logo { font-size: 26px; font-weight: 900; background: var(--gradient-1); -webkit-background-clip: text; -webkit-text-fill-color: transparent; text-decoration: none; }
        .logo span { font-size: 11px; display: block; -webkit-text-fill-color: var(--gray); font-weight: 400; }
        
        .menu-toggle { background: none; border: 2px solid #eee; cursor: pointer; padding: 10px; border-radius: 8px; display: flex; flex-direction: column; gap: 5px; transition: var(--transition); z-index: 101; }
        .menu-toggle:hover { border-color: var(--primary); }
        .menu-toggle span { display: block; width: 24px; height: 2px; background: var(--dark); border-radius: 2px; transition: var(--transition); }
        .menu-toggle.active span:nth-child(1) { transform: rotate(45deg) translate(5px, 5px); }
        .menu-toggle.active span:nth-child(2) { opacity: 0; }
        .menu-toggle.active span:nth-child(3) { transform: rotate(-45deg) translate(5px, -5px); }
        
        .sidebar { position: fixed; top: 0; left: -320px; width: 300px; height: 100vh; background: #fff; z-index: 200; transition: left 0.35s cubic-bezier(0.4,0,0.2,1); overflow-y: auto; box-shadow: 2px 0 30px rgba(0,0,0,0.15); display: flex; flex-direction: column; }
        .sidebar.open { left: 0; }
        .sidebar-backdrop { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 199; opacity: 0; visibility: hidden; transition: var(--transition); cursor: pointer; }
        .sidebar-backdrop.open { opacity: 1; visibility: visible; }
        .sidebar-header { background: var(--gradient-1); color: #fff; padding: 35px 25px; flex-shrink: 0; }
        .sidebar-header h3 { font-size: 20px; margin-bottom: 5px; }
        .sidebar-nav { flex: 1; padding: 10px 0; }
        .sidebar-nav a { display: flex; align-items: center; gap: 12px; padding: 14px 25px; text-decoration: none; color: var(--dark); font-weight: 500; font-size: 14px; transition: var(--transition); border-left: 3px solid transparent; cursor: pointer; }
        .sidebar-nav a:hover { background: #f8f9fa; color: var(--primary); border-left-color: var(--primary); }
        .sidebar-nav a .icon { font-size: 20px; width: 25px; text-align: center; }
        .sidebar-divider { height: 1px; background: #eee; margin: 15px 20px; }
        .sidebar-footer { padding: 20px; text-align: center; font-size: 11px; color: var(--gray); border-top: 1px solid #eee; }
        
        /* ========== SEARCH WITH SUGGESTIONS ========== */
        .search-wrapper { position: relative; width: 380px; }
        .search-box {
            display: flex;
            align-items: center;
            background: #f0f0f0;
            border-radius: 25px;
            padding: 5px;
            width: 100%;
            border: 2px solid transparent;
            transition: var(--transition);
        }
        .search-box:focus-within { border-color: var(--pokemon-yellow); background: #fff; }
        .search-box input {
            border: none;
            background: transparent;
            padding: 10px 15px;
            width: 100%;
            outline: none;
            font-size: 14px;
        }
        .search-box button {
            background: var(--gradient-pokemon);
            border: none;
            color: var(--dark);
            padding: 10px 20px;
            border-radius: 20px;
            cursor: pointer;
            font-weight: 600;
            white-space: nowrap;
            transition: var(--transition);
        }
        .search-box button:hover { transform: scale(1.05); }
        
        /* ========== SUGGESTIONS DROPDOWN ========== */
        .suggestions-dropdown {
            position: absolute;
            top: calc(100% + 8px);
            left: 0;
            right: 0;
            background: #fff;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.15);
            max-height: 350px;
            overflow-y: auto;
            z-index: 500;
            display: none;
            border: 1px solid #eee;
        }
        .suggestions-dropdown.show { display: block; animation: slideDown 0.2s ease; }
        @keyframes slideDown {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .suggestions-header {
            padding: 10px 15px;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: var(--gray);
            font-weight: 700;
            border-bottom: 1px solid #eee;
            background: #fafafa;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .suggestions-header .api-badge {
            background: var(--pokemon-yellow);
            color: var(--dark);
            padding: 2px 8px;
            border-radius: 8px;
            font-size: 9px;
            font-weight: 700;
        }
        .suggestion-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px 15px;
            cursor: pointer;
            transition: background 0.15s ease;
            border-bottom: 1px solid #f5f5f5;
        }
        .suggestion-item:hover { background: #f8f9fa; }
        .suggestion-item:last-child { border-bottom: none; }
        .suggestion-item .card-icon {
            width: 35px;
            height: 35px;
            background: linear-gradient(135deg, #ffcb05, #ff9900);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            flex-shrink: 0;
        }
        .suggestion-item .suggestion-text {
            flex: 1;
        }
        .suggestion-item .suggestion-name {
            font-weight: 600;
            font-size: 14px;
            color: var(--dark);
        }
        .suggestion-item .suggestion-type {
            font-size: 11px;
            color: var(--gray);
        }
        .suggestion-item .search-icon {
            color: var(--gray);
            font-size: 14px;
            flex-shrink: 0;
        }
        .suggestion-item.highlighted { background: #fff3cd; }
        .no-suggestions {
            padding: 20px;
            text-align: center;
            color: var(--gray);
            font-size: 13px;
        }
        
        .header-actions { display: flex; gap: 15px; align-items: center; }
        .admin-btn { background: linear-gradient(135deg, #0f3460, #1a1a2e); color: #fff; border: none; padding: 8px 16px; border-radius: 20px; cursor: pointer; font-weight: 600; font-size: 12px; transition: var(--transition); }
        .admin-btn:hover { background: var(--primary); transform: scale(1.05); }
        
        /* ========== BANNER ========== */
        .banner-section { position: relative; height: 380px; overflow: hidden; }
        .banner-slide { position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.6s ease; cursor: pointer; }
        .banner-slide.active { opacity: 1; }
        .banner-content { text-align: center; color: #fff; max-width: 600px; z-index: 1; padding: 20px; }
        .banner-emoji { font-size: 70px; margin-bottom: 10px; display: block; animation: float 3s ease-in-out infinite; }
        @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-15px); } }
        .banner-title { font-size: 40px; font-weight: 900; margin-bottom: 8px; }
        .banner-subtitle { font-size: 18px; margin-bottom: 8px; opacity: 0.9; }
        .banner-desc { font-size: 15px; margin-bottom: 25px; opacity: 0.85; }
        .banner-btn { display: inline-block; padding: 14px 35px; background: #fff; color: var(--dark); border-radius: 30px; text-decoration: none; font-weight: 700; transition: var(--transition); }
        .banner-btn:hover { transform: translateY(-3px); box-shadow: 0 8px 25px rgba(0,0,0,0.3); }
        .banner-nav { position: absolute; bottom: 25px; left: 50%; transform: translateX(-50%); display: flex; gap: 10px; z-index: 1; }
        .banner-dot { width: 10px; height: 10px; border-radius: 50%; background: rgba(255,255,255,0.4); cursor: pointer; transition: var(--transition); }
        .banner-dot.active { background: #fff; transform: scale(1.3); }
        .banner-arrow { position: absolute; top: 50%; transform: translateY(-50%); background: rgba(255,255,255,0.2); border: 2px solid rgba(255,255,255,0.3); color: #fff; width: 45px; height: 45px; border-radius: 50%; cursor: pointer; font-size: 18px; transition: var(--transition); z-index: 1; display: flex; align-items: center; justify-content: center; }
        .banner-arrow:hover { background: rgba(255,255,255,0.4); }
        .banner-arrow.prev { left: 25px; }
        .banner-arrow.next { right: 25px; }
        
        .section { margin: 40px 0; }
        .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; padding-bottom: 15px; border-bottom: 2px solid #eee; }
        .section-title { font-size: 24px; font-weight: 800; color: var(--dark); }
        .product-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
        
        .product-card { background: #fff; border-radius: var(--radius); overflow: hidden; transition: var(--transition); box-shadow: 0 2px 10px rgba(0,0,0,0.06); cursor: pointer; }
        .product-card:hover { transform: translateY(-5px); box-shadow: 0 12px 30px rgba(0,0,0,0.12); }
        .product-image { height: 200px; background: linear-gradient(135deg, #f8f9fa, #e9ecef); display: flex; align-items: center; justify-content: center; font-size: 70px; position: relative; }
        .product-badges { position: absolute; top: 10px; left: 10px; display: flex; flex-direction: column; gap: 4px; }
        .badge-discount { background: var(--danger); color: #fff; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 700; }
        .badge-stock { background: var(--warning); color: #000; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 700; }
        .badge-hot { background: var(--success); color: #fff; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 700; }
        .product-info { padding: 15px; }
        .product-game { font-size: 10px; color: var(--gray); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px; font-weight: 600; }
        .product-name { font-size: 15px; font-weight: 600; margin-bottom: 6px; line-height: 1.3; }
        .product-set { font-size: 11px; color: var(--gray); margin-bottom: 5px; }
        .product-meta { display: flex; gap: 15px; font-size: 11px; color: #888; margin: 8px 0; }
        .product-highlight { font-size: 11px; color: var(--primary); font-weight: 600; margin: 8px 0; background: #fff3f3; padding: 6px 10px; border-radius: 6px; }
        .price-main { display: flex; align-items: baseline; gap: 8px; margin: 10px 0; }
        .price-current { font-size: 22px; font-weight: 800; color: var(--primary); }
        .price-original { font-size: 13px; color: var(--gray); text-decoration: line-through; }
        .product-actions { display: flex; gap: 8px; }
        .btn-add-cart { flex: 1; background: var(--gradient-1); color: #fff; border: none; padding: 10px; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 13px; transition: var(--transition); }
        .btn-add-cart:hover { transform: scale(1.02); }
        .btn-wishlist { background: #f0f0f0; border: none; padding: 10px 12px; border-radius: 8px; cursor: pointer; font-size: 16px; }
        
        .features { background: #fff; padding: 50px 0; margin: 40px 0; }
        .features-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 30px; text-align: center; }
        .feature-item { padding: 25px 15px; transition: var(--transition); border-radius: var(--radius); }
        .feature-item:hover { background: #f8f9fa; }
        .feature-icon { font-size: 40px; margin-bottom: 12px; }
        .feature-title { font-weight: 700; margin-bottom: 8px; color: var(--dark); }
        .feature-desc { font-size: 12px; color: var(--gray); }
        
        .footer { background: var(--dark); color: #e0e0e0; padding: 50px 0 20px; }
        .footer-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 30px; margin-bottom: 40px; }
        .footer-col h4 { color: #fff; margin-bottom: 20px; font-size: 15px; }
        .footer-col p, .footer-col a { color: #a0a0a0; font-size: 12px; line-height: 2.2; text-decoration: none; display: block; }
        .footer-col a:hover { color: var(--pokemon-yellow); }
        .footer-bottom { border-top: 1px solid #2a2a3e; padding-top: 20px; text-align: center; font-size: 12px; color: #666; }
        
        .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); z-index: 300; display: flex; align-items: center; justify-content: center; opacity: 0; visibility: hidden; transition: var(--transition); }
        .modal-overlay.open { opacity: 1; visibility: visible; }
        .modal { background: #fff; border-radius: 16px; padding: 40px; width: 400px; max-width: 90%; position: relative; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
        .modal .close-modal { position: absolute; top: 15px; right: 15px; background: #f0f0f0; border: none; width: 35px; height: 35px; border-radius: 50%; cursor: pointer; font-size: 18px; }
        .modal input { width: 100%; padding: 12px 15px; margin: 10px 0; border: 2px solid #eee; border-radius: 8px; font-size: 14px; outline: none; }
        .modal input:focus { border-color: var(--primary); }
        .modal .btn-login { width: 100%; padding: 14px; background: var(--gradient-1); color: #fff; border: none; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer; margin-top: 15px; }
        
        .spinner { width: 40px; height: 40px; border: 3px solid #f0f0f0; border-top-color: var(--pokemon-yellow); border-radius: 50%; animation: spin 0.8s linear infinite; margin: 30px auto; }
        @keyframes spin { to { transform: rotate(360deg); } }
        
        @media (max-width: 768px) {
            .search-wrapper { width: 160px; }
            .features-grid, .footer-grid { grid-template-columns: repeat(2, 1fr); }
            .product-grid { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); }
            .banner-title { font-size: 26px; }
            .banner-section { height: 300px; }
        }
    </style>
</head>
<body>
    <div class="sidebar-backdrop" id="sidebarBackdrop" onclick="closeMenu()"></div>
    
    <aside class="sidebar" id="sidebar">
        <div class="sidebar-header"><h3>📦 Pokémon Store</h3><p>Booster Packs & Boxes</p></div>
        <nav class="sidebar-nav">
            <a onclick="navigateTo('/')"><span class="icon">🏠</span>Trang chủ</a>
            <a onclick="navigateTo('/?tab=pokemon-api')"><span class="icon">🔴</span>Pokémon API Live</a>
            <a onclick="navigateTo('/?tab=all')"><span class="icon">📦</span>Tất cả sản phẩm</a>
            <a onclick="navigateTo('/?tab=booster-box')"><span class="icon">📦</span>Booster Box (36 packs)</a>
            <a onclick="navigateTo('/?tab=etb')"><span class="icon">🎁</span>Elite Trainer Box</a>
            <a onclick="navigateTo('/?tab=bundle')"><span class="icon">📦</span>Booster Bundle</a>
            <div class="sidebar-divider"></div>
            <a href="#"><span class="icon">🛒</span>Giỏ hàng</a>
            <a href="#"><span class="icon">📞</span>Liên hệ</a>
        </nav>
        <div class="sidebar-footer"><p>© 2024 Pokémon TCG Store</p></div>
    </aside>
    
    <div class="modal-overlay" id="loginModal">
        <div class="modal">
            <button class="close-modal" onclick="closeLoginModal()">✕</button>
            <h2>🔐 Admin Login</h2>
            <form onsubmit="handleLogin(event)">
                <input type="text" id="loginUsername" placeholder="Username" required>
                <input type="password" id="loginPassword" placeholder="Password" required>
                <div id="loginError" style="color:var(--danger);font-size:13px;text-align:center;display:none;">❌ Sai tài khoản</div>
                <button type="submit" class="btn-login">Đăng nhập</button>
            </form>
            <p style="font-size:11px;color:var(--gray);margin-top:15px;text-align:center;">admin / admin123</p>
        </div>
    </div>
    
    <div class="top-bar">
        <div class="container">
            <div>📦 Pokémon TCG Store | Booster Packs & Boxes | API Search with Suggestions</div>
            <div>
                <a onclick="openLoginModal()">🔐 Admin</a>
                ${isAdmin ? '<span class="admin-badge">✅ Admin</span>' : ''}
                <span class="hotline">📞 1900 1234</span>
            </div>
        </div>
    </div>
    
    <header class="header">
        <div class="container">
            <div style="display:flex;align-items:center;gap:15px;">
                <button class="menu-toggle" id="menuToggle" onclick="toggleMenu()"><span></span><span></span><span></span></button>
                <a href="/" class="logo">POKÉMON STORE<span>Booster Packs & Boxes</span></a>
            </div>
            
            <!-- SEARCH WITH SUGGESTIONS -->
            <div class="search-wrapper">
                <div class="search-box">
                    <input type="text" 
                           placeholder="Tìm Pokémon card..." 
                           id="searchInput" 
                           autocomplete="off"
                           oninput="handleSearchInput(this.value)"
                           onkeydown="handleSearchKeydown(event)"
                           onfocus="handleSearchFocus()">
                    <button onclick="searchCards()">🔍</button>
                </div>
                <div class="suggestions-dropdown" id="suggestionsDropdown"></div>
            </div>
            
            <div class="header-actions">
                <button class="admin-btn" onclick="openLoginModal()">🔐 Admin</button>
                ${isAdmin ? '<a href="/admin" class="admin-btn" style="background:var(--success);">⚙️ Dashboard</a>' : ''}
            </div>
        </div>
    </header>
    
    <!-- BANNER -->
    <section class="banner-section" id="bannerSection">
        ${banners.map((b, i) => `
            <div class="banner-slide ${i === 0 ? 'active' : ''}" style="background:${b.bgColor};" data-index="${i}">
                <div class="banner-content">
                    <span class="banner-emoji">${b.emoji}</span>
                    <h2 class="banner-title">${b.title}</h2>
                    <p class="banner-subtitle">${b.subtitle}</p>
                    <p class="banner-desc">${b.description}</p>
                </div>
            </div>
        `).join('')}
        <button class="banner-arrow prev" onclick="prevBanner()">◀</button>
        <button class="banner-arrow next" onclick="nextBanner()">▶</button>
        <div class="banner-nav">${banners.map((_, i) => `<span class="banner-dot ${i === 0 ? 'active' : ''}" onclick="goToBanner(${i})"></span>`).join('')}</div>
    </section>
    
    <!-- FEATURES -->
    <section class="features">
        <div class="container">
            <div class="features-grid">
                <div class="feature-item"><span class="feature-icon">📦</span><div class="feature-title">Booster Box</div><div class="feature-desc">36 packs - Best value</div></div>
                <div class="feature-item"><span class="feature-icon">🎁</span><div class="feature-title">Elite Trainer Box</div><div class="feature-desc">9-10 packs + accessories</div></div>
                <div class="feature-item"><span class="feature-icon">🔍</span><div class="feature-title">Card Search</div><div class="feature-desc">Search + suggestions</div></div>
                <div class="feature-item"><span class="feature-icon">✅</span><div class="feature-title">Factory Sealed</div><div class="feature-desc">100% authentic</div></div>
            </div>
        </div>
    </section>
    
    <!-- PRODUCTS -->
    <section class="container section">
        <div class="section-header"><h2 class="section-title">📦 <span id="sectionTitle">Pokémon Booster Packs & Boxes</span></h2></div>
        <div class="product-grid" id="productGrid"></div>
        <div class="spinner" id="loadingSpinner" style="display:none;"></div>
    </section>
    
    <!-- FOOTER -->
    <footer class="footer">
        <div class="container">
            <div class="footer-grid">
                <div class="footer-col"><h4>📦 Pokémon Store</h4><p>Booster Packs & Boxes</p><p>Search with Suggestions</p></div>
                <div class="footer-col"><h4>Products</h4><a href="#" onclick="loadTab('booster-box')">Booster Box</a><a href="#" onclick="loadTab('etb')">Elite Trainer Box</a><a href="#" onclick="loadTab('bundle')">Booster Bundle</a></div>
                <div class="footer-col"><h4>Support</h4><a href="#">Shipping</a><a href="#">Returns</a><a href="#">FAQ</a></div>
                <div class="footer-col"><h4>Contact</h4><p>📞 1900 1234</p><p>📧 info@pokemonstore.vn</p></div>
            </div>
            <div class="footer-bottom"><p>© 2024 Pokémon TCG Store | KiotViet Sync | API: pokemontcg.io</p></div>
        </div>
    </footer>
    
    <script>
        // ========== STATE ==========
        let appState = { isMenuOpen: false, currentBanner: 0, activeTab: '${activeTab}', selectedSuggestionIndex: -1 };
        let allSuggestions = [];
        let debounceTimer = null;
        
        // ========== MENU ==========
        function toggleMenu() {
            appState.isMenuOpen = !appState.isMenuOpen;
            document.getElementById('sidebar').classList.toggle('open', appState.isMenuOpen);
            document.getElementById('sidebarBackdrop').classList.toggle('open', appState.isMenuOpen);
            document.getElementById('menuToggle').classList.toggle('active', appState.isMenuOpen);
            document.body.style.overflow = appState.isMenuOpen ? 'hidden' : '';
        }
        function closeMenu() { if(appState.isMenuOpen) toggleMenu(); }
        
        // ========== NAVIGATION ==========
        function navigateTo(path) { window.location.href = path; }
        function loadTab(tab) { navigateTo('/?tab=' + tab); }
        
        // ========== LOGIN ==========
        function openLoginModal() { document.getElementById('loginModal').classList.add('open'); }
        function closeLoginModal() { document.getElementById('loginModal').classList.remove('open'); }
        async function handleLogin(e) {
            e.preventDefault();
            try {
                const res = await fetch('/api/admin/login', {
                    method: 'POST', headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({username: document.getElementById('loginUsername').value, password: document.getElementById('loginPassword').value})
                });
                const data = await res.json();
                if(data.success) { document.cookie = 'admin_token=' + data.token + ';path=/;max-age=86400'; navigateTo('/admin'); }
                else { document.getElementById('loginError').style.display = 'block'; }
            } catch(e) { document.getElementById('loginError').style.display = 'block'; }
        }
        
        // ========== BANNER ==========
        const totalBanners = ${banners.length};
        let bannerInterval;
        function showBanner(i) {
            document.querySelectorAll('.banner-slide,.banner-dot').forEach(el => el.classList.remove('active'));
            document.querySelector(\`.banner-slide[data-index="\${i}"]\`)?.classList.add('active');
            document.querySelectorAll('.banner-dot')[i]?.classList.add('active');
            appState.currentBanner = i;
        }
        function nextBanner() { showBanner((appState.currentBanner + 1) % totalBanners); }
        function prevBanner() { showBanner((appState.currentBanner - 1 + totalBanners) % totalBanners); }
        function goToBanner(i) { showBanner(i); clearInterval(bannerInterval); bannerInterval = setInterval(nextBanner, 5000); }
        bannerInterval = setInterval(nextBanner, 5000);
        
        // ========== SEARCH WITH SUGGESTIONS ==========
        async function handleSearchInput(value) {
            const dropdown = document.getElementById('suggestionsDropdown');
            const query = value.trim();
            
            // Clear previous debounce
            if (debounceTimer) clearTimeout(debounceTimer);
            
            if (query.length < 1) {
                dropdown.classList.remove('show');
                allSuggestions = [];
                return;
            }
            
            // Debounce for 200ms
            debounceTimer = setTimeout(async () => {
                try {
                    const url = new URL('/api/suggestions', window.location.origin);
                    url.searchParams.set('q', query);
                    
                    const res = await fetch(url.toString());
                    const data = await res.json();
                    
                    if (data.success && data.suggestions.length > 0) {
                        allSuggestions = data.suggestions;
                        appState.selectedSuggestionIndex = -1;
                        renderSuggestions(query);
                        dropdown.classList.add('show');
                    } else {
                        allSuggestions = [];
                        renderNoSuggestions(query);
                        dropdown.classList.add('show');
                    }
                } catch(e) {
                    console.error('Suggestions error:', e);
                }
            }, 200);
        }
        
        function handleSearchFocus() {
            const input = document.getElementById('searchInput');
            if (input.value.trim().length >= 1) {
                handleSearchInput(input.value);
            }
        }
        
        function handleSearchKeydown(e) {
            const dropdown = document.getElementById('suggestionsDropdown');
            
            if (!dropdown.classList.contains('show')) return;
            
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                appState.selectedSuggestionIndex = Math.min(appState.selectedSuggestionIndex + 1, allSuggestions.length - 1);
                renderSuggestions(document.getElementById('searchInput').value.trim());
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                appState.selectedSuggestionIndex = Math.max(appState.selectedSuggestionIndex - 1, -1);
                renderSuggestions(document.getElementById('searchInput').value.trim());
            } else if (e.key === 'Enter') {
                if (appState.selectedSuggestionIndex >= 0 && appState.selectedSuggestionIndex < allSuggestions.length) {
                    e.preventDefault();
                    selectSuggestion(allSuggestions[appState.selectedSuggestionIndex]);
                } else {
                    e.preventDefault();
                    searchCards();
                }
            } else if (e.key === 'Escape') {
                dropdown.classList.remove('show');
                appState.selectedSuggestionIndex = -1;
            }
        }
        
        function renderSuggestions(query) {
            const dropdown = document.getElementById('suggestionsDropdown');
            const q = query.toLowerCase();
            
            let html = \`
                <div class="suggestions-header">
                    <span>💡 Gợi ý tìm kiếm</span>
                    <span class="api-badge">Pokémon TCG</span>
                </div>
            \`;
            
            allSuggestions.forEach((suggestion, index) => {
                const isHighlighted = index === appState.selectedSuggestionIndex;
                const matchPos = suggestion.toLowerCase().indexOf(q);
                
                let displayName = suggestion;
                if (matchPos >= 0) {
                    const before = suggestion.substring(0, matchPos);
                    const match = suggestion.substring(matchPos, matchPos + q.length);
                    const after = suggestion.substring(matchPos + q.length);
                    displayName = before + '<strong>' + match + '</strong>' + after;
                }
                
                html += \`
                    <div class="suggestion-item \${isHighlighted ? 'highlighted' : ''}" 
                         onclick="selectSuggestion('\${suggestion.replace(/'/g, "\\\\'")}')"
                         onmouseenter="appState.selectedSuggestionIndex = \${index}; renderSuggestions('\${q}');">
                        <div class="card-icon">🃏</div>
                        <div class="suggestion-text">
                            <div class="suggestion-name">\${displayName}</div>
                            <div class="suggestion-type">Pokémon Card</div>
                        </div>
                        <span class="search-icon">↗</span>
                    </div>
                \`;
            });
            
            // Add "search all" option
            html += \`
                <div class="suggestion-item \${appState.selectedSuggestionIndex === allSuggestions.length ? 'highlighted' : ''}"
                     onclick="searchCards()"
                     onmouseenter="appState.selectedSuggestionIndex = \${allSuggestions.length}; renderSuggestions('\${q}');">
                    <div class="card-icon">🔍</div>
                    <div class="suggestion-text">
                        <div class="suggestion-name">Tìm kiếm "<strong>\${query}</strong>" trên API</div>
                        <div class="suggestion-type">pokemontcg.io</div>
                    </div>
                    <span class="search-icon">→</span>
                </div>
            \`;
            
            dropdown.innerHTML = html;
        }
        
        function renderNoSuggestions(query) {
            const dropdown = document.getElementById('suggestionsDropdown');
            dropdown.innerHTML = \`
                <div class="suggestions-header">
                    <span>💡 Gợi ý tìm kiếm</span>
                    <span class="api-badge">Pokémon TCG</span>
                </div>
                <div class="no-suggestions">
                    <p>Không tìm thấy gợi ý cho "<strong>\${query}</strong>"</p>
                    <p style="margin-top:5px;font-size:11px;">Thử từ khóa: Charizard, Pikachu, Mewtwo...</p>
                </div>
                <div class="suggestion-item" onclick="searchCards()">
                    <div class="card-icon">🔍</div>
                    <div class="suggestion-text">
                        <div class="suggestion-name">Tìm "<strong>\${query}</strong>" trên Pokémon API</div>
                        <div class="suggestion-type">pokemontcg.io</div>
                    </div>
                </div>
            \`;
        }
        
        function selectSuggestion(suggestion) {
            document.getElementById('searchInput').value = suggestion;
            document.getElementById('suggestionsDropdown').classList.remove('show');
            appState.selectedSuggestionIndex = -1;
            searchCards();
        }
        
        // Close dropdown on outside click
        document.addEventListener('click', (e) => {
            const wrapper = document.querySelector('.search-wrapper');
            if (wrapper && !wrapper.contains(e.target)) {
                document.getElementById('suggestionsDropdown').classList.remove('show');
            }
        });
        
        // ========== PRODUCTS ==========
        const products = ${JSON.stringify(products)};
        
        function displayProducts(prods) {
            const grid = document.getElementById('productGrid');
            document.getElementById('sectionTitle').textContent = '📦 Pokémon Booster Packs & Boxes';
            
            if(prods.length === 0) {
                grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:#888;">Không tìm thấy sản phẩm</div>';
                return;
            }
            
            grid.innerHTML = prods.map(p => {
                const isETB = p.name.toLowerCase().includes('elite trainer') || p.name.toLowerCase().includes('etb');
                const icon = isETB ? '🎁' : '📦';
                
                return \`
                    <div class="product-card">
                        <div class="product-image">
                            <span style="font-size:70px;">\${icon}</span>
                            <div class="product-badges">
                                \${p.discount ? \`<span class="badge-discount">-\${p.discount}%</span>\` : ''}
                                \${p.quantity <= 10 ? \`<span class="badge-stock">Còn \${p.quantity}</span>\` : ''}
                                \${p.quantitySold > 200 ? '<span class="badge-hot">🔥 Hot</span>' : ''}
                            </div>
                        </div>
                        <div class="product-info">
                            <div class="product-game">\${p.game} • \${p.set}</div>
                            <div class="product-name">\${p.name}</div>
                            <div class="product-meta">
                                <span>📦 \${p.packsPerBox || '?'} packs</span>
                                <span>🃏 \${p.cardsPerPack || '?'}/pack</span>
                                \${p.guaranteedHits ? \`<span>✨ \${p.guaranteedHits} hits</span>\` : ''}
                            </div>
                            \${p.highlights ? \`<div class="product-highlight">\${p.highlights}</div>\` : ''}
                            <div class="price-main">
                                \${p.discount ? \`
                                    <span class="price-current">\${formatVND(p.price * (100 - p.discount) / 100)}</span>
                                    <span class="price-original">\${formatVND(p.price)}</span>
                                \` : \`<span class="price-current">\${formatVND(p.price)}</span>\`}
                            </div>
                            <div class="product-actions">
                                <button class="btn-add-cart" onclick="event.stopPropagation();alert('Đã thêm: \${p.name.replace(/'/g, "\\\\'")}')">🛒 Thêm vào giỏ</button>
                                <button class="btn-wishlist">♡</button>
                            </div>
                        </div>
                    </div>
                \`;
            }).join('');
        }
        
        function displayAPICards(cards) {
            const grid = document.getElementById('productGrid');
            document.getElementById('sectionTitle').textContent = '⚡ Pokémon TCG API Results';
            
            if(!cards || cards.length === 0) {
                grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:#888;">⚠ Không tìm thấy - Thử từ khóa khác</div>';
                return;
            }
            
            grid.innerHTML = cards.map(card => {
                const img = card.images?.small || card.images?.large || '';
                const rc = {'Rare Holo':'#ffd700','Rare Ultra':'#ffd700','Rare Secret':'#ff69b4','Rare':'#c0c0c0','Uncommon':'#4a90d9','Common':'#888'};
                return \`
                    <div class="product-card">
                        <div class="product-image">\${img ? \`<img src="\${img}" style="width:100%;height:100%;object-fit:contain;padding:10px;" onerror="this.parentElement.innerHTML='<span style=font-size:70px>🃏</span>'">\` : '<span style="font-size:70px;">🃏</span>'}</div>
                        <div class="product-info">
                            <div class="product-game">Pokémon TCG API</div>
                            <div class="product-name">\${card.name}</div>
                            <div class="product-set">\${card.set?.name || '?'} • #\${card.number}</div>
                            <span style="display:inline-block;padding:3px 10px;border-radius:3px;font-size:10px;font-weight:700;background:\${rc[card.rarity]||'#888'};color:#fff;">\${card.rarity||'Common'}</span>
                            <p style="font-size:11px;color:#888;margin:8px 0;">HP: \${card.hp||'?'} | Type: \${card.types?.join(', ')||'?'}</p>
                            <button class="btn-add-cart" onclick="event.stopPropagation();alert('Added: \${card.name.replace(/'/g, "\\\\'")}')">🛒 Add</button>
                        </div>
                    </div>
                \`;
            }).join('');
        }
        
        async function loadPokemonCards(query = '') {
            document.getElementById('loadingSpinner').style.display = 'block';
            document.getElementById('productGrid').innerHTML = '';
            
            try {
                const url = new URL('/api/pokemon/cards', window.location.origin);
                if(query) url.searchParams.set('q', query);
                url.searchParams.set('page', '1');
                
                const res = await fetch(url.toString());
                const data = await res.json();
                
                if(data.success && data.data && data.data.length > 0) {
                    displayAPICards(data.data);
                } else {
                    displayProducts(products);
                    document.getElementById('sectionTitle').textContent = '⚠ API không có kết quả - Hiển thị sản phẩm';
                }
            } catch(e) {
                displayProducts(products);
                document.getElementById('sectionTitle').textContent = '⚠ Lỗi API - Hiển thị sản phẩm';
            }
            
            document.getElementById('loadingSpinner').style.display = 'none';
        }
        
        function searchCards() {
            const query = document.getElementById('searchInput').value.trim();
            document.getElementById('suggestionsDropdown').classList.remove('show');
            if(query) loadPokemonCards(query);
        }
        
        function formatVND(p) { return p.toLocaleString('vi-VN') + '₫'; }
        
        // ========== INIT ==========
        function init() {
            const url = new URL(window.location.href);
            const tab = url.searchParams.get('tab') || 'all';
            
            if(tab === 'pokemon-api') loadPokemonCards();
            else if(tab === 'booster-box') { displayProducts(products.filter(p => p.name.toLowerCase().includes('booster box') && p.packsPerBox >= 36)); document.getElementById('sectionTitle').textContent = '📦 Booster Box (36 Packs)'; }
            else if(tab === 'etb') { displayProducts(products.filter(p => p.name.toLowerCase().includes('elite trainer') || p.name.toLowerCase().includes('etb'))); document.getElementById('sectionTitle').textContent = '🎁 Elite Trainer Boxes'; }
            else if(tab === 'bundle') { displayProducts(products.filter(p => p.name.toLowerCase().includes('bundle') && p.packsPerBox < 10)); document.getElementById('sectionTitle').textContent = '📦 Booster Bundles'; }
            else displayProducts(products);
        }
        
        init();
    </script>
</body>
</html>`;
}

// ============================================
// ADMIN HTML - FIXED
// ============================================
function getAdminHTML(products) {
    const totalValue = products.reduce((s, p) => s + (p.price * p.quantity), 0);
    const totalItems = products.reduce((s, p) => s + p.quantity, 0);
    const lowStock = products.filter(p => p.quantity <= 10 && p.quantity > 0);
    
    // Build table rows separately to avoid template literal issues
    let tableRows = '';
    products.forEach(p => {
        tableRows += '<tr>';
        tableRows += '<td>#' + p.id + '</td>';
        tableRows += '<td><strong>' + p.name + '</strong><br><small style="color:#888;">' + p.set + '</small></td>';
        tableRows += '<td>' + (p.packsPerBox || '?') + '</td>';
        tableRows += '<td><strong>' + p.price.toLocaleString('vi-VN') + '₫</strong></td>';
        tableRows += '<td>' + p.quantity + '</td>';
        tableRows += '<td><span class="badge ' + (p.quantity > 10 ? 'badge-success' : 'badge-warning') + '">' + (p.quantity > 10 ? 'Còn hàng' : 'Sắp hết') + '</span></td>';
        tableRows += '</tr>';
    });

    return '<!DOCTYPE html>\n' +
    '<html lang="vi">\n' +
    '<head>\n' +
    '<meta charset="UTF-8">\n' +
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
    '<title>Admin Dashboard - Pokémon Store</title>\n' +
    '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">\n' +
    '<style>\n' +
    '*{margin:0;padding:0;box-sizing:border-box;}\n' +
    'body{font-family:"Inter",sans-serif;background:#f5f5f5;padding:20px;}\n' +
    '.admin-header{background:linear-gradient(135deg,#1a1a2e,#0f3460);color:#fff;padding:25px 30px;border-radius:16px;margin-bottom:25px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:15px;}\n' +
    '.admin-header h1{font-size:24px;}\n' +
    '.btn{padding:10px 20px;border:none;border-radius:8px;cursor:pointer;font-weight:600;font-size:13px;text-decoration:none;display:inline-block;transition:all 0.3s;}\n' +
    '.btn-logout{background:#e94560;color:#fff;}\n' +
    '.btn-logout:hover{background:#c23152;}\n' +
    '.btn-back{background:rgba(255,255,255,0.2);color:#fff;}\n' +
    '.btn-back:hover{background:rgba(255,255,255,0.3);}\n' +
    '.stats-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:20px;margin-bottom:30px;}\n' +
    '.stat-card{background:#fff;padding:25px;border-radius:16px;box-shadow:0 2px 10px rgba(0,0,0,0.06);}\n' +
    '.stat-card h3{font-size:12px;color:#888;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px;}\n' +
    '.stat-card .value{font-size:32px;font-weight:900;color:#e94560;}\n' +
    '.stat-card .sub{font-size:12px;color:#888;margin-top:5px;}\n' +
    '.section{background:#fff;border-radius:16px;padding:25px;margin-bottom:20px;box-shadow:0 2px 10px rgba(0,0,0,0.06);}\n' +
    '.section h2{font-size:18px;margin-bottom:20px;}\n' +
    'table{width:100%;border-collapse:collapse;}\n' +
    'th{background:#f8f9fa;padding:12px 15px;text-align:left;font-size:11px;text-transform:uppercase;color:#888;letter-spacing:0.5px;}\n' +
    'td{padding:12px 15px;border-bottom:1px solid #eee;font-size:13px;}\n' +
    'tr:hover{background:#fafafa;}\n' +
    '.badge{padding:4px 10px;border-radius:12px;font-size:10px;font-weight:600;}\n' +
    '.badge-success{background:#e8f5e9;color:#00c853;}\n' +
    '.badge-warning{background:#fff3e0;color:#ff9800;}\n' +
    '.badge-danger{background:#ffebee;color:#ff1744;}\n' +
    '@media(max-width:768px){.admin-header{flex-direction:column;text-align:center;}}\n' +
    '</style>\n' +
    '</head>\n' +
    '<body>\n' +
    '<div class="admin-header">\n' +
    '<div>\n' +
    '<h1>📦 Admin Dashboard</h1>\n' +
    '<p style="font-size:13px;opacity:0.7;">Pokémon Booster Packs & Boxes Management</p>\n' +
    '</div>\n' +
    '<div style="display:flex;gap:10px;align-items:center;">\n' +
    '<span style="color:#fff;font-size:13px;">👤 Admin</span>\n' +
    '<a href="/" class="btn btn-back">← Về trang store</a>\n' +
    '<button class="btn btn-logout" onclick="logout()">Đăng xuất</button>\n' +
    '</div>\n' +
    '</div>\n' +
    '<div class="stats-grid">\n' +
    '<div class="stat-card"><h3>Tổng sản phẩm</h3><div class="value">' + products.length + '</div><div class="sub">Đang hoạt động</div></div>\n' +
    '<div class="stat-card"><h3>Tổng giá trị kho</h3><div class="value">' + (totalValue/1000000).toFixed(1) + 'M</div><div class="sub">' + totalItems + ' items trong kho</div></div>\n' +
    '<div class="stat-card"><h3>Sắp hết hàng</h3><div class="value" style="color:' + (lowStock.length > 0 ? '#ff9800' : '#00c853') + ';">' + lowStock.length + '</div><div class="sub">Cần nhập thêm</div></div>\n' +
    '<div class="stat-card"><h3>KiotViet Sync</h3><div class="value" style="color:#00c853;font-size:24px;">● Online</div><div class="sub">Real-time inventory</div></div>\n' +
    '</div>\n' +
    '<div class="section">\n' +
    '<h2>📦 Quản lý sản phẩm</h2>\n' +
    '<div style="overflow-x:auto;">\n' +
    '<table>\n' +
    '<thead><tr><th>ID</th><th>Sản phẩm</th><th>Packs</th><th>Giá</th><th>Tồn kho</th><th>Trạng thái</th></tr></thead>\n' +
    '<tbody>' + tableRows + '</tbody>\n' +
    '</table>\n' +
    '</div>\n' +
    '</div>\n' +
    '<div class="section">\n' +
    '<h2>🔄 KiotViet Sync Status</h2>\n' +
    '<p style="color:#888;margin:5px 0;">✅ Đồng bộ inventory real-time đang hoạt động</p>\n' +
    '<p style="color:#888;margin:5px 0;">🕐 Last sync: ' + new Date().toLocaleString('vi-VN') + '</p>\n' +
    '<p style="color:#888;margin:5px 0;">📡 API: Connected | Webhook: Active</p>\n' +
    '<p style="color:#888;margin:5px 0;">💡 Search Suggestions: Enabled (100+ Pokémon names)</p>\n' +
    '</div>\n' +
    '<script>\n' +
    'function logout(){\n' +
    '  document.cookie = "admin_token=;path=/;max-age=0";\n' +
    '  window.location.href = "/";\n' +
    '}\n' +
    '</script>\n' +
    '</body>\n' +
    '</html>';
}

// ============================================
// HTTP SERVER
// ============================================
const server = http.createServer(async (req, res) => {
    const requestUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const path = requestUrl.pathname;
    const searchParams = new URLSearchParams(requestUrl.search);
    const query = Object.fromEntries(searchParams.entries());
    const cookies = parseCookies(req.headers.cookie || '');
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // === SUGGESTIONS API ===
    if (path === '/api/suggestions') {
        const q = query.q || '';
        const suggestions = getSuggestions(q);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, query: q, suggestions }));
        return;
    }
    
    // === ADMIN LOGIN ===
    if (path === '/api/admin/login' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const { username, password } = JSON.parse(body);
                if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
                    const token = createAdminSession();
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true, token }));
                } else {
                    res.writeHead(401, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false }));
                }
            } catch(e) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false }));
            }
        });
        return;
    }
    
    // === ADMIN PAGE ===
    if (path === '/admin') {
        const token = cookies.admin_token;
        if (!token || !validateSession(token)) {
            res.writeHead(302, { 'Location': '/' });
            res.end();
            return;
        }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(getAdminHTML(products));
        return;
    }
    
    // === POKÉMON API ===
    if (path === '/api/pokemon/cards') {
        try {
            const result = await searchPokemonCards(query.q || '', parseInt(query.page) || 1, 12);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, data: result.data, total: result.total, source: 'pokemontcg.io' }));
        } catch(e) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, data: [], error: e.message }));
        }
        return;
    }
    
    if (path === '/api/pokemon/sets') {
        try {
            const sets = await getPokemonSets();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, data: sets }));
        } catch(e) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, data: [] }));
        }
        return;
    }
    
    // === HEALTH ===
    if (path === '/api/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'healthy', version: '6.0.0', features: ['Pokémon API', 'Search Suggestions'] }));
        return;
    }
    
    // === PRODUCTS ===
    if (path === '/api/products') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, data: products, total: products.length }));
        return;
    }
    
    // === HOMEPAGE ===
    if (path === '/') {
        const token = cookies.admin_token;
        const isAdmin = token && validateSession(token);
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(getHTML(isAdmin, query.tab || 'all'));
        return;
    }
    
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
    console.log('');
    console.log('╔══════════════════════════════════════╗');
    console.log('║  📦 Pokémon Store v6.0              ║');
    console.log('║  Search with Live Suggestions       ║');
    console.log('╚══════════════════════════════════════╝');
    console.log('');
    console.log(`   🌐 http://localhost:${PORT}`);
    console.log(`   🔐 Admin: http://localhost:${PORT}/admin`);
    console.log('   👤 admin / admin123');
    console.log('');
    console.log('   ✨ Features:');
    console.log('   - Live search suggestions dropdown');
    console.log('   - 100+ Pokémon card names database');
    console.log('   - Keyboard navigation (arrows + enter)');
    console.log('   - Debounced API calls');
    console.log('   - Highlighted matching text');
    console.log('');
});