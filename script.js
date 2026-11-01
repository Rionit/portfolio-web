const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const contentContainer = document.querySelector('.content-container');
const subtabButtons = document.querySelectorAll('.subtab-btn');
const subtabContents = document.querySelectorAll('.subtab-content');

// Keep track of the active mobile timer so we can cancel it if the user switches tabs quickly
let mobileGifTimer = null;

function animateToContent(showContentCallback) {
  const startHeight = contentContainer.offsetHeight;
  contentContainer.style.height = startHeight + 'px';

  showContentCallback();

  const activeTab = contentContainer.querySelector('.tab-content.active');
  let targetHeight = 0;
  if (activeTab) {
    targetHeight = activeTab.offsetHeight;
  }

  requestAnimationFrame(() => {
    contentContainer.style.height = targetHeight + 'px';
  });
}

// Helper function to reset all projects in the currently active view back to static, then wait 3s to fade to gifs on mobile
function resetAndTriggerMobileGifFade() {
  if (mobileGifTimer) {
    clearTimeout(mobileGifTimer);
    mobileGifTimer = null;
  }

  if (window.matchMedia('(hover: none), (pointer: coarse)').matches) {
    document.querySelectorAll('.project-media-container.has-gif').forEach(container => {
      container.classList.remove('show-gif');
    });

    mobileGifTimer = setTimeout(() => {
      document.querySelectorAll('.tab-content.active .subtab-content.active .project-media-container.has-gif').forEach(container => {
        container.classList.add('show-gif');
      });
    }, 3000);
  }
}

// Read URL hash and apply correct active classes to tabs/subtabs
function applyHashState() {
  const hash = window.location.hash.toLowerCase();
  if (!hash) return; // Keep default (Highlights) if no hash is present

  let targetMainTab = 'projects-section';
  let targetSubTab = 'highlights-sub';

  if (hash === '#links' || hash === '#links-section') {
    targetMainTab = 'links-section';
    targetSubTab = null;
  } else if (hash === '#about' || hash === '#about-section') {
    targetMainTab = 'about-section';
    targetSubTab = null;
  } else if (hash === '#projects' || hash === '#projects-section') {
    targetMainTab = 'projects-section';
    targetSubTab = 'highlights-sub';
  } else if (hash === '#games' || hash === '#games-sub') {
    targetMainTab = 'projects-section';
    targetSubTab = 'games-sub';
  } else if (hash === '#cgi' || hash === '#cgi-sub' || hash === '#3d' || hash === '#3d-sub') {
    targetMainTab = 'projects-section';
    targetSubTab = 'cgi-sub';
  } else if (hash === '#school' || hash === '#school-sub') {
    targetMainTab = 'projects-section';
    targetSubTab = 'school-sub';
  } else if (hash === '#highlights' || hash === '#highlights-sub') {
    targetMainTab = 'projects-section';
    targetSubTab = 'highlights-sub';
  }

  // Update Main Tabs
  tabButtons.forEach(btn => {
    if (btn.getAttribute('data-target') === targetMainTab) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
  tabContents.forEach(content => {
    if (content.id === targetMainTab) {
      content.classList.add('active');
    } else {
      content.classList.remove('active');
    }
  });

  // Update Subtabs (if applicable)
  if (targetSubTab) {
    subtabButtons.forEach(btn => {
      if (btn.getAttribute('data-subtarget') === targetSubTab) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
    subtabContents.forEach(content => {
      if (content.id === targetSubTab) {
        content.classList.add('active');
      } else {
        content.classList.remove('active');
      }
    });
  }
}

// Fetch and render projects dynamically from projects.json
async function loadProjects() {
  try {
    // Apply hash state BEFORE calculating heights so the correct initial tab is measured
    applyHashState();

    const response = await fetch('projects.json');
    const projects = await response.json();

    // Sort projects globally by priority (lowest number = highest on screen)
    projects.sort((a, b) => a.priority - b.priority);

    const categoryMap = {
      'highlights': '#highlights-sub .projects',
      'games': '#games-sub .projects',
      'cgi': '#cgi-sub .projects',
      'school': '#school-sub .projects'
    };

    Object.values(categoryMap).forEach(selector => {
      document.querySelector(selector).innerHTML = '';
    });

    projects.forEach(project => {
      const linksHtml = project.links
        .map(link => `<a href="${link.url}" target="_blank" rel="noopener">${link.label}</a>`)
        .join(' | ');

      let mediaHtml = '';
      if (project.thumbnail && project.gif) {
        mediaHtml = `
          <div class="project-media-container has-gif">
            <img src="${project.thumbnail}" alt="${project.title} thumbnail" class="thumbnail-img" loading="lazy">
            <img src="${project.gif}" alt="${project.title} gif" class="gif-img" loading="lazy">
          </div>
        `;
      } else if (project.thumbnail) {
        mediaHtml = `
          <div class="project-media-container">
            <img src="${project.thumbnail}" alt="${project.title} thumbnail" class="thumbnail-img" loading="lazy">
          </div>
        `;
      } else if (project.gif) {
        mediaHtml = `
          <div class="project-media-container">
            <img src="${project.gif}" alt="${project.title} gif" class="thumbnail-img" loading="lazy">
          </div>
        `;
      }

      const projectHtml = `
        <div class="project">
          ${mediaHtml}
          <div class="project-info">
            <div>
              <h3>${project.title}</h3>
              <p>${project.description}</p>
            </div>
            <p class="project-link">[ ${linksHtml} ]</p>
          </div>
        </div>
      `;

      project.categories.forEach(cat => {
        if (categoryMap[cat]) {
          document.querySelector(categoryMap[cat]).insertAdjacentHTML('beforeend', projectHtml);
        }
      });
    });

    // Set initial height after dynamic injection completes based on active tab
    const activeTab = contentContainer.querySelector('.tab-content.active');
    if (activeTab) {
      contentContainer.style.height = activeTab.offsetHeight + 'px';
    }

    resetAndTriggerMobileGifFade();

  } catch (error) {
    console.error('Failed to load projects:', error);
    const highlightsContainer = document.querySelector('#highlights-sub .projects');
    if (highlightsContainer) {
      highlightsContainer.innerHTML = '<p style="color: var(--muted); padding: 1rem;">Projekty se nepodařilo načíst.</p>';
    }
  }
}

// Load projects on startup
window.addEventListener('DOMContentLoaded', loadProjects);

// Main Tabs Switcher
tabButtons.forEach(button => {
  button.addEventListener('click', () => {
    if (button.classList.contains('active')) return;
    const targetId = button.getAttribute('data-target');

    // Update URL hash without jumping the page
    if (targetId === 'links-section') {
      history.replaceState(null, '', '#links');
    } else if (targetId === 'about-section') {
      history.replaceState(null, '', '#about');
    } else {
      history.replaceState(null, '', '#highlights');
    }

    animateToContent(() => {
      tabButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');

      tabContents.forEach(content => {
        if (content.id === targetId) {
          content.classList.add('active');
        } else {
          content.classList.remove('active');
        }
      });
    });

    resetAndTriggerMobileGifFade();
  });
});

// Subtabs Switcher
subtabButtons.forEach(button => {
  button.addEventListener('click', () => {
    if (button.classList.contains('active')) return;
    const targetSubId = button.getAttribute('data-subtarget');

    // Update URL hash based on subtarget (e.g. #games, #cgi, #school, #highlights)
    const hashName = targetSubId.replace('-sub', '');
    history.replaceState(null, '', '#' + hashName);

    animateToContent(() => {
      subtabButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');

      subtabContents.forEach(content => {
        if (content.id === targetSubId) {
          content.classList.add('active');
        } else {
          content.classList.remove('active');
        }
      });
    });

    resetAndTriggerMobileGifFade();
  });
});

// Handle browser back/forward buttons smoothly
window.addEventListener('hashchange', () => {
  animateToContent(() => {
    applyHashState();
  });
  resetAndTriggerMobileGifFade();
});

// Handle responsive window resizing smoothly (with debounce)
let resizeTimer = null;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    const activeTab = contentContainer.querySelector('.tab-content.active');
    if (activeTab) {
      contentContainer.style.transition = 'none';
      contentContainer.style.height = activeTab.offsetHeight + 'px';
      activeTab.offsetHeight; // Force reflow
      contentContainer.style.transition = 'height 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
    }
  }, 150);
});


