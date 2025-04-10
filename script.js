// Modern JavaScript with ES6+ features
class Cl0udCryptApp {
    constructor() {
        this.init();
    }

    init() {
        // Set current year
        this.setCurrentYear();

        // Initialize components
        this.setupScrollAnimations();
        this.setupAllAccordions();
        this.setupSmoothScrolling();
        this.setupFormValidation();
        this.setupPrivacyLink();
        this.setupProjectDetails();

        // Performance optimizations
        this.setupPerformanceOptimizations();
    }

    setCurrentYear() {
        const yearElement = document.getElementById('current-year');
        if (yearElement) {
            yearElement.textContent = new Date().getFullYear();
        }
    }

    setupScrollAnimations() {
        const animateElements = document.querySelectorAll('.animate-on-scroll');

        // Use Intersection Observer API with polyfill check
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                    }
                });
            }, {
                threshold: 0.1,
                rootMargin: '0px 0px -50px 0px' // Trigger animation slightly before element is in view
            });

            animateElements.forEach(element => {
                observer.observe(element);
            });
        } else {
            // Fallback for browsers without IntersectionObserver
            animateElements.forEach(el => el.classList.add('visible'));
        }
    }

    setupAllAccordions() {
        // Handle regular accordions
        document.querySelectorAll('.accordion-item:not(.tech-accordion .accordion-item) .accordion-header').forEach(header => {
            this.setupSingleAccordion(header);
        });

        // Handle tech accordions separately
        document.querySelectorAll('.tech-accordion .accordion-header').forEach(header => {
            this.setupSingleAccordion(header, true);
        });
    }

    setupSingleAccordion(header, isTechAccordion = false) {
        if (header.dataset.initialized) return;

        const item = header.closest('.accordion-item');
        const content = header.nextElementSibling;
        const icon = header.querySelector('i');

        // Initialize state
        header.setAttribute('aria-expanded', 'false');
        content.setAttribute('aria-hidden', 'true');
        content.style.maxHeight = '0';

        header.addEventListener('click', () => {
            const isExpanded = header.getAttribute('aria-expanded') === 'true';

            // For tech accordions, close others when opening one
            if (isTechAccordion && !isExpanded) {
                document.querySelectorAll('.tech-accordion .accordion-item').forEach(otherItem => {
                    if (otherItem !== item) {
                        const otherHeader = otherItem.querySelector('.accordion-header');
                        const otherContent = otherHeader.nextElementSibling;
                        otherHeader.setAttribute('aria-expanded', 'false');
                        otherHeader.classList.remove('active');
                        otherContent.setAttribute('aria-hidden', 'true');
                        otherContent.style.maxHeight = '0';

                        const otherIcon = otherHeader.querySelector('i');
                        if (otherIcon) otherIcon.style.transform = 'rotate(0deg)';
                    }
                });
            }

            // Toggle current item
            header.setAttribute('aria-expanded', !isExpanded);
            header.classList.toggle('active');
            content.setAttribute('aria-hidden', isExpanded);

            if (!isExpanded) {
                content.style.maxHeight = content.scrollHeight + 'px';
            } else {
                content.style.maxHeight = '0';
            }

            if (icon) {
                icon.style.transform = isExpanded ? 'rotate(0deg)' : 'rotate(180deg)';
            }
        });

        header.dataset.initialized = 'true';
    }

    setupSmoothScrolling() {
        document.addEventListener('click', (e) => {
            if (e.target.closest('a[href^="#"]')) {
                e.preventDefault();
                const targetId = e.target.closest('a').getAttribute('href');
                const target = document.querySelector(targetId);

                if (target) {
                    const headerHeight = document.querySelector('.sticky-nav')?.offsetHeight || 80;
                    const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight;

                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });

                    history.pushState(null, null, targetId);
                }
            }
        });
    }

    setupFormValidation() {
        const form = document.getElementById('contactForm');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Form validation
            if (!this.validateForm(form)) return;

            // Check CAPTCHA if present
            if (typeof grecaptcha !== 'undefined') {
                const captchaResponse = grecaptcha.getResponse();
                if (!captchaResponse) {
                    this.showFormError('Please verify you\'re not a robot!');
                    return;
                }
            }

            // Prepare form data
            const formData = new FormData(form);
            if (typeof grecaptcha !== 'undefined') {
                formData.append('g-recaptcha-response', grecaptcha.getResponse());
            }


            const submitBtn = form.querySelector('button[type="submit"]');
            const originalBtnHTML = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';

            try {
     
                await this.simulateFormSubmission(formData);

                this.showFormSuccess('Message sent successfully!');
                form.reset();
                if (typeof grecaptcha !== 'undefined') {
                    grecaptcha.reset();
                }
            } catch (error) {
                this.showFormError('Failed to send message. Please try again later.');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnHTML;
            }
        });
    }

    validateForm(form) {
        let isValid = true;
        const requiredFields = form.querySelectorAll('[required]');

        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                field.classList.add('error');
                isValid = false;
            } else {
                field.classList.remove('error');
            }
        });

        const emailField = form.querySelector('input[type="email"]');
        if (emailField && !this.validateEmail(emailField.value)) {
            emailField.classList.add('error');
            isValid = false;
        }

        return isValid;
    }

    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(String(email).toLowerCase());
    }

    async simulateFormSubmission(formData) {
 
        return new Promise((resolve, reject) => {
            setTimeout(() => {
        
                Math.random() > 0.2 ? resolve() : reject();
            }, 1500);
        });
    }

    showFormSuccess(message) {
  
        let successEl = document.getElementById('form-success');
        if (!successEl) {
            successEl = document.createElement('div');
            successEl.id = 'form-success';
            successEl.className = 'form-message success';
            document.getElementById('contactForm').prepend(successEl);
        }
        successEl.textContent = message;
        successEl.style.display = 'block';


        setTimeout(() => {
            successEl.style.display = 'none';
        }, 5000);
    }

    showFormError(message) {

        let errorEl = document.getElementById('form-error');
        if (!errorEl) {
            errorEl = document.createElement('div');
            errorEl.id = 'form-error';
            errorEl.className = 'form-message error';
            document.getElementById('contactForm').prepend(errorEl);
        }
        errorEl.textContent = message;
        errorEl.style.display = 'block';

        setTimeout(() => {
            errorEl.style.display = 'none';
        }, 5000);
    }

    setupPrivacyLink() {
        const privacyLink = document.querySelector('a[href="privacy.html"]');
        if (privacyLink) {
            privacyLink.addEventListener('click', (e) => {
                if (window.location.pathname.endsWith('index.html')) {
                    e.preventDefault();
                    window.open('privacy.html', '_blank');
                }
            });
        }
    }

    setupPerformanceOptimizations() {
      
        let scrollTimeout;
        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
        }, 100); 
    }

    preloadResources() {
        const resources = [
            'icons/drive.svg',
            'icons/dropbox.svg',
            'icons/proj3.png'
        ];

        resources.forEach(resource => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'image';
            link.href = resource;
            document.head.appendChild(link);
        });
    }

    setupProjectDetails() {
        const projectCards = document.querySelectorAll('.project-card');
        const detailsSection = document.getElementById('project-details');
        const descContent = document.querySelector('.project-description-content');
        const techStackSection = document.querySelector('.tech-stack');
        const techDetailsSection = document.querySelector('.tech-details .tech-accordion');

        // Project data (descriptions, tech stack, and technical details)
        const projects = {
            'google-drive': {
                description: `
                    <p>Cl0udCrypt for Google Drive is a Chrome extension that provides end-to-end encryption for files before they're uploaded to Google Drive. The extension seamlessly integrates with Google Drive's interface, adding an extra layer of security to your cloud storage.</p>
                    <p>Key features include:</p>
                    <ul>
                        <li>Client-side AES-256 encryption before upload</li>
                        <li>Zero-knowledge architecture - we never see your files or keys</li>
                        <li>Seamless integration with Google Drive's interface</li>
                        <li>Secure password-based key derivation</li>
                        <li>Encrypted file names and metadata</li>
                    </ul>
                    <p>Your data remains private even if Google Drive is compromised, as files are encrypted with keys that only you possess.</p>
                `,
                techStack: `
                    <div class="tech-item">
                        <div class="tech-icon">
                            <i class="fab fa-js-square"></i>
                        </div>
                        <h3>JavaScript</h3>
                        <p>Core extension functionality built with modern ES6+ JavaScript</p>
                    </div>
                    <div class="tech-item">
                        <div class="tech-icon">
                            <i class="fas fa-lock"></i>
                        </div>
                        <h3>WebCrypto API</h3>
                        <p>Native browser cryptography for maximum performance and security</p>
                    </div>
                    <div class="tech-item">
                        <div class="tech-icon">
                            <i class="fab fa-chrome"></i>
                        </div>
                        <h3>Chrome APIs</h3>
                        <p>Seamless integration with browser and cloud storage services</p>
                    </div>
                    <div class="tech-item">
                        <div class="tech-icon">
                            <i class="fas fa-project-diagram"></i>
                        </div>
                        <h3>PBKDF2</h3>
                        <p>Password-Based Key Derivation Function for secure key generation</p>
                    </div>
                `,
                techDetails: `
                    <div class="tech-accordion">
                        <div class="accordion-item">
                            <button class="accordion-header">
                                <span>Encryption Process Flow</span>
                                <i class="fas fa-chevron-down"></i>
                            </button>
                            <div class="accordion-content">
                                <div class="accordion-content-inner">
                                    <ol>
                                        <li><strong>File Selection:</strong> User selects files through the browser's native file picker.</li>
                                        <li><strong>Key Derivation:</strong> Password processed through PBKDF2-HMAC-SHA256 with 210,000 iterations.</li>
                                        <li><strong>Encryption:</strong> AES-256-GCM with 96-bit IV and 128-bit authentication tag.</li>
                                        <li><strong>Metadata Protection:</strong> File names encrypted separately with a different key.</li>
                                        <li><strong>Secure Upload:</strong> Encrypted files transferred via TLS 1.3 to the cloud provider.</li>
                                        <li><strong>Cleanup:</strong> Temporary files securely wiped from memory and storage.</li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                        <div class="accordion-item">
                            <button class="accordion-header">
                                <span>Security Architecture</span>
                                <i class="fas fa-chevron-down"></i>
                            </button>
                            <div class="accordion-content">
                                <div class="accordion-content-inner">
                                    <div class="subtopic-grid">
                                        <div class="subtopic-card">
                                            <h4 class="subtopic-title"><i class="fas fa-user-secret"></i> Zero-Knowledge Design</h4>
                                            <ul>
                                                <li>Encryption keys never leave user's device</li>
                                                <li>No server-side component that could be compromised</li>
                                                <li>Mathematically impossible for us to access user data</li>
                                            </ul>
                                        </div>
                                        <div class="subtopic-card">
                                            <h4 class="subtopic-title"><i class="fas fa-memory"></i> Memory Protection</h4>
                                            <ul>
                                                <li>Sensitive data wiped immediately after use</li>
                                                <li>Web Workers isolate cryptographic operations</li>
                                                <li>Secure memory allocation practices</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `
            },
            'dropbox': {
                description: `
                    <p>Cl0udCrypt for Dropbox brings the same zero-knowledge encryption technology to Dropbox users. The extension encrypts files client-side before they're synced to Dropbox, ensuring your data remains private.</p>
                    <p>Key features include:</p>
                    <ul>
                        <li>End-to-end encryption with client-side key generation</li>
                        <li>PBKDF2 key derivation for strong password protection</li>
                        <li>WebAssembly components for performance-critical operations</li>
                        <li>Full integration with Dropbox's sync functionality</li>
                        <li>Cross-platform compatibility</li>
                    </ul>
                    <p>Like our Google Drive version, this ensures your Dropbox files are protected even if Dropbox's servers are compromised.</p>
                `,
                techStack: `
                    <div class="tech-item">
                        <div class="tech-icon">
                            <i class="fab fa-js-square"></i>
                        </div>
                        <h3>JavaScript</h3>
                        <p>Core extension functionality built with modern ES6+ JavaScript</p>
                    </div>
                    <div class="tech-item">
                        <div class="tech-icon">
                            <i class="fas fa-lock"></i>
                        </div>
                        <h3>WebCrypto API</h3>
                        <p>Native browser cryptography for maximum performance and security</p>
                    </div>
                    <div class="tech-item">
                        <div class="tech-icon">
                            <i class="fab fa-dropbox"></i>
                        </div>
                        <h3>Dropbox API</h3>
                        <p>Integration with Dropbox's file sync and storage services</p>
                    </div>
                    <div class="tech-item">
                        <div class="tech-icon">
                            <i class="fas fa-project-diagram"></i>
                        </div>
                        <h3>WebAssembly</h3>
                        <p>Performance-critical operations implemented in WASM</p>
                    </div>
                `,
                techDetails: `
                    <div class="tech-accordion">
                        <div class="accordion-item">
                            <button class="accordion-header">
                                <span>Encryption Process Flow</span>
                                <i class="fas fa-chevron-down"></i>
                            </button>
                            <div class="accordion-content">
                                <div class="accordion-content-inner">
                                    <ol>
                                        <li><strong>File Selection:</strong> User selects files through the browser's native file picker.</li>
                                        <li><strong>Key Derivation:</strong> Password processed through PBKDF2-HMAC-SHA256 with 210,000 iterations.</li>
                                        <li><strong>Encryption:</strong> AES-256-GCM with 96-bit IV and 128-bit authentication tag.</li>
                                        <li><strong>Sync Preparation:</strong> Encrypted files prepared for Dropbox sync with proper metadata.</li>
                                        <li><strong>Secure Sync:</strong> Encrypted files transferred via TLS 1.3 to Dropbox servers.</li>
                                        <li><strong>Cleanup:</strong> Temporary files securely wiped from memory and storage.</li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                        <div class="accordion-item">
                            <button class="accordion-header">
                                <span>Performance Optimization</span>
                                <i class="fas fa-chevron-down"></i>
                            </button>
                            <div class="accordion-content">
                                <div class="accordion-content-inner">
                                    <div class="subtopic-grid">
                                        <div class="subtopic-card">
                                            <h4 class="subtopic-title"><i class="fas fa-tachometer-alt"></i> WebAssembly</h4>
                                            <ul>
                                                <li>Cryptographic operations implemented in Rust</li>
                                                <li>Compiled to WebAssembly for near-native performance</li>
                                                <li>40% faster than pure JavaScript implementation</li>
                                            </ul>
                                        </div>
                                        <div class="subtopic-card">
                                            <h4 class="subtopic-title"><i class="fas fa-memory"></i> Memory Management</h4>
                                            <ul>
                                                <li>Sensitive data wiped immediately after use</li>
                                                <li>Web Workers isolate cryptographic operations</li>
                                                <li>Secure memory allocation practices</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `
            },
            'policy-checker': {
                description: `
                    <p>Policy Checker is a browser extension that analyzes terms of service and privacy policies, providing users with clear summaries of how their data is being collected and used.</p>
                    <p>Key features include:</p>
                    <ul>
                        <li>Natural Language Processing to analyze policy documents</li>
                        <li>Simple visual indicators for data collection practices</li>
                        <li>Highlighting of concerning clauses</li>
                        <li>Historical comparison of policy changes</li>
                        <li>Customizable alerts for specific concerns</li>
                    </ul>
                    <p>This tool is currently in active development as we refine our AI models and expand our database of policy patterns.</p>
                `,
                techStack: `
                    <div class="under-construction">
                        <i class="fas fa-tools fa-3x" style="color: #f59e0b; margin-bottom: 1rem;"></i>
                        <h3>Technology Stack Under Development</h3>
                        <p>We're currently developing and testing the optimal technology stack for this project. Details will be available after deployment.</p>
                    </div>
                `, 
                techDetails: `
                    <div class="under-construction">
                        <p>We're working hard on the technical implementation of Policy Checker. The deep dive documentation will be published once the project reaches beta status.</p>
                    </div>
                `
            }
        };

        projectCards.forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.closest('.download-button')) return;

                projectCards.forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');

                const projectId = card.querySelector('img').alt.toLowerCase().replace(/\s+/g, '-');
                const projectData = projects[projectId.includes('google') ? 'google-drive' : 
                                  projectId.includes('dropbox') ? 'dropbox' : 'policy-checker'];

                // Update project description
                descContent.innerHTML = projectData.description;

                // Update technology stack
                if (projectData.techStack) {
                    techStackSection.innerHTML = projectData.techStack;
                    techStackSection.parentElement.style.display = 'block';
                } else {
                    techStackSection.parentElement.style.display = 'none';
                }

                // Update technical deep dive
                if (projectData.techDetails) {
                    techDetailsSection.innerHTML = projectData.techDetails;
                    techDetailsSection.parentElement.style.display = 'block';
                } else {
                    techDetailsSection.parentElement.style.display = 'none';
                }

                // Reinitialize accordions for the new content
                this.setupAllAccordions();

                detailsSection.style.display = 'block';
                detailsSection.scrollIntoView({ behavior: 'smooth' });
            });
        });

    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (!('IntersectionObserver' in window)) {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/intersection-observer@0.12.0/intersection-observer.min.js';
        script.onload = () => new Cl0udCryptApp();
        document.head.appendChild(script);
    } else {
        new Cl0udCryptApp();
    }
});

const policyDate = document.getElementById('policy-date');
if (policyDate) {
    policyDate.textContent = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function createParticles() {
    const banner = document.querySelector('.premium-banner');
    if (!banner) return;
    
    for (let i = 0; i < 15; i++) {
        const particle = document.createElement('span');
        particle.classList.add('particle');
        
        // Random properties
        const size = Math.random() * 4 + 1;
        const posX = Math.random() * 100;
        const duration = Math.random() * 10 + 5;
        const delay = Math.random() * 5;
        
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.left = `${posX}%`;
        particle.style.bottom = '0';
        particle.style.animationDuration = `${duration}s`;
        particle.style.animationDelay = `${delay}s`;
        
        banner.appendChild(particle);
    }
}

// Call this function when the page loads
document.addEventListener('DOMContentLoaded', createParticles);