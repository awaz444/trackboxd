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
let tokenRefreshPromise: Promise<string> | null = null;

// ------------------ Token Management ------------------

async function fetchNewAccessToken(): Promise<string> {
  // If a refresh is already in progress, return that promise
  if (tokenRefreshPromise) {
    return tokenRefreshPromise;
  }

  tokenRefreshPromise = (async () => {
    try {
      const resp = await fetch(TOKEN_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization:
            "Basic " +
            Buffer.from(`${client_id}:${client_secret}`).toString("base64"),
        },
        body: "grant_type=client_credentials",
      });

      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(`Failed to fetch token: ${resp.status} ${text}`);
      }

      const data = await resp.json();

      cachedToken = data.access_token;
      tokenExpiry = Date.now() + (data.expires_in - 60) * 1000; 
      // expire 60s early to be safe

      return cachedToken as string;
    } finally {
      tokenRefreshPromise = null;
    }
  })();

  return tokenRefreshPromise;
}

async function getAccessToken() {
  if (!cachedToken || !tokenExpiry || Date.now() >= tokenExpiry) {
    return await fetchNewAccessToken();
  }
  return cachedToken;
}

// ------------------ Helper for Requests ------------------

// Add this helper at the top or bottom of the file
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type SpotifyFetchInit = RequestInit & { next?: { revalidate?: number } };

async function fetchSpotify(url: string, options: SpotifyFetchInit = {}): Promise<Response> {
  const MAX_RETRIES = 5;
  let attempt = 0;

  // Default to 'no-store' so retries actually hit the network. Callers rendering
  // cacheable pages pass `next: { revalidate }` instead — a 'no-store' fetch
  // opts the whole route into dynamic rendering, which defeats ISR.
  const wantsCaching = options.next?.revalidate !== undefined;

  while (attempt < MAX_RETRIES) {
    try {
      await getAccessToken(); // Ensure token is available

      const res = await fetch(url, {
        ...options,
        // On a retry always bypass the cache, so we re-request with the new token.
        ...(wantsCaching && attempt === 0
          ? { next: options.next }
          : { cache: 'no-store' as RequestCache, next: undefined }),
        headers: {
          ...options.headers,
          Authorization: `Bearer ${cachedToken}`,
        },
      });

      if (res.status === 401) {
        // Token expired unexpectedly → refresh + retry
        await fetchNewAccessToken();
        
        // Add a small delay. If your proxy (googleusercontent) has eventual consistency,
        // this gives it time to recognize the new token.
        await sleep(500); 
        
        attempt++;
        continue;
      }

      return res;
    } catch (error) {
      // Logic for network errors could go here, but focusing on 401 per user request
      throw error;
    }
  }

  throw new Error("Failed to authenticate with Spotify after multiple attempts");
}

async function fetchSpotifyJson<T>(url: string, options: SpotifyFetchInit = {}): Promise<T> {
  const response = await fetchSpotify(url, options);

  if (!response.ok) {
    const body = await response.text();
    const error = new Error(
      `Spotify error: ${response.status} ${response.statusText}\n${body}`
    ) as Error & { status?: number };
    error.status = response.status;
    throw error;
  }

  return response.json();
}

// ------------------ Spotify API Helpers ------------------

export const searchTracks = async (
  query: string,
  options: { limit?: number; market?: string } = {}
) => {
  // Basic validation
  if (!query || !query.trim()) {
    throw new Error("Spotify search query cannot be empty");
  }

  const { limit = 20, market = 'US' } = options;
  const url = new URL(SEARCH_ENDPOINT);
  url.searchParams.append('q', query);
  url.searchParams.append('type', 'track');
  url.searchParams.append('limit', limit.toString());
  url.searchParams.append('market', market);

  const data = await fetchSpotifyJson<{ tracks: { items: any[] } }>(url.toString());
  return data.tracks?.items || [];
};

export async function getTrackDetails(
  trackId: string,
  options: { revalidate?: number } = {}
) {
  // Validate track ID: should be 22-char alphanumeric Spotify ID
  if (!/^[A-Za-z0-9]{22}$/.test(trackId)) {
    throw new Error(`Invalid track ID format: "${trackId}"`);
  }

  const url = `https://api.spotify.com/v1/tracks/${trackId}`;
  return fetchSpotifyJson<any>(
    url,
    options.revalidate !== undefined ? { next: { revalidate: options.revalidate } } : {}
  );
}

export async function getArtistDetails(artistId: string) {
  if (!artistId || !/^[A-Za-z0-9]{22}$/.test(artistId)) return null;
  try {
    return await fetchSpotifyJson<any>(`https://api.spotify.com/v1/artists/${artistId}`);
  } catch {
    return null;
  }
}

export const searchPlaylists = async (
  query: string,
  options: { limit?: number; market?: string } = {}
) => {
  if (!query || !query.trim()) {
    throw new Error("Spotify search query cannot be empty");
  }

  const { limit = 20, market = 'US' } = options;

  // FIX: Manually build the string to ensure %20 encoding
  // This matches the logic in 'searchTracksAlbumsAndPlaylists' which is known to work.
  const queryString = `?q=${encodeURIComponent(query)}&type=playlist&limit=${limit}&market=${market}`;
  
  // Combine directly with the endpoint
  const url = `${SEARCH_ENDPOINT}${queryString}`;

  const data = await fetchSpotifyJson<{ playlists: { items: any[] } }>(url);
  return data.playlists?.items || [];
};