// ==========================================
// TERMINAL EASTER EGG LOGIC
// ==========================================
const terminalOverlay = document.getElementById('terminal-overlay');
const terminalInput = document.getElementById('terminal-input');
const terminalOutput = document.getElementById('terminal-output');
const terminalCloseBtn = document.getElementById('terminal-close');
const terminalBody = document.getElementById('terminal-body');
const terminalTrigger = document.getElementById('terminal-trigger');

function toggleTerminal(e) {
  if (e) e.preventDefault();
  terminalOverlay.classList.toggle('active');
  if (terminalOverlay.classList.contains('active')) {
    terminalInput.focus();
  }
}

// Toggle with ~ (Backquote) key
window.addEventListener('keydown', (e) => {
  if (e.code === 'Backquote' || e.key === '`') {
    e.preventDefault();
    toggleTerminal();
  } else if (e.key === 'Escape' && terminalOverlay.classList.contains('active')) {
    terminalOverlay.classList.remove('active');
  }
});

terminalTrigger.addEventListener('click', toggleTerminal);
terminalCloseBtn.addEventListener('click', () => terminalOverlay.classList.remove('active'));

terminalOverlay.addEventListener('click', (e) => {
  if (e.target === terminalOverlay) {
    terminalOverlay.classList.remove('active');
  }
});

terminalInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const cmd = terminalInput.value.trim();
    if (cmd) {
      executeCommand(cmd);
    }
    terminalInput.value = '';
  }
});

