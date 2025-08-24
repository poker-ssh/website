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