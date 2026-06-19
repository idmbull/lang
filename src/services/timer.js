import { Store } from '../core/store.js';

export const TimerService = {
    interval: null,

    start(onTick) {
        if (this.interval) clearInterval(this.interval);

        this.interval = setInterval(() => {
            const state = Store.getState();
            if (!state.isActive || !state.startTime) return;

            const elapsedSeconds = (Date.now() - state.startTime) / 1000;

            // Format time: 0s, 1s ... 1:05
            let timeStr = "";
            if (elapsedSeconds < 60) {
                timeStr = `${Math.floor(elapsedSeconds)}s`;
            } else {
                const m = Math.floor(elapsedSeconds / 60).toString().padStart(2, "0");
                const s = Math.floor(elapsedSeconds % 60).toString().padStart(2, "0");
                timeStr = `${m}:${s}`;
            }

            // Tính WPM: (Số ký tự / 5) / Số phút
            const wpm = elapsedSeconds > 0
                ? Math.floor((state.prevInputLen / 5) / (elapsedSeconds / 60))
                : 0;

            onTick({ time: timeStr, wpm });
        }, 1000);
    },

    stop() {
        if (this.interval) clearInterval(this.interval);
    }
};