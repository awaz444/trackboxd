import React from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface SpotifyImage {
  url: string;
  height: number;
  width: number;
}

interface SpotifyArtist {
  id: string;
  name: string;
}

interface SpotifyTrack {
  id: string;
  name: string;
  artists: SpotifyArtist[];
  album?: {
    images: SpotifyImage[];
  };
}

interface SpotifyAlbum {
  id: string;
  name: string;
  images: SpotifyImage[];
  artists: SpotifyArtist[];
}

interface SpotifyPlaylist {
  id: string;
  name: string;
  images: SpotifyImage[];
  owner: {
    display_name: string;
  };
}

interface User {
  id: string;
  name: string;
  image_url?: string;
  country?: string;
}

interface SearchResults {
  tracks: SpotifyTrack[];
  albums: SpotifyAlbum[];
  playlists: SpotifyPlaylist[];
  users: User[];
}

async function fetchAll(query: string): Promise<SearchResults> {
  const params = new URLSearchParams({
    q: query,
    trackLimit: "10",
    albumLimit: "4",
    playlistLimit: "5",
    userLimit: "10",
  });
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/search/all?${params.toString()}`,
    { cache: "no-store" }
  );
  if (!res.ok) return { tracks: [], albums: [], playlists: [], users: [] };
  return res.json();
}

export const dynamic = "force-dynamic";

export default async function SearchPage({ 
  searchParams 
}: { 
  searchParams?: { q?: string } 
}) {
  const q = searchParams?.q?.trim() || "";
  const results = q ? await fetchAll(q) : { tracks: [], albums: [], playlists: [], users: [] };

  return (
    <div className="min-h-screen bg-[#FFFBEb]">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold text-[#5C5537] mb-4">Search</h1>
        <form action="/search" className="mb-6">
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search tracks, albums, playlists, users..."
            className="w-full border border-[#5C5537]/30 text-[#5C5537] rounded-lg px-3 py-2 bg-[#FFFBEb]"
          />
        </form>

        {q && (
          <div className="space-y-8">
            {/* Tracks Section */}
            <section>
              <h2 className="text-lg font-semibold text-[#5C5537] mb-3">Tracks</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {results.tracks?.filter((t): t is SpotifyTrack => !!t)?.map((t) => (
                  <a key={t.id} href={`/songs/${t.id}`} className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#5C5537]/10">
                    <img 
                      src={t.album?.images?.[0]?.url || "/file.svg"} 
                      alt={t.name} 
                      className="w-12 h-12 rounded object-cover" 
                    />
                    <div>
                      <div className="font-medium text-[#5C5537]">{t.name}</div>
                      <div className="text-sm text-[#5C5537]/70">
                        {t.artists?.map(a => a.name).join(", ")}
                      </div>
                    </div>
                  </a>
                ))}
                {(!results.tracks || results.tracks.length === 0) && (
                  <div className="text-[#5C5537]/60">No tracks found.</div>
                )}
              </div>
            </section>

            {/* Albums Section */}
            <section>
              <h2 className="text-lg font-semibold text-[#5C5537] mb-3">Albums</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {results.albums?.filter((a): a is SpotifyAlbum => !!a)?.map((a) => (
                  <a key={a.id} href={`/albums/${a.id}`} className="p-3 rounded-lg hover:bg-[#5C5537]/10">
                    <img 
                      src={a.images?.[0]?.url || "/file.svg"} 
                      alt={a.name} 
                      className="w-full rounded object-cover" 
                    />
                    <div className="mt-2 font-medium text-[#5C5537] truncate">{a.name}</div>
                    <div className="text-sm text-[#5C5537]/70 truncate">
                      {a.artists?.map(x => x.name).join(", ")}
                    </div>
                  </a>
                ))}
                {(!results.albums || results.albums.length === 0) && (
                  <div className="text-[#5C5537]/60">No albums found.</div>
                )}
              </div>
            </section>

            {/* Playlists Section */}
            <section>
              <h2 className="text-lg font-semibold text-[#5C5537] mb-3">Playlists</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {results.playlists?.filter((p): p is SpotifyPlaylist => !!p)?.map((p) => (
                  <a key={p.id} href={`/playlists/${p.id}`} className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#5C5537]/10">
                    <img 
                      src={p.images?.[0]?.url || "/file.svg"} 
                      alt={p.name} 
                      className="w-12 h-12 rounded object-cover" 
                    />
                    <div>
                      <div className="font-medium text-[#5C5537]">{p.name}</div>
                      <div className="text-sm text-[#5C5537]/70">
                        By {p.owner?.display_name || "Unknown"}
                      </div>
                    </div>
                  </a>
                ))}
                {(!results.playlists || results.playlists.length === 0) && (
                  <div className="text-[#5C5537]/60">No playlists found.</div>
                )}
              </div>
            </section>

            {/* Users Section */}
            <section>
              <h2 className="text-lg font-semibold text-[#5C5537] mb-3">Users</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {results.users?.filter((u): u is User => !!u)?.map((u) => (
                  <a key={u.id} href={`/profile/${u.name}`} className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#5C5537]/10">
                    <img 
                      src={u.image_url || "/default-avatar.jpg"} 
                      alt={u.name} 
                      className="w-10 h-10 rounded-full object-cover" 
                    />
                    <div>
                      <div className="font-medium text-[#5C5537]">{u.name}</div>
                      {u.country && (
                        <div className="text-sm text-[#5C5537]/70">{u.country}</div>
                      )}
                    </div>
                  </a>
                ))}
                {(!results.users || results.users.length === 0) && (
                  <div className="text-[#5C5537]/60">No users found.</div>
                )}
              </div>
            </section>
          </div>
        )}
      </div>
      <Footer variant="light" />
    </div>
  );
}


