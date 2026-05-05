const express = require('express');
const cors = require('cors');
const YtDlpWrap = require('yt-dlp-wrap');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// yt-dlp setup
const ytDlp = new YtDlpWrap();

// Startup pe yt-dlp binary download karo
YtDlpWrap.downloadFromGithub()
  .then(() => console.log('✅ yt-dlp ready!'))
  .catch(e => console.error('❌ yt-dlp download failed:', e.message));

// ============================================
// ROUTE 1: Video info
// ============================================
app.post('/api/info', async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.json({ success: false, error: 'URL required' });
  }

  try {
    const info = await ytDlp.getVideoInfo(url);

    const formats = [
      { label: 'Video', quality: 'Best Quality', format_id: 'bestvideo+bestaudio/best' },
      { label: 'Video', quality: '720p MP4', format_id: 'bestvideo[height<=720]+bestaudio/best[height<=720]' },
      { label: 'Video', quality: '480p MP4', format_id: 'bestvideo[height<=480]+bestaudio/best[height<=480]' },
      { label: 'Audio Only', quality: 'MP3', format_id: 'bestaudio' }
    ];

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

// ============================================
// ROUTE 2: Video download
// ============================================
app.get('/api/download', async (req, res) => {
  const { url, format } = req.query;

  if (!url) return res.status(400).send('URL required');

  const isAudio = format === 'bestaudio';
  const filename = `saveit_${Date.now()}.${isAudio ? 'mp3' : 'mp4'}`;

  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Type', isAudio ? 'audio/mpeg' : 'video/mp4');

  try {
    const args = isAudio
      ? [url, '-f', 'bestaudio', '--extract-audio', '--audio-format', 'mp3', '-o', '-']
      : [url, '-f', format || 'best', '--merge-output-format', 'mp4', '-o', '-'];

    const stream = ytDlp.execStream(args);
    stream.pipe(res);
    stream.on('error', err => {
      console.error('Stream error:', err.message);
      if (!res.headersSent) res.status(500).send('Download failed');
    });
  } catch (err) {
    if (!res.headersSent) res.status(500).send(err.message);
  }
});

// ============================================
// Server start
// ============================================
app.listen(PORT, () => {
  console.log(`✅ SaveIt server running on port ${PORT}`);
});
