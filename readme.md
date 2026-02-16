# Omni Bot

<div align="center">
  <img src="assets/omni.png" alt="Omni Bot Logo"/>
  <br/>
  <h3>Transform your Discord experience with Omni</h3>
</div>

<p align="center">
  <a href="#about">About</a> •
  <a href="#features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#configuration">Configuration</a> •
  <a href="#contributing">Contributing</a> •
  <a href="#license">License</a>
</p>

---

![Omni Banner](assets/banner.png)

## About

**Omni** is a sophisticated Discord music bot designed to provide an interactive and social listening experience. Beyond standard playback, Omni features a web dashboard for seamless control, public radio streaming, custom playlist creation, and real-time social sharing features. Built with modern web technologies, Omni ensures a responsive and premium user experience both in Discord and on the web.

## Features

- **High-Quality Audio Playback:** Stream music from YouTube, Spotify, and Deezer with crystal clear audio.
- **Web Dashboard:** Control your music, manage playlists, and view what's playing directly from a sleek web interface.
- **Custom Playlists:** Create, save, and manage your personal playlists.
- **Public Radio:** Tune into various public radio stations.
- **Social Sharing:** Share your current track with friends.
- **Real-time Interaction:** Synchronized playback and controls across Discord and the web dashboard.

## Tech Stack

**Core:**
- **Runtime:** Node.js (v22+)
- **Language:** TypeScript
- **Monorepo Management:** Turbo, PNPM

**Bot (Server):**
- **Framework:** Discord.js, Express
- **Audio Processing:** fluent-ffmpeg, @discordjs/voice, youtube-dl-exec, @distube/ytdl-core
- **Communication:** Socket.io

**Web (Client):**
- **Framework:** React, Vite
- **Styling:** Tailwind CSS
- **State Management:** React Hooks
- **Communication:** Socket.io-client

## Getting Started

Follow these instructions to set up the project locally for development and testing.

### Prerequisites

Ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v22.14.0 or higher recommended)
- [PNPM](https://pnpm.io/) (v9.1.0 or higher)
- [Python](https://www.python.org/) (v3.12, required for build tools)
- [FFmpeg](https://ffmpeg.org/) (Required for audio processing if not using static builds)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/VideMelo/omni.git
    cd omni-bot
    ```

2.  **Install dependencies:**
    ```bash
    pnpm install
    ```

## Configuration

Configuring the environment variables correctly is essential for the bot to function, especially for YouTube playback and the web dashboard.

### 1. Bot Configuration (`packages/bot`)

Navigate to `packages/bot`, rename `.env.template` to `.env` and fill in the following:

| Variable | Description |
| :--- | :--- |
| `DISCORD_TOKEN` | Your Discord Bot Token. |
| `DISCORD_ID` | Your Discord Application Client ID. |
| `DISCORD_SECRET` | Your Discord Application Client Secret. |
| `DISCORD_REDIRECT` | The Redirect URI registered in the Discord Developer Portal (e.g., `http://localhost:8080/redirect`). |
| `DISCORD_CACHE_CHANNEL` | **Important:** The ID of a private text channel. The bot uploads played songs here to use Discord as a CDN/Cache, avoiding repeated YouTube downloads. |
| `YOUTUBE_COOKIES` | **Path** to a `cookies.txt` file (Netscape format). Required to bypass age restrictions and prevent 403 errors. |
| `SPOTIFY_ID` | Your Spotify Application Client ID. |
| `SPOTIFY_SECRET` | Your Spotify Application Client Secret. |
| `LASTFM_API_KEY` | (Optional) Last.fm API Key for "Similar Tracks" recommendations. |
| `CLIENT_URL` | The URL where your Web Dashboard is running (e.g., `http://localhost:8080`). Used for CORS. |
| `PORT` | The port the bot's API server will run on (default: `8443`). |

#### Detailed: YouTube Cookies
To get your `cookies.txt`:
1. Use a browser extension like [Get cookies.txt LOCALLY](https://chrome.google.com/webstore/detail/get-cookiestxt-locally/ccmclabjdofocmcogghhcepehcmebhne) (Chrome) or [Cookie Quick Manager](https://addons.mozilla.org/en-US/firefox/addon/cookie-quick-manager/) (Firefox).
2. Log in to YouTube, then export the cookies in **Netscape** format.
3. Save the file as `youtube-cookies.txt` inside `packages/bot/`.
4. Set `YOUTUBE_COOKIES` in your `.env` to `./youtube-cookies.txt` (This file is ignored by git to keep your session private).

### 2. Client Configuration (`packages/web`)

Navigate to `packages/web`, rename `.env.template` to `.env`, and configure:

| Variable | Description |
| :--- | :--- |
| `VITE_DISCORD_ID` | Your Discord Application Client ID. |
| `VITE_SERVER_URL` | The URL of the Bot's API server (e.g., `http://localhost:8443`). |
## Running the Project

This project uses **Turbo** to manage tasks across the monorepo.

### Development Mode

To start both the Bot and the Web Client in development mode with hot-reloading:

```bash
pnpm dev
# or
pnpm turbo run dev
```

### Building for Production

To build all packages:

```bash
pnpm build
# or
pnpm turbo run build
```

### Linting

To check for code issues:

```bash
pnpm lint
```

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request for any enhancements or bug fixes.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature`)
3.  Commit your Changes (`git commit -m 'Add some feature'`)
4.  Push to the Branch (`git push origin feature`)
5.  Open a Pull Request

## License

Distributed under the MIT License. See `LICENSE` for more information.

---
<p align="center">Made with ❤️ by VideMelo</p>
