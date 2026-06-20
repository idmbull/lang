import { wrapChars } from '../utils/dom.js';
import { Store } from '../core/store.js';
import { marked } from 'marked';

export class TextDisplay {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
    }

    render(htmlContent, expectedText) {
        this.container.innerHTML = marked.parse(htmlContent);

        const walker = document.createTreeWalker(this.container, NodeFilter.SHOW_TEXT);
        const nodesToReplace = [];

        while (walker.nextNode()) {
            const node = walker.currentNode;
            const p = node.parentElement;
            if (p.closest('.visual-header') || p.closest('.speaker-label') || p.closest('.skipped-text')) continue;
            // Đã xóa lệnh lọc khoảng trắng sai lầm ở đây
            nodesToReplace.push(node);
        }

        nodesToReplace.forEach(node => {
            const parent = node.parentNode;
            let text = node.textContent;
            
            // Giải pháp mới: Chỉ xóa các dấu xuống dòng \n rác do thư viện marked sinh ra.
            // Giữ nguyên 100% các khoảng trắng (Space) hợp lệ của người dùng.
            text = text.replace(/[\r\n]+/g, '');
            
            if (text === '') {
                // Xóa bỏ node nếu nó là rác
                node.remove();
                return;
            }

            if (parent.classList?.contains("tooltip-word")) {
                parent.innerHTML = "";
                parent.appendChild(wrapChars(text, "tooltip-char", parent.dataset.note || ""));
            } else {
                parent.replaceChild(wrapChars(text), node);
            }
        });

        // Xử lý vị trí dấu Enter (↵) xuống dòng
        this.container.querySelectorAll(':scope > .newline-char').forEach(span => {
            let prev = span.previousElementSibling;
            while (prev && (prev.tagName === 'BR' || prev.classList.contains('visual-break'))) {
                prev = prev.previousElementSibling;
            }
            
            if (!prev || prev.classList.contains('visual-header')) {
                span.remove();
            } else if (/^(P|DIV|H[1-6]|LI|BLOCKQUOTE)$/.test(prev.tagName)) {
                const lastCharNode = prev.lastElementChild;
                prev.appendChild(span);
                if (span.nextElementSibling?.classList.contains('visual-break')) {
                    prev.appendChild(span.nextElementSibling);
                }

                if (lastCharNode && lastCharNode.tagName === 'SPAN') {
                    const wrapper = document.createElement('span');
                    wrapper.className = 'nowrap-group';
                    wrapper.style.whiteSpace = 'nowrap';
                    prev.insertBefore(wrapper, lastCharNode);
                    wrapper.appendChild(lastCharNode);
                    wrapper.appendChild(span);
                }
            }
        });

        this.container.querySelectorAll(':scope > br').forEach(br => br.remove());

        const rawSpans = Array.from(this.container.querySelectorAll("span")).filter(s =>
            !s.children.length && !s.classList.contains('tooltip-word') &&
            !s.closest('.speaker-label') && !s.closest('.visual-header') && !s.closest('.skipped-text')
        );

        const verifiedSpans = [];
        let textIdx = 0;
        
        // Quá trình dóng hàng Span và Logic (Sẽ chính xác 100% sau khi sửa lỗi trên)
        for (const span of rawSpans) {
            if (textIdx >= expectedText.length) break;
            const spanChar = span.textContent;
            const expectedChar = expectedText[textIdx];
            const isNewlineSpan = span.classList.contains('newline-char');
            const effectiveSpanChar = isNewlineSpan ? " " : spanChar;

            if (effectiveSpanChar === expectedChar) {
                verifiedSpans.push(span);
                textIdx++;
            } else if (effectiveSpanChar === ' ' && expectedChar !== ' ') {
                // Bỏ qua phantom space
            } else {
                verifiedSpans.push(span);
                textIdx++;
            }
        }

        Store.getState().textSpans = verifiedSpans;
        this.updateCursor(0, [], expectedText, ""); 
    }

    updateCursor(caret, changedIndices, expectedText, currentText) {
        const spans = Store.getState().textSpans;
        changedIndices.forEach(i => {
            const span = spans[i];
            if (!span) return;
            span.classList.remove("current", "correct", "incorrect");
            if (i < caret) {
                span.classList.add(currentText[i] === expectedText[i] ? "correct" : "incorrect");
            }
        });
        if (spans[caret]) spans[caret].classList.add("current");
    }
}
