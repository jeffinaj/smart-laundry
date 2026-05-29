// Authentication Form Handlers
document.addEventListener('DOMContentLoaded', function() {
  // Login Form Handler
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      const messageEl = document.getElementById('login-message');
      
      if (!email || !password) {
        if (messageEl) {
          messageEl.textContent = 'Please enter email and password.';
          messageEl.style.color = '#dc2626';
        }
        return;
      }
      
      try {
        if (messageEl) {
          messageEl.textContent = 'Logging in...';
          messageEl.style.color = '#3b82f6';
        }
        
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        
        const result = await response.json();
        
        if (result.success) {
          if (messageEl) {
            messageEl.textContent = 'Login successful! Redirecting...';
            messageEl.style.color = '#16a34a';
          }
          setTimeout(() => {
            window.location.href = '/dashboard';
          }, 1000);
        } else {
          if (messageEl) {
            messageEl.textContent = result.message || 'Login failed';
            messageEl.style.color = '#dc2626';
          }
        }
      } catch (error) {
        if (messageEl) {
          messageEl.textContent = 'Error connecting to server';
          messageEl.style.color = '#dc2626';
        }
        console.error('Login error:', error);
      }
    });
  }
  
  // Signup Form Handler
  const signupForm = document.getElementById('signup-form');
  if (signupForm) {
    signupForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const name = document.getElementById('name').value.trim();
      const email = document.getElementById('email').value.trim();
      const phone = document.getElementById('phone').value.trim();
      const password = document.getElementById('password').value;
      const messageEl = document.getElementById('signup-message');
      
      // Validation
      let error = null;
      if (!name || name.length < 2) {
        error = 'Please enter your full name.';
      } else if (!email || !email.includes('@')) {
        error = 'Please enter a valid email address.';
      } else if (!phone || !/^[0-9]{8,15}$/.test(phone)) {
        error = 'Please enter a valid phone number (8-15 digits).';
      } else if (!password || password.length < 6) {
        error = 'Password must be at least 6 characters long.';
      }
      
      if (error) {
        if (messageEl) {
          messageEl.textContent = error;
          messageEl.style.color = '#dc2626';
        }
        return;
      }
      
      try {
        if (messageEl) {
          messageEl.textContent = 'Creating account...';
          messageEl.style.color = '#3b82f6';
        }
        
        const response = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, phone, password })
        });
        
        const result = await response.json();
        
        if (result.success) {
          if (messageEl) {
            messageEl.textContent = 'Account created successfully! Redirecting to login...';
            messageEl.style.color = '#16a34a';
          }
          setTimeout(() => {
            window.location.href = '/login';
          }, 1000);
        } else {
          if (messageEl) {
            messageEl.textContent = result.message || 'Signup failed';
            messageEl.style.color = '#dc2626';
          }
        }
      } catch (error) {
        if (messageEl) {
          messageEl.textContent = 'Error connecting to server';
          messageEl.style.color = '#dc2626';
        }
        console.error('Signup error:', error);
      }
    });
  }
});
