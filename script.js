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
              // Optional: Unobserve after animation to improve performance
              // observer.unobserve(entry.target);
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
      // Use event delegation for better performance
      document.addEventListener('click', (e) => {
        if (e.target.closest('a[href^="#"]')) {
          e.preventDefault();
          const targetId = e.target.closest('a').getAttribute('href');
          const target = document.querySelector(targetId);
          
          if (target) {
            // Account for sticky header height
            const headerHeight = document.querySelector('.sticky-nav')?.offsetHeight || 80;
            const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight;
            
            window.scrollTo({
              top: targetPosition,
              behavior: 'smooth'
            });
            
            // Update URL without page jump
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
        
        // UI feedback
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalBtnHTML = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
        
        try {
          // Simulate API call (replace with actual fetch)
          await this.simulateFormSubmission(formData);
          
          // Success feedback
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
      
      // Email validation
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
      // Replace with actual fetch() to your backend
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          // Simulate random success/failure for testing
          Math.random() > 0.2 ? resolve() : reject();
        }, 1500);
      });
    }
  
    showFormSuccess(message) {
      // Create or show success message element
      let successEl = document.getElementById('form-success');
      if (!successEl) {
        successEl = document.createElement('div');
        successEl.id = 'form-success';
        successEl.className = 'form-message success';
        document.getElementById('contactForm').prepend(successEl);
      }
      successEl.textContent = message;
      successEl.style.display = 'block';
      
      // Hide after 5 seconds
      setTimeout(() => {
        successEl.style.display = 'none';
      }, 5000);
    }
  
    showFormError(message) {
      // Create or show error message element
      let errorEl = document.getElementById('form-error');
      if (!errorEl) {
        errorEl = document.createElement('div');
        errorEl.id = 'form-error';
        errorEl.className = 'form-message error';
        document.getElementById('contactForm').prepend(errorEl);
      }
      errorEl.textContent = message;
      errorEl.style.display = 'block';
      
      // Hide after 5 seconds
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
      // Debounce scroll events
      let scrollTimeout;
      window.addEventListener('scroll', () => {
        clearTimeout(scrollTimeout);
      }, 100); // Add missing closing parenthesis and semicolon
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
  }

 
  
  // Initialize the app when DOM is loaded
  document.addEventListener('DOMContentLoaded', () => {
    // Load Intersection Observer polyfill if needed
    if (!('IntersectionObserver' in window)) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/intersection-observer@0.12.0/intersection-observer.min.js';
      script.onload = () => new Cl0udCryptApp();
      document.head.appendChild(script);
    } else {
      new Cl0udCryptApp();
    }
  });
  
  // Privacy Policy Date
  const policyDate = document.getElementById('policy-date');
  if (policyDate) {
    policyDate.textContent = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }