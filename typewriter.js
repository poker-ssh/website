const text = "This is Poker built with Python which you can access throught your terminal and play with others using SSH";
const typewriterElement = document.getElementById('typewriter-text');
let i = 0;

function typeWriter() {
    if (i < text.length) {
        typewriterElement.innerHTML += text.charAt(i);
        i++;
        setTimeout(typeWriter, 20);
    } else {
        // Stop the cursor blinking when typing is complete
        typewriterElement.classList.add('typing-complete');
    }
}

// Start typing when page loads
window.addEventListener('load', function() {
    typeWriter();
});
