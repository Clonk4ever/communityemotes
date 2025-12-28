let emotesData = [];
let originalEmotesData = [];
let currentPage = 1;
let isRandomized = false;
let isLatestMode = false;
let isOldestMode = false;

// Get emotes per page based on screen size
function getEmotesPerPage() {
  return window.innerWidth <= 900 ? 57 : 256;
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

  // On mobile, move display to banner-wrapper and hide banner
  if (window.innerWidth <= 900) {
    const bannerWrapper = document.querySelector('.banner-wrapper');
    if (bannerWrapper) {
      bannerWrapper.appendChild(display);
    }
    if (banner) {
      banner.style.visibility = 'hidden';
    }
  }
  
  display.style.display = 'block';
}

function closeSurpriseEmote() {
  const display = document.getElementById('surpriseEmoteDisplay');
  const banner = document.querySelector('.banner');
  const surpriseContainer = document.getElementById('surpriseMeContainer');
  
  if (display) {
    display.style.display = 'none';
    
    // On mobile, move display back to original container
    if (window.innerWidth <= 900 && surpriseContainer) {
      surpriseContainer.appendChild(display);
    }
  }
  
  // Show banner again on mobile when surprise display is closed
  if (window.innerWidth <= 900 && banner) {
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
    // Uncomment and add your Twitch URL:
    twitchBtn.href = 'https://www.twitch.tv/clonk_4_ever';
  }

  const youtubeBtn = document.getElementById('youtubeBtn');
  if (youtubeBtn) {
    // Uncomment and add your YouTube URL:
    youtubeBtn.href = 'https://www.youtube.com/@Clonk_4_ever';
  }
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
