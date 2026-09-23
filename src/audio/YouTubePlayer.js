/**
 * 📺 YouTube In-Car Infotainment & Audio Player
 *
 * Provides real-time YouTube music streaming inside the cockpit tablet and
 * persists audio seamlessly during high-speed highway driving.
 */

import { gameState } from '../state.js';

export const CURATED_ROAD_TRACKS = [
  // 🌴 Synthwave & Outrun
  {
    id: 'MV_3Dpw-BRY',
    title: 'Nightcall',
    artist: 'Kavinsky',
    genre: 'synthwave',
    duration: '4:19',
    tag: '🌴 Outrun Classic',
    thumbnail: 'https://i.ytimg.com/vi/MV_3Dpw-BRY/hqdefault.jpg'
  },
  {
    id: 'URma_gu1aNE',
    title: 'Sunset',
    artist: 'The Midnight',
    genre: 'synthwave',
    duration: '5:26',
    tag: '🌴 80s Highway',
    thumbnail: 'https://i.ytimg.com/vi/URma_gu1aNE/hqdefault.jpg'
  },
  {
    id: '8GW6sLrK40k',
    title: 'Resonance',
    artist: 'HOME',
    genre: 'synthwave',
    duration: '3:32',
    tag: '🌴 Nostalgic Dream',
    thumbnail: 'https://i.ytimg.com/vi/8GW6sLrK40k/hqdefault.jpg'
  },
  {
    id: 'TvZskcqdYcE',
    title: 'Running in the Night',
    artist: 'FM-84 ft. Ollie Wride',
    genre: 'synthwave',
    duration: '4:30',
    tag: '🌴 Pacific Coast',
    thumbnail: 'https://i.ytimg.com/vi/TvZskcqdYcE/hqdefault.jpg'
  },
  {
    id: 'UiSB2Fbw9gs',
    title: 'Days of Thunder',
    artist: 'The Midnight',
    genre: 'synthwave',
    duration: '5:28',
    tag: '🌴 Synth Sax Anthem',
    thumbnail: 'https://i.ytimg.com/vi/UiSB2Fbw9gs/hqdefault.jpg'
  },
  {
    id: 'IGqeyQhBPMI',
    title: 'Future Club',
    artist: 'Perturbator',
    genre: 'synthwave',
    duration: '4:49',
    tag: '🌴 Dystopian Pulse',
    thumbnail: 'https://i.ytimg.com/vi/IGqeyQhBPMI/hqdefault.jpg'
  },
  {
    id: '-5FKNViujeM',
    title: 'Pacific Coast Highway',
    artist: 'Kavinsky',
    genre: 'synthwave',
    duration: '3:57',
    tag: '🌴 Highway 1 Anthem',
    thumbnail: 'https://i.ytimg.com/vi/-5FKNViujeM/hqdefault.jpg'
  },

  // 🎸 Classic Desert & Highway Rock
  {
    id: '09839DpTctU',
    title: 'Hotel California',
    artist: 'Eagles',
    genre: 'rock',
    duration: '6:30',
    tag: '🎸 SoCal Legend',
    thumbnail: 'https://i.ytimg.com/vi/09839DpTctU/hqdefault.jpg'
  },
  {
    id: 'CqnU_sJ8V-E',
    title: 'Free Bird',
    artist: 'Lynyrd Skynyrd',
    genre: 'rock',
    duration: '9:08',
    tag: '🎸 Highway Solo',
    thumbnail: 'https://i.ytimg.com/vi/CqnU_sJ8V-E/hqdefault.jpg'
  },
  {
    id: 'ec0XKhAHR5I',
    title: 'Fortunate Son',
    artist: 'Creedence Clearwater Revival',
    genre: 'rock',
    duration: '2:21',
    tag: '🎸 Americana Classic',
    thumbnail: 'https://i.ytimg.com/vi/ec0XKhAHR5I/hqdefault.jpg'
  },
  {
    id: 'rMbATaj7Il8',
    title: 'Born to Be Wild',
    artist: 'Steppenwolf',
    genre: 'rock',
    duration: '3:30',
    tag: '🎸 Heavy Metal Thunder',
    thumbnail: 'https://i.ytimg.com/vi/rMbATaj7Il8/hqdefault.jpg'
  },
  {
    id: 'Y1D3a5eDJIs',
    title: 'Runnin\' Down a Dream',
    artist: 'Tom Petty',
    genre: 'rock',
    duration: '4:23',
    tag: '🎸 Desert Highway',
    thumbnail: 'https://i.ytimg.com/vi/Y1D3a5eDJIs/hqdefault.jpg'
  },
  {
    id: 'aRlSHG5hRY4',
    title: 'Radar Love',
    artist: 'Golden Earring',
    genre: 'rock',
    duration: '6:25',
    tag: '🎸 Midnight Driving',
    thumbnail: 'https://i.ytimg.com/vi/aRlSHG5hRY4/hqdefault.jpg'
  },
  {
    id: 'UAKCR7kQMTQ',
    title: 'Highway Star',
    artist: 'Deep Purple',
    genre: 'rock',
    duration: '6:06',
    tag: '🎸 V8 Speed',
    thumbnail: 'https://i.ytimg.com/vi/UAKCR7kQMTQ/hqdefault.jpg'
  },

  // 🏎️ Eurobeat, Phonk & Drift
  {
    id: 'BJ0xBCwkg3E',
    title: 'Running in the 90s',
    artist: 'Maurizio De Jorio (Initial D)',
    genre: 'eurobeat',
    duration: '4:52',
    tag: '🏎️ Touge Drift',
    thumbnail: 'https://i.ytimg.com/vi/BJ0xBCwkg3E/hqdefault.jpg'
  },
  {
    id: 'dv13gl0a-FA',
    title: 'Deja Vu',
    artist: 'Dave Rodgers (Initial D)',
    genre: 'eurobeat',
    duration: '4:24',
    tag: '🏎️ Multi-Track Drift',
    thumbnail: 'https://i.ytimg.com/vi/dv13gl0a-FA/hqdefault.jpg'
  },
  {
    id: 'w-sQRS-Lc9k',
    title: 'Murder In My Mind',
    artist: 'Kordhell',
    genre: 'eurobeat',
    duration: '2:25',
    tag: '🏎️ Drift Phonk',
    thumbnail: 'https://i.ytimg.com/vi/w-sQRS-Lc9k/hqdefault.jpg'
  },
  {
    id: 'pIZ0QRWK0zg',
    title: 'Sahara',
    artist: 'Hensonn',
    genre: 'eurobeat',
    duration: '2:51',
    tag: '🏎️ Aggressive Phonk',
    thumbnail: 'https://i.ytimg.com/vi/pIZ0QRWK0zg/hqdefault.jpg'
  },
  {
    id: 'Hh5jEQraXaw',
    title: 'Why Not',
    artist: 'Ghostface Playa',
    genre: 'eurobeat',
    duration: '2:48',
    tag: '🏎️ Cowbell Drift',
    thumbnail: 'https://i.ytimg.com/vi/Hh5jEQraXaw/hqdefault.jpg'
  },

  // ☕ Lo-Fi & Chillout Cruiser
  {
    id: '5qap5aO4i9A',
    title: 'Lofi Hip Hop Radio 24/7',
    artist: 'Lofi Girl',
    genre: 'chillhop',
    duration: 'LIVE',
    tag: '☕ Chill Beats to Relax',
    thumbnail: 'https://i.ytimg.com/vi/5qap5aO4i9A/hqdefault.jpg'
  },
  {
    id: '4xDzrJKXOOY',
    title: 'Synthwave Radio 24/7 - Chill Beats',
    artist: 'Lofi Girl',
    genre: 'chillhop',
    duration: 'LIVE',
    tag: '☕ Sunset Chills',
    thumbnail: 'https://i.ytimg.com/vi/4xDzrJKXOOY/hqdefault.jpg'
  },
  {
    id: 'TURbeWK2wwg',
    title: 'Late Night Highway Lofi',
    artist: 'Chillhop Music',
    genre: 'chillhop',
    duration: '3:15',
    tag: '☕ Ocean Breeze',
    thumbnail: 'https://i.ytimg.com/vi/TURbeWK2wwg/hqdefault.jpg'
  },

  // ⚡ Cyberpunk & Electronic
  {
    id: 'er416Ad3R1g',
    title: 'Turbo Killer',
    artist: 'Carpenter Brut',
    genre: 'cyberpunk',
    duration: '3:28',
    tag: '⚡ High Octane',
    thumbnail: 'https://i.ytimg.com/vi/er416Ad3R1g/hqdefault.jpg'
  },
  {
    id: 'zhl-Cs1-sG4',
    title: 'Giorgio by Moroder',
    artist: 'Daft Punk',
    genre: 'cyberpunk',
    duration: '9:05',
    tag: '⚡ Synthesizer Legend',
    thumbnail: 'https://i.ytimg.com/vi/zhl-Cs1-sG4/hqdefault.jpg'
  },
  {
    id: 'sy1dYFGkPUE',
    title: 'D.A.N.C.E. / Genesis',
    artist: 'Justice',
    genre: 'cyberpunk',
    duration: '4:00',
    tag: '⚡ French Electro',
    thumbnail: 'https://i.ytimg.com/vi/sy1dYFGkPUE/hqdefault.jpg'
  },

  // 📻 90s West Coast Hip-Hop
  {
    id: '_CL6n0FJZpk',
    title: 'Still D.R.E.',
    artist: 'Dr. Dre ft. Snoop Dogg',
    genre: 'westcoast',
    duration: '4:51',
    tag: '📻 West Coast Anthem',
    thumbnail: 'https://i.ytimg.com/vi/_CL6n0FJZpk/hqdefault.jpg'
  },
  {
    id: 'omfz62qu_Bc',
    title: 'California Love',
    artist: '2Pac ft. Dr. Dre',
    genre: 'westcoast',
    duration: '4:45',
    tag: '📻 California Legend',
    thumbnail: 'https://i.ytimg.com/vi/omfz62qu_Bc/hqdefault.jpg'
  },
  {
    id: 'h4UqMyldS7Q',
    title: 'It Was a Good Day',
    artist: 'Ice Cube',
    genre: 'westcoast',
    duration: '4:20',
    tag: '📻 90s Lowrider Cruise',
    thumbnail: 'https://i.ytimg.com/vi/h4UqMyldS7Q/hqdefault.jpg'
  }
];

