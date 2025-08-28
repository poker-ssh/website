let isInitialized = false;
let activeTimeouts = [];

function typeWriter(element, initialSpeed = 20) {
    const originalText = element.textContent || element.innerText;
    
    // Pre-process the text to add color spans for all suits
    const coloredText = originalText.replace(/♦/g, '<span style="color: #ff4444;">♦</span>')
                                  .replace(/♥/g, '<span style="color: #ff4444;">♥</span>')
                                  .replace(/♠/g, '<span style="color: #000000; -webkit-text-stroke: 0.3px white; text-stroke: 0.3px white;">♠</span>')
                                  .replace(/♣/g, '<span style="color: #000000; -webkit-text-stroke: 0.3px white; text-stroke: 0.3px white;">♣</span>');
    
    // Parse the HTML to get segments of text and HTML tags
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = coloredText;
    
    // Extract all text nodes and tags in order
    const segments = [];
    function walkNodes(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            // Add each character as a separate segment
            const text = node.textContent;
            for (let i = 0; i < text.length; i++) {
                segments.push({
                    type: 'text',
                    content: text[i],
                    html: text[i]
                });
            }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            // Add opening tag
            const tagName = node.tagName.toLowerCase();
            const style = node.getAttribute('style');
            const openTag = `<${tagName}${style ? ` style="${style}"` : ''}>`;
            
            // Process children to get their content
            let childContent = '';
            for (let child of node.childNodes) {
                if (child.nodeType === Node.TEXT_NODE) {
                    childContent += child.textContent;
                }
            }
            
            // Add the complete styled element as one segment
            segments.push({
                type: 'styled',
                content: childContent,
                html: openTag + childContent + `</${tagName}>`
            });
        }
    }
    
    // If no HTML styling needed, use simple text approach
    if (coloredText === originalText) {
        element.textContent = '';
        let i = 0;
        const startTime = Date.now();
        
        function typeSimple() {
            if (i < originalText.length) {
                element.textContent += originalText.charAt(i);
                i++;
                
                const elapsedTime = Date.now() - startTime;
                let currentSpeed;
                
                if (elapsedTime > 3000) {
                    currentSpeed = Math.max(5, initialSpeed * 0.2);
                } else if (elapsedTime > 1500) {
                    currentSpeed = Math.max(10, initialSpeed * 0.5);
                } else if (elapsedTime > 500) {
                    currentSpeed = Math.max(15, initialSpeed * 0.7);
                } else {
                    currentSpeed = initialSpeed;
                }
                
                const timeoutId = setTimeout(typeSimple, currentSpeed);
                activeTimeouts.push(timeoutId);
            } else {
                element.classList.add('typing-complete');
            }
        }
        
        typeSimple();
        return;
    }
    
    // Parse nodes for HTML content
    for (let child of tempDiv.childNodes) {
        walkNodes(child);
    }
    
    element.innerHTML = '';
    let i = 0;
    const startTime = Date.now();
    let currentHtml = '';
    
    function type() {
        if (i < segments.length) {
            const segment = segments[i];
            
            if (segment.type === 'styled') {
                // Add the complete styled element at once
                currentHtml += segment.html;
            } else {
                // Add regular text character
                currentHtml += segment.content;
            }
            
            element.innerHTML = currentHtml;
            i++;
            
            const elapsedTime = Date.now() - startTime;
            let currentSpeed;
            
            if (elapsedTime > 3000) {
                currentSpeed = Math.max(5, initialSpeed * 0.2);
            } else if (elapsedTime > 1500) {
                currentSpeed = Math.max(10, initialSpeed * 0.5);
            } else if (elapsedTime > 500) {
                currentSpeed = Math.max(15, initialSpeed * 0.7);
            } else {
                currentSpeed = initialSpeed;
            }
            
            const timeoutId = setTimeout(type, currentSpeed);
            activeTimeouts.push(timeoutId);
        } else {
            element.classList.add('typing-complete');
        }
    }

    type();
}

// Remove the separate colorRedSuits function since it's now integrated

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
    // Prefer a dedicated .ssh-cmd element (code), fall back to any text node inside sshBox
    const cmdElem = sshBox.querySelector('.ssh-cmd') || sshBox.querySelector('[typewriter="true"]') || sshBox;
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
    bindLogoHoverFallback();
});

// If DOMContentLoaded already fired, ensure controls exist
if (document.readyState === 'interactive' || document.readyState === 'complete') {
    createControls();
    bindLogoHoverFallback();
}

// Fallback: toggle a class on hover/touch to force the tentacle animation.
function bindLogoHoverFallback() {
    const logos = document.querySelectorAll('.github-logo');
    if (!logos || logos.length === 0) return;

    logos.forEach((logo) => {
        // ensure listeners aren't added twice
        if (logo._logoHoverBound) return;
        const group = logo.querySelector('.octo-tentacle-group');
        if (!group) return;

        logo.addEventListener('mouseenter', () => group.classList.add('tentacle-wave-active'));
        logo.addEventListener('mouseleave', () => group.classList.remove('tentacle-wave-active'));

        // touch: toggle briefly on touchstart to simulate a wave
        logo.addEventListener('touchstart', (ev) => {
            ev.preventDefault();
            if (group.classList.contains('tentacle-wave-active')) {
                group.classList.remove('tentacle-wave-active');
            } else {
                group.classList.add('tentacle-wave-active');
                setTimeout(() => group.classList.remove('tentacle-wave-active'), 900);
            }
        }, { passive: false });

        logo._logoHoverBound = true;
    });
}

// also bind the corner (top-right) octo-arm for touch/hover fallback
function bindCornerFallback() {
    const corners = document.querySelectorAll('.site-github-corner');
    if (!corners || corners.length === 0) return;
    corners.forEach((corner) => {
        if (corner._cornerBound) return;
        const arm = corner.querySelector('.octo-arm');
        if (!arm) return;
        corner.addEventListener('mouseenter', () => arm.classList.add('tentacle-wave-active'));
        corner.addEventListener('mouseleave', () => arm.classList.remove('tentacle-wave-active'));
        corner.addEventListener('touchstart', (ev) => {
            ev.preventDefault();
            arm.classList.add('tentacle-wave-active');
            setTimeout(() => arm.classList.remove('tentacle-wave-active'), 900);
        }, { passive: false });
        corner._cornerBound = true;
    });
}

// call corner binder as well
window.addEventListener('load', bindCornerFallback);
if (document.readyState === 'interactive' || document.readyState === 'complete') bindCornerFallback();