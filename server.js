const express = require('express');
const cors = require('cors');
const { exec, execSync } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// yt-dlp install karo agar nahi hai
try {
  execSync('yt-dlp --version', { stdio: 'ignore' });
  console.log('✅ yt-dlp already installed');
} catch {
  console.log('⏳ Installing yt-dlp...');
  try {
    execSync('pip install yt-dlp', { stdio: 'inherit' });
    console.log('✅ yt-dlp installed via pip');
  } catch {
    try {
      execSync('pip3 install yt-dlp', { stdio: 'inherit' });
      console.log('✅ yt-dlp installed via pip3');
    } catch {
      try {
        execSync('curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp && chmod a+rx /usr/local/bin/yt-dlp', { stdio: 'inherit' });
        console.log('✅ yt-dlp installed via curl');
      } catch (e) {
        console.error('❌ yt-dlp install failed:', e.message);
      }
    }
  }
}

function runYtDlp(args) {
  return new Promise((resolve, reject) => {
    exec(`yt-dlp ${args}`, { maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) reject(new Error(stderr || error.message));
      else resolve(stdout.trim());
    });
  });
}

app.post('/api/info', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.json({ success: false, error: 'URL required' });

  try {
    const infoJson = await runYtDlp(`"${url}" --dump-json --no-playlist -q`);
    const info = JSON.parse(infoJson);

    const formats = [];
    formats.push({ label: 'Video', quality: 'Best Quality', format_id: 'bestvideo+bestaudio/best' });
    formats.push({ label: 'Video', quality: '720p MP4', format_id: 'bestvideo[height<=720]+bestaudio/best[height<=720]' });
    formats.push({ label: 'Audio Only', quality: 'MP3', format_id: 'bestaudio' });

    res.json({
      success: true,
      title: info.title || 'Video',
      duration: info.duration_string || '',
      formats
    });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

app.get('/api/download', async (req, res) => {
  const { url, format } = req.query;
  if (!url) return res.status(400).send('URL required');

  const isAudio = format === 'bestaudio';
  const ext = isAudio ? 'mp3' : 'mp4';
  const filename = `saveit_${Date.now()}.${ext}`;

  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Type', isAudio ? 'audio/mpeg' : 'video/mp4');

  const cmd = isAudio
    ? `yt-dlp "${url}" -f bestaudio --extract-audio --audio-format mp3 -o -`
    : `yt-dlp "${url}" -f "${format || 'best'}" --merge-output-format mp4 -o -`;

  const child = exec(cmd, { maxBuffer: 500 * 1024 * 1024 });
  child.stdout.pipe(res);
  child.stderr.on('data', d => console.error('[yt-dlp]', d));
  child.on('error', err => {
    if (!res.headersSent) res.status(500).send('Download failed');
  });
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});

  
  

