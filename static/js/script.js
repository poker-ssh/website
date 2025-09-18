let isInitialized = false;
let activeTimeouts = [];

// HELPER: fetch with timeout (cleans up timer)
async function fetchWithTimeout(resource, options = {}, timeout = 10000) {
    const attempt = async (t) => {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), t);
        const start = Date.now();
        try {
            console.debug(`[fetchWithTimeout] start ${resource} timeout=${t}ms`);
            const response = await fetch(resource, { ...options, signal: controller.signal });
            console.debug(`[fetchWithTimeout] finished ${resource} status=${response.status} took=${Date.now() - start}ms`);
            return response;
        } catch (e) {
            const took = Date.now() - start;
            console.warn(`[fetchWithTimeout] error ${resource} timeout=${t}ms took=${took}ms name=${e.name}`);
            throw e;
        } finally {
            clearTimeout(id);
        }
    };

    try {
        return await attempt(timeout);
    } catch (e) {
        // If it was aborted due to timeout, retry once with a longer timeout to avoid spurious failures
        if (e && e.name === 'AbortError' && timeout < 30000) {
            console.warn(`[fetchWithTimeout] AbortError detected for ${resource}, retrying with ${Math.min(30000, timeout * 2)}ms`);
            try {
                return await attempt(Math.min(30000, timeout * 2));
            } catch (e2) {
                // surface the second error
                throw e2;
            }
        }
        throw e;
    }
}

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

// Server Status Functionality
async function checkServerStatus() {
    const statusElement = document.getElementById('server-status');
    if (!statusElement) return;

    try {
        // Show loading state
        statusElement.innerHTML = '<div class="info-box"><span class="status-loading">Checking server status...</span></div>';
        
        // Fetch server health with a robust timeout helper
        const response = await fetchWithTimeout('https://poker-ec2-health.qincai.xyz/health', {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
        }, 10000);
        
    if (response.ok) {
            const data = await response.json();
            const lastProbe = new Date(data.last_probe * 1000).toLocaleString();
            
            // Determine overall status
            const isOnline = data.status === 'ok' && data.probe?.tcp_connect && data.probe?.ssh_ok;
            
            if (isOnline) {
                statusElement.innerHTML = `
                    <div class="info-box">
                        <div class="status-online">
                            <span class="status-indicator">🟢</span>
                            <span class="status-text">Server Online</span>
                            <div class="status-info">
                                <p><strong>Status:</strong> ${data.status}</p>
                                <p><strong>SSH Connection:</strong> ${data.probe.ssh_ok ? '✅ Working' : '❌ Failed'}</p>
                                <p><strong>TCP Connection:</strong> ${data.probe.tcp_connect ? '✅ Working' : '❌ Failed'}</p>
                                <p><strong>Connect with:</strong> <code>ssh play.poker.qincai.xyz</code></p>
                                <p><strong>Last probe:</strong> ${lastProbe}</p>
                            </div>
                        </div>
                    </div>
                `;
            } else {
                statusElement.innerHTML = `
                    <div class="info-box">
                        <div class="status-offline">
                            <span class="status-indicator">🟡</span>
                            <span class="status-text">Server Issues</span>
                            <div class="status-info">
                                <p><strong>Status:</strong> ${data.status}</p>
                                <p><strong>SSH Connection:</strong> ${data.probe?.ssh_ok ? '✅ Working' : '❌ Failed'}</p>
                                <p><strong>TCP Connection:</strong> ${data.probe?.tcp_connect ? '✅ Working' : '❌ Failed'}</p>
                                <p><strong>Error:</strong> ${data.probe?.error || 'None'}</p>
                                <p><strong>Last probe:</strong> ${lastProbe}</p>
                            </div>
                        </div>
                    </div>
                `;
            }
        } else if (response.status >= 500 && response.status < 600) {
            // Server-side error: likely the status server or backend is down
            statusElement.innerHTML = `
                <div class="info-box">
                    <div class="status-offline">
                        <span class="status-indicator">🔴</span>
                        <span class="status-text">Server Unavailable</span>
                        <div class="status-info">
                            <p><strong>Error:</strong> HTTP ${response.status} — Server error</p>
                            <p>The status server is returning a ${response.status} error. The server is most likely down.</p>
                            <p><strong>Manual check:</strong> <a href="https://poker-ec2-health.qincai.xyz/health" target="_blank" style="color: rgb(100, 200, 255);">View health endpoint</a></p>
                            <p><strong>Try connecting:</strong> <code>ssh play.poker.qincai.xyz</code></p>
                            <p><strong>Last checked:</strong> ${new Date().toLocaleTimeString()}</p>
                        </div>
                    </div>
                </div>
            `;
            return;
        } else {
            throw new Error(`HTTP ${response.status}`);
        }
        
    } catch (error) {
        // Handle different types of errors
        let errorMessage = 'Connection failed';
        let isNetworkError = false;
        
        if (error.name === 'AbortError') {
            errorMessage = 'Request timeout (>10 seconds)';
        } else if (error.message.includes('HTTP')) {
            errorMessage = `Server returned ${error.message}`;
        } else if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
            errorMessage = 'Network error (CORS or connection failed)';
            isNetworkError = true;
        }
        
        statusElement.innerHTML = `
            <div class="info-box">
                <div class="status-offline">
                    <span class="status-indicator">${isNetworkError ? '�' : '�🔴'}</span>
                    <span class="status-text">${isNetworkError ? 'Cannot Check' : 'Server Error'}</span>
                    <div class="status-info">
                        <p><strong>Error:</strong> ${errorMessage}</p>
                        ${isNetworkError ? `
                            <p><strong>Manual check:</strong> <a href="https://poker-ec2-health.qincai.xyz/health" target="_blank" style="color: rgb(100, 200, 255);">View health endpoint</a></p>
                            <p><strong>Try connecting:</strong> <code>ssh play.poker.qincai.xyz</code></p>
                        ` : `
                            <p>The status endpoint returned an error. Server may be temporarily unavailable.</p>
                        `}
                        <p><strong>Last checked:</strong> ${new Date().toLocaleTimeString()}</p>
                    </div>
                </div>
            </div>
        `;
    }
}

