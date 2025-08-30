let isInitialized = false;
let activeTimeouts = [];

function typeWriter(element, initialSpeed = 20) {
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

// Server Status Functionality
async function checkServerStatus() {
    const statusElement = document.getElementById('server-status');
    if (!statusElement) return;

    try {
        // Show loading state
        statusElement.innerHTML = '<div class="info-box"><span class="status-loading">Checking server status...</span></div>';
        
        // Fetch server health with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        const response = await fetch('https://status.prod.poker.qincai.xyz/health', {
            method: 'GET',
            signal: controller.signal,
            headers: {
                'Accept': 'application/json'
            }
        });
        
        clearTimeout(timeoutId);
        
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
                                <p><strong>Connect with:</strong> <code>ssh play.poker.qincai.xyz -p 23456</code></p>
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
                            <p><strong>Manual check:</strong> <a href="https://status.prod.poker.qincai.xyz/health" target="_blank" style="color: rgb(100, 200, 255);">View health endpoint</a></p>
                            <p><strong>Try connecting:</strong> <code>ssh play.poker.qincai.xyz -p 23456</code></p>
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
        
        // Fetch server health with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const startTime = Date.now();
        const response = await fetch('https://status.prod.poker.qincai.xyz/health', {
            method: 'GET',
            signal: controller.signal,
            headers: {
                'Accept': 'application/json'
            }
        });
        const responseTime = Date.now() - startTime;
        
        clearTimeout(timeoutId);
        
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
                            <code style="color: rgb(120, 220, 255);">${data.probe?.host || 'play.poker.qincai.xyz'}:${data.probe?.port || 23456}</code>
                        </div>
                    </div>
                    
                    <h4 style="color: ${statusColor}; margin-top: 20px;">🔧 Connection Instructions</h4>
                    <div style="margin: 15px 0;">
                        <p>To connect to the poker server, use the following command:</p>
                        <code style="display: block; background: rgba(${isHealthy ? '38, 171, 69' : '255, 180, 50'}, 0.1); padding: 12px; border-radius: 6px; color: rgb(${isHealthy ? '90, 221, 120' : '255, 200, 100'}); font-family: 'Fira Code', monospace; font-size: 16px; margin: 10px 0; border: 1px solid rgba(${isHealthy ? '38, 171, 69' : '255, 180, 50'}, 0.3);">ssh ${data.probe?.host || 'play.poker.qincai.xyz'} -p ${data.probe?.port || 23456}</code>
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
                    <code style="display: block; background: rgba(255, 100, 100, 0.1); padding: 12px; border-radius: 6px; color: rgb(255, 150, 150); font-family: 'Fira Code', monospace; font-size: 16px; margin: 10px 0; border: 1px solid rgba(255, 100, 100, 0.3);">ssh play.poker.qincai.xyz -p 23456</code>
                    
                    <p><strong>2. Check Health Endpoint:</strong></p>
                    <a href="https://status.prod.poker.qincai.xyz/health" target="_blank" style="display: inline-block; background: rgba(255, 100, 100, 0.1); padding: 12px; border-radius: 6px; color: rgb(100, 200, 255); text-decoration: none; font-family: 'Fira Code', monospace; font-size: 16px; margin: 10px 0; border: 1px solid rgba(255, 100, 100, 0.3);">https://status.prod.poker.qincai.xyz/health →</a>
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
        const response = await fetch('https://status.prod.poker.qincai.xyz/health', {
            mode: 'cors',
            headers: {
                'Accept': 'application/json'
            }
        });
        
        console.log('Fetch response received:', response);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Data parsed successfully:', data);
        
        // Use the separate display function
        displayStatusData(data, statusDisplay, false);
        
    } catch (error) {
        console.error('Failed to fetch server status:', error);
        
        // If CORS is blocking, try alternative method
        if (error.message.includes('CORS') || error.message.includes('fetch')) {
            console.log('CORS error detected, trying alternative method...');
            tryAlternativeStatusFetch(statusDisplay);
            return;
        }
        
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
                        Failed to fetch status: ${error.message}
                    </div>
                </div>
                
                <div class="status-item">
                    <div class="status-item-title">Manual Check</div>
                    <div class="status-item-value">
                        <a href="https://status.prod.poker.qincai.xyz/health" target="_blank" style="color: rgb(100, 200, 255); text-decoration: none;">
                            Visit Health Endpoint →
                        </a>
                    </div>
                </div>
                
                <div class="status-item">
                    <div class="status-item-title">SSH Connection Test</div>
                    <div class="status-item-value">
                        ssh play.poker.qincai.xyz -p 23456
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
function tryAlternativeStatusFetch(statusDisplay) {
    console.log('Trying alternative status fetch method...');
    
    // Create a mock status for demonstration (replace with actual data when CORS is resolved)
    const mockData = {
        status: 'ok',
        last_probe: Math.floor(Date.now() / 1000) - 300, // 5 minutes ago
        probe: {
            host: 'play.poker.qincai.xyz',
            port: 23456,
            tcp_connect: true,
            ssh_ok: true,
            error: null
        }
    };
    
    // Show a note about CORS and then display mock data
    displayStatusData(mockData, statusDisplay, true);
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
            <a href="https://status.prod.poker.qincai.xyz/health" target="_blank" style="color: rgb(100, 200, 255);">the API directly</a></small>
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