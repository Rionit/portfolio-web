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
        .map(link => `<a href="${link.url}">${link.label}</a>`)
        .join(' | ');

      let mediaHtml = '';
      if (project.thumbnail && project.gif) {
        mediaHtml = `
          <div class="project-media-container has-gif">
            <img src="${project.thumbnail}" alt="${project.title} thumbnail" class="thumbnail-img">
            <img src="${project.gif}" alt="${project.title} gif" class="gif-img">
          </div>
        `;
      } else if (project.thumbnail) {
        mediaHtml = `
          <div class="project-media-container">
            <img src="${project.thumbnail}" alt="${project.title} thumbnail" class="thumbnail-img">
          </div>
        `;
      } else if (project.gif) {
        mediaHtml = `
          <div class="project-media-container">
            <img src="${project.gif}" alt="${project.title} gif" class="thumbnail-img">
          </div>
        `;
      }

      const projectHtml = `
        <div class="project">
          ${mediaHtml}
          <div class="project-info">
            <h3>${project.title}</h3>
            <p>${project.description}</p>
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

// Handle responsive window resizing smoothly
window.addEventListener('resize', () => {
  const activeTab = contentContainer.querySelector('.tab-content.active');
  if (activeTab) {
    contentContainer.style.transition = 'none';
    contentContainer.style.height = activeTab.offsetHeight + 'px';
    contentContainer.offsetHeight; // Force reflow
    contentContainer.style.transition = 'height 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
  }
});