/**
 * Extracts a valid 11-character YouTube video ID from various URL formats,
 * or returns null if not a direct video URL.
 */
export function extractYouTubeVideoId(input) {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();

  // Direct 11-char alphanumeric ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // youtube.com, youtu.be, music.youtube.com
  const match = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|music\.youtube\.com\/watch\?v=))([a-zA-Z0-9_-]{11})/i);
  return match ? match[1] : null;
}

/**
 * Fetches real-time YouTube search suggestions using JSONP against suggestqueries.google.com
 * (bypasses CORS restrictions seamlessly from any browser origin).
 */
export function fetchYouTubeSuggestions(query) {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      resolve([]);
      return;
    }
    const clean = query.trim();
    if (!clean) {
      resolve([]);
      return;
    }

    const callbackName = 'yt_suggest_' + Math.random().toString(36).substring(2, 9);
    const script = document.createElement('script');

    let resolved = false;
    const finish = (results) => {
      if (resolved) return;
      resolved = true;
      resolve(results || []);
      // Retain a safe no-op callback so any delayed script execution never throws ReferenceError
      try {
        window[callbackName] = () => {};
        setTimeout(() => {
          try { delete window[callbackName]; } catch (e) {}
        }, 30000);
      } catch (e) {}
      if (script.parentNode) {
        try { script.parentNode.removeChild(script); } catch (e) {}
      }
    };

    const timer = setTimeout(() => {
      finish([]);
    }, 2500);

    window[callbackName] = (data) => {
      clearTimeout(timer);
      if (data && Array.isArray(data[1])) {
        const suggestions = data[1].map(item => Array.isArray(item) ? item[0] : item).filter(Boolean);
        finish(suggestions);
      } else {
        finish([]);
      }
    };

    script.src = `https://suggestqueries.google.com/complete/search?client=youtube&ds=yt&q=${encodeURIComponent(clean)}&jsonp=${callbackName}`;
    script.onerror = () => {
      clearTimeout(timer);
      finish([]);
    };
    document.head.appendChild(script);
  });
}

