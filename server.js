const express = require('express');
const cors = require('cors');
const { exec, execFileSync } = require('child_process');
const https = require('https');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// yt-dlp binary path
const YT_DLP_PATH = path.join('/tmp', 'yt-dlp');

// yt-dlp download function
function downloadYtDlp() {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(YT_DLP_PATH)) {
      console.log('✅ yt-dlp already exists');
      return resolve();
    }
    console.log('⏳ Downloading yt-dlp...');
    const file = fs.createWriteStream(YT_DLP_PATH);
    https.get('https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp', res => {
      if (res.statusCode === 302 || res.statusCode === 301) {
        https.get(res.headers.location, res2 => {
          res2.pipe(file);
          file.on('finish', () => {
            file.close();
            fs.chmodSync(YT_DLP_PATH, '755');
            console.log('✅ yt-dlp downloaded!');
            resolve();
          });
        }).on('error', reject);
      } else {
        res.pipe(file);
        file.on('finish', () => {
          file.close();
          fs.chmodSync(YT_DLP_PATH, '755');
          console.log('✅ yt-dlp downloaded!');
          resolve();
        });
      }
    }).on('error', reject);
  });
}

// Server start hone pe download karo
downloadYtDlp().catch(e => console.error('❌ Download failed:', e.message));

// ============================================
// ROUTE 1: Video info
// ============================================
app.post('/api/info', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.json({ success: false, error: 'URL required' });

  exec(`"${YT_DLP_PATH}" "${url}" --dump-json --no-playlist -q`, 
    { maxBuffer: 10 * 1024 * 1024 }, 
    (error, stdout, stderr) => {
      if (error) {
        return res.json({ success: false, error: stderr || error.message });
      }
      try {
        const info = JSON.parse(stdout.trim());
        res.json({
          success: true,
          title: info.title || 'Video',
          duration: info.duration_string || '',
          formats: [
            { label: 'Video', quality: 'Best Quality', format_id: 'bestvideo+bestaudio/best' },
            { label: 'Video', quality: '720p MP4', format_id: 'bestvideo[height<=720]+bestaudio/best[height<=720]' },
            { label: 'Video', quality: '480p MP4', format_id: 'bestvideo[height<=480]+bestaudio/best[height<=480]' },
            { label: 'Audio Only', quality: 'MP3', format_id: 'bestaudio' }
          ]
        });
      } catch (e) {
        res.json({ success: false, error: 'Could not parse video info' });
      }
    }
  );
});

// ============================================
// ROUTE 2: Video download
// ============================================
app.get('/api/download', (req, res) => {
  const { url, format } = req.query;
  if (!url) return res.status(400).send('URL required');

  const isAudio = format === 'bestaudio';
  const filename = `saveit_${Date.now()}.${isAudio ? 'mp3' : 'mp4'}`;

  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Type', isAudio ? 'audio/mpeg' : 'video/mp4');

  const cmd = isAudio
    ? `"${YT_DLP_PATH}" "${url}" -f bestaudio --extract-audio --audio-format mp3 -o -`
    : `"${YT_DLP_PATH}" "${url}" -f "${format || 'best'}" --merge-output-format mp4 -o -`;

  const child = exec(cmd, { maxBuffer: 500 * 1024 * 1024 });
  child.stdout.pipe(res);
  child.stderr.on('data', d => console.error('[yt-dlp]', d));
  child.on('error', err => {
    if (!res.headersSent) res.status(500).send('Download failed');
  });
});

// ============================================
// Server start
// ============================================
app.listen(PORT, () => {
  console.log(`✅ SaveIt server running on port ${PORT}`);
});
