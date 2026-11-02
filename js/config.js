/**
 * SAFESHELF — js/config.js
 * ------------------------------------------------------------
 * Central configuration file for SafeShelf.
 *
 * EmailJS Configuration:
 * To enable live low-stock email notifications:
 * 1. Register a free account at https://www.emailjs.com/
 * 2. Create an Email Service (e.g. Gmail) and get your SERVICE_ID.
 * 3. Create an Email Template and get your TEMPLATE_ID.
 * 4. Copy your Public Key from Account Settings.
 * 5. Replace the placeholder values below with your credentials.
 * ------------------------------------------------------------
 */
const EMAIL_CONFIG = {
    SERVICE_ID: "service_58r4oug",
    TEMPLATE_ID: "template_477wcbx",
    PUBLIC_KEY: "_EWhxKB_VFKW9rnzS"
};

// Escape any untrusted value before interpolating it into an HTML template.
// Prefer textContent for plain text; this helper is for existing markup templates.
function escapeHTML(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, character => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[character]);
}

function safeImageURL(value) {
    const raw = String(value == null ? '' : value).trim();
    if (!raw) return '';
    if (/^(\.\.?\/|\/)[a-zA-Z0-9_./-]+\.(?:png|jpe?g|webp|gif|svg)$/i.test(raw)) return raw;
    try { const parsed = new URL(raw, window.location.origin);
        if ((parsed.protocol === 'https:' || (parsed.protocol === 'http:' && parsed.origin === window.location.origin)) && !parsed.username && !parsed.password) return parsed.href;
    } catch (_) {}
    return '';
}