/**
 * Fetches official video title and author from YouTube's CORS-enabled oEmbed endpoint.
 */
export async function fetchYouTubeDetails(videoId) {
  if (!videoId) return null;
  try {
    const res = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
    if (res.ok) {
      const data = await res.json();
      return {
        id: videoId,
        title: data.title || `YouTube Video (${videoId})`,
        artist: data.author_name || 'YouTube',
        thumbnail: data.thumbnail_url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        genre: 'youtube',
        duration: '--:--',
        tag: '📺 Direct Video'
      };
    }
  } catch (e) {}
  return {
    id: videoId,
    title: `YouTube Video (${videoId})`,
    artist: 'YouTube',
    thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    genre: 'youtube',
    duration: '--:--',
    tag: '📺 Direct Video'
  };
}

/**
 * Real-time online YouTube video search. Queries public search instances with CORS support.
 * Returns an array of video items with authentic YouTube video IDs and real video thumbnails.
 */
export async function searchYouTubeOnline(query) {
  if (!query || typeof query !== 'string') return [];
  const clean = query.trim();
  if (!clean) return [];

  const endpoints = [
    `https://api.piped.private.coffee/search?filter=videos&q=${encodeURIComponent(clean)}`
  ];

  for (const ep of endpoints) {
    try {
      const res = await fetch(ep, { signal: AbortSignal.timeout(4000) });
      if (res.ok) {
        const data = await res.json();
        const items = data.items || data;
        if (Array.isArray(items) && items.length > 0) {
          const results = [];
          for (const item of items) {
            const vidId = extractYouTubeVideoId(item.url) || (item.url ? item.url.replace('/watch?v=', '') : null);
            if (vidId && /^[a-zA-Z0-9_-]{11}$/.test(vidId)) {
              let durationStr = '--:--';
              if (typeof item.duration === 'number' && item.duration > 0) {
                const mins = Math.floor(item.duration / 60);
                const secs = Math.floor(item.duration % 60);
                durationStr = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
              } else if (typeof item.duration === 'string') {
                durationStr = item.duration;
              }

              results.push({
                id: vidId,
                title: item.title || `YouTube Video (${vidId})`,
                artist: item.uploaderName || 'YouTube',
                thumbnail: `https://i.ytimg.com/vi/${vidId}/hqdefault.jpg`,
                genre: 'search',
                duration: durationStr,
                tag: '🔴 YouTube'
              });
            }
          }
          if (results.length > 0) return results;
        }
      }
    } catch (e) {}
  }
  return [];
}

