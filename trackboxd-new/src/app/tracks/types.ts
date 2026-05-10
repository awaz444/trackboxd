export interface Track {
    id: string;
    title: string;
    artist: string;
    album: string;
    coverArt: string;
    avgRating: number;
    saveCount: number;
    genre: string;
    year: number;
    mood: string;
    isSaved: boolean;
    stats?: {
      like_count: number;
      review_count: number;
      annotation_count: number;
      avg_rating: number;
    };
  }
  
  export interface SpotifyTrack {
    id: string;
    name: string;
    preview_url: string | null;
    duration_ms: number;
    album: {
      name: string;
      images: { url: string }[];
      release_date: string;
    };
    artists: { name: string }[];
    added_by?: {
      id: string;
    };
  }
  
  export interface Review {
    id: string;
    rating: number;
    text: string;
    created_at: string;
    user_id: string;
    item_id: string;
    like_count: number;
    is_public: boolean;
    users: {
      id: string;
      name: string;
      image_url: string;
    };
    // Add this new property
    item: {
      id: string;
      name: string;
      artist: string;
      album: string;
      cover_url: string;
      type: string;
    };
    // Keep existing properties
    spotify_items?: {
      id: string;
      type: string;
    };
    track_details?: {
      id: string;
      name: string;
      album: {
        images: {
          url: string;
          width: number;
          height: number;
        }[];
        name: string;
        release_date: string;
      };
      artists: {
        name: string;
      }[];
    };
  }
  
  export interface Annotation {
    id: string;
    text: string;
    created_at: string;
    like_count: number;
    item_id: string;
    timestamp: number; // Add this field
    users: {
        id: string;
        name: string;
        image_url: string;
    };
    is_public: boolean;
    item: {
      id: string;
      name: string;
      artist: string;
      album: string;
      cover_url: string;
      type: string;
    };
    track_id: string;
    track_details: {
        name: string;
        artists: {
            name: string;
        }[];
        album: {
            name: string;
            images: {
                url: string;
                width: number;
                height: number;
            }[];
        };
    };
}
  
  export interface SpotifyPlaylistTrack {
    track: SpotifyTrack;
    stats?: {
      like_count: number;
      review_count: number;
      annotation_count: number;
      avg_rating: number;
    };
  }