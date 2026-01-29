# Hi-Fi Music

Archanid features a high-fidelity music engine capable of streaming from multiple sources with advanced audio filters and Last.fm integration.

## Core Commands

### Playing Music
The `/music play` command is the entry point. It supports direct URLs and search queries.

*   **Slash Command:** `/music play query:song name`
*   **Text Command:** `!play song name`

**Supported Sources:**
*   **YouTube** (Search & Direct)
*   **SoundCloud** (Search & Direct)
*   **Bandcamp** (Direct URL)
*   **Spotify** (via Bridge)
*   **Direct Audio Files** (MP3/FLAC/WAV)

### Playback Control
Once music is playing, you can use the interactive buttons on the "Now Playing" embed or these commands:

| Command | Description |
| :--- | :--- |
| `/music pause` | Pauses the current track. |
| `/music resume` | Resumes playback. |
| `/music skip` | Skips to the next song in the queue. |
| `/music stop` | Stops playback, clears the queue, and disconnects the bot. |
| `/music volume` | Adjusts volume (0-100%). Default is 50%. |
| `/music loop` | Cycles between `Off`, `Loop Track`, and `Loop Queue`. |

---

## The Spotify Bridge

Archanid cannot stream directly from Spotify's encrypted servers. Instead, it uses a smart **Bridge System**.

1.  You paste a **Spotify Link** (Track, Album, or Playlist).
2.  Archanid analyzes the metadata (Artist, Title, Duration).
3.  It instantly searches **SoundCloud** and **YouTube** for the highest quality match.
4.  It plays the match seamlessly.

!!! success "Playlists Supported"
    You can paste a Spotify Playlist URL, and Archanid will queue up to 100 songs from it automatically!

---

## Audio Filters

Apply professional-grade DSP filters to change how your music sounds.

**Command:** `/music filter name:<filter>`

| Filter | Description |
| :--- | :--- |
| `nightcore` | Increases pitch and speed (~1.25x). Anime style. |
| `vaporwave` | Decreases pitch and speed (~0.8x). Aesthetic style. |
| `bassboost` | Significantly boosts low frequencies. |
| `8d` | Simulates audio rotating around your head (requires headphones). |
| `normal` | Resets all filters. |

---

## Last.fm Scrobbling

Link your Last.fm account to track what you listen to on Discord.

*   **Login:** `/fm login` (Follow the link to authorize).
*   **Scrobbling:** Once logged in, every song you listen to (for at least 50% of its duration) will be scrobbled to your profile.
*   **Now Playing:** `/fm np` shows what you are listening to with global stats.
*   **Charts:** `/fm chart` shows your top artists/albums grid.

---

## AI Recommendations

Stuck on what to play next? Archanid analyzes your recent listening history (via Last.fm) and uses an algorithm to suggest a song you might like.

**Command:** `/music recommend`
