export class YouTubePlayer {
    constructor(containerId) {
        this.containerId = containerId;
        this.player = null;
        this.isReady = false;
        this.isPlaying = false;
        this.pausedAt = 0;
        this.endTime = 0;
        this.checkInterval = null;
        this.onEnded = null;
        this.currentVolume = 100;

        if (!window.YT) {
            const tag = document.createElement('script');
            tag.src = "https://www.youtube.com/iframe_api";
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        }
    }

    extractVideoId(url) {
        const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
        return match ? match[1] : null;
    }

    async load(url) {
        const videoId = this.extractVideoId(url);
        if (!videoId) return alert("Link YouTube không hợp lệ!");

        const initPlayer = () => {
            if (this.player) {
                this.player.loadVideoById(videoId);
                this.player.pauseVideo();
            } else {
                this.player = new window.YT.Player(this.containerId, {
                    videoId: videoId,
                    playerVars: { 'controls': 1, 'rel': 0, 'showinfo': 0, 'modestbranding': 1, 'disablekb': 1 },
                    events: {
                        'onReady': () => {
                            this.isReady = true;
                            this.player.setVolume(this.currentVolume);
                        },
                        'onStateChange': (e) => {
                            if (e.data === window.YT.PlayerState.PLAYING) this.isPlaying = true;
                            else this.isPlaying = false;
                        }
                    }
                });
            }
            this.pausedAt = 0;
            const container = document.getElementById('videoContainer');
            if (container) container.classList.remove('hidden');
        };

        if (window.YT && window.YT.Player) initPlayer();
        else window.onYouTubeIframeAPIReady = initPlayer;
    }

    setVolume(v) {
        this.currentVolume = Math.min(100, Math.max(0, v * 20));
        if (this.isReady && this.player) this.player.setVolume(this.currentVolume);
    }

    stop() {
        if (!this.isReady || !this.player || typeof this.player.pauseVideo !== 'function') return;
        this.player.pauseVideo();
        this.isPlaying = false;
        if (this.checkInterval) clearInterval(this.checkInterval);
    }

    pause() {
        if (!this.isReady || !this.player || typeof this.player.pauseVideo !== 'function') return;
        this.player.pauseVideo();
        this.pausedAt = this.player.getCurrentTime();
        if (this.checkInterval) clearInterval(this.checkInterval);
    }

    resume() {
        if (!this.isReady || !this.player || typeof this.player.getDuration !== 'function') return;
        if (this.pausedAt >= this.player.getDuration()) this.pausedAt = 0;
        this.playFrom(this.pausedAt);
    }

    clear() {
        this.stop();
        if (this.player && typeof this.player.stopVideo === 'function') this.player.stopVideo();
    }

    playSegment(startSec, endSec) {
        if (!this.isReady || !this.player || typeof this.player.seekTo !== 'function') return;
        this.stop();

        this.endTime = endSec;
        this.player.seekTo(startSec, true);
        this.player.playVideo();

        this.checkInterval = setInterval(() => {
            if (this.player && typeof this.player.getCurrentTime === 'function') {
                if (this.player.getCurrentTime() >= this.endTime) {
                    this.pause();
                    this.pausedAt = this.endTime;
                    if (this.onEnded) this.onEnded();
                }
            }
        }, 50);
    }

    playFrom(startSec) {
        if (!this.isReady || !this.player || typeof this.player.seekTo !== 'function') return;
        this.stop();
        this.player.seekTo(startSec, true);
        this.player.playVideo();
    }
}