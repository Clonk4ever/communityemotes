let emotesData = [];
let originalEmotesData = [];
let currentPage = 1;
let isRandomized = false;
let isLatestMode = false;
let isOldestMode = false;
const TWITCH_CHANNEL = 'clonk_4_ever';
const TWITCH_STATUS_REFRESH_MS = 120000;
// TWITCH_LIVE_OVERRIDE = Null uses API status // False hides LIVE // True Shows LIVE
const TWITCH_LIVE_OVERRIDE = null;
let twitchStatusIntervalId = null;

function setTwitchLiveState(state) {
  const twitchBtn = document.getElementById('twitchBtn');
  if (!twitchBtn) return;

  twitchBtn.classList.remove('is-live', 'is-offline', 'is-unknown');
  twitchBtn.classList.add(`is-${state}`);

  if (state === 'live') {
    twitchBtn.title = 'Twitch - Live now';
    twitchBtn.setAttribute('aria-label', 'Twitch channel is live now');
    return;
  }

  if (state === 'offline') {
    twitchBtn.title = 'Twitch - Offline';
    twitchBtn.setAttribute('aria-label', 'Twitch channel is currently offline');
    return;
  }

  twitchBtn.title = 'Twitch - Status unavailable';
  twitchBtn.setAttribute('aria-label', 'Twitch channel status is unavailable');
}

async function fetchTwitchLiveStatus(channel) {
  const endpoint = `https://api.ivr.fi/v2/twitch/user?login=${encodeURIComponent(channel)}`;
  const response = await fetch(endpoint, {
    headers: { Accept: 'application/json' }
  });

  if (!response.ok) {
    throw new Error(`Twitch status request failed (${response.status})`);
  }

  const payload = await response.json();
  const user = Array.isArray(payload) ? payload[0] : null;

  if (!user) {
    throw new Error('Twitch user payload was empty');
  }
  
  if (typeof TWITCH_LIVE_OVERRIDE === 'boolean') {
    return TWITCH_LIVE_OVERRIDE;
  }

  return Boolean(user.stream);
}

async function updateTwitchLiveStatus(channel) {
  try {
    const isLive = await fetchTwitchLiveStatus(channel);
    setTwitchLiveState(isLive ? 'live' : 'offline');
  } catch (error) {
    console.warn('Unable to fetch Twitch live status:', error);
    setTwitchLiveState('unknown');
  }
}

function startTwitchStatusPolling(channel) {
  updateTwitchLiveStatus(channel);

  if (twitchStatusIntervalId) {
    clearInterval(twitchStatusIntervalId);
  }

  twitchStatusIntervalId = setInterval(() => {
    updateTwitchLiveStatus(channel);
  }, TWITCH_STATUS_REFRESH_MS);

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      updateTwitchLiveStatus(channel);
    }
  });
}

// Get emotes per page based on screen size to fill all columns perfectly
function getEmotesPerPage() {
  const width = window.innerWidth;
  
  if (width <= 650) {
    return 114;  // 3 columns × 38 rows = 114 (perfect fit)
  } else if (width <= 900) {
    return 152;  // 4 columns × 38 rows = 152 (perfect fit)
  } else if (width <= 1200) {
    return 180;  // 6 columns × 30 rows = 180 (perfect fit)
  } else if (width <= 1919) {
    return 256;  // 8 columns × 32 rows = 256 (perfect fit)
  } else if (width <= 2559) {
    return 300;  // 10 columns × 30 rows = 300 (perfect fit)
  } else {
    return 420;  // 14 columns × 30 rows = 420 (perfect fit)
  }
}

// Toggle for showing emote names (change to false to hide names)
const SHOW_EMOTE_NAMES = false;

// Fetch emotes data with error handling
fetch('emotes.json')
  .then(res => {
    if (!res.ok) {
      throw new Error('Failed to load emotes');
    }
    return res.json();
  })
  .then(data => {
    if (!Array.isArray(data)) {
      console.error('emotes.json should be an array');
      return;
    }
    emotesData = data;
    originalEmotesData = [...data];
    // Update emote counter
    const counterElement = document.getElementById('emoteCount');
    if (counterElement) {
      counterElement.textContent = originalEmotesData.length;
    }
    renderEmotes(data);
    setupPagination();
  })
  .catch(err => {
    console.error('Error loading emotes:', err);
    const gallery = document.getElementById('gallery');
    gallery.innerHTML = '<p style="color: #ff6b6b;">Failed to load emotes. Please refresh the page.</p>';
  });