export const getPlaylistDetails = async (playlistId: string) => {
  return fetchSpotifyJson<any>(`${PLAYLISTS_ENDPOINT}/${playlistId}`);
};

interface PlaylistItemsOptions {
  limit?: number;
  offset?: number;
  fields?: string;
}

export const getPlaylistItems = async (playlistId: string, options?: PlaylistItemsOptions | number) => {
  const url = new URL(`${PLAYLISTS_ENDPOINT}/${playlistId}/tracks`);
  
  // Handle both new options object and legacy number parameter
  if (typeof options === 'number') {
    url.searchParams.append("limit", options.toString());
  } else if (options) {
    if (options.limit) url.searchParams.append("limit", options.limit.toString());
    if (options.offset) url.searchParams.append("offset", options.offset.toString());
    if (options.fields) url.searchParams.append("fields", options.fields);
  }

  return fetchSpotifyJson<any>(url.toString());
};

export const getAlbumDetails = async (
  albumId: string,
  options: { revalidate?: number } = {}
) => {
  if (!albumId) throw new Error("Album ID is required");
  return fetchSpotifyJson<any>(
    `${ALBUMS_ENDPOINT}/${albumId}`,
    options.revalidate !== undefined ? { next: { revalidate: options.revalidate } } : {}
  );
};

interface AlbumTracksOptions {
  limit?: number;
  offset?: number;
  fields?: string; // Added fields just in case intended
}

export const getAlbumTracks = async (albumId: string, options?: AlbumTracksOptions | number) => {
  if (!albumId) throw new Error("Album ID is required");
  const url = new URL(`${ALBUMS_ENDPOINT}/${albumId}/tracks`);
  
  // Handle both new options object and legacy number parameter
  if (typeof options === 'number') {
    url.searchParams.append("limit", options.toString());
  } else if (options) {
    if (options.limit) url.searchParams.append("limit", options.limit.toString());
    if (options.offset) url.searchParams.append("offset", options.offset.toString());
  }

  return fetchSpotifyJson<any>(url.toString());
};

export const searchAlbums = async (query: string, limit = 20, offset = 0, market = "US") => {
  const url = new URL(SEARCH_ENDPOINT);
  url.searchParams.append("q", query);
  url.searchParams.append("type", "album");
  url.searchParams.append("limit", limit.toString());
  url.searchParams.append("offset", offset.toString());
  url.searchParams.append("market", market);

  const data = await fetchSpotifyJson<{ albums: { items: any[] } }>(url.toString());
  return data.albums?.items || [];
};

// Combined search for tracks, albums, playlists
interface SearchTracksAlbumsAndPlaylistsOptions {
  trackLimit?: number;
  albumLimit?: number;
  playlistLimit?: number;
  market?: string;
}

export const searchTracksAlbumsAndPlaylists = async (
  query: string, 
  options: SearchTracksAlbumsAndPlaylistsOptions = {}
) => {
  const { 
    trackLimit = 4, 
    albumLimit = 2, 
    playlistLimit = 2, 
    market = 'US' 
  } = options;

  const url = (type: string, limit: number) =>
    `${SEARCH_ENDPOINT}?q=${encodeURIComponent(query)}&type=${type}&limit=${limit}&market=${market}`;

  // We use fetchSpotify for each request to ensure they all get the token check and specific retry logic
  // fetchSpotify will manage getting/refreshing the token
  const [tracks, albums, playlists] = await Promise.all([
    fetchSpotifyJson<{ tracks: { items: any[] } }>(url("track", trackLimit)),
    fetchSpotifyJson<{ albums: { items: any[] } }>(url("album", albumLimit)),
    fetchSpotifyJson<{ playlists: { items: any[] } }>(url("playlist", playlistLimit)),
  ]);

  return {
    tracks: tracks.tracks?.items || [],
    albums: albums.albums?.items || [],
    playlists: playlists.playlists?.items || [],
  };
};

interface SearchTracksAndAlbumsOptions {
  trackLimit?: number;
  albumLimit?: number;
  market?: string;
}

export const searchTracksAndAlbums = async (query: string, options: SearchTracksAndAlbumsOptions = {}) => {
  const { trackLimit = 5, albumLimit = 5, market = 'US' } = options;

  const url = (type: string, limit: number) =>
    `${SEARCH_ENDPOINT}?q=${encodeURIComponent(query)}&type=${type}&limit=${limit}&market=${market}`;

  const [tracks, albums] = await Promise.all([
    fetchSpotifyJson<{ tracks: { items: any[] } }>(url("track", trackLimit)),
    fetchSpotifyJson<{ albums: { items: any[] } }>(url("album", albumLimit)),
  ]);

  return {
    tracks: tracks.tracks?.items || [],
    albums: albums.albums?.items || [],
  };
};