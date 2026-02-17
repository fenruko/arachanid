// CONFIGURATION
const API_BASE_URL = "https://jeans-saving-airports-pants.trycloudflare.com/api"; // Update this with your Cloudflare Tunnel URL!
const CLIENT_ID = "1329184069426348052"; 
const SPOTIFY_CLIENT_ID = "04091d0b054b4e028b3f8cfe39826363"; // User must provide this!

// State
let currentTab = 'overview';
let updateInterval = null;
let userProfile = null;
let selectedGuildId = null;
let accessToken = null;
let spotifyToken = null;
let currentTrackDuration = 0;
let currentTrackTitle = "";
let isSeeking = false;

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    // 1. Check for Redirect Token (Hash)
    const fragment = new URLSearchParams(window.location.hash.slice(1));
    
    if (fragment.has('access_token')) {
        const token = fragment.get('access_token');
        const tokenType = fragment.get('token_type');
        const scope = fragment.get('scope') || "";

        if (scope.includes('guilds')) {
            // Discord Login
            localStorage.setItem('discord_token', token);
            localStorage.setItem('discord_token_type', tokenType);
            window.history.replaceState({}, document.title, window.location.pathname); 
            fetchUserProfile(tokenType, token);
        } else if (scope.includes('playlist')) {
            // Spotify Login
            localStorage.setItem('spotify_token', token);
            window.history.replaceState({}, document.title, window.location.pathname);
            checkSpotifyConnection();
        }
    } 
    // 2. Check for Saved Tokens
    else {
        if (localStorage.getItem('discord_token')) {
            const token = localStorage.getItem('discord_token');
            const type = localStorage.getItem('discord_token_type');
            fetchUserProfile(type, token);
        }
        if (localStorage.getItem('spotify_token')) {
            checkSpotifyConnection();
        }
    }

    // Tab Switching
    document.querySelectorAll('.menu-item').forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.getAttribute('data-tab');
            if (target) switchTab(target);
        });
    });

    // Server Selection
    const serverSelect = document.getElementById('serverSelect');
    if (serverSelect) {
        serverSelect.addEventListener('change', (e) => {
            selectedGuildId = e.target.value;
            localStorage.setItem('selected_guild', selectedGuildId);
            updateMusicState();
        });
    }

    if (localStorage.getItem('selected_guild')) {
        selectedGuildId = localStorage.getItem('selected_guild');
    }

    // Search
    const searchInput = document.getElementById('searchInput');
    if(searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') searchMusic();
        });
    }

    // Seek Bar
    const seekBar = document.getElementById('seekBar');
    if (seekBar) {
        seekBar.addEventListener('input', () => { isSeeking = true; }); 
        seekBar.addEventListener('change', (e) => {
            isSeeking = false;
            const newPos = (e.target.value / 100) * currentTrackDuration;
            musicControl('seek', newPos);
        });
    }

    // Volume Slider
    const volSlider = document.getElementById('volumeSlider');
    if (volSlider) {
        volSlider.addEventListener('change', (e) => {
            musicControl('volume', e.target.value);
        });
    }

    // Initial Stats Fetch
    fetchStats();
    
    // Start Polling
    const rate = localStorage.getItem('refresh_rate') || 3000;
    updateInterval = setInterval(() => {
        if (currentTab === 'overview') fetchStats();
        if (currentTab === 'music' && selectedGuildId) updateMusicState();
    }, parseInt(rate));
});

// Mobile Sidebar Toggle
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    if (sidebar && overlay) {
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
    }
}

function switchTab(tabName) {
    document.querySelectorAll('.menu-item').forEach(t => {
        if (t.getAttribute('data-tab') === tabName) t.classList.add('active');
        else t.classList.remove('active');
    });

    document.querySelectorAll('.tab-content').forEach(c => {
        if (c.id === tabName) c.classList.add('active');
        else c.classList.remove('active');
    });

    const pageTitle = document.getElementById('pageTitle');
    if (pageTitle) pageTitle.textContent = tabName.charAt(0).toUpperCase() + tabName.slice(1);
    
    currentTab = tabName;
    
    if (tabName === 'servers') renderServerGrid();
    if (tabName === 'settings') loadServerSettings();
    if (tabName === 'music') checkSpotifyConnection(); // Refresh playlist view

    const sidebar = document.getElementById('sidebar');
    if (sidebar && sidebar.classList.contains('active')) {
        toggleSidebar();
    }
}

