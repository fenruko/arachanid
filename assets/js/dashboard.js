// CONFIGURATION
const API_BASE_URL = "http://arch.lemonhostfree.tech:25739/api"; 
// REPLACE WITH YOUR ACTUAL CLIENT ID from Discord Developer Portal
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
const searchInput = document.getElementById('searchInput');

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    // Check for OAuth2 Fragment
    const fragment = new URLSearchParams(window.location.hash.slice(1));
    if (fragment.has('access_token')) {
        accessToken = fragment.get('access_token');
        const tokenType = fragment.get('token_type');
        window.history.replaceState({}, document.title, window.location.pathname); // Clean URL
        fetchUserProfile(tokenType, accessToken);
    }

    // Tab Switching
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.tab;
            switchTab(target);
        });
    });

    // Server Selection
    document.getElementById('serverSelect').addEventListener('change', (e) => {
        selectedGuildId = e.target.value;
        updateMusicState();
    });

    // Search Enter Key
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
    }, 2000);
});

function switchTab(tabName) {
    tabs.forEach(t => t.classList.remove('active'));
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    tabContents.forEach(c => c.classList.remove('active'));
    document.getElementById(tabName).classList.add('active');

    document.getElementById('pageTitle').textContent = tabName.charAt(0).toUpperCase() + tabName.slice(1);
    currentTab = tabName;
}

// --- AUTHENTICATION ---

function login() {
    const redirectUri = encodeURIComponent(window.location.origin + window.location.pathname);
    // Scopes: identify (for profile), guilds (to list servers)
    const url = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${redirectUri}&response_type=token&scope=identify%20guilds`;
    window.location.href = url;
}

async function fetchUserProfile(tokenType, token) {
    try {
        // Get User
        const userResp = await fetch('https://discord.com/api/users/@me', {
            headers: { authorization: `${tokenType} ${token}` }
        });
        const user = await userResp.json();
        userProfile = user;

        // Update UI
        const profileHTML = `
            <div style="display:flex; align-items:center; gap:10px;">
                <img src="https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png" style="width:32px; height:32px; border-radius:50%;">
                <span>${user.username}</span>
            </div>
        `;
        document.getElementById('userProfile').innerHTML = profileHTML;

        // Get Guilds
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
        
        // Filter for guilds where user has Manage Server (0x20) or Administrator (0x8)
        // Simple check: permissions & 0x20 === 0x20
        const adminGuilds = guilds.filter(g => (BigInt(g.permissions) & 0x20n) === 0x20n);
        
        const select = document.getElementById('serverSelect');
        select.innerHTML = '<option value="" disabled selected>Select a Server</option>';
        
        adminGuilds.forEach(g => {
            const opt = document.createElement('option');
            opt.value = g.id;
            opt.textContent = g.name;
            select.appendChild(opt);
        });

    } catch (e) {
        console.error("Guild Fetch Error", e);
    }
}

// --- API INTERACTIONS ---

async function fetchStats() {
    try {
        const response = await fetch(`${API_BASE_URL}/stats`);
        if (!response.ok) throw new Error('Network error');
        const data = await response.json();
        
        document.getElementById('serverCount').textContent = data.servers.toLocaleString();
        document.getElementById('userCount').textContent = data.users.toLocaleString();
        document.getElementById('pingCount').textContent = `${data.latency}ms`;
        document.getElementById('shardCount').textContent = data.shards;
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
            
            // Progress Bar (Simple estimation)
            // Ideally backend returns current position, but for now we just show it's active
            document.getElementById('playPauseIcon').className = data.paused ? "fa-solid fa-play" : "fa-solid fa-pause";
        } else {
            document.getElementById('trackTitle').textContent = "No Track Playing";
            document.getElementById('trackArtist').textContent = "Queue is empty";
            document.getElementById('albumArt').style.backgroundImage = "none";
            document.getElementById('playPauseIcon').className = "fa-solid fa-play";
        }

        // Update Queue
        const queueList = document.getElementById('queueList');
        if (data.queue && data.queue.length > 0) {
            queueList.innerHTML = data.queue.map((t, i) => `
                <li>
                    <span>${i+1}. ${t.title}</span>
                    <span style="font-size:12px; color:#666;">${t.author}</span>
                </li>
            `).join('');
        } else {
            queueList.innerHTML = '<li class="empty-queue">Queue is empty</li>';
        }

        document.getElementById('musicConnection').textContent = "Connected";
        document.getElementById('musicConnection').style.color = "#4ade80";

    } catch (e) {
        document.getElementById('musicConnection').textContent = "Disconnected";
        document.getElementById('musicConnection').style.color = "#ef4444";
    }
}

async function searchMusic() {
    const query = document.getElementById('searchInput').value;
    if (!query) return;

    const resultsDiv = document.getElementById('searchResults');
    resultsDiv.style.display = 'block';
    resultsDiv.innerHTML = '<div style="padding:10px;">Searching...</div>';

    try {
        const res = await fetch(`${API_BASE_URL}/music/search`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: query })
        });
        const data = await res.json();

        if (data.results) {
            resultsDiv.innerHTML = data.results.map(track => `
                <div style="padding: 10px; border-bottom: 1px solid #333; cursor: pointer; display: flex; align-items: center; gap: 10px;" 
                     onclick="playTrack('${track.uri.replace(/'/g, "\\'")}')">
                    <img src="${track.artwork || ''}" style="width: 40px; height: 40px; border-radius: 4px;">
                    <div>
                        <div style="font-weight: bold; font-size: 14px;">${track.title}</div>
                        <div style="font-size: 12px; color: #aaa;">${track.author}</div>
                    </div>
                </div>
            `).join('');
        } else {
            resultsDiv.innerHTML = '<div style="padding:10px;">No results found.</div>';
        }

    } catch (e) {
        resultsDiv.innerHTML = '<div style="padding:10px; color:red;">Search failed.</div>';
    }
}

async function playTrack(uri) {
    if (!selectedGuildId) return alert("Please select a server first!");
    if (!userProfile) return alert("Please login first!");

    document.getElementById('searchResults').style.display = 'none';
    document.getElementById('searchInput').value = '';

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
        updateMusicState();
    } catch (e) {
        alert("Failed to play track. Make sure you are in a voice channel.");
    }
}

async function musicAction(action) {
    if (!selectedGuildId) return;

    await fetch(`${API_BASE_URL}/music/control`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            guild_id: selectedGuildId,
            action: action 
        })
    });
    updateMusicState();
}
