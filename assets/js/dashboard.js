// CONFIGURATION
// ⚠️ WARNING: If your site is https://canva.xin, this MUST be an https:// URL or browser will block it.
const API_BASE_URL = "https://sisters-hearings-hart-reason.trycloudflare.com/api"; 
const CLIENT_ID = "1329184069426348052"; 

// State
let currentTab = 'overview';
let updateInterval = null;
let userProfile = null;
let selectedGuildId = null;
let accessToken = null;

// DOM Elements
const tabs = document.querySelectorAll('.menu-item');
const tabContents = document.querySelectorAll('.tab-content');

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    // Check for OAuth2 Fragment
    const fragment = new URLSearchParams(window.location.hash.slice(1));
    if (fragment.has('access_token')) {
        accessToken = fragment.get('access_token');
        const tokenType = fragment.get('token_type');
        window.history.replaceState({}, document.title, window.location.pathname);
        fetchUserProfile(tokenType, accessToken);
    }

    // Tab Switching
    tabs.forEach(tab => {
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
            updateMusicState();
        });
    }

    // Search Enter Key
    const searchInput = document.getElementById('searchInput');
    if(searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') searchMusic();
        });
    }

    // Initial Fetch
    fetchStats();
    
    // Start Polling
    updateInterval = setInterval(() => {
        if (currentTab === 'overview') fetchStats();
        if (currentTab === 'music' && selectedGuildId) updateMusicState();
    }, 3000);
});

function switchTab(tabName) {
    // Update Sidebar
    tabs.forEach(t => {
        if (t.getAttribute('data-tab') === tabName) t.classList.add('active');
        else t.classList.remove('active');
    });

    // Update Content
    tabContents.forEach(c => {
        if (c.id === tabName) c.classList.add('active');
        else c.classList.remove('active');
    });

    const pageTitle = document.getElementById('pageTitle');
    if (pageTitle) pageTitle.textContent = tabName.charAt(0).toUpperCase() + tabName.slice(1);
    
    currentTab = tabName;
}

// --- AUTHENTICATION ---

