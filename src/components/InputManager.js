import { Store } from '../core/store.js';
import { TypingEngine } from '../engine/typing-engine.js';
import { EventBus, EVENTS } from '../core/eventBus.js';
import { LocaleService } from '../locales/index.js';

export class InputManager {
    constructor(inputId) {
        this.input = document.getElementById(inputId);
        this.virtualValue = "";

        // Các biến phục vụ IME
        this.isComposing = false;
        this.imeTooltipEl = null;
        this.cachedSpanRect = null;

        this.initEvents();
    }

    // --- HỆ THỐNG IME TOOLTIP ---
    getOrCreateImeTooltip() {
        if (!this.imeTooltipEl) {
            this.imeTooltipEl = document.createElement('div');
            this.imeTooltipEl.className = 'ime-tooltip';
            document.body.appendChild(this.imeTooltipEl);
        }
        return this.imeTooltipEl;
    }

    updateImeTooltip(text) {
        const tooltip = this.getOrCreateImeTooltip();
        if (!text) {
            tooltip.classList.remove('visible');
            return;
        }

        tooltip.textContent = text;

        if (this.cachedSpanRect) {
            const bottomPos = window.innerHeight - this.cachedSpanRect.top + 5;
            tooltip.style.bottom = `${bottomPos}px`;
            tooltip.style.left = `${this.cachedSpanRect.left}px`;
            tooltip.style.top = 'auto';
        }
        tooltip.classList.add('visible');
    }

    hideImeTooltip() {
        if (this.imeTooltipEl) this.imeTooltipEl.classList.remove('visible');
    }

    // Đồng bộ vị trí Ô gõ ẩn với Con trỏ trên màn hình (Chống nhảy Box gợi ý Windows)
    syncInputPosition() {
        const state = Store.getState();
        const currentSpan = state.textSpans[state.prevIndex || 0];
        const inputArea = document.querySelector('.input-area');

        if (currentSpan && inputArea && this.input) {
            const rect = currentSpan.getBoundingClientRect();
            this.cachedSpanRect = rect;

            // Cố tình làm to textarea ẩn để tránh rớt dòng gây nhảy IME
            inputArea.style.top = `${rect.top}px`;
            inputArea.style.left = `${rect.left}px`;
            inputArea.style.width = `1000px`;
            inputArea.style.height = `200px`;

            this.input.style.whiteSpace = 'nowrap';
            this.input.style.overflow = 'hidden';
            this.input.style.width = '1000px';
            this.input.style.height = '200px';

            const style = window.getComputedStyle(currentSpan);
            this.input.style.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
            this.input.style.lineHeight = style.lineHeight;

            if (this.isComposing && this.imeTooltipEl && this.imeTooltipEl.classList.contains('visible')) {
                const bottomPos = window.innerHeight - rect.top + 5;
                this.imeTooltipEl.style.bottom = `${bottomPos}px`;
                this.imeTooltipEl.style.left = `${rect.left}px`;
            }
        }
    }

    // --- LẮNG NGHE SỰ KIỆN BÀN PHÍM ---
    initEvents() {
        // Phím bình thường (Backspace, Enter)
        this.input.addEventListener('keydown', (e) => {
            if (this.isComposing) return;
            if (e.key === 'Backspace' && this.virtualValue.length > 0) {
                this.virtualValue = this.virtualValue.slice(0, -1);
                this.processInput();
            } else if (e.key === 'Enter') {
                e.preventDefault();
                this.virtualValue += " ";
                this.processInput();
            }
        });

        // KHI BẮT ĐẦU GÕ BỘ GÕ (Ví dụ: Pinyin, Hangul)
        this.input.addEventListener('compositionstart', () => {
            this.isComposing = true;
            this.syncInputPosition();
        });

        // KHI ĐANG GÕ BỘ GÕ (Đang hiện Pinyin)
        this.input.addEventListener('compositionupdate', (e) => {
            this.isComposing = true;
            this.updateImeTooltip(e.data);
        });

        // KHI XÁC NHẬN CHỮ BỘ GÕ (Ấn Space hoặc số để chọn chữ)
        this.input.addEventListener('compositionend', (e) => {
            this.isComposing = false;
            this.hideImeTooltip();

            let committedText = e.data;
            if (committedText) {
                const state = Store.getState();
                const expectedChar = state.source.text[this.virtualValue.length];
                committedText = LocaleService.applySmartQuotes(committedText, expectedChar);
                this.virtualValue += committedText;
            }
            this.input.value = "";
            this.processInput();
            requestAnimationFrame(() => this.syncInputPosition());
        });

        // KHI GÕ CHỮ LATIN BÌNH THƯỜNG HOẶC PASTE
        this.input.addEventListener('input', (e) => {
            if (this.isComposing) return;
            if (e.inputType === 'insertText' || e.inputType === 'insertFromPaste') {
                let char = e.data || this.input.value;
                if (char) {
                    const expectedChar = Store.getState().source.text[this.virtualValue.length];
                    this.virtualValue += LocaleService.applySmartQuotes(char, expectedChar);
                }
                this.input.value = "";
                this.processInput();
            }
        });

        // Lắng nghe khi thay đổi kích thước web hoặc cuộn trang để bám theo con trỏ
        window.addEventListener('resize', () => this.syncInputPosition());
        const textContainer = document.getElementById('textContainer');
        if (textContainer) {
            textContainer.addEventListener('scroll', () => {
                requestAnimationFrame(() => this.syncInputPosition());
            });
        }
    }

    // --- XỬ LÝ ĐẦU VÀO VÀ ĐẨY SANG ENGINE ---
    processInput() {
        const state = Store.getState();
        const expected = state.source.text;

        let currentText = this.virtualValue.replace(/\n/g, " ");
        if (currentText.length > expected.length) {
            currentText = currentText.slice(0, expected.length);
            this.virtualValue = currentText;
        }

        if (!state.isActive && currentText.length > 0) {
            Store.startExercise();
            EventBus.emit(EVENTS.EXERCISE_START);
        }

        const result = TypingEngine.evaluateTyping(
            currentText, expected, state.prevInputLen,
            state.wordStarts, state.wordTokens,
            state.furthestSpokenIndex || -1
        );

        const prev = state.prevIndex;
        const caret = result.caret;
        const changed = [];
        const start = Math.max(0, Math.min(prev, caret) - 5);
        const end = Math.min(state.textSpans.length - 1, Math.max(prev, caret) + 5);
        for (let i = start; i <= end; i++) changed.push(i);

        state.furthestSpokenIndex = result.newFurthestIndex;
        state.prevIndex = caret;
        state.prevInputLen = currentText.length;
        Store.addStats(result.isCorrect);

        EventBus.emit(EVENTS.INPUT_CHANGE, {
            caret, changed, expectedText: expected, currentText,
            wordToSpeak: result.wordToSpeak,
            isComplete: result.isComplete
        });

        // Cập nhật lại vị trí box IME sau mỗi lần gõ
        this.syncInputPosition();
    }
}