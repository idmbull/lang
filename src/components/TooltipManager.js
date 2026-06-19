import { marked } from 'marked';

export class TooltipManager {
    constructor(containerId, tooltipId) {
        this.container = document.getElementById(containerId);
        this.tooltip = document.getElementById(tooltipId);
        this.hoverTimer = null;

        this.initEvents();
    }

    initEvents() {
        // Sử dụng Event Delegation (Lắng nghe toàn bộ container thay vì từng chữ)
        this.container.addEventListener('mouseover', (e) => {
            const wordEl = e.target.closest('.tooltip-word');
            if (wordEl) this.show(wordEl);
        });

        this.container.addEventListener('mouseout', (e) => {
            const wordEl = e.target.closest('.tooltip-word');
            if (wordEl) this.hide();
        });
    }

    show(wordElement) {
        clearTimeout(this.hoverTimer);
        this.hoverTimer = setTimeout(() => {
            const note = wordElement.dataset.note || "";
            this.tooltip.innerHTML = marked.parseInline(note);
            this.tooltip.classList.add("visible");

            const rect = wordElement.getBoundingClientRect();
            this.positionTooltip(rect);
        }, 150);
    }

    hide() {
        clearTimeout(this.hoverTimer);
        this.tooltip.classList.remove("visible");
    }

    // Hiển thị tooltip ngay tại vị trí con trỏ đang gõ
    showAtSpan(span) {
        const wrapper = span.closest('.tooltip-word');
        if (wrapper) {
            this.tooltip.innerHTML = marked.parseInline(wrapper.dataset.note || "");
            this.tooltip.classList.add("visible");
            this.positionTooltip(span.getBoundingClientRect());
        } else {
            this.hide();
        }
    }

    positionTooltip(rect) {
        const ttWidth = this.tooltip.offsetWidth;
        const ttHeight = this.tooltip.offsetHeight;
        let left = rect.left + rect.width / 2 - ttWidth / 2;
        let top = rect.bottom + 8; // Mặc định ở dưới

        this.tooltip.classList.remove("pos-top", "pos-bottom");

        // Nếu ở dưới bị tràn màn hình thì đẩy lên trên
        if (top + ttHeight > window.innerHeight - 8) {
            top = rect.top - ttHeight - 8;
            this.tooltip.classList.add("pos-top");
        } else {
            this.tooltip.classList.add("pos-bottom");
        }

        // Ép không cho tràn 2 bên
        if (left < 8) left = 8;
        if (left + ttWidth > window.innerWidth - 8) left = window.innerWidth - ttWidth - 8;

        this.tooltip.style.left = `${Math.round(left)}px`;
        this.tooltip.style.top = `${Math.round(top)}px`;

        // Căn mũi tên
        const arrowLeft = Math.round(rect.left + rect.width / 2 - left - 8);
        this.tooltip.style.setProperty("--arrow-left", `${arrowLeft}px`);
    }
}