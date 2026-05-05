# SaveIt - Complete Setup & Hosting Guide
## (TikTok/Instagram/Facebook Video Downloader)

---

## 📁 Files jo aapke paas hain:
```
saveit/
├── index.html     ← Frontend (website design)
├── server.js      ← Backend (Node.js server)
├── package.json   ← Project info
└── README.md      ← Yeh guide
```

---

## ✅ STEP 1: Apne Computer pe Chalana (Local)

### Pehle yeh install karein:

**1. Node.js install karein**
- https://nodejs.org/en/download pe jayen
- LTS version download karein aur install karein

**2. yt-dlp install karein**
- Windows ke liye: https://github.com/yt-dlp/yt-dlp/releases se `yt-dlp.exe` download karein
- Isko `C:\Windows\System32\` mein copy karein (taake har jagah se chal sake)
- Ya Python ke zariye: `pip install yt-dlp`

**3. ffmpeg install karein** (video merge ke liye zaruri hai)
- https://ffmpeg.org/download.html se download karein
- Isko bhi PATH mein add karein

---

### Project run karein:

```bash
# 1. Folder mein jayen
cd saveit

# 2. Dependencies install karein
npm install

# 3. Server chalayein
node server.js
```

Ab browser mein kholen: **http://localhost:3000**

---

## 🌐 STEP 2: Internet pe Host Karna (Free Options)

### Option A: Railway.app (Sabse Asaan - Recommended)

1. https://railway.app pe account banayein (GitHub se login karein)
2. "New Project" → "Deploy from GitHub repo" click karein
3. Apna code GitHub pe upload karein (agar nahi hai toh neeche dekhein)
4. Railway automatically deploy kar dega
5. Aapko ek free URL mil jayega jaise: `https://saveit-production.up.railway.app`

**yt-dlp Railway pe install karna:**
- Project settings mein jayen → "Variables" tab
- `NIXPACKS_APT_PKGS` = `ffmpeg python3-pip` add karein
- Ek aur command file banayein `nixpacks.toml`:
```toml
[phases.setup]
cmds = ["pip install yt-dlp"]
```

---

### Option B: Render.com (Free - Thoda Slow)

1. https://render.com pe account banayein
2. "New Web Service" → GitHub repo connect karein
3. Build Command: `npm install && pip install yt-dlp`
4. Start Command: `node server.js`
5. Free tier mein deploy karein

**Note:** Render free mein 15 minute inactivity pe sleep ho jaata hai

---

### Option C: VPS (Paid - Best Performance)
**DigitalOcean / Hostinger / Contabo** pe $4-6/month ka VPS lein

```bash
# VPS pe SSH karke:
sudo apt update
sudo apt install nodejs npm ffmpeg python3-pip -y
pip install yt-dlp

# Code upload karein (Git ya FTP se)
git clone https://github.com/aapka-username/saveit.git
cd saveit
npm install
node server.js

# Background mein chalane ke liye:
npm install -g pm2
pm2 start server.js
pm2 startup
pm2 save
```

---

## 📤 STEP 3: Code GitHub pe Upload Karna

```bash
# Git install karein: https://git-scm.com/
# GitHub account banayein: https://github.com/

git init
git add .
git commit -m "SaveIt video downloader"
git branch -M main
git remote add origin https://github.com/aapka-username/saveit.git
git push -u origin main
```

---

## 🔧 STEP 4: Domain Lagana (Optional)

Agar custom domain chahiye (jaise `saveit.com`):
1. Namecheap / GoDaddy se domain lein (~$10/year)
2. Railway/Render settings mein "Custom Domain" add karein
3. Domain ka DNS Railway ke IP pe point karein

---

## ⚠️ Important Notes:

1. **yt-dlp update karte rahein** — platforms apni API change karte rehte hain:
   ```bash
   pip install -U yt-dlp
   ```

2. **Rate limiting** add karein production mein (bahut requests aayein toh server crash ho sakta hai)

3. **Instagram aur Facebook** ke liye aapko login cookies deni pad sakti hain yt-dlp ko

4. **Legal note:** Sirf apni ya copyright-free videos download karein. Doosron ki content ke liye permission lein.

---

## 🆘 Common Errors:

| Error | Solution |
|-------|----------|
| `yt-dlp not found` | yt-dlp install karein aur PATH mein add karein |
| `ffmpeg not found` | ffmpeg install karein |
| `CORS error` | server.js mein cors() already hai, browser se test karein |
| `Video unavailable` | Video private ho sakti hai ya region block |
| `429 Too Many Requests` | Kuch time baad try karein, IP block ho gayi |

---

## 📞 Quick Start Summary:

```
1. Node.js install karein
2. yt-dlp install karein  
3. npm install (folder mein)
4. node server.js
5. http://localhost:3000 kholein
6. Koi bhi video URL paste karein aur download karein!
```

**Website ready hai! 🎉**