function printToTerminal(htmlContent, className = '') {
  const div = document.createElement('div');
  div.className = `term-line ${className}`;
  div.innerHTML = htmlContent;
  terminalOutput.appendChild(div);
  terminalBody.scrollTop = terminalBody.scrollHeight;
}

function executeCommand(cmd) {
  printToTerminal(`<span class="term-prompt">&gt;</span> ${escapeHtml(cmd)}`);

  const parts = cmd.toLowerCase().split(' ');
  const mainCmd = parts[0];
  const args = parts.slice(1);

  switch (mainCmd) {
    case 'help':
      printToterimalHelp();
      break;
    case 'projects':
      printToTerminal(`Switching to Projects tab...`, 'term-success');
      document.querySelector('[data-target="projects-section"]').click();
      setTimeout(() => terminalOverlay.classList.remove('active'), 400);
      break;
    case 'links':
      printToTerminal(`Switching to Links tab...`, 'term-success');
      document.querySelector('[data-target="links-section"]').click();
      setTimeout(() => terminalOverlay.classList.remove('active'), 400);
      break;
    case 'about':
      printToTerminal(`Switching to About Me tab...`, 'term-success');
      document.querySelector('[data-target="about-section"]').click();
      setTimeout(() => terminalOverlay.classList.remove('active'), 400);
      break;
    case 'stardew':
      printToTerminal(`Switching to Stardew website...`, 'term-success');
      window.location.href = 'https://stardew.rionit.net';
      setTimeout(() => terminalOverlay.classList.remove('active'), 400);
      break;
    case 'whoami':
      printToTerminal(`Bc. Filip Doležal (Rionit) - Game Dev, 3D Artist & Master's Student at MFF UK`);
      break;
    case 'neofetch':
      printNeofetch();
      break;
    case 'sudo':
      if (args[0] === 'hire') {
        printToTerminal(`[sudo] password for visitor: *********<br><span class="term-success">ACCESS GRANTED! 🎉 Send an email to contact@rionit.net to start working together!</span>`);
      } else {
        printToTerminal(`sudo: ${escapeHtml(args.join(' '))}: command not found. Did you mean <span class="term-hl">sudo hire</span>?`, 'term-error');
      }
      break;
    case 'date':
      printToTerminal(new Date().toString());
      break;
    case 'echo':
      printToTerminal(escapeHtml(args.join(' ')));
      break;
    case 'clear':
      terminalOutput.innerHTML = '';
      break;
    default:
      printToTerminal(`Command not found: ${escapeHtml(mainCmd)}. Type <span class="term-hl">help</span> for available commands.`, 'term-error');
  }
}

function printNeofetch() {
  const neofetchHtml = `
<div style="display: flex; gap: 1.5rem; align-items: flex-start; margin: 0.5rem 0;">
  <img src="neofetch.gif" alt="Neofetch Image" style="width: 250px; height: 250px; object-fit: cover;">
  <div style="font-family: inherit; line-height: 1.4;">
    <span class="term-hl">visitor</span><span class="sep">@</span><span class="path">rionit.net</span><br>
    <span class="sep">------------------</span><br>
    <span class="term-hl">OS:</span> TrueNAS Scale<br>
    <span class="term-hl">Host:</span> Web Browser<br>
    <span class="term-hl">Uptime:</span> A while now for sure<br>
    <span class="term-hl">Role:</span> Game Dev &amp; 3D Artist<br>
    <span class="term-hl">Engines:</span> Blender, Godot, Unity<br>
    <span class="term-hl">Stack:</span> GDScript, C#, C++, JS<br>
    <span class="term-hl">Contact:</span> contact@rionit.net
  </div>
</div>
<div style="margin-top: 0.5rem; margin-left: calc(250px + 1.5rem);">
  <span style="background-color: var(--bg-color); padding: 0 20px;">   </span><span style="background-color: var(--primary-color); padding: 0 20px;">   </span><span style="background-color: var(--secondary-color); padding: 0 20px;">   </span><span style="background-color: var(--accent-color); padding: 0 20px;">   </span><span style="background-color: var(--muted); padding: 0 20px;">   </span><span style="background-color: var(--text-color); padding: 0 20px;">   </span>
</div>`.trim();
  printToTerminal(neofetchHtml);
}

function printToterimalHelp() {
  printToTerminal(`Available commands:<br>` +
    `- <span class="term-hl">projects</span>: View projects section<br>` +
    `- <span class="term-hl">links</span>: View social & contact links<br>` +
    `- <span class="term-hl">about</span>: Learn more about me<br>` +
    `- <span class="term-hl">whoami</span>: Display user info<br>` +
    `- <span class="term-hl">neofetch</span>: Display system/portfolio info overview<br>` +
    `- <span class="term-hl">stardew</span>: Play Journey of the Prairie King<br>` +
    `- <span class="term-hl">sudo hire</span>: Instant recruitment access<br>` +
    `- <span class="term-hl">date</span>: Show current date & time<br>` +
    `- <span class="term-hl">echo [text]</span>: Print custom text<br>` +
    `- <span class="term-hl">clear</span>: Clear terminal screen`);
}

function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}