export class YouTubePlayerManager {
  constructor() {
    this.container = null;
    this.iframe = null;
    this.ytPlayer = null;
    this.isApiLoaded = false;
    this.isReady = false;
    this.currentTrack = null;
    this.recentHistory = [];
    this.activeFilter = 'all';
    this.onStateChangeCallbacks = new Set();
    
    // Default initial track
    this.currentTrack = CURATED_ROAD_TRACKS[0];
  }

  /**
   * Initializes the persistent YouTube host in the DOM.
   * Runs safely in browser environments and headlessly in Node.js.
   */
  init() {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    // Load recent history from localStorage if available
    try {
      const saved = localStorage.getItem('dreamstate_yt_recent');
      if (saved) {
        this.recentHistory = JSON.parse(saved);
      }
    } catch (e) {}

    // Create or locate the persistent container
    let host = document.getElementById('youtube-persistent-container');
    if (!host) {
      host = document.createElement('div');
      host.id = 'youtube-persistent-container';
      host.className = 'yt-driving-mode';
      document.body.appendChild(host);
    }
    this.container = host;

    // Check if YouTube IFrame API is already loaded or inject it
    if (window.YT && window.YT.Player) {
      this.isApiLoaded = true;
      this._mountPlayer();
    } else {
      const existingScript = document.querySelector('script[src*="youtube.com/iframe_api"]');
      if (!existingScript) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(tag);
      }

      const prevReady = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (typeof prevReady === 'function') prevReady();
        this.isApiLoaded = true;
        this._mountPlayer();
      };

