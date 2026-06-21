export class VideoPlayer {
    constructor(videoId) {
        this.video = document.getElementById(videoId);
        this.container = document.getElementById('videoContainer');
        this.isPlaying = false;
        this.pausedAt = 0;
        this.endTime = 0;
        this.checkInterval = null;
        this.onEnded = null;

        if (this.video) {
            this.video.addEventListener('pause', () => this.isPlaying = false);
            this.video.addEventListener('play', () => this.isPlaying = true);
        }
    }

    load(fileUrl) {
        if (!this.video) return;
        this.video.src = fileUrl;
        this.video.load();
        this.pausedAt = 0;
        if (this.container) this.container.classList.remove('hidden');
    }

    setVolume(v) {
        if (this.video) this.video.volume = Math.max(0, Math.min(1, v / 5));
    }

    stop() {
        if (!this.video) return;
        this.video.pause();
        this.isPlaying = false;
        if (this.checkInterval) clearInterval(this.checkInterval);
    }

    pause() {
        if (!this.video) return;
        this.video.pause();
        this.pausedAt = this.video.currentTime;
        if (this.checkInterval) clearInterval(this.checkInterval);
    }

    resume() {
        if (!this.video) return;
        if (this.pausedAt >= this.video.duration) this.pausedAt = 0;
        this.playFrom(this.pausedAt);
    }

    clear() {
        if (!this.video) return;
        this.stop();
        this.video.removeAttribute('src');
        this.video.load();
        if (this.container) this.container.classList.add('hidden');
    }

    playSegment(startSec, endSec) {
        if (!this.video || !this.video.src) return;
        this.stop();

        this.video.currentTime = startSec;
        this.endTime = endSec;

        const playPromise = this.video.play();
        if (playPromise !== undefined) {
            playPromise.catch(e => console.warn("Trình duyệt chặn Autoplay Video:", e));
        }

        this.checkInterval = setInterval(() => {
            if (this.video.currentTime >= this.endTime) {
                this.pause();
                this.pausedAt = this.endTime;
                if (this.onEnded) this.onEnded();
            }
        }, 50);
    }

    playFrom(startSec) {
        if (!this.video || !this.video.src) return;
        this.stop();
        if (startSec >= this.video.duration) startSec = 0;
        this.video.currentTime = startSec;
        this.video.play();
    }
}