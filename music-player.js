// Music Player
let currentTrackIndex = 0;
let musicFiles = [];
let audioPlayer;

function initMusicPlayer() {
  audioPlayer = document.getElementById('audioPlayer');
  const playPauseBtn = document.getElementById('playPauseBtn');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const volumeSlider = document.getElementById('volumeSlider');
  const musicTitle = document.getElementById('musicTitle');

  // Load music files list (we'll fetch from a JSON or scan the folder)
  loadMusicFiles();

  // Event listeners
  playPauseBtn.addEventListener('click', togglePlayPause);
  prevBtn.addEventListener('click', playPrevious);
  nextBtn.addEventListener('click', playNext);
  volumeSlider.addEventListener('input', (e) => {
    const value = e.target.value;
    audioPlayer.volume = value / 100;
    // Update the green line behind the thumb
    const wrapper = e.target.closest('.volume-slider-wrapper');
    if (wrapper) {
      wrapper.style.setProperty('--volume-percent', `${value}%`);
    }
  });
  
  // Set initial volume line
  const wrapper = volumeSlider.closest('.volume-slider-wrapper');
  if (wrapper) {
    wrapper.style.setProperty('--volume-percent', `${volumeSlider.value}%`);
  }

  audioPlayer.addEventListener('ended', () => {
    // Auto-advance to next track when current track ends
    if (musicFiles.length > 0) {
      playNext(true); // Force auto-play
    }
  });
  
  // Set initial volume
  audioPlayer.volume = 0.5;
}

function loadMusicFiles() {
  // Try to load music list from a JSON file
  fetch('music-list.json')
    .then(res => res.json())
    .then(data => {
      if (Array.isArray(data) && data.length > 0) {
        musicFiles = data;
        audioPlayer.volume = 0.5; // Set default volume
      } else {
        musicFiles = [];
      }
    })
    .catch(err => {
      console.log('Music list not found. Run generate-music-list.bat after adding music files.');
      musicFiles = [];
    });
}

function loadTrack(index, autoPlay = false) {
  if (musicFiles.length === 0) return;
  
  currentTrackIndex = index;
  const track = musicFiles[currentTrackIndex];
  
  // Check if track is already a full URL (Google Drive, etc.) or a local path
  if (track.startsWith('http://') || track.startsWith('https://')) {
    // It's a full URL, use it directly
    audioPlayer.src = track;
  } else {
    // It's a local file, prepend music/ folder
    audioPlayer.src = `music/${track}`;
  }
  
  audioPlayer.load();
  
  if (autoPlay) {
    // Wait for the track to be ready, then play
    const playHandler = () => {
      audioPlayer.play().catch(err => {
        console.error('Error playing audio:', err);
      });
      audioPlayer.removeEventListener('canplay', playHandler);
    };
    audioPlayer.addEventListener('canplay', playHandler, { once: true });
  }
}

function togglePlayPause() {
  if (musicFiles.length === 0) {
    return;
  }

  if (audioPlayer.paused) {
    if (!audioPlayer.src) {
      loadTrack(0, true);
      document.getElementById('playPauseBtn').textContent = '⏸';
    } else {
      audioPlayer.play().catch(err => {
        console.error('Error playing audio:', err);
      });
      document.getElementById('playPauseBtn').textContent = '⏸';
    }
  } else {
    audioPlayer.pause();
    document.getElementById('playPauseBtn').textContent = '▶';
  }
}

function playNext(forcePlay = false) {
  if (musicFiles.length === 0) return;
  const wasPlaying = !audioPlayer.paused || forcePlay;
  
  // Loop through all tracks (infinite loop)
  currentTrackIndex = (currentTrackIndex + 1) % musicFiles.length;
  
  // Load and play the next track
  loadTrack(currentTrackIndex, wasPlaying);
  
  if (wasPlaying) {
    document.getElementById('playPauseBtn').textContent = '⏸';
  }
}

function playPrevious() {
  if (musicFiles.length === 0) return;
  const wasPlaying = !audioPlayer.paused;
  currentTrackIndex = (currentTrackIndex - 1 + musicFiles.length) % musicFiles.length;
  loadTrack(currentTrackIndex, wasPlaying);
  if (wasPlaying) {
    document.getElementById('playPauseBtn').textContent = '⏸';
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMusicPlayer);
} else {
  initMusicPlayer();
}

