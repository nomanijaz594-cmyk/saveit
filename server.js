const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const https = require('https');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const YT_DLP_PATH = '/tmp/yt-dlp';

function downloadYtDlp() {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(YT_DLP_PATH)) {
      console.log('✅ yt-dlp already exists');
      return resolve();
    }
    console.log('⏳ Downloading yt-dlp...');
    const file = fs.createWriteStream(YT_DLP_PATH);
    function download(url) {
      https.get(url, res => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          return download(res.headers.location);
        }
        res.pipe(file);
        file.on('finish', () => {
          file.close();
          fs.chmodSync(YT_DLP_PATH, '755');
          console.log('✅ yt-dlp downloaded!');
          resolve();
        });
      }).on('error', reject);
    }
    download('https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp');
  });
}

downloadYtDlp().catch(e => console.error('❌ Download failed:', e.message));

app.post('/api/info', (req, res) => {
  const { url } = req.body;
  if (!url) return res.json({ success: false, error: 'URL required' });

  const cmd = `"${YT_DLP_PATH}" "${url}" --dump-json --no-playlist -q --no-warnings`;

  exec(cmd, { maxBuffer: 10 * 1024 * 1024, timeout: 30000 }, (error, stdout, stderr) => {
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
          { label: 'Video', quality: 'Best MP4', format_id: 'best[ext=mp4]/best' },
          { label: 'Video', quality: '720p', format_id: 'best[height<=720][ext=mp4]/best[height<=720]' },
          { label: 'Video', quality: '480p', format_id: 'best[height<=480][ext=mp4]/best[height<=480]' },
          { label: 'Audio Only', quality: 'MP3', format_id: 'bestaudio' }
        ]
      });
    } catch (e) {
      res.json({ success: false, error: 'Parse error: ' + stdout.substring(0, 300) });
    }
  });
});

app.get('/api/download', (req, res) => {
  const { url, format } = req.query;
  if (!url) return res.status(400).send('URL required');

  const isAudio = format === 'bestaudio';
  const filename = `saveit_${Date.now()}.${isAudio ? 'mp3' : 'mp4'}`;

  res.setHeader('Content-Disposition', `attachment; filename=