function renderEmotes(list) {
  const gallery = document.getElementById('gallery');
  gallery.innerHTML = '';

  if (list.length === 0) {
    gallery.innerHTML = '<p style="color: #999;">No emotes found</p>';
    return;
  }

  // Calculate pagination
  const emotesPerPage = getEmotesPerPage();
  const startIndex = (currentPage - 1) * emotesPerPage;
  const endIndex = startIndex + emotesPerPage;
  const pageEmotes = list.slice(startIndex, endIndex);

  pageEmotes.forEach(emote => {
    const div = document.createElement('div');
    div.className = 'emote';

    const img = document.createElement('img');
    img.src = `emotes/${emote.file}`;
    img.alt = emote.name;
    img.loading = 'lazy';

    const button = document.createElement('button');
    button.textContent = 'Download';
    button.onclick = () => downloadEmote(emote.file, emote.name);

    div.appendChild(img);
    
    if (SHOW_EMOTE_NAMES) {
      const nameDiv = document.createElement('div');
      nameDiv.className = 'emote-name';
      nameDiv.textContent = emote.name;
      div.appendChild(nameDiv);
    }
    
    div.appendChild(button);
    gallery.appendChild(div);
  });
}

function downloadEmote(file, name) {
  const link = document.createElement('a');
  link.href = `emotes/${file}`;
  link.download = file;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function setupPagination() {
  // Reset to page 1 if current page is beyond available pages after resize
  const emotesPerPage = getEmotesPerPage();
  const totalPages = Math.ceil(emotesData.length / emotesPerPage);
  if (currentPage > totalPages && totalPages > 0) {
    currentPage = 1;
  }
  updatePagination();
}

function updatePagination() {
  const paginationContainer = document.getElementById('pagination');
  if (!paginationContainer) return;

  const emotesPerPage = getEmotesPerPage();
  const totalPages = Math.ceil(emotesData.length / emotesPerPage);
  paginationContainer.innerHTML = '';

  // Previous button
  const prevBtn = document.createElement('button');
  prevBtn.className = 'pagination-btn';
  prevBtn.textContent = '◀';
  prevBtn.disabled = currentPage === 1;
  prevBtn.onclick = () => {
    if (currentPage > 1) {
      currentPage--;
      renderEmotes(emotesData);
      updatePagination();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  paginationContainer.appendChild(prevBtn);

  // Page numbers
  for (let i = 1; i <= totalPages; i++) {
    const pageBtn = document.createElement('button');
    pageBtn.className = 'pagination-btn';
    pageBtn.textContent = i;
    if (i === currentPage) {
      pageBtn.classList.add('active');
    }
    pageBtn.onclick = () => {
      currentPage = i;
      renderEmotes(emotesData);
      updatePagination();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    paginationContainer.appendChild(pageBtn);
  }

  // Next button
  const nextBtn = document.createElement('button');
  nextBtn.className = 'pagination-btn';
  nextBtn.textContent = '▶';
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.onclick = () => {
    if (currentPage < totalPages) {
      currentPage++;
      renderEmotes(emotesData);
      updatePagination();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  paginationContainer.appendChild(nextBtn);
}

// Randomize functionality
function randomizeEmotes() {
  const shuffled = [...originalEmotesData].sort(() => Math.random() - 0.5);
  emotesData = shuffled;
  isRandomized = true;
  currentPage = 1;
  renderEmotes(emotesData);
  updatePagination();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Latest functionality - show newest emotes first
function showLatestEmotes() {
  // Sort by addedDate (newest first) - emotes.json is already sorted by date
  emotesData = [...originalEmotesData];
  isLatestMode = true;
  isRandomized = false;
  isOldestMode = false;
  currentPage = 1;
  renderEmotes(emotesData);
  updatePagination();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Oldest functionality - show oldest emotes first
function showOldestEmotes() {
  // Reverse the array to show oldest first
  emotesData = [...originalEmotesData].reverse();
  isOldestMode = true;
  isRandomized = false;
  isLatestMode = false;
  currentPage = 1;
  renderEmotes(emotesData);
  updatePagination();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Surprise Me functionality
function showSurpriseEmote() {
  if (originalEmotesData.length === 0) return;

  const randomIndex = Math.floor(Math.random() * originalEmotesData.length);
  const randomEmote = originalEmotesData[randomIndex];
  const display = document.getElementById('surpriseEmoteDisplay');
  const content = document.getElementById('surpriseEmoteContent');
  const banner = document.querySelector('.banner');

  let nameHtml = '';
  if (SHOW_EMOTE_NAMES) {
    nameHtml = `<div class="emote-name">${randomEmote.name}</div>`;
  }

  content.innerHTML = `
    <img src="emotes/${randomEmote.file}" alt="${randomEmote.name}">
    ${nameHtml}
    <button class="surprise-download-btn" onclick="downloadEmote('${randomEmote.file}', '${randomEmote.name}')">Download</button>
  `;

  // Move display to banner-wrapper and hide banner (all widths)
  const bannerWrapper = document.querySelector('.banner-wrapper');
  if (bannerWrapper) {
    bannerWrapper.appendChild(display);
  }
  if (banner) {
    banner.style.visibility = 'hidden';
  }
  
  display.style.display = 'block';
}

function closeSurpriseEmote() {
  const display = document.getElementById('surpriseEmoteDisplay');
  const banner = document.querySelector('.banner');
  const surpriseContainer = document.getElementById('surpriseMeContainer');
  
  if (display) {
    display.style.display = 'none';
    
    // Move display back to original container
    if (surpriseContainer) {
      surpriseContainer.appendChild(display);
    }
  }
  
  // Show banner again when surprise display is closed
  if (banner) {
    banner.style.visibility = 'visible';
  }
}

// Removed scroll hide/show functionality - buttons now stay fixed at top

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  // Randomize button
  const randomizeBtn = document.getElementById('randomizeBtn');
  if (randomizeBtn) {
    randomizeBtn.addEventListener('click', randomizeEmotes);
  }

  // Latest button
  const latestBtn = document.getElementById('latestBtn');
  if (latestBtn) {
    latestBtn.addEventListener('click', showLatestEmotes);
  }

  // Oldest button
  const oldestBtn = document.getElementById('oldestBtn');
  if (oldestBtn) {
    oldestBtn.addEventListener('click', showOldestEmotes);
  }

  // Surprise Me button
  const surpriseMeBtn = document.getElementById('surpriseMeBtn');
  if (surpriseMeBtn) {
    surpriseMeBtn.addEventListener('click', showSurpriseEmote);
  }

  // Close surprise emote
  const closeSurprise = document.getElementById('closeSurprise');
  if (closeSurprise) {
    closeSurprise.addEventListener('click', closeSurpriseEmote);
  }

  // Twitch and YouTube buttons - Add your URLs here:
  const twitchBtn = document.getElementById('twitchBtn');
  if (twitchBtn) {
    twitchBtn.href = `https://www.twitch.tv/${TWITCH_CHANNEL}`;
    setTwitchLiveState('unknown');
    startTwitchStatusPolling(TWITCH_CHANNEL);
  }

  const youtubeBtn = document.getElementById('youtubeBtn');
  if (youtubeBtn) {
    // Uncomment and add your YouTube URL:
    youtubeBtn.href = 'https://www.youtube.com/@Clonk_4_ever';
  }
  const paypalBtn = document.getElementById('paypalBtn');
  if (paypalBtn) {
    // Add your PayPal donation URL:
    paypalBtn.href = 'https://www.paypal.com/donate/?hosted_button_id=A4E86UPTFDEZ2';
  }

  // PWA Install Button
  let deferredPrompt;
  const appInstallBtn = document.getElementById('appInstallBtn');

  // Show install button when app can be installed
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    // Stash the event so it can be triggered later
    deferredPrompt = e;
    // Show the install button
    if (appInstallBtn) {
      appInstallBtn.style.display = 'flex';
    }
  });

  // Handle install button click
  if (appInstallBtn) {
    appInstallBtn.addEventListener('click', async () => {
      const installedFlag = localStorage.getItem('appInstalled') === 'true';

      // If already installed (standalone or remembered in browser), inform user
      if (window.matchMedia('(display-mode: standalone)').matches || installedFlag) {
        alert('You already have the app installed.');
        return;
      }

      // If prompt not available, show manual instructions
      if (!deferredPrompt) {
        alert('Install isn’t available right now. Try “Add to Home Screen” from your browser menu.');
        return;
      }

      // Show the install prompt
      deferredPrompt.prompt();

      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }

      // Clear the deferredPrompt
      deferredPrompt = null;
    });
  }

  // Keep install button visible even after app is installed
  window.addEventListener('appinstalled', () => {
    console.log('PWA was installed');
    localStorage.setItem('appInstalled', 'true');
    deferredPrompt = null;
  });

  // Contact Form Submission
  const contactForm = document.getElementById('contactForm');
  const formMessage = document.getElementById('formMessage');
  const messageSendOk = document.getElementById('messageSendOk');
  let messageSendOkTimer = null;
  const messageInput = document.getElementById('contactMessage');

  if (contactForm) {
    if (messageInput) {
      messageInput.addEventListener('input', () => {
        messageInput.setCustomValidity('');
      });
    }

    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const isMobileViewport = window.matchMedia('(max-width: 900px), (pointer: coarse)').matches;
      const preservedScrollY = window.scrollY;

      const messageText = messageInput ? messageInput.value.trim() : '';
      if (!messageText) {
        if (formMessage) {
          formMessage.textContent = 'Please enter a message before sending.';
          formMessage.className = 'form-message form-message-error';
          formMessage.style.display = 'block';
        }
        if (messageInput) {
          messageInput.focus();
        }
        return;
      }

      if (messageInput) {
        messageInput.setCustomValidity('');
      }

      if (isMobileViewport && document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }

      const formData = new FormData(contactForm);
      const submitButton = contactForm.querySelector('button[type="submit"]');
      const originalButtonText = submitButton ? submitButton.textContent : 'Send';

      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Sending...';
      }

      if (formMessage) {
        formMessage.style.display = 'none';
      }

      try {
        const response = await fetch('https://formspree.io/f/mojvnrkk', {
          method: 'POST',
          body: formData,
          headers: {
            Accept: 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Form submission failed');
        }

        if (messageSendOk) {
          messageSendOk.style.display = 'block';
          if (messageSendOkTimer) {
            clearTimeout(messageSendOkTimer);
          }
          messageSendOkTimer = setTimeout(() => {
            messageSendOk.style.display = 'none';
            messageSendOkTimer = null;
          }, 1900);
        }

        contactForm.reset();
      } catch (error) {
        if (formMessage) {
          formMessage.textContent = 'Failed to send message. Please try again.';
          formMessage.className = 'form-message form-message-error';
          formMessage.style.display = 'block';
        }
      } finally {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = originalButtonText;
        }

        if (isMobileViewport) {
          requestAnimationFrame(() => {
            window.scrollTo(0, preservedScrollY);
          });
        }
      }
    });
  }

  // Keep button visible even if app is already installed
});

// Search functionality
const searchInput = document.getElementById('search');
if (searchInput) {
  searchInput.addEventListener('input', e => {
    const value = e.target.value.toLowerCase().trim();

    if (!value) {
      emotesData = [...originalEmotesData];
      if (isRandomized) {
        randomizeEmotes();
      } else if (isLatestMode) {
        showLatestEmotes();
      } else if (isOldestMode) {
        showOldestEmotes();
      } else {
        currentPage = 1;
        renderEmotes(emotesData);
        setupPagination();
      }
      return;
    }

    const filtered = originalEmotesData.filter(emote =>
      emote.name.toLowerCase().includes(value) ||
      (emote.tags && emote.tags.some(tag => tag.toLowerCase().includes(value)))
    );

    emotesData = filtered;
    currentPage = 1;
    renderEmotes(filtered);
    setupPagination();
  });

// Handle window resize to recalculate pagination when switching between mobile/desktop
window.addEventListener('resize', () => {
  const emotesPerPage = getEmotesPerPage();
  const totalPages = Math.ceil(emotesData.length / emotesPerPage);
  if (currentPage > totalPages && totalPages > 0) {
    currentPage = 1;
  }
  renderEmotes(emotesData);
  updatePagination();
});
}
