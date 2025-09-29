let isInitialized = false;
let activeTimeouts = [];

function typeWriter(element, initialSpeed = 8) {
    const originalText = element.textContent || element.innerText;
    
    // Get the original HTML content to preserve links and other elements
    const originalHTML = element.innerHTML;
    
    // Pre-process the HTML to add color spans for all suits while preserving other HTML
    let coloredHTML = originalHTML.replace(/♦/g, '<span style="color: #ff4444;">♦</span>')
                                  .replace(/♥/g, '<span style="color: #ff4444;">♥</span>')
                                  .replace(/♠/g, '<span style="color: #000000; -webkit-text-stroke: 0.3px white; text-stroke: 0.3px white;">♠</span>')
                                  .replace(/♣/g, '<span style="color: #000000; -webkit-text-stroke: 0.3px white; text-stroke: 0.3px white;">♣</span>');
    
    // Parse the HTML to get segments of text and HTML tags
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = coloredHTML;
    
    // Extract all text nodes and HTML elements in order
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
            // Handle different types of elements
            const tagName = node.tagName.toLowerCase();
            
            // Get all attributes of the element
            let attributes = '';
            if (node.attributes) {
                for (let attr of node.attributes) {
                    attributes += ` ${attr.name}="${attr.value}"`;
                }
            }
            
            const openTag = `<${tagName}${attributes}>`;
            const closeTag = `</${tagName}>`;
            
            // Get the inner content
            let innerContent = '';
            for (let child of node.childNodes) {
                if (child.nodeType === Node.TEXT_NODE) {
                    innerContent += child.textContent;
                } else if (child.nodeType === Node.ELEMENT_NODE) {
                    innerContent += child.outerHTML;
                }
            }
            
            // Add the complete element as one segment to preserve link functionality
            segments.push({
                type: 'element',
                content: innerContent,
                html: openTag + innerContent + closeTag
            });
        }
    }
    
    // If no HTML elements are present, use simple text approach
    if (coloredHTML === originalText) {
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
                    currentSpeed = Math.max(2, initialSpeed * 0.3);
                } else if (elapsedTime > 1500) {
                    currentSpeed = Math.max(4, initialSpeed * 0.8);
                } else if (elapsedTime > 500) {
                    currentSpeed = Math.max(6, initialSpeed * 1.2);
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
            
            if (segment.type === 'element') {
                // Add the complete HTML element at once (preserves functionality)
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
                currentSpeed = Math.max(2, initialSpeed * 0.1);
            } else if (elapsedTime > 1500) {
                currentSpeed = Math.max(3, initialSpeed * 0.3);
            } else if (elapsedTime > 500) {
                currentSpeed = Math.max(5, initialSpeed * 0.6);
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
window.addEventListener('load', function() {
    initTypewriters();
    initServerStatus(); // Initialize server status checking
    initDetailedStatus(); // Initialize detailed status for status page
    initStatusPage(); // Initialize status page display
});

// Also initialize when DOM is ready (fallback)
document.addEventListener('DOMContentLoaded', function() {
    initTypewriters();
    initServerStatus(); // Initialize server status checking
    initDetailedStatus(); // Initialize detailed status for status page
    initStatusPage(); // Initialize status page display
});

/* -- Interactive enhancements -- */
// Create small DOM controls: copy button, toast message, theme toggle (to-do)
function createControls() {
    // Ensure ssh box exists
    const sshBox = document.querySelector('div.ssh-box');
    if (sshBox) {
        // Wire existing copy button (if present) or create one
        let copyBtn = sshBox.querySelector('.copy-btn');
        if (!copyBtn) {
            copyBtn = document.createElement('button');
            copyBtn.className = 'copy-btn';
            copyBtn.type = 'button';
            copyBtn.title = 'Copy command to clipboard (or press C)';
            copyBtn.innerText = 'Copy';
            sshBox.appendChild(copyBtn);
        }
        if (!copyBtn._wired) {
            copyBtn.addEventListener('click', (ev) => { ev.preventDefault(); copySSH(sshBox); });
            copyBtn._wired = true;
        }

        // Make the code element clickable to copy (clicking code copies)
        const sshCode = sshBox.querySelector('.ssh-cmd');
        if (sshCode && !sshCode._wired) {
            // allow keyboard activation
            sshCode.setAttribute('tabindex', '0');
            sshCode.setAttribute('role', 'button');
            sshCode.addEventListener('click', (ev) => {
                // ignore clicks on inner buttons/links
                const tag = (ev.target && ev.target.tagName) || '';
                if (tag === 'BUTTON' || tag === 'A') return;
                ev.preventDefault();
                copySSH(sshBox);
            });
            sshCode.addEventListener('keydown', (ev) => {
                if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); copySSH(sshBox); }
            });
            sshCode._wired = true;
        }
    }

    // Wire the Copy Host Key button (if present)
    const copyKeyBtn = document.getElementById('copySshBtn');
    if (copyKeyBtn && !copyKeyBtn._wired) {
        copyKeyBtn.addEventListener('click', async (ev) => {
            ev.preventDefault();
            const keyElem = document.getElementById('sshKey');
            const text = keyElem ? (keyElem.innerText || keyElem.textContent || '').trim() : '';
            if (!text) { showToast('No SSH key found to copy'); return; }

            try {
                await navigator.clipboard.writeText(text);
                showToast('SSH host key copied to clipboard');
            } catch (e) {
                // fallback to execCommand
                const ta = document.createElement('textarea');
                ta.value = text;
                document.body.appendChild(ta);
                ta.select();
                try { document.execCommand('copy'); showToast('SSH host key copied to clipboard'); } catch (err) { showToast('Copy failed — select and copy manually'); }
                ta.remove();
            }
        });
        copyKeyBtn._wired = true;
    }

    // Compute and display SHA256 fingerprint for the public key, and wire toggle/copy for fingerprint
    try {
        const sshKeyElem = document.getElementById('sshKey');
        const fingerprintElem = document.getElementById('sshFingerprint');
        const toggleFullKeyBtn = document.getElementById('toggleFullKeyBtn');
        const copyFingerprintBtn = document.getElementById('copyFingerprintBtn');

        if (sshKeyElem && fingerprintElem) {
            const pubKeyText = (sshKeyElem.innerText || sshKeyElem.textContent || '').trim();
            // Extract the base64 blob from the SSH public key (format: <type> <base64> [comment])
            const parts = pubKeyText.split(/\s+/);
            if (parts.length >= 2) {
                const b64 = parts[1];

                // helper: convert base64 to ArrayBuffer
                function base64ToArrayBuffer(base64) {
                    const binary_string = atob(base64);
                    const len = binary_string.length;
                    const bytes = new Uint8Array(len);
                    for (let i = 0; i < len; i++) {
                        bytes[i] = binary_string.charCodeAt(i);
                    }
                    return bytes.buffer;
                }

                // Compute SHA256 and format like OpenSSH (base64, without padding)
                (async () => {
                    try {
                        const keyBuf = base64ToArrayBuffer(b64);
                        const hashBuf = await crypto.subtle.digest('SHA-256', keyBuf);
                        const hashArr = new Uint8Array(hashBuf);
                        // base64 encode
                        let binary = '';
                        for (let i = 0; i < hashArr.length; i++) binary += String.fromCharCode(hashArr[i]);
                        let b64Hash = btoa(binary).replace(/=+$/, '');
                        // OpenSSH shows: SHA256:<base64>
                        const display = 'SHA256:' + b64Hash;
                        fingerprintElem.textContent = display;

                        // wire copy fingerprint button
                        if (copyFingerprintBtn && !copyFingerprintBtn._wired) {
                            copyFingerprintBtn.addEventListener('click', async (ev) => {
                                ev.preventDefault();
                                try { await navigator.clipboard.writeText(display); showToast('Fingerprint copied to clipboard'); }
                                catch (e) { const ta=document.createElement('textarea'); ta.value=display; document.body.appendChild(ta); ta.select(); try{document.execCommand('copy'); showToast('Fingerprint copied to clipboard');}catch(err){showToast('Copy failed — select manually');} ta.remove(); }
                            });
                            copyFingerprintBtn._wired = true;
                        }

                        // wire toggle to show/hide full key
                        if (toggleFullKeyBtn && !toggleFullKeyBtn._wired) {
                            toggleFullKeyBtn.addEventListener('click', (ev) => {
                                ev.preventDefault();
                                if (sshKeyElem.style.display === 'none' || sshKeyElem.style.display === '') {
                                    sshKeyElem.style.display = 'block';
                                    toggleFullKeyBtn.textContent = 'Hide full key';
                                } else {
                                    sshKeyElem.style.display = 'none';
                                    toggleFullKeyBtn.textContent = 'Show full key';
                                }
                            });
                            toggleFullKeyBtn._wired = true;
                        }
                    } catch (err) {
                        fingerprintElem.textContent = 'unable to compute fingerprint';
                        console.warn('Fingerprint compute failed', err);
                    }
                })();
            } else {
                fingerprintElem.textContent = 'invalid public key format';
            }
        }
    } catch (err) {
        console.warn('Fingerprint wiring failed', err);
    }

    // Global Help button (may be outside ssh-box)
    const helpBtnGlobal = document.querySelector('.help-btn');
    if (helpBtnGlobal && !helpBtnGlobal._wired) {
        helpBtnGlobal.addEventListener('click', (ev) => { ev.preventDefault(); showCopyModal(); });
        helpBtnGlobal._wired = true;
    }

    // Toast element
    if (!document.querySelector('.toast')) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.setAttribute('role','status');
        toast.setAttribute('aria-live','polite');
        document.body.appendChild(toast);
    }

    // Ensure copy-help modal exists
    createCopyModal();

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

    // Show brief !HELP! whenever user copies the SSH command
    // (about SSH key generation and Permission denied (publickey) troubleshooting)
    try {
        showCopyModal();
    } catch (e) {
        // If modal fails for some random reason, fail silently — copy already happened or user will see toast
        console.warn('showCopyModal failed', e);
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


// --- Copy-help modal helpers ---
function createCopyModal() {
    if (document.getElementById('copy-help-modal')) return;

    const modal = document.createElement('div');
    modal.id = 'copy-help-modal';
    modal.className = 'copy-help-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.style.display = 'none';

    modal.innerHTML = `
        <div class="copy-help-panel">
            <button class="copy-help-close" aria-label="Close">✕</button>
            <h3>Please read me!!</h3>
            <p>If you haven't connected with SSH before, make sure you have an SSH keypair set up on your machine.</p>
            <p class="kbd">Generate one with: <code>ssh-keygen -N "" -t ed25519</code> (and press ENTER at all prompts)</p>
            <p>If you see "Permission denied (publickey)" when connecting, ensure:</p>
            <ol>
                <li>You are authorised to connect using your username — do not attempt to impersonate or log in as another registered user.</li>
                <li>Permissions on <code>~/.ssh</code> and files are correct (700 for dir, 600 for keys).</li>
                <li><strong>If you are still having issues, try connecting using a different username:</strong> <code>ssh &lt;username&gt;@play.poker.qincai.xyz</code></li>
            </ol>
            <p><i>Or if you are too lazy to generate a keypair, you can connect with:</i> <code>ssh guest@play.poker.qincai.xyz</code></p>
            <div style="text-align:right; margin-top:12px;">
                <button class="copy-help-dontshow">Close</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // event delegation for close
    modal.querySelectorAll('.copy-help-close, .copy-help-dontshow').forEach(btn => {
        btn.addEventListener('click', () => hideCopyModal());
    });

    // click outside to close
    modal.addEventListener('click', (ev) => {
        if (ev.target === modal) hideCopyModal();
    });
}

function showCopyModal() {
    const modal = document.getElementById('copy-help-modal');
    if (!modal) return;
    modal.style.display = 'block';
    // simple fade-in
    requestAnimationFrame(() => modal.classList.add('open'));
    // trap focus briefly
    const focusTarget = modal.querySelector('.copy-help-dontshow') || modal.querySelector('.copy-help-close');
    if (focusTarget) focusTarget.focus();
    // auto-hide after 30s
    clearTimeout(modal._hideTimer);
    modal._hideTimer = setTimeout(() => hideCopyModal(), 30000);
}

function hideCopyModal() {
    const modal = document.getElementById('copy-help-modal');
    if (!modal) return;
    modal.classList.remove('open');
    // wait for CSS transition then hide
    clearTimeout(modal._hideTimer);
    setTimeout(() => { modal.style.display = 'none'; }, 220);
}
// --- End of copy-help modal helpers ---