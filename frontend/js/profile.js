/**
 * AMEP Profile & Auth Manager
 * Handles:
 *  1. Auth guards (redirect to login if no token)
 *  2. Username/initials display across all pages
 *  3. Global logout function
 */

(function () {
  // 1. Auth Guard
  const token = localStorage.getItem('amep_token');
  const userStr = localStorage.getItem('amep_user');
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  const authPages = ['login.html', 'signup.html', 'index.html'];

  if (!token && !authPages.includes(currentPage)) {
    window.location.href = 'login.html';
    return;
  }

  let user = null;
  if (userStr) {
    try {
      user = JSON.parse(userStr);
    } catch (e) {
      console.error('Failed to parse user data');
    }
  }

  // 2. Global Logout
  window.amepLogout = function () {
    localStorage.removeItem('amep_token');
    localStorage.removeItem('amep_user');
    localStorage.removeItem('amep_python_progress');
    localStorage.removeItem('amep_python_synced');
    localStorage.removeItem('amep_analytics');
    window.location.href = 'login.html';
  };

  // 3. UI Update Helpers
  function getInitials(name) {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    return parts.length >= 2
      ? parts[0][0] + parts[parts.length - 1][0]
      : parts[0][0];
  }

  function updateUI() {
    if (!user) return;

    const userName = user.name || user.fullName || user.email?.split('@')[0] || 'User';
    const userRole = user.role || 'Student';
    const userEmail = user.email || '';
    const initials = getInitials(userName);

    // Update all elements with specific display classes
    document.querySelectorAll('.user-name-display').forEach(el => {
      el.textContent = userName;
    });

    document.querySelectorAll('.user-email-display').forEach(el => {
      el.textContent = userEmail;
    });

    document.querySelectorAll('.user-initials-display').forEach(el => {
      el.textContent = initials;
    });

    document.querySelectorAll('.user-role-display').forEach(el => {
      el.textContent = userRole;
    });

    // Update input fields
    document.querySelectorAll('.user-name-input').forEach(el => {
      el.value = userName;
    });

    document.querySelectorAll('.user-email-input').forEach(el => {
      el.value = userEmail;
    });

    // Update profile images with initials if they have the specific class
    document.querySelectorAll('.user-avatar-initials').forEach(el => {
      el.textContent = initials;
      // Optionally style it to look like an avatar if it's just a div
      if (el.tagName === 'DIV' && !el.classList.contains('avatar-styled')) {
         el.style.display = 'flex';
         el.style.alignItems = 'center';
         el.style.justifyContent = 'center';
         el.style.background = 'linear-gradient(135deg, #059669, #00261b)';
         el.style.color = '#fff';
         el.style.fontWeight = 'bold';
         el.style.borderRadius = '50%';
         el.classList.add('avatar-styled');
      }
    });
  }

  // Run update on DOM load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateUI);
  } else {
    updateUI();
  }

  // Also expose updateUI for dynamic content
  window.amepUpdateUI = updateUI;
})();
