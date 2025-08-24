function typeWriter(element, speed = 20) {
    const text = element.textContent || element.innerText;
    element.textContent = ''; // Clear the element
    let i = 0;

    function type() {
        if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
            setTimeout(type, speed);
        } else {
            // Stop the cursor blinking when typing is complete
            element.classList.add('typing-complete');
        }
    }

    type();
}

// Function to initialize typewriter elements
function initTypewriters() {
    const typewriter = document.querySelectorAll('[typewriter="true"]');
    
    typewriter.forEach((element, index) => {
        // Reset element content and remove any existing classes
        element.classList.remove('typing-complete');
        
        // Start all typewriters at the same time
        typeWriter(element);
    });
}

// Initialize all typewriter elements when page loads
window.addEventListener('load', initTypewriters);

// Also initialize when DOM is ready (fallback)
document.addEventListener('DOMContentLoaded', initTypewriters);

// Initialize when page is shown from cache (for back button)
window.addEventListener('pageshow', initTypewriters);