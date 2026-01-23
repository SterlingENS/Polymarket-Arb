// Main JavaScript for Privacy x402 Protocol Website

// Code tab switching
document.addEventListener('DOMContentLoaded', function() {
    // Code tabs
    const codeTabs = document.querySelectorAll('.code-tab');
    const codeContents = document.querySelectorAll('.code-content');

    codeTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const targetTab = this.dataset.tab;

            // Remove active class from all tabs and contents
            codeTabs.forEach(t => t.classList.remove('active'));
            codeContents.forEach(c => c.classList.remove('active'));

            // Add active class to clicked tab
            this.classList.add('active');

            // Show corresponding content
            const targetContent = document.querySelector(`.code-content.${targetTab}`);
            if (targetContent) {
                targetContent.classList.add('active');
            }
        });
    });

    // Mobile menu toggle
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const navMenu = document.querySelector('.nav-menu');

    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            const icon = this.querySelector('i');
            if (navMenu.classList.contains('active')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });
    }

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Add fade-in animation on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in-up');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe elements for animation
    document.querySelectorAll('.feature-card, .level-card, .comparison-table').forEach(el => {
        observer.observe(el);
    });

    // Copy code functionality
    document.querySelectorAll('.code-content').forEach(codeBlock => {
        const copyButton = document.createElement('button');
        copyButton.className = 'copy-code-btn';
        copyButton.innerHTML = '<i class="fas fa-copy"></i> Copy';
        copyButton.style.cssText = `
            position: absolute;
            top: 1rem;
            right: 1rem;
            padding: 0.5rem 1rem;
            background: rgba(99, 102, 241, 0.8);
            border: none;
            border-radius: 0.5rem;
            color: white;
            cursor: pointer;
            font-size: 0.9rem;
            transition: all 0.3s ease;
        `;

        codeBlock.style.position = 'relative';
        codeBlock.appendChild(copyButton);

        copyButton.addEventListener('click', async function() {
            const code = codeBlock.querySelector('code').textContent;
            try {
                await navigator.clipboard.writeText(code);
                copyButton.innerHTML = '<i class="fas fa-check"></i> Copied!';
                copyButton.style.background = 'rgba(16, 185, 129, 0.8)';
                setTimeout(() => {
                    copyButton.innerHTML = '<i class="fas fa-copy"></i> Copy';
                    copyButton.style.background = 'rgba(99, 102, 241, 0.8)';
                }, 2000);
            } catch (err) {
                console.error('Failed to copy code:', err);
            }
        });

        copyButton.addEventListener('mouseenter', function() {
            this.style.background = 'rgba(79, 70, 229, 1)';
        });

        copyButton.addEventListener('mouseleave', function() {
            if (!this.innerHTML.includes('Copied')) {
                this.style.background = 'rgba(99, 102, 241, 0.8)';
            }
        });
    });

    // Privacy score calculator (if on playground page)
    const privacyCalculator = document.getElementById('privacy-calculator');
    if (privacyCalculator) {
        initPrivacyCalculator();
    }

    // Syntax highlighting (basic)
    document.querySelectorAll('code').forEach(block => {
        highlightCode(block);
    });
});

// Basic syntax highlighting
function highlightCode(codeBlock) {
    let code = codeBlock.innerHTML;

    // Keywords
    const keywords = ['import', 'from', 'const', 'await', 'async', 'new', 'function', 'return', 'if', 'else'];
    keywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'g');
        code = code.replace(regex, `<span style="color: #c792ea">${keyword}</span>`);
    });

    // Strings
    code = code.replace(/(['"`])(.*?)\1/g, '<span style="color: #c3e88d">$1$2$1</span>');

    // Comments
    code = code.replace(/(\/\/.*$)/gm, '<span style="color: #546e7a">$1</span>');

    // Numbers
    code = code.replace(/\b(\d+\.?\d*)\b/g, '<span style="color: #f78c6c">$1</span>');

    // Functions
    code = code.replace(/\b([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g, '<span style="color: #82aaff">$1</span>(');

    codeBlock.innerHTML = code;
}

// Privacy calculator initialization
function initPrivacyCalculator() {
    const form = document.getElementById('privacy-form');
    const resultDiv = document.getElementById('privacy-result');

    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();

            const privacyLevel = parseInt(document.getElementById('privacy-level').value);
            const stealthAddress = document.getElementById('stealth-address').checked;
            const zkProof = document.getElementById('zk-proof').checked;
            const mixing = document.getElementById('mixing').checked;
            const mixingFactor = parseInt(document.getElementById('mixing-factor').value) || 0;

            // Calculate privacy score
            let score = privacyLevel * 0.15;
            if (stealthAddress) score += 0.25;
            if (zkProof) score += 0.3;
            if (mixing) score += Math.min(mixingFactor * 0.02, 0.2);

            score = Math.min(score, 1.0);

            // Display result
            resultDiv.innerHTML = `
                <div class="privacy-result-card">
                    <h3>Privacy Score: <span class="score-value">${score.toFixed(2)}</span></h3>
                    <div class="score-bar">
                        <div class="score-fill" style="width: ${score * 100}%; background: ${getScoreColor(score)}"></div>
                    </div>
                    <p class="score-description">${getScoreDescription(score)}</p>
                    <div class="score-details">
                        <h4>Score Breakdown:</h4>
                        <ul>
                            <li>Privacy Level: +${(privacyLevel * 0.15).toFixed(2)}</li>
                            ${stealthAddress ? '<li>Stealth Address: +0.25</li>' : ''}
                            ${zkProof ? '<li>ZK Proof: +0.30</li>' : ''}
                            ${mixing ? `<li>Mixing: +${Math.min(mixingFactor * 0.02, 0.2).toFixed(2)}</li>` : ''}
                        </ul>
                    </div>
                </div>
            `;
            resultDiv.style.display = 'block';
        });
    }
}

function getScoreColor(score) {
    if (score < 0.3) return '#ef4444';
    if (score < 0.5) return '#f59e0b';
    if (score < 0.7) return '#eab308';
    if (score < 0.9) return '#10b981';
    return '#6366f1';
}

function getScoreDescription(score) {
    if (score < 0.3) return 'Low privacy - Not recommended for sensitive transactions';
    if (score < 0.5) return 'Basic privacy - Suitable for low-value transactions';
    if (score < 0.7) return 'Moderate privacy - Good for standard transactions';
    if (score < 0.9) return 'High privacy - Excellent for sensitive transactions';
    return 'Maximum privacy - Best possible privacy guarantees';
}

// Navbar scroll effect
let lastScroll = 0;
window.addEventListener('scroll', function() {
    const navbar = document.querySelector('.navbar');
    const currentScroll = window.pageYOffset;

    if (currentScroll > lastScroll && currentScroll > 100) {
        navbar.style.transform = 'translateY(-100%)';
    } else {
        navbar.style.transform = 'translateY(0)';
    }

    lastScroll = currentScroll;
});