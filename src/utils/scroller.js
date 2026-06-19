export class AutoScroller {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.targetScrollTop = 0;
        this.isAnimating = false;
        this.scrollFrameId = null;
        this.userIsScrolling = false;
        this.userScrollTimeout = null;

        this.initEvents();
    }

    initEvents() {
        if (!this.container) return;
        const onUserScroll = () => {
            this.stop();
            this.userIsScrolling = true;
            clearTimeout(this.userScrollTimeout);
            this.userScrollTimeout = setTimeout(() => {
                this.userIsScrolling = false;
            }, 150);
        };
        this.container.addEventListener("wheel", onUserScroll, { passive: true });
        this.container.addEventListener("touchstart", onUserScroll, { passive: true });
        this.container.addEventListener("mousedown", onUserScroll, { passive: true });
    }

    stop() {
        if (this.isAnimating) {
            this.isAnimating = false;
            if (this.scrollFrameId) cancelAnimationFrame(this.scrollFrameId);
        }
    }

    scrollTo(targetSpan) {
        if (!targetSpan || !this.container || this.userIsScrolling) return;

        const containerRect = this.container.getBoundingClientRect();
        const spanRect = targetSpan.getBoundingClientRect();

        const relativeY = spanRect.top - containerRect.top;
        const safeZoneTop = containerRect.height * 0.35;
        const safeZoneBot = containerRect.height * 0.55;

        const isOffScreenTop = relativeY < 0;
        const isOffScreenBottom = relativeY > containerRect.height - spanRect.height;

        let delta = 0;
        if (relativeY < safeZoneTop) delta = relativeY - safeZoneTop;
        else if (relativeY > safeZoneBot) delta = relativeY - safeZoneBot;

        if (delta !== 0) {
            let target = this.container.scrollTop + delta;
            target = Math.max(0, Math.min(target, this.container.scrollHeight - this.container.clientHeight));
            this.targetScrollTop = target;

            if (isOffScreenTop || isOffScreenBottom) {
                this.stop();
                this.container.scrollTop = this.targetScrollTop;
            } else {
                if (!this.isAnimating) {
                    this.isAnimating = true;
                    this.loop();
                }
            }
        }
    }

    loop() {
        if (!this.isAnimating) return;
        const current = this.container.scrollTop;
        const diff = this.targetScrollTop - current;

        if (Math.abs(diff) < 0.5) {
            this.container.scrollTop = this.targetScrollTop;
            this.isAnimating = false;
            return;
        }

        this.container.scrollTop = current + (diff * 0.15);
        this.scrollFrameId = requestAnimationFrame(() => this.loop());
    }

    reset() {
        this.stop();
        if (this.container) this.container.scrollTop = 0;
    }
}