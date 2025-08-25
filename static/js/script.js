let isInitialized = false;
let activeTimeouts = [];

function typeWriter(element, speed = 20) {
    const text = element.textContent || element.innerText;
    element.textContent = ''; // Clear the element
    let i = 0;

    function type() {
        if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
            const timeoutId = setTimeout(type, speed);
            activeTimeouts.push(timeoutId);
        } else {
            // Stop the cursor blinking when typing is complete
            element.classList.add('typing-complete');
        }
    }

    type();
}

// Function to clear all active timeouts
function clearActiveTimeouts() {
    activeTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
    activeTimeouts = [];
}

// Function to initialize typewriter elements
function initTypewriters() {
    // Prevent multiple initializations
    if (isInitialized) {
        return;
    }
    
    // Clear any existing timeouts
    clearActiveTimeouts();
    
    const typewriter = document.querySelectorAll('[typewriter="true"]');
    
    typewriter.forEach((element, index) => {
        // Reset element content and remove any existing classes
        element.classList.remove('typing-complete');
        
        // Start all typewriters at the same time
        typeWriter(element);
    });
    
    isInitialized = true;
}

// Reset initialization flag when page starts unloading
window.addEventListener('beforeunload', function() {
    isInitialized = false;
    clearActiveTimeouts();
});

// Initialize all typewriter elements when page loads
window.addEventListener('load', initTypewriters);

// Also initialize when DOM is ready (fallback)
document.addEventListener('DOMContentLoaded', initTypewriters);

/* -- Interactive enhancements -- */
// Create small DOM controls: copy button, toast message, theme toggle (to-do)
function createControls() {
    // Copy button inside ssh-box
    const sshBox = document.querySelector('div.ssh-box');
    if (sshBox && !sshBox.querySelector('.copy-btn')) {
        const btn = document.createElement('button');
        btn.className = 'copy-btn';
        btn.type = 'button';
        btn.title = 'Copy command to clipboard (or press C)';
        btn.innerText = 'Copy';
        btn.addEventListener('click', () => copySSH(sshBox));
        sshBox.appendChild(btn);
    }

    // Toast element
    if (!document.querySelector('.toast')) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.setAttribute('role','status');
        toast.setAttribute('aria-live','polite');
        document.body.appendChild(toast);
    }

}

function showToast(message, timeout = 2200) {
    const toast = document.querySelector('.toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toast._hideTimeout);
    toast._hideTimeout = setTimeout(() => {
        toast.classList.remove('show');
    }, timeout);
}

async function copySSH(sshBox) {
    const cmdElem = sshBox.querySelector('p2') || sshBox;
    const text = cmdElem.innerText || cmdElem.textContent;
    try {
        await navigator.clipboard.writeText(text.trim());
        showToast('SSH command copied to clipboard');
    } catch (e) {
        // fallback using execCommand
        const ta = document.createElement('textarea');
        ta.value = text.trim();
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); showToast('SSH command copied to clipboard'); } catch (err) { showToast('Copy failed — select and copy manually'); }
        ta.remove();
    }
}

// Keyboard shortcuts: C to copy SSH
function bindKeyboardShortcuts() {
    document.addEventListener('keydown', (ev) => {
        // ignore when typing in inputs
        const tag = (ev.target && ev.target.tagName) || '';
        if (tag === 'INPUT' || tag === 'TEXTAREA' || ev.ctrlKey || ev.metaKey) return;

        if (ev.key.toLowerCase() === 'c') {
            const sshBox = document.querySelector('div.ssh-box');
            if (sshBox) {
                copySSH(sshBox);
                ev.preventDefault();
            }
        }
    });
}

// Small accessibility improvement: make the logo link to home
function ensureLogoLink() {
    const logoImg = document.querySelector('div.header .logo-section img');
    if (!logoImg) return;
    if (logoImg.parentElement && logoImg.parentElement.tagName === 'A') return;
    const a = document.createElement('a');
    a.href = 'index.html';
    a.setAttribute('aria-label','Home');
    const parent = logoImg.parentElement;
    parent.replaceChild(a, logoImg);
    a.appendChild(logoImg);
}

// Initialise interactive features after load
window.addEventListener('load', () => {
    createControls();
    bindKeyboardShortcuts();
    ensureLogoLink();
});

// If DOMContentLoaded already fired, ensure controls exist
if (document.readyState === 'interactive' || document.readyState === 'complete') {
    createControls();
    // theme removed
}