// --- AUTHENTICATION ---

function login() {
    const redirectUri = encodeURIComponent(window.location.href.split('#')[0]); // Current page
    const url = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${redirectUri}&response_type=token&scope=identify%20guilds`;
    window.location.href = url;
}

function logout() {
    localStorage.removeItem('discord_token');
    localStorage.removeItem('discord_token_type');
    window.location.reload();
}

async function fetchUserProfile(tokenType, token) {
    try {
        const userResp = await fetch('https://discord.com/api/users/@me', {
            headers: { authorization: `${tokenType} ${token}` }
        });
        
        if (!userResp.ok) {
            logout();
            return;
        }

        const user = await userResp.json();
        userProfile = user;

        const profileDiv = document.getElementById('userProfile');
        if (profileDiv) {
            profileDiv.innerHTML = `
                <div style="display:flex; align-items:center; gap:12px; padding: 10px; background: rgba(255,255,255,0.05); border-radius: 8px;">
                    <img src="https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png" style="width:32px; height:32px; border-radius:50%;">
                    <div style="font-size: 14px; font-weight: 600; overflow: hidden; text-overflow: ellipsis;">${user.username}</div>
                </div>
            `;
            document.getElementById('logoutBtnContainer').style.display = 'block';
        }

        fetchUserGuilds(tokenType, token);
    } catch (e) {
        console.error("Auth Error", e);
    }
}

let userGuildsCache = [];

async function fetchUserGuilds(tokenType, token) {
    try {
        const resp = await fetch('https://discord.com/api/users/@me/guilds', {
            headers: { authorization: `${tokenType} ${token}` }
        });
        const guilds = await resp.json();
        userGuildsCache = guilds.filter(g => (BigInt(g.permissions) & 0x20n) === 0x20n || (BigInt(g.permissions) & 0x8n) === 0x8n);
        
        const select = document.getElementById('serverSelect');
        if (select) {
            select.innerHTML = '<option value="" disabled selected>Select a Server</option>';
            userGuildsCache.forEach(g => {
                const opt = document.createElement('option');
                opt.value = g.id;
                opt.textContent = g.name;
                if (g.id === selectedGuildId) opt.selected = true;
                select.appendChild(opt);
            });
        }
        
        if (currentTab === 'servers') renderServerGrid();

    } catch (e) {
        console.error("Guild Fetch Error", e);
    }
}

function renderServerGrid() {
    const grid = document.getElementById('serverGrid');
    if (!grid) return;
    
    if (!userProfile) {
        grid.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-server"></i>
                <h2>Server Management</h2>
                <button class="login-btn" onclick="login()" style="margin-top:20px; width:auto; padding:10px 30px;">Login Required</button>
            </div>`;
        return;
    }

    if (userGuildsCache.length === 0) {
        grid.innerHTML = '<div class="empty-state">No servers found where you have permissions.</div>';
        return;
    }

    grid.innerHTML = userGuildsCache.map(g => {
        const icon = g.icon ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png` : 'https://cdn.discordapp.com/embed/avatars/0.png';
        return `
            <div class="stat-card" style="flex-direction: column; align-items: center; text-align: center; gap: 15px; cursor: pointer;" onclick="selectServer('${g.id}')">
                <img src="${icon}" style="width: 64px; height: 64px; border-radius: 50%;">
                <div class="stat-info">
                    <h3 style="font-size: 16px; color: white;">${g.name}</h3>
                    <p style="font-size: 12px; color: #aaa;">ID: ${g.id}</p>
                </div>
                <button style="padding: 8px 16px; background: var(--accent); border: none; border-radius: 4px; color: white; cursor: pointer;">
                    Manage
                </button>
            </div>
        `;
    }).join('');
}

function selectServer(guildId) {
    selectedGuildId = guildId;
    localStorage.setItem('selected_guild', guildId);
    
    const select = document.getElementById('serverSelect');
    if (select) select.value = guildId;

    switchTab('settings');
}

// --- SPOTIFY INTEGRATION ---

function spotifyLogin() {
    const redirectUri = encodeURIComponent(window.location.href.split('#')[0]);
    const scope = encodeURIComponent('playlist-read-private playlist-read-collaborative user-library-read');
    if (SPOTIFY_CLIENT_ID === "YOUR_SPOTIFY_CLIENT_ID") {
        alert("Please configure the Spotify Client ID in dashboard.js!");
        return;
    }
    const url = `https://accounts.spotify.com/authorize?client_id=${SPOTIFY_CLIENT_ID}&response_type=token&redirect_uri=${redirectUri}&scope=${scope}&show_dialog=true`;
    window.location.href = url;
}

function checkSpotifyConnection() {
    const token = localStorage.getItem('spotify_token');
    const btn = document.getElementById('spotifyLoginBtn');
    const container = document.getElementById('spotifyPlaylists');
    
    if (token) {
        if(btn) {
            btn.textContent = "Connected";
            btn.style.background = "#1ed760";
            btn.disabled = true;
        }
        if(container && container.children.length <= 1) { // Load if empty
             fetchSpotifyPlaylists(token);
        }
    }
}

async function fetchSpotifyPlaylists(token) {
    try {
        const res = await fetch('https://api.spotify.com/v1/me/playlists?limit=20', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (res.status === 401) { // Expired
            localStorage.removeItem('spotify_token');
            const btn = document.getElementById('spotifyLoginBtn');
            if(btn) {
                btn.textContent = "Connect Spotify";
                btn.disabled = false;
                btn.style.background = "#1DB954";
            }
            return;
        }

        const data = await res.json();
        renderSpotifyPlaylists(data.items);
    } catch (e) {
        console.error("Spotify Error", e);
        document.getElementById('spotifyPlaylists').innerHTML = '<div style="color:red;">Failed to load playlists.</div>';
    }
}

function renderSpotifyPlaylists(playlists) {
    const container = document.getElementById('spotifyPlaylists');
    if (!container) return;

    if (!playlists || playlists.length === 0) {
        container.innerHTML = '<div style="grid-column:1/-1; text-align:center;">No playlists found.</div>';
        return;
    }

    container.innerHTML = playlists.map(p => {
        const image = p.images && p.images.length > 0 ? p.images[0].url : 'https://via.placeholder.com/150?text=No+Cover';
        return `
            <div class="playlist-card" style="background: rgba(255,255,255,0.05); padding: 10px; border-radius: 8px; cursor: pointer; transition: 0.2s;" 
                 onclick="playTrack('${p.external_urls.spotify}')"
                 onmouseover="this.style.background='rgba(255,255,255,0.1)'" 
                 onmouseout="this.style.background='rgba(255,255,255,0.05)'">
                <img src="${image}" style="width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: 6px; margin-bottom: 8px;">
                <div style="font-weight: 600; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${p.name}</div>
                <div style="font-size: 12px; color: #aaa;">${p.tracks.total} Tracks</div>
            </div>
        `;
    }).join('');
}

// --- LYRICS & SETTINGS ---

function toggleLyrics() {
    const container = document.getElementById('lyricsContainer');
    if (container.style.display === 'block') {
        closeLyrics();
    } else {
        openLyrics();
    }
}

function closeLyrics() {
    document.getElementById('lyricsContainer').style.display = 'none';
}

async function openLyrics() {
    if (!selectedGuildId) return alert("Select a server first!");
    
    const container = document.getElementById('lyricsContainer');
    const textElem = document.getElementById('lyricsText');
    const titleElem = document.getElementById('lyricsTitle');
    
    container.style.display = 'block';
    textElem.textContent = "Fetching lyrics...";
    
    try {
        const res = await fetch(`${API_BASE_URL}/music/lyrics?guild_id=${selectedGuildId}`);
        const data = await res.json();
        
        if (data.error) {
            textElem.textContent = "Error: " + data.error;
        } else {
            titleElem.textContent = data.title ? `Lyrics: ${data.title} - ${data.artist}` : "Lyrics";
            textElem.textContent = data.lyrics;
        }
    } catch (e) {
        textElem.textContent = "Failed to load lyrics.";
    }
}

async function loadServerSettings() {
    if (!selectedGuildId) {
        document.getElementById('settingsTitle').textContent = "Select a Server to Configure";
        document.getElementById('configForm').style.display = 'none';
        return;
    }
    
    const guild = userGuildsCache.find(g => g.id === selectedGuildId);
    if (guild) document.getElementById('settingsTitle').textContent = `Configuring: ${guild.name}`;
    document.getElementById('configForm').style.display = 'block';

    try {
        const channelRes = await fetch(`${API_BASE_URL}/channels/${selectedGuildId}`);
        const channelData = await channelRes.json();
        
        const channelSelect = document.getElementById('welcomeChannelInput');
        channelSelect.innerHTML = '<option value="">None / Disabled</option>';
        
        if (channelData.channels) {
            channelData.channels.forEach(ch => {
                const opt = document.createElement('option');
                opt.value = ch.id;
                opt.textContent = `#${ch.name}`;
                channelSelect.appendChild(opt);
            });
        }

        const res = await fetch(`${API_BASE_URL}/settings/${selectedGuildId}`);
        const data = await res.json();
        
        document.getElementById('prefixInput').value = data.prefix || "!";
        
        if (data.welcome_channel) {
            channelSelect.value = data.welcome_channel;
        } else {
            channelSelect.value = "";
        }
        
        document.getElementById('modLeveling').checked = data.modules.leveling;
        document.getElementById('modEconomy').checked = data.modules.economy;
        document.getElementById('modModeration').checked = data.modules.moderation;
        
    } catch (e) {
        console.error("Failed to load settings", e);
    }
}

async function saveServerSettings() {
    if (!selectedGuildId) return;
    
    const payload = {
        prefix: document.getElementById('prefixInput').value,
        welcome_channel: document.getElementById('welcomeChannelInput').value,
        modules: {
            leveling: document.getElementById('modLeveling').checked,
            economy: document.getElementById('modEconomy').checked,
            moderation: document.getElementById('modModeration').checked
        }
    };
    
    try {
        const res = await fetch(`${API_BASE_URL}/settings/${selectedGuildId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        if (res.ok) alert("Settings saved!");
        else alert("Failed to save settings.");
        
    } catch (e) {
        alert("Error saving settings.");
    }
}

// --- API INTERACTIONS ---

async function fetchStats() {
    try {
        const response = await fetch(`${API_BASE_URL}/stats`);
        const data = await response.json();
        
        document.getElementById('serverCount').textContent = data.servers;
        document.getElementById('userCount').textContent = data.users;
        document.getElementById('pingCount').textContent = `${data.latency}ms`;
        document.getElementById('shardCount').textContent = data.shards;
        
        // New Stats
        const uptimeElem = document.getElementById('uptimeCount');
        if (uptimeElem) {
             const hours = Math.floor(data.uptime / 3600);
             const mins = Math.floor((data.uptime % 3600) / 60);
             uptimeElem.textContent = `${hours}h ${mins}m`;
        }
        
        const cpuElem = document.getElementById('cpuUsage');
        if (cpuElem) cpuElem.textContent = `${data.cpu}%`;
        
        const ramElem = document.getElementById('ramUsage');
        if (ramElem) ramElem.textContent = `${data.ram_percent}% (${data.ram_used} MB)`;

        document.querySelector('.status-dot').style.backgroundColor = '#4ade80';
        document.getElementById('botStatus').textContent = 'System Online';
    } catch (error) {
        document.querySelector('.status-dot').style.backgroundColor = '#ef4444';
        document.getElementById('botStatus').textContent = 'System Offline';
    }
}

async function updateMusicState() {
    if (!selectedGuildId) return;

    try {
        const response = await fetch(`${API_BASE_URL}/music/state/${selectedGuildId}`);
        const data = await response.json();

        // Update Now Playing
        if (data.current) {
            document.getElementById('trackTitle').textContent = data.current.title;
            document.getElementById('trackArtist').textContent = data.current.author;
            document.getElementById('albumArt').style.backgroundImage = `url(${data.current.artwork || ''})`;
            document.getElementById('albumArt').innerHTML = data.current.artwork ? '' : '<i class="fa-solid fa-music"></i>';
            document.getElementById('playPauseIcon').className = data.paused ? "fa-solid fa-play" : "fa-solid fa-pause";
            
                        currentTrackDuration = data.current.duration; // ms
            
                        if (currentTrackTitle !== data.current.title && document.getElementById('lyricsContainer').style.display === 'block') {
                            openLyrics();
                        }
            
                        currentTrackTitle = data.current.title;
            
                        if (!isSeeking) {
                            const percent = (data.position / data.current.duration) * 100;
                            document.getElementById('seekBar').value = percent || 0;
                            document.getElementById('currentTime').textContent = formatTime(data.position);
                            document.getElementById('totalTime').textContent = formatTime(data.current.duration);     
                        }
            
                    } else {
                        // Reset
                        document.getElementById('trackTitle').textContent = "No Track Playing";
                        document.getElementById('trackArtist').textContent = "Queue is empty";
                        document.getElementById('albumArt').style.backgroundImage = "none";
                        document.getElementById('albumArt').innerHTML = '<i class="fa-solid fa-music"></i>';
                        document.getElementById('playPauseIcon').className = "fa-solid fa-play";
                        document.getElementById('seekBar').value = 0;
                        document.getElementById('currentTime').textContent = "0:00";
                        document.getElementById('totalTime').textContent = "0:00";
                        currentTrackTitle = ""; 
                        closeLyrics(); 
                    }
            
                    // Update Queue
                    const queueList = document.getElementById('queueList');
                    if (data.queue && data.queue.length > 0) {
                        queueList.innerHTML = data.queue.map((t, i) => `
                            <li>
                                <div style="flex:1;">
                                    <div style="font-weight: 500;">${i+1}. ${t.title}</div>
                                    <div style="font-size:12px; color: #888;">${t.author} • ${formatTime(t.duration)}</div>
                                </div>
                                <div class="queue-actions" style="display:flex; gap:5px;">
                                    <button onclick="musicControl('queue_move_up', ${i})" title="Move Up" style="background:none; border:none; color:#60a5fa; cursor:pointer;"><i class="fa-solid fa-arrow-up"></i></button>
                                    <button onclick="musicControl('queue_move_down', ${i})" title="Move Down" style="background:none; border:none; color:#60a5fa; cursor:pointer;"><i class="fa-solid fa-arrow-down"></i></button>
                                    <button onclick="musicControl('play_now', ${i})" title="Play Now" style="background:none; border:none; color:#4ade80; cursor:pointer;"><i class="fa-solid fa-play"></i></button>
                                    <button onclick="musicControl('queue_remove', ${i})" title="Remove" style="background:none; border:none; color:#ef4444; cursor:pointer;"><i class="fa-solid fa-trash"></i></button>
                                </div>
                            </li>
                        `).join('');
                    } else {
                        queueList.innerHTML = '<li class="empty-queue">Queue is empty</li>';
                    }
            
                    document.getElementById('musicConnection').textContent = "Connected";
                    document.getElementById('musicConnection').style.color = "#4ade80";

    } catch (e) {
        console.error(e);
        document.getElementById('musicConnection').textContent = "Disconnected";
        document.getElementById('musicConnection').style.color = "#ef4444";
    }
}

async function searchMusic() {
    const query = document.getElementById('searchInput').value;
    const resultsDiv = document.getElementById('searchResults');
    resultsDiv.style.display = 'block';
    resultsDiv.innerHTML = '<div style="padding:15px; text-align:center;"><i class="fa-solid fa-spinner fa-spin"></i> Searching...</div>';

    try {
        const res = await fetch(`${API_BASE_URL}/music/search`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: query })
        });
        const data = await res.json();

        if (data.results) {
            resultsDiv.innerHTML = data.results.map(track => `
                <div class="search-result-item" style="padding: 12px; border-bottom: 1px solid var(--border); cursor: pointer; display: flex; align-items: center; gap: 12px;" 
                     onclick="playTrack('${track.uri.replace(/'/g, "\\'")}')">
                    <img src="${track.artwork || ''}" style="width: 44px; height: 44px; border-radius: 6px; background: #222;">
                    <div style="overflow: hidden;">
                        <div style="font-weight: 600; font-size: 14px; white-space: nowrap; text-overflow: ellipsis; overflow: hidden;">${track.title}</div>
                        <div style="font-size: 12px; color: #888;">${track.author} • ${formatTime(track.duration)}</div>
                    </div>
                </div>
            `).join('');
        }
    } catch (e) {
        resultsDiv.innerHTML = '<div style="padding:15px; color:red;">Search failed.</div>';
    }
}

async function playTrack(uri) {
    if (!selectedGuildId) return alert("Select a server first!");
    const resultsDiv = document.getElementById('searchResults');
    if (resultsDiv) resultsDiv.style.display = 'none';
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.value = '';

    await fetch(`${API_BASE_URL}/music/play`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guild_id: selectedGuildId, uri: uri, user_id: userProfile.id })
    });
    setTimeout(updateMusicState, 500);
}

async function musicAction(action) {
    musicControl(action, null);
}

async function musicControl(action, value) {
    if (!selectedGuildId) return;

    await fetch(`${API_BASE_URL}/music/control`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guild_id: selectedGuildId, action: action, value: value })
    });
    setTimeout(updateMusicState, 300);
}

function formatTime(ms) {
    if (!ms) return "0:00";
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
