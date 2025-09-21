// spotify.ts (refactored for Client Credentials Flow)

const client_id = process.env.SPOTIFY_CLIENT_ID!;
const client_secret = process.env.SPOTIFY_CLIENT_SECRET!;

if (!client_id || !client_secret) {
  throw new Error(`
    Missing Spotify environment variables.
    Please ensure SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET are set.
  `);
}

const TOKEN_ENDPOINT = `https://accounts.spotify.com/api/token`;
const SEARCH_ENDPOINT = `https://api.spotify.com/v1/search`;
const PLAYLISTS_ENDPOINT = `https://api.spotify.com/v1/playlists`;
const TRACKS_ENDPOINT = `https://api.spotify.com/v1/tracks`;
const ALBUMS_ENDPOINT = `https://api.spotify.com/v1/albums`;

let cachedToken: string | null = null;
let tokenExpiry: number | null = null;

// in-memory token cache

async function getAccessToken() {
  const now = Date.now();

  // reuse token if still valid
  if (cachedToken && tokenExpiry && now < tokenExpiry) {
    return cachedToken;
  }

  const resp = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization:
        "Basic " +
        Buffer.from(
          process.env.SPOTIFY_CLIENT_ID + ":" + process.env.SPOTIFY_CLIENT_SECRET
        ).toString("base64"),
    },
    body: "grant_type=client_credentials",
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Failed to fetch token: ${resp.status} ${text}`);
  }

  const data = await resp.json();
  cachedToken = data.access_token;
  tokenExpiry = now + data.expires_in * 1000; // ms
  return cachedToken;
}

// ------------------ Spotify API Helpers ------------------

export const searchTracks = async (query: string, limit = 5) => {
  const token = await getAccessToken();
  const response = await fetch(
    `${SEARCH_ENDPOINT}?q=${encodeURIComponent(query)}&type=track&limit=${limit}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!response.ok) throw new Error(`Spotify error: ${response.statusText}`);
  return response.json();
};

export async function getTrackDetails(trackId: string) {
  // Validate track ID: should be 22-char alphanumeric Spotify ID
  if (!/^[A-Za-z0-9]{22}$/.test(trackId)) {
    throw new Error(`Invalid track ID format: "${trackId}"`);
  }

  const token = await getAccessToken();
  const url = `https://api.spotify.com/v1/tracks/${trackId}`;

  const resp = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  // Always try to log Spotify's actual error body
  if (!resp.ok) {
    const errorBody = await resp.text();
    throw new Error(
      `Spotify API error ${resp.status}: ${resp.statusText}\n${errorBody}`
    );
  }

  return resp.json();
}

export async function searchPlaylists(query: string) {
  if (!query || !query.trim()) {
    throw new Error("Spotify search query cannot be empty");
  }

  const token = await getAccessToken();

  const url = new URL("https://api.spotify.com/v1/search");
  url.searchParams.set("q", query);
  url.searchParams.set("type", "playlist"); // ✅ required

  const resp = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(
      `Spotify error: ${resp.status} ${resp.statusText}\n${body}`
    );
  }

  return resp.json();
}


export const getPlaylistDetails = async (playlistId: string) => {
  const token = await getAccessToken();
  const response = await fetch(`${PLAYLISTS_ENDPOINT}/${playlistId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error(`Spotify error: ${response.statusText}`);
  return response.json();
};

interface PlaylistItemsOptions {
  limit?: number;
  offset?: number;
  fields?: string;
}

export const getPlaylistItems = async (playlistId: string, options?: PlaylistItemsOptions | number) => {
  const token = await getAccessToken();
  const url = new URL(`${PLAYLISTS_ENDPOINT}/${playlistId}/tracks`);
  
  // Handle both new options object and legacy number parameter
  if (typeof options === 'number') {
    url.searchParams.append("limit", options.toString());
  } else if (options) {
    if (options.limit) url.searchParams.append("limit", options.limit.toString());
    if (options.offset) url.searchParams.append("offset", options.offset.toString());
    if (options.fields) url.searchParams.append("fields", options.fields);
  }

  const response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error(`Spotify error: ${response.statusText}`);
  return response.json();
};

export const getAlbumDetails = async (albumId: string) => {
  if (!albumId) throw new Error("Album ID is required");
  const token = await getAccessToken();
  const response = await fetch(`${ALBUMS_ENDPOINT}/${albumId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error(`Spotify error: ${response.statusText}`);
  return response.json();
};

interface AlbumTracksOptions {
  limit?: number;
  offset?: number;
}

export const getAlbumTracks = async (albumId: string, options?: AlbumTracksOptions | number) => {
  if (!albumId) throw new Error("Album ID is required");
  const token = await getAccessToken();
  const url = new URL(`${ALBUMS_ENDPOINT}/${albumId}/tracks`);
  
  // Handle both new options object and legacy number parameter
  if (typeof options === 'number') {
    url.searchParams.append("limit", options.toString());
  } else if (options) {
    if (options.limit) url.searchParams.append("limit", options.limit.toString());
    if (options.offset) url.searchParams.append("offset", options.offset.toString());
  }

  const response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error(`Spotify error: ${response.statusText}`);
  return response.json();
};

export const searchAlbums = async (query: string, limit = 20, offset = 0, market = "US") => {
  const token = await getAccessToken();
  const url = new URL(SEARCH_ENDPOINT);
  url.searchParams.append("q", query);
  url.searchParams.append("type", "album");
  url.searchParams.append("limit", limit.toString());
  url.searchParams.append("offset", offset.toString());
  url.searchParams.append("market", market);

  const response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error(`Spotify error: ${response.statusText}`);
  const data = await response.json();
  return data.albums?.items || [];
};

// Combined search for tracks, albums, playlists
export const searchTracksAlbumsAndPlaylists = async (query: string) => {
  const token = await getAccessToken();
  const url = (type: string, limit: number) =>
    `${SEARCH_ENDPOINT}?q=${encodeURIComponent(query)}&type=${type}&limit=${limit}`;

  const [tracksRes, albumsRes, playlistsRes] = await Promise.all([
    fetch(url("track", 7), { headers: { Authorization: `Bearer ${token}` } }),
    fetch(url("album", 4), { headers: { Authorization: `Bearer ${token}` } }),
    fetch(url("playlist", 4), { headers: { Authorization: `Bearer ${token}` } }),
  ]);

  if (!tracksRes.ok || !albumsRes.ok || !playlistsRes.ok) {
    throw new Error("Spotify combined search failed");
  }

  const [tracks, albums, playlists] = await Promise.all([
    tracksRes.json(),
    albumsRes.json(),
    playlistsRes.json(),
  ]);

  return {
    tracks: tracks.tracks?.items || [],
    albums: albums.albums?.items || [],
    playlists: playlists.playlists?.items || [],
  };
};
