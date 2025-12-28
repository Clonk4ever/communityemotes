let emotesData = [];
let originalEmotesData = [];
let currentPage = 1;
const emotesPerPage = 256;
let isRandomized = false;

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
  updatePagination();
}

function updatePagination() {
  const paginationContainer = document.getElementById('pagination');
  if (!paginationContainer) return;

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

function restoreNormal() {
  emotesData = [...originalEmotesData];
  isRandomized = false;
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

  let nameHtml = '';
  if (SHOW_EMOTE_NAMES) {
    nameHtml = `<div class="emote-name">${randomEmote.name}</div>`;
  }

  content.innerHTML = `
    <img src="emotes/${randomEmote.file}" alt="${randomEmote.name}">
    ${nameHtml}
    <button class="surprise-download-btn" onclick="downloadEmote('${randomEmote.file}', '${randomEmote.name}')">Download</button>
  `;

  display.style.display = 'block';
}

function closeSurpriseEmote() {
  document.getElementById('surpriseEmoteDisplay').style.display = 'none';
}

// Mobile scroll hide/show functionality
let lastScrollTop = 0;
let isScrolling = false;

function handleMobileScroll() {
  // Only apply on mobile devices
  if (window.innerWidth > 900) return;
  
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const musicPlayer = document.getElementById('musicPlayer');
  const topRightButtons = document.getElementById('topRightButtons');
  const surpriseMeContainer = document.getElementById('surpriseMeContainer');
  
  if (!musicPlayer || !topRightButtons || !surpriseMeContainer) return;
  
  // Show when at top or scrolling up, hide when scrolling down
  if (scrollTop <= 50) {
    // At top - always show
    musicPlayer.classList.remove('hidden');
    topRightButtons.classList.remove('hidden');
    surpriseMeContainer.classList.remove('hidden');
  } else if (scrollTop > lastScrollTop && scrollTop > 100) {
    // Scrolling down - hide
    musicPlayer.classList.add('hidden');
    topRightButtons.classList.add('hidden');
    surpriseMeContainer.classList.add('hidden');
  } else if (scrollTop < lastScrollTop) {
    // Scrolling up - show
    musicPlayer.classList.remove('hidden');
    topRightButtons.classList.remove('hidden');
    surpriseMeContainer.classList.remove('hidden');
  }
  
  lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
}

// Throttle scroll events for better performance
let scrollTimeout;
window.addEventListener('scroll', () => {
  if (!scrollTimeout) {
    scrollTimeout = setTimeout(() => {
      handleMobileScroll();
      scrollTimeout = null;
    }, 10);
  }
}, { passive: true });

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  // Randomize button
  const randomizeBtn = document.getElementById('randomizeBtn');
  if (randomizeBtn) {
    randomizeBtn.addEventListener('click', randomizeEmotes);
  }

  // Normal button
  const normalBtn = document.getElementById('normalBtn');
  if (normalBtn) {
    normalBtn.addEventListener('click', restoreNormal);
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
}
