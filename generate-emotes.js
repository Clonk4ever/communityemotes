const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const emotesFolder = path.join(__dirname, 'emotes');
const outputFile = path.join(__dirname, 'emotes.json');

// Helper function to get file creation date from git (first commit)
// Falls back to file modification time if git is not available
function getFileDate(filePath, relativePath) {
  try {
    // Try to get the first commit date for this file using git log
    // --follow: follow renames
    // --format=%ct: output commit timestamp
    // --diff-filter=A: only show commits that added the file
    // -1: only the first (oldest) commit
    const gitCommand = `git log --follow --format=%ct --diff-filter=A -1 -- "${relativePath}"`;
    const timestamp = execSync(gitCommand, { 
      encoding: 'utf8',
      cwd: __dirname,
      stdio: ['ignore', 'pipe', 'ignore']
    }).trim();
    
    if (timestamp) {
      return parseInt(timestamp) * 1000; // Convert to milliseconds
    }
  } catch (err) {
    // Git command failed (file not tracked, not a git repo, etc.)
    // Fall back to file modification time
  }
  
  // Fallback to file modification time
  const stats = fs.statSync(filePath);
  return stats.mtime.getTime();
}

// Get all files from emotes folder
fs.readdir(emotesFolder, (err, files) => {
  if (err) {
    console.error('Error reading emotes folder:', err);
    return;
  }

  // Filter only image files
  const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'];
  const imageFiles = files.filter(file => {
    const ext = path.extname(file).toLowerCase();
    return imageExtensions.includes(ext);
  });

  // Read existing emotes.json to preserve tags and names
  let existingEmotes = [];
  try {
    if (fs.existsSync(outputFile)) {
      const existingData = fs.readFileSync(outputFile, 'utf8');
      existingEmotes = JSON.parse(existingData);
      if (!Array.isArray(existingEmotes)) {
        existingEmotes = [];
      }
    }
  } catch (err) {
    console.log('No existing emotes.json or invalid format, starting fresh');
    existingEmotes = [];
  }

  // Create a map of existing emotes by filename for quick lookup
  const existingEmotesMap = new Map();
  existingEmotes.forEach(emote => {
    existingEmotesMap.set(emote.file, emote);
  });

  // Helper function to parse tags from filename
  function parseTagsFromName(filename) {
    const nameWithoutExt = path.basename(filename, path.extname(filename));
    const tagMatch = nameWithoutExt.match(/\(([^)]+)\)/);
    
    if (tagMatch) {
      // Extract tags from parentheses and clean up the name
      const tags = tagMatch[1].split(',').map(tag => tag.trim().toLowerCase()).filter(Boolean);
      const cleanName = nameWithoutExt.replace(/\([^)]+\)/, '').trim();
      return { name: cleanName, tags: tags };
    }
    
    // No tags in name
    return { name: nameWithoutExt, tags: [] };
  }

  // Generate emotes array - keep existing entries if file still exists, add new ones
  const emotes = imageFiles.map(file => {
    const filePath = path.join(emotesFolder, file);
    const relativePath = path.join('emotes', file).replace(/\\/g, '/'); // Use forward slashes for git
    
    // Check if this file already exists in the JSON
    if (existingEmotesMap.has(file)) {
      const existing = existingEmotesMap.get(file);
      // Check if name has tags format - if so, parse them
      const parsed = parseTagsFromName(file);
      
      // If filename has tags format and existing entry doesn't have tags (or has empty tags),
      // use parsed tags. Otherwise, preserve existing tags.
      if (parsed.tags.length > 0 && (!existing.tags || existing.tags.length === 0)) {
        return {
          name: parsed.name,
          file: file,
          tags: parsed.tags,
          addedDate: existing.addedDate || getFileDate(filePath, relativePath)
        };
      }
      
      // Keep the existing entry but preserve the date (don't overwrite existing dates)
      return {
        ...existing,
        addedDate: existing.addedDate || getFileDate(filePath, relativePath)
      };
    } else {
      // New file - parse name and tags from filename
      const parsed = parseTagsFromName(file);
      return {
        name: parsed.name,
        file: file,
        tags: parsed.tags,
        addedDate: getFileDate(filePath, relativePath)
      };
    }
  });

  // Sort by date added (newest first)
  emotes.sort((a, b) => {
    const dateA = a.addedDate || 0;
    const dateB = b.addedDate || 0;
    return dateB - dateA; // Newest first
  });

  // Write to emotes.json
  fs.writeFile(outputFile, JSON.stringify(emotes, null, 2), (err) => {
    if (err) {
      console.error('Error writing emotes.json:', err);
      return;
    }
    
    const addedCount = emotes.length - existingEmotes.filter(e => imageFiles.includes(e.file)).length;
    const removedCount = existingEmotes.length - existingEmotes.filter(e => imageFiles.includes(e.file)).length;
    
    console.log(`✅ Updated emotes.json with ${emotes.length} emotes!`);
    if (addedCount > 0) {
      console.log(`➕ Added ${addedCount} new emote(s)`);
    }
    if (removedCount > 0) {
      console.log(`➖ Removed ${removedCount} emote(s) that no longer exist in folder`);
    }
    if (addedCount === 0 && removedCount === 0) {
      console.log(`No changes detected - all emotes are in sync`);
    }
  });
});