function login() {
    const redirectUri = encodeURIComponent("https://canva.xin/dashboard.html");
    const url = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${redirectUri}&response_type=token&scope=identify%20guilds`;
    window.location.href = url;
}

async function fetchUserProfile(tokenType, token) {
    try {
        const userResp = await fetch('https://discord.com/api/users/@me', {
            headers: { authorization: `${tokenType} ${token}` }
        });
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
        }
        fetchUserGuilds(tokenType, token);
    } catch (e) {
        console.error("Auth Error", e);
    }
}

async function fetchUserGuilds(tokenType, token) {
    try {
        const resp = await fetch('https://discord.com/api/users/@me/guilds', {
            headers: { authorization: `${tokenType} ${token}` }
        });
        const guilds = await resp.json();
        const adminGuilds = guilds.filter(g => (BigInt(g.permissions) & 0x20n) === 0x20n || (BigInt(g.permissions) & 0x8n) === 0x8n);
        
        const select = document.getElementById('serverSelect');
        if (select) {
            select.innerHTML = '<option value="" disabled selected>Select a Server</option>';
            adminGuilds.forEach(g => {
                const opt = document.createElement('option');
                opt.value = g.id;
                opt.textContent = g.name;
                select.appendChild(opt);
            });
        }
    } catch (e) {
        console.error("Guild Fetch Error", e);
    }
}

// --- API ---

async function fetchStats() {
    try {
        const response = await fetch(`${API_BASE_URL}/stats`);
        const data = await response.json();
        
        document.getElementById('serverCount').textContent = data.servers || "0";
        document.getElementById('userCount').textContent = data.users || "0";
        document.getElementById('pingCount').textContent = `${data.latency || 0}ms`;
        document.getElementById('shardCount').textContent = data.shards || "1";
        
        const dot = document.querySelector('.status-dot');
        if (dot) dot.style.backgroundColor = '#4ade80';
        const botStatus = document.getElementById('botStatus');
        if (botStatus) botStatus.textContent = 'System Online';
    } catch (error) {
        const dot = document.querySelector('.status-dot');
        if (dot) dot.style.backgroundColor = '#ef4444';
        const botStatus = document.getElementById('botStatus');
        if (botStatus) botStatus.textContent = 'System Offline (SSL/Mixed Content Blocked?)';
    }
}

async function updateMusicState() {
    if (!selectedGuildId) return;

    try {
        const response = await fetch(`${API_BASE_URL}/music/state/${selectedGuildId}`);
        const data = await response.json();

        if (data.current) {
            document.getElementById('trackTitle').textContent = data.current.title;
            document.getElementById('trackArtist').textContent = data.current.author;
            const albumArt = document.getElementById('albumArt');
            if (albumArt) {
                albumArt.style.backgroundImage = `url(${data.current.artwork || ''})`;
                albumArt.innerHTML = data.current.artwork ? '' : '<i class="fa-solid fa-music"></i>';
            }
            const icon = document.getElementById('playPauseIcon');
            if (icon) icon.className = data.paused ? "fa-solid fa-play" : "fa-solid fa-pause";
        } else {
            document.getElementById('trackTitle').textContent = "No Track Playing";
            document.getElementById('trackArtist').textContent = "Select a song to start";
            const albumArt = document.getElementById('albumArt');
            if (albumArt) {
                albumArt.style.backgroundImage = "none";
                albumArt.innerHTML = '<i class="fa-solid fa-music"></i>';
            }
        }

        const queueList = document.getElementById('queueList');
        if (queueList) {
            if (data.queue && data.queue.length > 0) {
                queueList.innerHTML = data.queue.map((t, i) => `
                    <li>
                        <div style="font-weight: 500;">${i+1}. ${t.title}</div>
                        <div style="font-size:12px; color: #888;">${t.author}</div>
                    </li>
                `).join('');
            } else {
                queueList.innerHTML = '<li class="empty-queue">Queue is empty</li>';
            }
        }

        const musicConn = document.getElementById('musicConnection');
        if (musicConn) {
            musicConn.textContent = "Connected";
            musicConn.style.color = "#4ade80";
        }

    } catch (e) {
        const musicConn = document.getElementById('musicConnection');
        if (musicConn) {
            musicConn.textContent = "Disconnected";
            musicConn.style.color = "#ef4444";
        }
    }
}

async function searchMusic() {
    const input = document.getElementById('searchInput');
    const query = input ? input.value : "";
    if (!query) return;

    const resultsDiv = document.getElementById('searchResults');
    if (!resultsDiv) return;

    resultsDiv.style.display = 'block';
    resultsDiv.innerHTML = '<div style="padding:15px; text-align:center;"><i class="fa-solid fa-spinner fa-spin"></i> Searching...</div>';

    try {
        const res = await fetch(`${API_BASE_URL}/music/search`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: query })
        });
        const data = await res.json();

        if (data.results && data.results.length > 0) {
            resultsDiv.innerHTML = data.results.map(track => `
                <div class="search-result-item" style="padding: 12px; border-bottom: 1px solid var(--border); cursor: pointer; display: flex; align-items: center; gap: 12px;" 
                     onclick="playTrack('${track.uri.replace(/'/g, "\\'")}')">
                    <img src="${track.artwork || ''}" style="width: 44px; height: 44px; border-radius: 6px; background: #222;">
                    <div style="overflow: hidden;">
                        <div style="font-weight: 600; font-size: 14px; white-space: nowrap; text-overflow: ellipsis; overflow: hidden;">${track.title}</div>
                        <div style="font-size: 12px; color: #888;">${track.author}</div>
                    </div>
                </div>
            `).join('');
        } else {
            resultsDiv.innerHTML = '<div style="padding:15px; text-align:center;">No results found.</div>';
        }
    } catch (e) {
        resultsDiv.innerHTML = '<div style="padding:15px; text-align:center; color:#ef4444;">Search failed. SSL/Mixed Content?</div>';
    }
}

async function playTrack(uri) {
    if (!selectedGuildId) return alert("Please select a server first!");
    if (!userProfile) return alert("Please login first!");

    const resultsDiv = document.getElementById('searchResults');
    if (resultsDiv) resultsDiv.style.display = 'none';
    const input = document.getElementById('searchInput');
    if (input) input.value = '';

    try {
        await fetch(`${API_BASE_URL}/music/play`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                guild_id: selectedGuildId,
                uri: uri,
                user_id: userProfile.id
            })
        });
        setTimeout(updateMusicState, 1000);
    } catch (e) {
        alert("Action failed. Check bot console or HTTPS connection.");
    }
}

async function musicAction(action) {
    if (!selectedGuildId) return;

    try {
        await fetch(`${API_BASE_URL}/music/control`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                guild_id: selectedGuildId,
                action: action 
            })
        });
        updateMusicState();
    } catch (e) {
        console.error("Control failed", e);
    }
}
