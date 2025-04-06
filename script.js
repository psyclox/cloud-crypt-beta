// script.js
document.addEventListener('DOMContentLoaded', function() {
    // Set current year in footer
    document.getElementById('current-year').textContent = new Date().getFullYear();
    
    // Animate elements on scroll
    const animateElements = document.querySelectorAll('.animate-on-scroll');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1 });
    
    animateElements.forEach(element => {
        observer.observe(element);
    });
    
    // Accordion functionality
    const accordionHeaders = document.querySelectorAll('.accordion-header');
    accordionHeaders.forEach(header => {
        header.addEventListener('click', () => {
            header.classList.toggle('active');
            const content = header.nextElementSibling;
            if (header.classList.contains('active')) {
                content.style.maxHeight = content.scrollHeight + 'px';
            } else {
                content.style.maxHeight = 0;
            }
        });
    });
    
    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                window.scrollTo({
                    top: target.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Projects Section Generator
    function renderProjects() {
        const projects = [
            {
                name: "Files Encrypter for Google Drive",
                desc: "AES-256 encryption before cloud upload",
                status: "live",
                icon: "fab fa-google-drive"
            },
            {
                name: "Files Encrypter for Dropbox",
                desc: "Zero-knowledge Dropbox integration",
                status: "beta",
                icon: "fab fa-dropbox"
            },
            {
                name: "Policy Checker",
                desc: "AI-powered privacy policy analyzer",
                status: "dev",
                icon: "fas fa-file-contract"
            }
        ];
        
        const container = document.createElement('section');
        container.id = 'projects';
        container.className = 'section animate-on-scroll';
        container.innerHTML = `
            <h2 class="section-title">Our Projects</h2>
            <div class="projects-grid"></div>
        `;
        
        document.querySelector('.container').appendChild(container);
        
        const grid = container.querySelector('.projects-grid');
        projects.forEach(project => {
            const card = document.createElement('div');
            card.className = 'project-card';
            card.innerHTML = `
                <div class="project-badge">${project.status.toUpperCase()}</div>
                <div class="project-content">
                    <div class="project-icon">
                        <i class="${project.icon}"></i>
                    </div>
                    <h3>${project.name}</h3>
                    <p>${project.desc}</p>
                </div>
            `;
            grid.appendChild(card);
        });
    }

    renderProjects();
    
    // Smooth scroll for privacy link
    document.querySelector('a[href="privacy.html"]')?.addEventListener('click', function(e) {
        if (window.location.pathname.endsWith('popup.html')) {
            e.preventDefault();
            window.open('privacy.html', '_blank');
        }
    });
});

// Privacy Policy Date with null check
const policyDate = document.getElementById('policy-date');
if (policyDate) {
    policyDate.textContent = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Form Submission Handler
document.getElementById('contactForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const captchaResponse = grecaptcha.getResponse();
    if (!captchaResponse) {
        alert("Please complete the CAPTCHA");
        return;
    }
    
    const formData = new FormData(this);
    formData.append('g-recaptcha-response', captchaResponse);
    const submitBtn = this.querySelector('button[type="submit"]');
    
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    
    // Simulate API call
    setTimeout(() => {
        submitBtn.innerHTML = '<i class="fas fa-check"></i> Sent!';
        this.reset();
        grecaptcha.reset();
        
        // Show confirmation
        const confirmation = document.createElement('div');
        confirmation.className = 'form-confirmation';
        confirmation.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <p>Thank you! Our team will respond within 24 hours.</p>
        `;
        this.parentNode.insertBefore(confirmation, this.nextSibling);
        
        setTimeout(() => {
            confirmation.remove();
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Send Message <i class="fas fa-paper-plane"></i>';
        }, 3000);
    }, 1500);
});