// Fluff-Fabriken - Main JavaScript

// ============================================
// CONFIGURATION - Update these with your Google Sheet URLs
// ============================================
// To get these URLs:
// 1. Open your Google Sheet (with two tabs: "Prislista" and "Öppettider")
// 2. Go to File → Share → Publish to web
// 3. Select each sheet tab and choose "CSV" format
// 4. Copy each URL and paste below

// Prislista sheet - columns: Tjänst, Beskrivning, Pris, Kategori
const PRICES_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQo6cAtp_NwB5KE5yr0banQtreicRaOuzrBWEUwa1Hfn4dStOrEC5R6oc6_R1zk5sB5i0RP_d3m8UPQ/pub?gid=0&single=true&output=csv';

// Öppettider sheet - columns: Dag, Tid, Notering (optional, for holidays/special notes)
const HOURS_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQo6cAtp_NwB5KE5yr0banQtreicRaOuzrBWEUwa1Hfn4dStOrEC5R6oc6_R1zk5sB5i0RP_d3m8UPQ/pub?gid=403793296&single=true&output=csv';

// ============================================
// Mobile Navigation Toggle
// ============================================
const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');

if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
        navLinks.classList.toggle('active');
    });

    // Close menu when clicking a link
    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
        });
    });
}

// ============================================
// Google Sheets Price List
// ============================================

/**
 * Parse CSV/TSV string into array of objects
 * Automatically detects delimiter (tab or comma)
 */
function parseCSV(data) {
    const lines = data.trim().split('\n');
    if (lines.length < 2) return [];

    // Detect delimiter: if first line has tabs, use tab; otherwise comma
    const delimiter = lines[0].includes('\t') ? '\t' : ',';

    const headers = lines[0].split(delimiter).map(h => h.trim().replace(/^"|"$/g, ''));

    return lines.slice(1).map(line => {
        const values = line.split(delimiter).map(v => v.trim().replace(/^"|"$/g, ''));
        const obj = {};
        headers.forEach((header, index) => {
            obj[header] = values[index] || '';
        });
        return obj;
    });
}

/**
 * Group services by category
 */
function groupByCategory(services) {
    const groups = new Map();

    services.forEach(service => {
        const category = service['Kategori'] || 'Övriga tjänster';
        if (!groups.has(category)) {
            groups.set(category, []);
        }
        groups.get(category).push(service);
    });

    return groups;
}

/**
 * Render the price list to the page
 */
function renderPriceList(groups) {
    const container = document.getElementById('price-list');
    if (!container) return;

    container.innerHTML = '';

    groups.forEach((services, category) => {
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'price-category';

        const categoryTitle = document.createElement('h3');
        categoryTitle.textContent = category;
        categoryDiv.appendChild(categoryTitle);

        services.forEach(service => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'price-item';

            const infoDiv = document.createElement('div');
            infoDiv.className = 'price-info';

            const nameSpan = document.createElement('span');
            nameSpan.className = 'price-name';
            nameSpan.textContent = service['Tjänst'] || '';
            infoDiv.appendChild(nameSpan);

            if (service['Beskrivning']) {
                const descSpan = document.createElement('span');
                descSpan.className = 'price-description';
                descSpan.textContent = service['Beskrivning'];
                infoDiv.appendChild(document.createElement('br'));
                infoDiv.appendChild(descSpan);
            }

            const priceSpan = document.createElement('span');
            priceSpan.className = 'price-amount';
            priceSpan.textContent = service['Pris'] || '';

            itemDiv.appendChild(infoDiv);
            itemDiv.appendChild(priceSpan);
            categoryDiv.appendChild(itemDiv);
        });

        container.appendChild(categoryDiv);
    });
}

/**
 * Show error message in a container
 */
function showError(containerId, message, fallbackText) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
        <div class="error-message">
            <p>${message}</p>
            ${fallbackText ? `<p>${fallbackText}</p>` : ''}
        </div>
    `;
}

/**
 * Fetch and display prices from Google Sheets
 */
async function loadPrices() {
    const container = document.getElementById('price-list');
    if (!container) return;

    // Check if URL is configured
    if (!PRICES_CSV_URL) {
        showError('price-list', 'Prislistan är inte konfigurerad ännu.', 'Kontakta oss för aktuell prislista.');
        return;
    }

    try {
        const response = await fetch(PRICES_CSV_URL);

        if (!response.ok) {
            throw new Error('Could not fetch price list');
        }

        const csv = await response.text();
        const services = parseCSV(csv);

        if (services.length === 0) {
            showError('price-list', 'Inga tjänster hittades.', 'Kontakta oss för aktuell prislista.');
            return;
        }

        const groups = groupByCategory(services);
        renderPriceList(groups);

    } catch (error) {
        console.error('Error loading prices:', error);
        showError('price-list', 'Kunde inte ladda prislistan.', 'Kontakta oss för aktuell prislista.');
    }
}

// ============================================
// Google Sheets Opening Hours
// ============================================

/**
 * Render opening hours to the page
 */
function renderHours(hours) {
    const container = document.getElementById('hours-list');
    if (!container) return;

    container.innerHTML = '';

    hours.forEach(item => {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'hours-item';

        const daySpan = document.createElement('span');
        daySpan.className = 'day';
        daySpan.textContent = item['Dag'] || '';

        const timeSpan = document.createElement('span');
        timeSpan.className = 'time';
        timeSpan.textContent = item['Tid'] || '';

        dayDiv.appendChild(daySpan);
        dayDiv.appendChild(timeSpan);

        // Add note if present (for holidays, special dates)
        if (item['Notering']) {
            const noteSpan = document.createElement('span');
            noteSpan.className = 'hours-note';
            noteSpan.textContent = item['Notering'];
            dayDiv.appendChild(noteSpan);
        }

        container.appendChild(dayDiv);
    });
}

/**
 * Fetch and display opening hours from Google Sheets
 */
async function loadHours() {
    const container = document.getElementById('hours-list');
    if (!container) return;

    // Check if URL is configured
    if (!HOURS_CSV_URL) {
        showError('hours-list', 'Öppettider är inte konfigurerade ännu.', 'Kontakta oss för aktuella öppettider.');
        return;
    }

    try {
        const response = await fetch(HOURS_CSV_URL);

        if (!response.ok) {
            throw new Error('Could not fetch hours');
        }

        const csv = await response.text();
        const hours = parseCSV(csv);

        if (hours.length === 0) {
            showError('hours-list', 'Inga öppettider hittades.', 'Kontakta oss för aktuella öppettider.');
            return;
        }

        renderHours(hours);

    } catch (error) {
        console.error('Error loading hours:', error);
        showError('hours-list', 'Kunde inte ladda öppettider.', 'Kontakta oss för aktuella öppettider.');
    }
}

// ============================================
// Initialize
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    loadPrices();
    loadHours();
});
