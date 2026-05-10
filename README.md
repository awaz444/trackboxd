# 🎵 trackboxd — a letterboxd for Spotify

**trackboxd** is a web-only music companion app that brings the film-buff culture of Letterboxd to Spotify listeners. It lets users **rate**, **review**, and **annotate** songs, albums, and playlists — building a social layer on top of the Spotify experience.

You log in with your Spotify account, explore your music history, write timestamped thoughts on tracks (like SoundCloud comments), rate albums like Pitchfork, and create custom playlists that live on both trackboxd and Spotify.


---

## 📌 Core Idea

Spotify is for listening.  
**trackboxd is for reacting.**  
It gives you a home to express your taste, opinions, and deep takes on the music you love — while also seeing how others feel about the same tracks.

---

## ✨ Features

### 🔐 Spotify-Only Login
- Users authenticate via their Spotify accounts
- All playlists and listening data are imported securely

### ⭐ Ratings & Reviews
- Rate **tracks**, **albums**, and **playlists** on a 1–5 scale
- Write public or private **reviews** to share your thoughts
- View ratings/reviews by others

### 🕒 Timestamped Annotations
- Annotate a song at specific moments — like SoundCloud waveform comments
- Add context, emotions, lyrics, or trivia at key moments
- Others can upvote or reply to annotations

### 👍 Annotation Upvotes & Comments
- Users can **upvote helpful or funny annotations**
- Comment threads on each annotation for discussion

### 📦 Playlist Import & Creation
- Import all your existing **Spotify playlists**
- Optionally **create new playlists** directly from trackboxd
- Playlists created on trackboxd sync back to your Spotify account

### 🧑‍💻 User Profiles
- Every user has a profile showing:
  - Their ratings, reviews, playlists, and recent activity
  - Annotations they’ve contributed across songs
  - Follower/following stats (optional future feature)

---

## 🔄 Workflow

1. **User logs in with Spotify** (OAuth)
2. trackboxd fetches:
   - User profile
   - Saved tracks, albums, and playlists
3. User can:
   - Rate any song, album, or playlist
   - Write a review about a track or album
   - Annotate tracks with timestamped comments
   - Upvote/comment on others’ annotations
   - Create a new playlist (optional) — synced to Spotify
4. Annotations are displayed on a waveform-style interface while playing the track
5. Other users can discover songs via:
   - Trending annotations
   - Top-rated albums
   - Followed users' activity

---

## 💡 Vision

trackboxd aims to be the **social memory layer** for your music —  
a space between the passive act of listening and the expressive act of sharing taste.

It turns your Spotify account into something *alive* — not just a list of streams, but a reflection of your emotions, thoughts, and musical journey.

---

