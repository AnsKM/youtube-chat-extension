// Smooth scrolling for navigation links
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

// Add navbar background on scroll
const nav = document.querySelector('.nav');
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        nav.style.background = 'rgba(255, 255, 255, 0.95)';
    } else {
        nav.style.background = 'rgba(255, 255, 255, 0.8)';
    }
});

// Animate elements on scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe all sections
document.querySelectorAll('section').forEach(section => {
    section.style.opacity = '0';
    section.style.transform = 'translateY(20px)';
    section.style.transition = 'all 0.6s ease-out';
    observer.observe(section);
});

// Countdown for limited spots
const updateCountdown = () => {
    const spotsLeft = 47 - Math.floor((Date.now() - Date.parse('2025-06-08')) / (1000 * 60 * 60 * 24));
    const limitedBadge = document.querySelector('.limited-badge');
    if (limitedBadge && spotsLeft > 0) {
        limitedBadge.textContent = `${spotsLeft} spots left`;
    }
};

updateCountdown();
setInterval(updateCountdown, 60000); // Update every minute

// Add hover effect to pricing cards
document.querySelectorAll('.pricing-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-8px)';
    });
    card.addEventListener('mouseleave', () => {
        if (!card.classList.contains('featured')) {
            card.style.transform = 'translateY(0)';
        }
    });
});

// Marquee pause on hover
const marquee = document.querySelector('.marquee-content');
if (marquee) {
    marquee.addEventListener('mouseenter', () => {
        marquee.style.animationPlayState = 'paused';
    });
    marquee.addEventListener('mouseleave', () => {
        marquee.style.animationPlayState = 'running';
    });
}

// CTA button ripple effect
document.querySelectorAll('.btn').forEach(button => {
    button.addEventListener('click', function(e) {
        const ripple = document.createElement('span');
        ripple.classList.add('ripple');
        ripple.style.width = ripple.style.height = Math.max(this.offsetWidth, this.offsetHeight) + 'px';
        ripple.style.left = (e.clientX - this.offsetLeft - ripple.offsetWidth / 2) + 'px';
        ripple.style.top = (e.clientY - this.offsetTop - ripple.offsetHeight / 2) + 'px';
        this.appendChild(ripple);
        
        setTimeout(() => ripple.remove(), 600);
    });
});

// Add ripple styles
const style = document.createElement('style');
style.textContent = `
    .btn {
        position: relative;
        overflow: hidden;
    }
    .ripple {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.5);
        transform: scale(0);
        animation: ripple-animation 0.6s ease-out;
    }
    @keyframes ripple-animation {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Update Chrome Web Store links based on availability
const updateChromeLinks = () => {
    const isLive = false; // Set to true when extension is live
    const chromeStoreUrl = isLive ? 
        'https://chrome.google.com/webstore/detail/youtube-chat-extension/YOUR_EXTENSION_ID' : 
        '#signup';
    
    document.querySelectorAll('a[href="https://chrome.google.com/webstore"]').forEach(link => {
        link.href = chromeStoreUrl;
        if (!isLive) {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                // Show email signup modal or scroll to signup section
                alert('Extension coming soon! Sign up to be notified when we launch.');
            });
        }
    });
};

updateChromeLinks();

// Log landing page view
console.log('YouTube Chat Extension - Landing Page Loaded');
console.log('Version: 1.0.0');
console.log('Build: Production');