      // Fallback: If API takes longer than 2.5s or is blocked, mount standard iframe
      setTimeout(() => {
        if (!this.isReady && !this.iframe) {
          this._mountFallbackIframe();
        }
      }, 2500);
    }
  }

  _mountPlayer() {
    if (typeof window === 'undefined' || !this.container) return;
    if (this.isReady) return;

    try {
      const initialId = (gameState.youtubeApp && gameState.youtubeApp.currentVideoId) || 'MV_3Dpw-BRY';
      const origin = encodeURIComponent(window.location.origin);
      const widgetReferrer = encodeURIComponent(window.location.href);

      // Pre-create iframe with strict-origin-when-cross-origin referrerpolicy and nocookie domain
      this.container.innerHTML = '';
      const iframe = document.createElement('iframe');
      iframe.id = 'youtube-iframe-mount';
      iframe.width = '100%';
      iframe.height = '100%';
      iframe.src = `https://www.youtube-nocookie.com/embed/${initialId}?enablejsapi=1&autoplay=0&controls=1&modestbranding=1&rel=0&fs=0&playsinline=1&origin=${origin}&widget_referrer=${widgetReferrer}`;
      iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
      iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');
      iframe.setAttribute('allowfullscreen', 'true');
      iframe.style.border = 'none';

      this.container.appendChild(iframe);
      this.iframe = iframe;

      if (window.YT && window.YT.Player) {
        this.ytPlayer = new window.YT.Player('youtube-iframe-mount', {
          host: 'https://www.youtube-nocookie.com',
          events: {
            onReady: (event) => {
              this.isReady = true;
              this.iframe = event.target.getIframe() || iframe;
              if (this.iframe) {
                this.iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
                this.iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');
              }
              this._notifyStateChange();
            },
            onStateChange: (event) => {
              // YT.PlayerState.PLAYING === 1, PAUSED === 2, ENDED === 0
              if (event.data === 1) {
                gameState.youtubeApp.isPlaying = true;
              } else if (event.data === 2 || event.data === 0) {
                gameState.youtubeApp.isPlaying = false;
              }
              this._notifyStateChange();
            },
            onError: (event) => {
              const code = event.data;
              this._handlePlaybackError(code);
            }
          }
        });
      } else {
        this.isReady = true;
        this._notifyStateChange();
      }
    } catch (err) {
      this._mountFallbackIframe();
    }
  }

  _handlePlaybackError(code) {
    const blockedId = this._pendingVideoId || (gameState.youtubeApp && gameState.youtubeApp.currentVideoId);
    if (blockedId) {
      this._embeddingBlocked = this._embeddingBlocked || new Set();
      this._embeddingBlocked.add(blockedId);
    }
    this._pendingVideoId = null;

    // 100 = not found/private, 101/150/153 = embedding disabled or player configuration error
    if (code === 100 || code === 101 || code === 150 || code === 153) {
      // Find the next unblocked curated track
      const nextTrack = CURATED_ROAD_TRACKS.find(t =>
        t.id && t.id !== blockedId && (!this._embeddingBlocked || !this._embeddingBlocked.has(t.id))
      );
      if (nextTrack) {
        try {
          if (this.ytPlayer && typeof this.ytPlayer.loadVideoById === 'function') {
            this.ytPlayer.loadVideoById({ videoId: nextTrack.id, startSeconds: 0 });
            gameState.youtubeApp.currentVideoId = nextTrack.id;
            gameState.youtubeApp.currentTitle = nextTrack.title;
            gameState.youtubeApp.currentArtist = nextTrack.artist;
            gameState.youtubeApp.currentThumbnail = nextTrack.thumbnail;
            gameState.youtubeApp.isPlaying = true;
            this._notifyStateChange();
          } else {
            this.playTrack(nextTrack);
          }
        } catch (e) {
          this.playTrack(nextTrack);
        }
      }
    }
    // For error 5 (HTML5 player error), fall back to direct iframe
    if (code === 5 || (!code && !this.isReady)) {
      if (!this.iframe) this._mountFallbackIframe();
    }
  }

  _mountFallbackIframe() {
    if (typeof window === 'undefined' || !this.container) return;
    if (this.iframe) return;

    const initialId = (gameState.youtubeApp && gameState.youtubeApp.currentVideoId) || 'MV_3Dpw-BRY';
    const origin = encodeURIComponent(window.location.origin);
    const widgetReferrer = encodeURIComponent(window.location.href);
    const iframe = document.createElement('iframe');
    iframe.id = 'youtube-iframe-mount';
    iframe.width = '100%';
    iframe.height = '100%';
    iframe.src = `https://www.youtube-nocookie.com/embed/${initialId}?enablejsapi=1&autoplay=0&controls=1&modestbranding=1&rel=0&fs=0&playsinline=1&origin=${origin}&widget_referrer=${widgetReferrer}`;
    iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');
    iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
    iframe.setAttribute('allowfullscreen', 'true');
    iframe.style.border = 'none';

    this.container.innerHTML = '';
    this.container.appendChild(iframe);
    this.iframe = iframe;
    this.isReady = true;
    this._notifyStateChange();
  }

  /**
   * Play a track by object or video ID.
   */
  playTrack(trackOrId) {
    let track = null;
    if (typeof trackOrId === 'string') {
      const vidId = extractYouTubeVideoId(trackOrId) || trackOrId;
      track = CURATED_ROAD_TRACKS.find(t => t.id === vidId) || {
        id: vidId,
        title: `YouTube Video (${vidId})`,
        artist: 'YouTube Stream',
        genre: 'custom',
        duration: '--:--',
        tag: '📺 Direct Video',
        thumbnail: `https://i.ytimg.com/vi/${vidId}/hqdefault.jpg`
      };
    } else if (trackOrId && typeof trackOrId === 'object') {
      track = trackOrId;
    }

    if (!track) return;

    if (!track.id && track.searchQuery) {
      this.searchAndPlay(track.searchQuery);
      return;
    }

    this.currentTrack = track;
    gameState.youtubeApp.isPlaying = true;
    gameState.youtubeApp.currentVideoId = track.id;
    gameState.youtubeApp.currentTitle = track.title;
    gameState.youtubeApp.currentArtist = track.artist;
    gameState.youtubeApp.currentThumbnail = track.thumbnail || `https://i.ytimg.com/vi/${track.id}/hqdefault.jpg`;
    gameState.youtubeApp.isSearchQuery = false;
    gameState.youtubeApp.searchQuery = '';

    this._recordHistory(track);

    // Register this video ID as pending load so we can detect error 153 for it
    this._pendingVideoId = track.id;

    if (this.ytPlayer && typeof this.ytPlayer.loadVideoById === 'function') {
      try {
        this.ytPlayer.loadVideoById({
          videoId: track.id,
          startSeconds: 0
        });
        if (gameState.youtubeApp.isMuted && typeof this.ytPlayer.mute === 'function') {
          this.ytPlayer.mute();
        } else if (typeof this.ytPlayer.unMute === 'function') {
          this.ytPlayer.unMute();
        }
        if (typeof this.ytPlayer.playVideo === 'function') {
          this.ytPlayer.playVideo();
        }
      } catch (e) {
        this._updateIframeSrc(track.id);
      }
    } else {
      this._updateIframeSrc(track.id);
    }

    this._notifyStateChange();
  }

  /**
   * Performs an intelligent search across the catalog and real-time online YouTube search.
   * Directly resolves and plays the genuine YouTube video with audio.
   */
  async searchAndPlay(query) {
    if (!query || typeof query !== 'string') return;
    const cleanQuery = query.trim();
    if (!cleanQuery) return;

    // 1. Direct YouTube URL or 11-char ID
    const extractedId = extractYouTubeVideoId(cleanQuery);
    if (extractedId) {
      this.playTrack(extractedId);
      return;
    }

    // 2. Exact match in curated catalog
    const matches = this.filterCatalog(cleanQuery);
    if (matches.length > 0 && (
      matches[0].title.toLowerCase() === cleanQuery.toLowerCase() ||
      matches[0].artist.toLowerCase() === cleanQuery.toLowerCase()
    )) {
      this.playTrack(matches[0]);
      return;
    }

    // 3. Online search to find the authentic top YouTube video and stream it
    try {
      const onlineResults = await searchYouTubeOnline(cleanQuery);
      if (onlineResults && onlineResults.length > 0) {
        this.playTrack(onlineResults[0]);
        return;
      }
    } catch (e) {}

    // 4. If catalog has partial match, play top catalog match
    if (matches.length > 0) {
      this.playTrack(matches[0]);
      return;
    }

    // 5. Fallback: play default curated track with query title
    this.playTrack({
      id: 'MV_3Dpw-BRY',
      title: cleanQuery,
      artist: 'YouTube Audio',
      genre: 'search',
      duration: 'Stream',
      tag: '🔴 YouTube',
      thumbnail: 'https://i.ytimg.com/vi/MV_3Dpw-BRY/hqdefault.jpg'
    });
  }

  _updateIframeSrc(videoId) {
    if (typeof window === 'undefined') return;
    const origin = encodeURIComponent(window.location.origin);
    const widgetReferrer = encodeURIComponent(window.location.href);
    const src = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&enablejsapi=1&controls=1&modestbranding=1&rel=0&fs=0&playsinline=1&origin=${origin}&widget_referrer=${widgetReferrer}`;
    if (this.iframe) {
      this.iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
      this.iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');
      this.iframe.src = src;
    } else if (this.container) {
      this.container.innerHTML = `<iframe id="youtube-iframe-mount" width="100%" height="100%" src="${src}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen style="border:none;"></iframe>`;
      this.iframe = this.container.querySelector('iframe');
      this.isReady = true;
    }
  }

  pause() {
    gameState.youtubeApp.isPlaying = false;
    if (this.ytPlayer && typeof this.ytPlayer.pauseVideo === 'function') {
      try {
        this.ytPlayer.pauseVideo();
      } catch (e) {}
    } else if (this.iframe && this.iframe.contentWindow) {
      try {
        this.iframe.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
      } catch (e) {}
    }
    this._notifyStateChange();
  }

  resume() {
    gameState.youtubeApp.isPlaying = true;
    if (this.ytPlayer && typeof this.ytPlayer.playVideo === 'function') {
      try {
        this.ytPlayer.playVideo();
      } catch (e) {}
    } else if (this.iframe && this.iframe.contentWindow) {
      try {
        this.iframe.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
      } catch (e) {}
    }
    this._notifyStateChange();
  }

  togglePlay() {
    if (gameState.youtubeApp.isPlaying) {
      this.pause();
    } else {
      this.resume();
    }
  }

  setVolume(val) {
    const clamped = Math.max(0, Math.min(100, Math.round(val)));
    gameState.youtubeApp.volume = clamped;
    if (this.ytPlayer && typeof this.ytPlayer.setVolume === 'function') {
      try {
        this.ytPlayer.setVolume(clamped);
      } catch (e) {}
    } else if (this.iframe && this.iframe.contentWindow) {
      try {
        this.iframe.contentWindow.postMessage(JSON.stringify({
          event: 'command',
          func: 'setVolume',
          args: [clamped]
        }), '*');
      } catch (e) {}
    }
    this._notifyStateChange();
  }

  toggleMute() {
    gameState.youtubeApp.isMuted = !gameState.youtubeApp.isMuted;
    if (this.ytPlayer) {
      try {
        if (gameState.youtubeApp.isMuted) {
          if (typeof this.ytPlayer.mute === 'function') this.ytPlayer.mute();
        } else {
          if (typeof this.ytPlayer.unMute === 'function') this.ytPlayer.unMute();
        }
      } catch (e) {}
    } else if (this.iframe && this.iframe.contentWindow) {
      try {
        const cmd = gameState.youtubeApp.isMuted ? 'mute' : 'unMute';
        this.iframe.contentWindow.postMessage(`{"event":"command","func":"${cmd}","args":""}`, '*');
      } catch (e) {}
    }
    this._notifyStateChange();
  }

  nextTrack() {
    const currentId = gameState.youtubeApp.currentVideoId;
    const index = CURATED_ROAD_TRACKS.findIndex(t => t.id === currentId);
    const nextIndex = (index + 1) % CURATED_ROAD_TRACKS.length;
    this.playTrack(CURATED_ROAD_TRACKS[nextIndex]);
  }

  prevTrack() {
    const currentId = gameState.youtubeApp.currentVideoId;
    const index = CURATED_ROAD_TRACKS.findIndex(t => t.id === currentId);
    const prevIndex = (index - 1 + CURATED_ROAD_TRACKS.length) % CURATED_ROAD_TRACKS.length;
    this.playTrack(CURATED_ROAD_TRACKS[prevIndex]);
  }

  getCuratedCatalog(genre = 'all') {
    if (!genre || genre === 'all') return CURATED_ROAD_TRACKS;
    return CURATED_ROAD_TRACKS.filter(t => t.genre === genre);
  }

  filterCatalog(searchTerm) {
    if (!searchTerm) return CURATED_ROAD_TRACKS;
    const term = searchTerm.toLowerCase().trim();
    return CURATED_ROAD_TRACKS.filter(t => {
      return t.title.toLowerCase().includes(term) ||
             t.artist.toLowerCase().includes(term) ||
             t.genre.toLowerCase().includes(term) ||
             (t.tag && t.tag.toLowerCase().includes(term));
    });
  }

  _recordHistory(track) {
    if (!track) return;
    this.recentHistory = this.recentHistory.filter(h => h.id !== track.id);
    this.recentHistory.unshift({
      id: track.id,
      title: track.title,
      artist: track.artist,
      thumbnail: track.thumbnail,
      playedAt: Date.now()
    });
    if (this.recentHistory.length > 20) {
      this.recentHistory.pop();
    }
    try {
      localStorage.setItem('dreamstate_yt_recent', JSON.stringify(this.recentHistory));
    } catch (e) {}
  }

  onStateChange(cb) {
    if (typeof cb === 'function') {
      this.onStateChangeCallbacks.add(cb);
    }
  }

  removeStateChangeListener(cb) {
    this.onStateChangeCallbacks.delete(cb);
  }

  _notifyStateChange() {
    this.onStateChangeCallbacks.forEach(cb => {
      try { cb(gameState.youtubeApp); } catch (e) {}
    });
  }

  /**
   * Universal search across direct URLs/IDs, curated catalog, and real-time online YouTube video results.
   */
  async searchAll(query) {
    if (!query || typeof query !== 'string') {
      return this.getCuratedCatalog('all');
    }
    const clean = query.trim();
    if (!clean) {
      return this.getCuratedCatalog('all');
    }

    const results = [];
    const seenIds = new Set();
    const seenTitles = new Set();

    // 1. Direct YouTube URL or 11-char ID
    const extractedId = extractYouTubeVideoId(clean);
    if (extractedId) {
      try {
        const details = await fetchYouTubeDetails(extractedId);
        if (details) {
          results.push(details);
          seenIds.add(details.id);
          seenTitles.add(details.title.toLowerCase());
        }
      } catch (e) {}
    }

    // 2. Curated catalog matches
    const catalogMatches = this.filterCatalog(clean);
    catalogMatches.forEach(t => {
      if (t.id && !seenIds.has(t.id)) {
        results.push(t);
        seenIds.add(t.id);
        seenTitles.add(t.title.toLowerCase());
      }
    });

    // 3. Real-time online YouTube search (returns real video IDs and authentic thumbnails)
    try {
      const onlineResults = await searchYouTubeOnline(clean);
      if (Array.isArray(onlineResults)) {
        onlineResults.forEach(item => {
          if (item.id && !seenIds.has(item.id)) {
            seenIds.add(item.id);
            seenTitles.add(item.title.toLowerCase());
            results.push(item);
          }
        });
      }
    } catch (e) {}

    // 4. Live suggestions from Google YouTube Suggest API
    try {
      const suggestions = await fetchYouTubeSuggestions(clean);
      if (Array.isArray(suggestions)) {
        suggestions.forEach(item => {
          const itemLower = item.toLowerCase();
          if (!seenTitles.has(itemLower)) {
            seenTitles.add(itemLower);
            const catMatch = CURATED_ROAD_TRACKS.find(t => t.title.toLowerCase().includes(itemLower) || itemLower.includes(t.title.toLowerCase()));
            const thumb = catMatch ? catMatch.thumbnail : (results[0] ? results[0].thumbnail : 'https://i.ytimg.com/vi/MV_3Dpw-BRY/hqdefault.jpg');
            results.push({
              id: catMatch ? catMatch.id : null,
              searchQuery: item,
              title: item,
              artist: catMatch ? catMatch.artist : 'YouTube Search',
              genre: 'search',
              duration: catMatch ? catMatch.duration : 'Stream',
              tag: '🔴 YouTube',
              thumbnail: thumb
            });
          }
        });
      }
    } catch (e) {}

    return results;
  }

  /**
   * Set visual mode of persistent container:
   * - 'tablet': docked cleanly into tablet screen frame
   * - All other modes: strictly audio-only, moved completely off-screen and invisible.
   */
  setDockMode(mode) {
    if (!this.container) return;
    if (mode === 'tablet') {
      this.container.className = 'yt-tablet-mode';
      this.container.style.opacity = '1';
      this.container.style.pointerEvents = 'auto';
      this.container.style.zIndex = '350';
      this.container.style.clipPath = 'none';
    } else {
      // Audio-only driving mode: completely off-screen and invisible
      this.container.className = 'yt-driving-mode';
      this.container.style.position = 'fixed';
      this.container.style.left = '-9999px';
      this.container.style.top = '-9999px';
      this.container.style.width = '200px';
      this.container.style.height = '200px';
      this.container.style.opacity = '0.001';
      this.container.style.pointerEvents = 'none';
      this.container.style.zIndex = '-10';
      this.container.style.clipPath = 'none';
    }
  }
}

export const youtubePlayer = new YouTubePlayerManager();
