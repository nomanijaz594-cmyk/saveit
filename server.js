// ============================================
// SaveIt - Video Downloader Backend
// Node.js + Express + yt-dlp
// ============================================

const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Sabhi domains se requests allow karta hai
app.use(express.json());
app.use(express.static(__dirname)); // index.html serve karta hai

// ============================================
// Helper: yt-dlp command run karna
// ============================================
function runYtDlp(args) {
  return new Promise((resolve, reject) => {
    exec(`yt-dlp ${args}`, { maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(stderr || error.message));
      } else {
        resolve(stdout.trim());
      }
    });
  });
}

// ============================================
// ROUTE 1: Video info lena (title, formats)
// POST /api/info
// Body: { url: "https://tiktok.com/..." }
// ============================================
app.post('/api/info', async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.json({ success: false, error: 'URL required' });
  }

  try {
    // Video ka JSON info lao
    const infoJson = await runYtDlp(`"${url}" --dump-json --no-playlist`);
    const info = JSON.parse(infoJson);

    // Formats filter karo — sirf useful wale
    const formats = [];

    // No-watermark video (TikTok ke liye)
    if (info.extractor === 'tiktok') {
      formats.push({ label: 'Video (No Watermark)', quality: 'HD MP4', format_id: 'nowm' });
    }

    // Best video quality
    formats.push({ label: 'Video', quality: 'Best Quality', format_id: 'bestvideo+bestaudio/best' });

    // 720p
    formats.push({ label: 'Video', quality: '720p MP4', format_id: 'bestvideo[height<=720]+bestaudio/best[height<=720]' });

    // 480p
    formats.push({ label: 'Video', quality: '480p MP4', format_id: 'bestvideo[height<=480]+bestaudio/best[height<=480]' });

    // Audio only
    formats.push({ label: 'Audio Only', quality: 'MP3 128kbps', format_id: 'bestaudio' });

    res.json({
      success: true,
      title: info.title || 'Video',
      duration: info.duration_string || '',
      thumbnail: info.thumbnail || '',
      formats
    });

  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

// ============================================
// ROUTE 2: Video download karna
// GET /api/download?url=...&format=...
// ============================================
app.get('/api/download', async (req, res) => {
  const { url, format } = req.query;

  if (!url) {
    return res.status(400).send('URL required');
  }

  const fmt = format || 'bestvideo+bestaudio/best';
  const isAudio = fmt === 'bestaudio';

  // File extension decide karo
  const ext = isAudio ? 'mp3' : 'mp4';

  // Filename safe banao
  const filename = `saveit_video_${Date.now()}.${ext}`;

  // Headers set karo download ke liye
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Type', isAudio ? 'audio/mpeg' : 'video/mp4');

  // yt-dlp command
  let cmd;
  if (isAudio) {
    cmd = `yt-dlp "${url}" -f bestaudio --extract-audio --audio-format mp3 -o - 2>/dev/null`;
  } else if (fmt === 'nowm') {
    // TikTok no-watermark
    cmd = `yt-dlp "${url}" -f "hd" -o - 2>/dev/null`;
  } else {
    cmd = `yt-dlp "${url}" -f "${fmt}" --merge-output-format mp4 -o - 2>/dev/null`;
  }

  const child = exec(cmd, { maxBuffer: 500 * 1024 * 1024 });

  child.stdout.pipe(res);

  child.stderr.on('data', (data) => {
    console.error('[yt-dlp error]', data);
  });

  child.on('error', (err) => {
    console.error('Process error:', err);
    if (!res.headersSent) {
      res.status(500).send('Download failed');
    }
  });
});

// ============================================
// Server start karo
// ============================================
app.listen(PORT, () => {
  console.log(`\n✅ SaveIt server chal raha hai!`);
  console.log(`🌐 Website: http://localhost:${PORT}`);
  console.log(`📡 API: http://localhost:${PORT}/api/info\n`);
});
