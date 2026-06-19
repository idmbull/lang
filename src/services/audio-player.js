export class SuperAudioPlayer {
    constructor() {
        this.ctx = null;
        this.buffer = null;
        this.currentSource = null;
        this.gainNode = null;
        this.volume = 1;
        this.onEnded = null;
        this.startTime = 0; // Thời điểm bắt đầu phát
        this.pausedAt = 0;  // Vị trí dừng lại (tính bằng giây)
        this.isPlaying = false;
    }

    async load(arrayBuffer) {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.gainNode = this.ctx.createGain();
            this.gainNode.connect(this.ctx.destination);
        }
        try {
            this.stop();
            this.buffer = await this.ctx.decodeAudioData(arrayBuffer);
            this.pausedAt = 0; // Reset vị trí khi load bài mới
        } catch (err) {
            console.error("Audio decode error:", err);
        }
    }

    setVolume(v) {
        this.volume = v;
        if (this.gainNode && this.ctx) {
            this.gainNode.gain.cancelScheduledValues(this.ctx.currentTime);
            this.gainNode.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.1);
        }
    }

    stop() {
        if (this.currentSource) {
            try {
                this.currentSource.onended = null;
                this.currentSource.stop();
            } catch { }
            this.currentSource.disconnect();
            this.currentSource = null;
        }
        this.isPlaying = false;
    }

    pause() {
        if (!this.isPlaying || !this.ctx) return;
        const elapsed = this.ctx.currentTime - this.startTime;
        this.pausedAt += elapsed;
        this.stop();
    }

    resume() {
        if (this.pausedAt >= (this.buffer?.duration || 0)) {
            this.pausedAt = 0;
        }
        this.playFrom(this.pausedAt);
    }

    clear() {
        this.stop();
        this.buffer = null;
    }

    playSegment(startSec, endSec) {
        if (!this.buffer || !this.ctx) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();

        const duration = endSec - startSec;
        if (duration <= 0) return;

        this.stop();

        const src = this.ctx.createBufferSource();
        src.buffer = this.buffer;
        src.connect(this.gainNode);

        const now = this.ctx.currentTime;
        const fadeTime = 0.02;

        this.gainNode.gain.cancelScheduledValues(now);
        this.gainNode.gain.setValueAtTime(0, now);
        this.gainNode.gain.linearRampToValueAtTime(this.volume, now + fadeTime);
        this.gainNode.gain.setValueAtTime(this.volume, now + duration - fadeTime);
        this.gainNode.gain.linearRampToValueAtTime(0, now + duration);

        src.start(now, startSec, duration);
        src.stop(now + duration + 0.05);
        this.isPlaying = false;
        this.pausedAt = endSec;
        this.currentSource = src;
    }

    playFrom(startSec) {
        if (!this.buffer || !this.ctx) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();

        if (startSec >= this.buffer.duration) startSec = 0;

        this.stop();

        const src = this.ctx.createBufferSource();
        src.buffer = this.buffer;
        src.connect(this.gainNode);

        const now = this.ctx.currentTime;
        const fadeTime = 0.05;

        this.gainNode.gain.cancelScheduledValues(now);
        this.gainNode.gain.setValueAtTime(0, now);
        this.gainNode.gain.linearRampToValueAtTime(this.volume, now + fadeTime);

        src.start(now, startSec);

        this.startTime = now;
        this.pausedAt = startSec;
        this.isPlaying = true;

        src.onended = () => {
            this.isPlaying = false;
            if (this.onEnded) this.onEnded();
        };

        this.currentSource = src;
    }
}