// Enhanced Server Status for Status Page
async function checkDetailedServerStatus() {
    const detailedElement = document.getElementById('detailed-status');
    if (!detailedElement) return;

    try {
        // Show loading state
        detailedElement.innerHTML = `
            <div class="info-box">
                <p class="status-loading">Gathering detailed server information...</p>
            </div>
        `;
        
        // Fetch server health with a robust timeout helper and measure response time
        const startTime = Date.now();
        const response = await fetchWithTimeout('https://poker-ec2-health.qincai.xyz/health', {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
        }, 10000);
        const responseTime = Date.now() - startTime;
        
    if (response.ok) {
            const data = await response.json();
            const lastProbe = new Date(data.last_probe * 1000);
            const timeSinceProbe = Math.floor((Date.now() - data.last_probe * 1000) / 1000);
            
            // Determine colors based on status
            const isHealthy = data.status === 'ok' && data.probe?.tcp_connect && data.probe?.ssh_ok;
            const statusColor = isHealthy ? 'rgb(38, 171, 69)' : 'rgb(255, 180, 50)';
            const statusText = isHealthy ? 'Fully Operational' : 'Partial Issues';
            
            detailedElement.innerHTML = `
                <div class="info-box stages" style="height: auto; min-height: 200px; text-align: left;">
                    <h3 style="color: ${statusColor}; margin-top: 0;">� Live Server Status</h3>
                    <div style="margin: 15px 0;">
                        <div style="padding: 8px 0; border-bottom: 1px solid rgba(${isHealthy ? '38, 171, 69' : '255, 180, 50'}, 0.2); font-size: 16px;">
                            <strong style="color: ${statusColor};">Overall Status:</strong> 
                            <span style="color: ${isHealthy ? 'rgb(50, 200, 50)' : 'rgb(255, 200, 50)'}; font-weight: 600;">${statusText}</span>
                        </div>
                        <div style="padding: 8px 0; border-bottom: 1px solid rgba(${isHealthy ? '38, 171, 69' : '255, 180, 50'}, 0.2); font-size: 16px;">
                            <strong style="color: ${statusColor};">Health Check:</strong> 
                            <span style="color: ${data.status === 'ok' ? 'rgb(50, 200, 50)' : 'rgb(255, 100, 100)'}; font-weight: 600;">${data.status.toUpperCase()}</span>
                        </div>
                        <div style="padding: 8px 0; border-bottom: 1px solid rgba(${isHealthy ? '38, 171, 69' : '255, 180, 50'}, 0.2); font-size: 16px;">
                            <strong style="color: ${statusColor};">TCP Connection:</strong> 
                            <span style="color: ${data.probe?.tcp_connect ? 'rgb(50, 200, 50)' : 'rgb(255, 100, 100)'}; font-weight: 600;">
                                ${data.probe?.tcp_connect ? '✅ Connected' : '❌ Failed'}
                            </span>
                        </div>
                        <div style="padding: 8px 0; border-bottom: 1px solid rgba(${isHealthy ? '38, 171, 69' : '255, 180, 50'}, 0.2); font-size: 16px;">
                            <strong style="color: ${statusColor};">SSH Service:</strong> 
                            <span style="color: ${data.probe?.ssh_ok ? 'rgb(50, 200, 50)' : 'rgb(255, 100, 100)'}; font-weight: 600;">
                                ${data.probe?.ssh_ok ? '✅ Working' : '❌ Failed'}
                            </span>
                        </div>
                        <div style="padding: 8px 0; border-bottom: 1px solid rgba(${isHealthy ? '38, 171, 69' : '255, 180, 50'}, 0.2); font-size: 16px;">
                            <strong style="color: ${statusColor};">Response Time:</strong> 
                            <span style="color: ${responseTime < 1000 ? 'rgb(50, 200, 50)' : responseTime < 3000 ? 'rgb(255, 200, 50)' : 'rgb(255, 100, 100)'}; font-weight: 600;">
                                ${responseTime}ms
                            </span>
                        </div>
                        <div style="padding: 8px 0; font-size: 16px;">
                            <strong style="color: ${statusColor};">Server Address:</strong> 
                            <code style="color: rgb(120, 220, 255);">${data.probe?.host || 'play.poker.qincai.xyz'}:${data.probe?.port || 22}</code>
                        </div>
                    </div>
                    
                    <h4 style="color: ${statusColor}; margin-top: 20px;">🔧 Connection Instructions</h4>
                    <div style="margin: 15px 0;">
                        <p>To connect to the poker server, use the following command:</p>
                        <code style="display: block; background: rgba(${isHealthy ? '38, 171, 69' : '255, 180, 50'}, 0.1); padding: 12px; border-radius: 6px; color: rgb(${isHealthy ? '90, 221, 120' : '255, 200, 100'}); font-family: 'Fira Code', monospace; font-size: 16px; margin: 10px 0; border: 1px solid rgba(${isHealthy ? '38, 171, 69' : '255, 180, 50'}, 0.3);">ssh ${data.probe?.host || 'play.poker.qincai.xyz'} -p ${data.probe?.port || 22}</code>
                    </div>
                    
                    <h4 style="color: ${statusColor}; margin-top: 20px;">⏱️ Probe Information</h4>
                    <div style="margin: 15px 0; font-size: 14px; color: rgb(180, 180, 180);">
                        <p><strong>Last Probe:</strong> ${lastProbe.toLocaleString()}</p>
                        <p><strong>Time Since Probe:</strong> ${timeSinceProbe < 60 ? `${timeSinceProbe} seconds` : `${Math.floor(timeSinceProbe / 60)} minutes`} ago</p>
                        ${data.probe?.error ? `<p><strong>Last Error:</strong> <span style="color: rgb(255, 100, 100);">${data.probe.error}</span></p>` : ''}
                    </div>
                    
                    <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid rgba(${isHealthy ? '38, 171, 69' : '255, 180, 50'}, 0.2); font-size: 12px; color: rgb(150, 150, 150); text-align: center; font-style: italic;">
                        Status fetched: ${new Date().toLocaleString()} | Auto-refresh: 30s
                    </div>
                </div>
            `;
        } else if (response.status >= 500 && response.status < 600) {
            // Server-side error: likely the status server or backend is down
            detailedElement.innerHTML = `
                <div class="info-box stages" style="height: auto; min-height: 200px; text-align: left;">
                    <h3 style="color: rgb(255, 100, 100); margin-top: 0;">⚠️ Status Server Unavailable</h3>
                    <div style="margin: 15px 0;">
                        <div style="padding: 8px 0; border-bottom: 1px solid rgba(255, 100, 100, 0.2); font-size: 16px;">
                            <strong style="color: rgb(255, 100, 100);">Error:</strong> <span style="color: rgb(255, 150, 150);">HTTP ${response.status} — Server error</span>
                        </div>
                        <div style="padding: 8px 0; font-size: 16px;">
                            <strong style="color: rgb(255, 100, 100);">Message:</strong> The status endpoint is returning a server error. The server is most likely down.
                        </div>
                    </div>
                    <h4 style="color: rgb(255, 100, 100); margin-top: 20px;">🔎 Manual Checks</h4>
                    <div style="margin: 15px 0;">
                        <p><strong>Check the health endpoint:</strong></p>
                        <a href="https://poker-ec2-health.qincai.xyz/health" target="_blank" style="display: inline-block; background: rgba(255, 100, 100, 0.1); padding: 12px; border-radius: 6px; color: rgb(100, 200, 255); text-decoration: none; font-family: 'Fira Code', monospace; font-size: 16px; margin: 10px 0; border: 1px solid rgba(255, 100, 100, 0.3);">https://poker-ec2-health.qincai.xyz/health →</a>
                        <p style="margin-top:10px;"><strong>Try direct SSH:</strong> <code>ssh play.poker.qincai.xyz</code></p>
                    </div>
                    <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid rgba(255, 100, 100, 0.2); font-size: 12px; color: rgb(150, 150, 150); text-align: center; font-style: italic;">
                        Last attempt: ${new Date().toLocaleString()}
                    </div>
                </div>
            `;
            return;
        } else {
            throw new Error(`HTTP ${response.status}`);
        }
        
    } catch (error) {
        let errorMessage = 'Connection failed';
        let troubleshooting = '';
        
        if (error.name === 'AbortError') {
            errorMessage = 'Request timeout (>10 seconds)';
            troubleshooting = 'The status endpoint may be experiencing high load or network issues.';
        } else if (error.message.includes('HTTP')) {
            errorMessage = `Server returned ${error.message}`;
            troubleshooting = 'The status server returned an error. The game server may still be accessible.';
        } else if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
            errorMessage = 'Network error (CORS or connection failed)';
            troubleshooting = 'Browser security or network connectivity issue. Try the manual check below.';
        } else {
            troubleshooting = 'Could not reach the status endpoint. Check your internet connection.';
        }
        
        detailedElement.innerHTML = `
            <div class="info-box stages" style="height: auto; min-height: 200px; text-align: left;">
                <h3 style="color: rgb(255, 100, 100); margin-top: 0;">⚠️ Status Check Failed</h3>
                <div style="margin: 15px 0;">
                    <div style="padding: 8px 0; border-bottom: 1px solid rgba(255, 100, 100, 0.2); font-size: 16px;">
                        <strong style="color: rgb(255, 100, 100);">Error:</strong> <span style="color: rgb(255, 150, 150);">${errorMessage}</span>
                    </div>
                    <div style="padding: 8px 0; border-bottom: 1px solid rgba(255, 100, 100, 0.2); font-size: 16px;">
                        <strong style="color: rgb(255, 100, 100);">Issue:</strong> <span style="color: rgb(255, 150, 150);">${troubleshooting}</span>
                    </div>
                    <div style="padding: 8px 0; font-size: 16px;">
                        <strong style="color: rgb(255, 100, 100);">Game Server:</strong> <span style="color: rgb(255, 200, 50);">May still be accessible</span>
                    </div>
                </div>
                
                <h4 style="color: rgb(255, 100, 100); margin-top: 20px;">� Manual Checks</h4>
                <div style="margin: 15px 0;">
                    <p><strong>1. Test Direct Connection:</strong></p>
                    <code style="display: block; background: rgba(255, 100, 100, 0.1); padding: 12px; border-radius: 6px; color: rgb(255, 150, 150); font-family: 'Fira Code', monospace; font-size: 16px; margin: 10px 0; border: 1px solid rgba(255, 100, 100, 0.3);">ssh play.poker.qincai.xyz</code>
                    
                    <p><strong>2. Check Health Endpoint:</strong></p>
                    <a href="https://poker-ec2-health.qincai.xyz/health" target="_blank" style="display: inline-block; background: rgba(255, 100, 100, 0.1); padding: 12px; border-radius: 6px; color: rgb(100, 200, 255); text-decoration: none; font-family: 'Fira Code', monospace; font-size: 16px; margin: 10px 0; border: 1px solid rgba(255, 100, 100, 0.3);">https://poker-ec2-health.qincai.xyz/health →</a>
                </div>
                
                <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid rgba(255, 100, 100, 0.2); font-size: 12px; color: rgb(150, 150, 150); text-align: center; font-style: italic;">
                    Last attempt: ${new Date().toLocaleString()}
                </div>
            </div>
        `;
    }
}

