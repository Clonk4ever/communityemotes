const fs = require('fs');
const path = require('path');

const musicFolder = path.join(__dirname, 'music');
const outputFile = path.join(__dirname, 'music-list.json');

// Get all files from music folder
fs.readdir(musicFolder, (err, files) => {
  if (err) {
    console.error('Error reading music folder:', err);
    return;
  }

  // Filter only audio files
  const audioExtensions = ['.mp3', '.ogg', '.wav', '.m4a', '.aac', '.flac'];
  const audioFiles = files.filter(file => {
    const ext = path.extname(file).toLowerCase();
    return audioExtensions.includes(ext);
  });

  if (audioFiles.length === 0) {
    console.log('No audio files found in music folder.');
    return;
  }

  // Write to music-list.json (just an array of filenames)
  fs.writeFile(outputFile, JSON.stringify(audioFiles, null, 2), (err) => {
    if (err) {
      console.error('Error writing music-list.json:', err);
      return;
    }
    console.log(`✅ Generated music-list.json with ${audioFiles.length} tracks!`);
    console.log(`Tracks: ${audioFiles.join(', ')}`);
  });
});

