import { Track, SpotifyTrack, Review, SpotifyPlaylistTrack } from "@/app/tracks/types";

export const spotifyToTrack = (trackData: any): Track => {
  return {
    id: trackData.track?.id || trackData.id,
    title: trackData.track?.name || trackData.name,
    artist: (trackData.track?.artists || trackData.artists)?.map((a: any) => a.name).join(", "),
    album: trackData.track?.album?.name || trackData.album?.name,
    coverArt: trackData.track?.album?.images[0]?.url || trackData.album?.images[0]?.url || "/default-album.png",
    avgRating: trackData.track?.stats?.avg_rating || trackData.stats?.avg_rating || 0,
    saveCount: trackData.track?.stats?.like_count || trackData.stats?.like_count || 0,
    genre: "Pop", // Default value
    year: trackData.track?.album?.release_date ? 
      parseInt(trackData.track.album.release_date.substring(0, 4)) : 
      trackData.album?.release_date ? 
        parseInt(trackData.album.release_date.substring(0, 4)) : 
        new Date().getFullYear(),
    mood: "Energetic", // Default value
    isSaved: false,
    stats: {
      like_count: trackData.track?.stats?.like_count || trackData.stats?.like_count || 0,
      review_count: trackData.track?.stats?.review_count || trackData.stats?.review_count || 0,
      annotation_count: trackData.track?.stats?.annotation_count || trackData.stats?.annotation_count || 0,
      avg_rating: trackData.track?.stats?.avg_rating || trackData.stats?.avg_rating || 0
    }
  };
};

export const reviewToTrack = (review: Review): Track => {
  const trackDetails = review.track_details;
  if (!trackDetails) {
    throw new Error('Track details are missing from review');
  }
  const album = trackDetails.album;
  const artists = trackDetails.artists;

  return {
    id: trackDetails.id,
    title: trackDetails.name,
    artist: artists.map(a => a.name).join(", "),
    album: album.name,
    coverArt: album.images[0]?.url || "/default-album.png",
    avgRating: review.rating,
    saveCount: Math.floor(Math.random() * 2000) + 500, // Temporary random count
    genre: "Pop", // Default value
    year: album.release_date ? parseInt(album.release_date.substring(0, 4)) : new Date().getFullYear(),
    mood: "Energetic", // Default value
    isSaved: false
  };
};