// Function to fetch and display detailed server status on status page
async function fetchAndDisplayServerStatus() {
    const statusDisplay = document.getElementById('server-status-display');
    if (!statusDisplay) {
        console.log('Status display element not found');
        return;
    }

    console.log('Starting server status fetch...');

    try {
        // Show loading state
        statusDisplay.innerHTML = `
            <div class="status-loading">🔄 Fetching server status...</div>
        `;

        console.log('About to fetch from API...');
        const response = await fetchWithTimeout('https://poker-ec2-health.qincai.xyz/health', {
            mode: 'cors',
            headers: { 'Accept': 'application/json' }
        }, 10000);
        
        console.log('Fetch response received:', response);
        
        if (!response.ok) {
            if (response.status >= 500 && response.status < 600) {
                // Server-side error: likely the status server or backend is down
                statusDisplay.innerHTML = `
                    <div class="status-header">
                        <div class="status-indicator status-offline">
                            🔴 Status Server Unavailable
                        </div>
                    </div>
                    
                    <div class="status-details">
                        <div class="status-item" style="grid-column: 1 / -1;">
                            <div class="status-item-title">Error</div>
                            <div class="status-item-value error">
                                Server returned HTTP ${response.status} — the status server is most likely down.
                            </div>
                        </div>
                        <div class="status-item">
                            <div class="status-item-title">Manual Check</div>
                            <div class="status-item-value">
                                <a href="https://poker-ec2-health.qincai.xyz/health" target="_blank" style="color: rgb(100, 200, 255); text-decoration: none;">
                                    Visit Health Endpoint →
                                </a>
                            </div>
                        </div>
                        <div class="status-item">
                            <div class="status-item-title">SSH Connection Test</div>
                            <div class="status-item-value">
                                ssh play.poker.qincai.xyz
                            </div>
                        </div>
                    </div>
                    
                    <div class="status-timestamp">
                        Last attempt: ${new Date().toLocaleString()}
                    </div>
                `;
                return;
            }
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Data parsed successfully:', data);
        
        // Use the separate display function
        displayStatusData(data, statusDisplay, false);
        
    } catch (error) {
        console.error('Failed to fetch server status:', error);

        // If the thrown error encodes an HTTP status, prefer handling 5xx explicitly
        try {
            const match = (error && error.message) ? error.message.match(/HTTP\s*:?\s*(\d{3})/) : null;
            if (match && match[1]) {
                const code = Number(match[1]);
                if (code >= 500 && code < 600) {
                    statusDisplay.innerHTML = `
                        <div class="status-header">
                            <div class="status-indicator status-offline">
                                🔴 Status Server Unavailable
                            </div>
                        </div>
                        
                        <div class="status-details">
                            <div class="status-item" style="grid-column: 1 / -1;">
                                <div class="status-item-title">Error</div>
                                <div class="status-item-value error">
                                    Server returned HTTP ${code} — the status server is most likely down.
                                </div>
                            </div>
                            <div class="status-item">
                                <div class="status-item-title">Manual Check</div>
                                <div class="status-item-value">
                                    <a href="https://poker-ec2-health.qincai.xyz/health" target="_blank" style="color: rgb(100, 200, 255); text-decoration: none;">
                                        Visit Health Endpoint →
                                    </a>
                                </div>
                            </div>
                            <div class="status-item">
                                <div class="status-item-title">SSH Connection Test</div>
                                <div class="status-item-value">
                                    ssh play.poker.qincai.xyz
                                </div>
                            </div>
                        </div>
                        
                        <div class="status-timestamp">
                            Last attempt: ${new Date().toLocaleString()}
                        </div>
                    `;
                    return;
                }
            }
        } catch (e) {
            // ignore parsing errors and continue to other handling
        }

        // If this appears to be a network/CORS error, probe the /health endpoint using no-cors to decide
        const isCorsLike = (error && ((error.name === 'TypeError' && error.message.includes('Failed to fetch')) || error.message.includes('CORS')));
        if (isCorsLike) {
            console.log('CORS or network error detected, probing /health with no-cors...');
            try {
                const reachable = await probeHealthEndpoint(4000);
                        if (reachable) {
                            console.log('Probe succeeded -> host reachable but original fetch failed. Showing diagnostic message.');
                            tryAlternativeStatusFetch(statusDisplay, true);
                    return;
                } else {
                    console.log('Probe failed -> likely server down. Showing server-down message.');
                    statusDisplay.innerHTML = `
                        <div class="status-header">
                            <div class="status-indicator status-offline">
                                🔴 Server Unreachable
                            </div>
                        </div>
                        
                        <div class="status-details">
                            <div class="status-item" style="grid-column: 1 / -1;">
                                <div class="status-item-title">Error</div>
                                <div class="status-item-value error">
                                    Could not reach the status host. The server is most likely down.
                                </div>
                            </div>
                            <div class="status-item">
                                <div class="status-item-title">Manual Check</div>
                                <div class="status-item-value">
                                    <a href="https://poker-ec2-health.qincai.xyz/health" target="_blank" style="color: rgb(100, 200, 255); text-decoration: none;">
                                        Visit Health Endpoint →
                                    </a>
                                </div>
                            </div>
                            <div class="status-item">
                                <div class="status-item-title">SSH Connection Test</div>
                                <div class="status-item-value">
                                    ssh play.poker.qincai.xyz
                                </div>
                            </div>
                        </div>
                        
                        <div class="status-timestamp">
                            Last attempt: ${new Date().toLocaleString()}
                        </div>
                    `;
                    return;
                }
            } catch (probeErr) {
                console.warn('Probe error:', probeErr);
                // fall through to generic fallback
            }
        }

        // Generic fallback display
        statusDisplay.innerHTML = `
            <div class="status-header">
                <div class="status-indicator status-offline">
                    🔴 Status Check Failed
                </div>
            </div>
            
            <div class="status-details">
                <div class="status-item" style="grid-column: 1 / -1;">
                    <div class="status-item-title">Error</div>
                    <div class="status-item-value error">
                        Failed to fetch status: ${error && error.message ? error.message : String(error)}
                    </div>
                </div>
                
                <div class="status-item">
                    <div class="status-item-title">Manual Check</div>
                    <div class="status-item-value">
                        <a href="https://poker-ec2-health.qincai.xyz/health" target="_blank" style="color: rgb(100, 200, 255); text-decoration: none;">
                            Visit Health Endpoint →
                        </a>
                    </div>
                </div>
                
                <div class="status-item">
                    <div class="status-item-title">SSH Connection Test</div>
                    <div class="status-item-value">
                        ssh play.poker.qincai.xyz
                    </div>
                </div>
            </div>
            
            <div class="status-timestamp">
                Last attempt: ${new Date().toLocaleString()}
            </div>
        `;
    }
}

// Alternative method to fetch status when CORS is blocking
function tryAlternativeStatusFetch(statusDisplay, probeReachable = null) {
    console.log('CORS/network fallback invoked — showing diagnostic message.');

    if (!statusDisplay) return;

    if (probeReachable === true) {
        // Host is reachable but original fetch failed: likely server-side HTTP error (e.g., 502)
        statusDisplay.innerHTML = `
            <div class="status-blocked">
                <h3>⚠️ Direct Fetch Failed (Host Reachable)</h3>
                <p>The status host is reachable but the API request failed. This usually means the status server returned an HTTP error (for example: 502 Bad Gateway).</p>
                <div style="margin-top:12px; padding:10px; border-radius:6px; background:rgba(240,240,240,0.04);">
                    <strong>Live API Status</strong><br>
                    <a href="https://poker-ec2-health.qincai.xyz/health" target="_blank" style="color: rgb(100, 200, 255); text-decoration: none;">Open health endpoint to see the HTTP error →</a>
                </div>
                <div style="margin-top:12px;">
                    <p><strong>SSH Test Command</strong><br><code>ssh play.poker.qincai.xyz</code></p>
                </div>
                <div style="margin-top:12px; color: #bbb; font-size: 13px;">
                    <p style="margin-top:6px;">Status check attempted: ${new Date().toLocaleString()}</p>
                    <p style="font-style:italic;">If you see an HTTP 5xx when opening the endpoint, the server is most likely down.</p>
                </div>
            </div>
        `;
        return;
    }

    // probeReachable === false or unknown -> treat as CORS/network blocking
    statusDisplay.innerHTML = `
        <div class="status-blocked">
            <h3>🔒 Direct API Access Blocked</h3>
            <p>The server status API requires CORS headers to be accessed directly from this website, or the request was blocked by network/CORS restrictions.</p>
            <p>You can still check the live status using the manual methods below.</p>

            <div style="margin-top:12px; padding:10px; border-radius:6px; background:rgba(240,240,240,0.04);">
                <strong>Live API Status</strong><br>
                <a href="https://poker-ec2-health.qincai.xyz/health" target="_blank" style="color: rgb(100, 200, 255); text-decoration: none;">View Live Status JSON →</a>
            </div>

            <div style="margin-top:12px;">
                <p><strong>Server Host</strong><br><code>play.poker.qincai.xyz</code></p>
                <p><strong>Server Port</strong><br><code>22</code></p>
                <p><strong>SSH Test Command</strong><br><code>ssh play.poker.qincai.xyz</code></p>
            </div>

            <div style="margin-top:12px; color: #bbb; font-size: 13px;">
                <p><strong>How to Check Status</strong></p>
                <ol>
                    <li>Click the "View Live Status JSON" link above</li>
                    <li>Look for <code>"status": "ok"</code> and <code>"ssh_ok": true</code></li>
                    <li>Or try connecting directly with the SSH command</li>
                </ol>
                <p style="margin-top:6px;">Status check attempted: ${new Date().toLocaleString()}</p>
                <p style="font-style:italic;">Note: Server admin needs to add CORS headers to enable direct status display</p>
            </div>
        </div>
    `;
}

// Probe the /health endpoint using no-cors to detect host reachability.
// Returns true if the request completes (opaque responses count as success), false if it fails.
async function probeHealthEndpoint(timeout = 4000) {
    try {
        // use no-cors so the browser will attempt the request but return an opaque response if CORS is missing
        await fetchWithTimeout('https://poker-ec2-health.qincai.xyz/health', { mode: 'no-cors', cache: 'no-store' }, timeout);
        return true;
    } catch (e) {
        return false;
    }
}

// Separate function to display status data
function displayStatusData(data, statusDisplay, isMockData = false) {
    console.log('Displaying status data:', data);
    
    // Process the data
    const isOnline = data.status === 'ok' && data.probe && data.probe.tcp_connect && data.probe.ssh_ok;
    const lastProbeDate = new Date(data.last_probe * 1000);
    const currentTime = new Date();
    
    // Calculate time since last probe
    const timeDiff = currentTime - lastProbeDate;
    const minutesAgo = Math.floor(timeDiff / (1000 * 60));
    const hoursAgo = Math.floor(timeDiff / (1000 * 60 * 60));
    
    let timeAgoText;
    if (minutesAgo < 1) {
        timeAgoText = 'Less than a minute ago';
    } else if (minutesAgo < 60) {
        timeAgoText = `${minutesAgo} minute${minutesAgo > 1 ? 's' : ''} ago`;
    } else if (hoursAgo < 24) {
        timeAgoText = `${hoursAgo} hour${hoursAgo > 1 ? 's' : ''} ago`;
    } else {
        const daysAgo = Math.floor(hoursAgo / 24);
        timeAgoText = `${daysAgo} day${daysAgo > 1 ? 's' : ''} ago`;
    }

    // Create the status display HTML
    const statusHTML = `
        ${isMockData ? `
        <div style="background: rgba(255, 165, 0, 0.1); border: 1px solid rgba(255, 165, 0, 0.3); padding: 10px; margin-bottom: 20px; border-radius: 8px; text-align: center;">
            <strong>⚠️ Note:</strong> CORS policy prevents direct API access from local files.<br>
            <small>Status shown is for demonstration. For live data, serve this page from a web server or check 
            <a href="https://poker-ec2-health.qincai.xyz/health" target="_blank" style="color: rgb(100, 200, 255);">the API directly</a></small>
        </div>
        ` : ''}
        
        <div class="status-header">
            <div class="status-indicator ${isOnline ? 'status-online' : 'status-offline'}">
                ${isOnline ? '🟢 Server Online' : '🔴 Server Offline'}
            </div>
        </div>
        
        <div class="status-details">
            <div class="status-item">
                <div class="status-item-title">Overall Status</div>
                <div class="status-item-value ${data.status === 'ok' ? 'success' : 'error'}">
                    ${data.status === 'ok' ? '✅ OK' : '❌ ' + data.status}
                </div>
            </div>
            
            <div class="status-item">
                <div class="status-item-title">Last Health Check</div>
                <div class="status-item-value">
                    ${timeAgoText}
                </div>
            </div>
            
            <div class="status-item">
                <div class="status-item-title">Server Host</div>
                <div class="status-item-value">
                    ${data.probe ? data.probe.host : 'Unknown'}
                </div>
            </div>
            
            <div class="status-item">
                <div class="status-item-title">Server Port</div>
                <div class="status-item-value">
                    ${data.probe ? data.probe.port : 'Unknown'}
                </div>
            </div>
            
            <div class="status-item">
                <div class="status-item-title">TCP Connection</div>
                <div class="status-item-value ${data.probe && data.probe.tcp_connect ? 'success' : 'error'}">
                    ${data.probe && data.probe.tcp_connect ? '✅ Connected' : '❌ Failed'}
                </div>
            </div>
            
            <div class="status-item">
                <div class="status-item-title">SSH Service</div>
                <div class="status-item-value ${data.probe && data.probe.ssh_ok ? 'success' : 'error'}">
                    ${data.probe && data.probe.ssh_ok ? '✅ Available' : '❌ Unavailable'}
                </div>
            </div>
            
            ${data.probe && data.probe.error ? `
            <div class="status-item" style="grid-column: 1 / -1;">
                <div class="status-item-title">Error Details</div>
                <div class="status-item-value error">
                    ${data.probe.error}
                </div>
            </div>
            ` : ''}
        </div>
        
        <div class="status-timestamp">
            Last updated: ${currentTime.toLocaleString()}<br>
            Health check timestamp: ${lastProbeDate.toLocaleString()}
        </div>
    `;

    statusDisplay.innerHTML = statusHTML;
}

// Initialize status display on status page
function initStatusPage() {
    console.log('initStatusPage called');
    // Only run on status page
    const statusElement = document.getElementById('server-status-display');
    if (statusElement) {
        console.log('Status page detected, starting status fetch');
        fetchAndDisplayServerStatus(); // Initial load
        
    // Auto-refresh every 30 seconds
    setInterval(fetchAndDisplayServerStatus, 30000);
    } else {
        console.log('Status page element not found');
    }
}


// Initialise server status polling
function initServerStatus() {
    try {
        // perform an immediate check and then poll every 30s
        checkServerStatus();
        setInterval(checkServerStatus, 30000);
    } catch (e) {
        console.warn('initServerStatus failed:', e);
    }
}

// Initialise detailed status polling (shim)
function initDetailedStatus() {
    try {
        checkDetailedServerStatus();
        setInterval(checkDetailedServerStatus, 30000);
    } catch (e) {
        console.warn('initDetailedStatus failed:', e);
    }
}