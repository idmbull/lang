import { LocaleService } from '../locales/index.js';

const TIMESTAMP_REGEX = /^([\d.]+)\s+([\d.]+)/;

function cleanForTyping(text) {
    if (!text) return "";
    let s = text;
    s = s.replace(/\^\[[^\]]+\]/g, '');
    s = s.replace(/`[^`]+`/g, '');
    s = s.replace(/[*_~]+/g, '');
    s = s.replace(/[\r\n\t]+/g, ' ');
    s = s.replace(/\s+/g, ' ');
    return s;
}

function escapeAttr(s) {
    if (!s) return "";
    return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function convertMarkdownToPlain(md) {
    return md.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1')
        .replace(/__(.*?)__/g, '$1').replace(/_(.*?)_/g, '$1')
        .replace(/`(.*?)`/g, '$1').replace(/~~(.*?)~~/g, '$1')
        .replace(/#+\s*/g, '').replace(/>\s*/g, '')
        .replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim();
}

function formatHtmlContent(text) {
    const makeSpan = (word, note) => {
        const cleanWord = convertMarkdownToPlain(word);
        return `<span class="tooltip-word" data-note="${escapeAttr(note)}">${cleanWord}</span>`;
    };

    return text
        .replace(/`([^`]+)`/g, '<span class="skipped-text">$1</span>')
        .replace(/\*\*(.+?)\*\*\^\[([^\]]+)\]/g, (m, w, n) => makeSpan(w, n))
        .replace(/([.,;!?])\^\[([^\]]+)\]/g, (m, c, n) => makeSpan(c, n))
        .replace(/([^\s.,;!?\[\]\^]+)\^\[([^\]]+)\]/g, (m, w, n) => makeSpan(w, n))
        .replace(/\*\*(.+?)\*\*/g, "$1")
        .replace(/\*(.+?)\*/g, "$1")
        .replace(/__(.+?)__/g, "$1")
        .replace(/_(.+?)_/g, "$1");
}

function parseDictationLine(line, cleanFunc) {
    const parts = line.split("\t");
    let start = 0, end = 0, speaker = null, textRaw = "";

    if (parts.length >= 4) {
        start = parseFloat(parts[0]); end = parseFloat(parts[1]);
        speaker = parts[2].trim(); textRaw = parts.slice(3).join(" ").trim();
    } else {
        const m = line.match(/^([\d.]+)\s+([\d.]+)\s+(.*)$/);
        if (m) { start = parseFloat(m[1]); end = parseFloat(m[2]); textRaw = m[3].trim(); }
        else textRaw = line;
    }
    return { type: 'audio', start, end, speaker: cleanFunc(speaker), content: cleanFunc(textRaw) };
}

export const ContentParser = {
    parseUnified(rawContent) {
        const lines = rawContent.split(/\r?\n/);
        const language = LocaleService.detectLanguage(rawContent);

        const result = {
            title: "", text: "", html: "", language: language,
            segments: [], charStarts: []
        };

        let blocks = [];
        let isDictation = lines.some(line => TIMESTAMP_REGEX.test(line.trim()));
        let openDouble = true;

        const cleanLine = (text) => {
            if (!text) return "";
            let s = text.replace(/&nbsp;/gi, " ").replace(/\u00A0/g, " ").replace(/[—–]/g, "-").replace(/ …/g, "...").replace(/…/g, "...");

            if (language === 'zh') {
                s = s.replace(/"/g, () => {
                    let repl = openDouble ? '“' : '”';
                    openDouble = !openDouble;
                    return repl;
                });
            } else {
                s = s.replace(/[“”「」『』«»]/g, '"').replace(/[‘’]/g, "'");
            }
            return s.replace(/\u200B/g, "");
        };

        lines.forEach(line => {
            const trimmed = line.trim();
            if (!trimmed) {
                if (blocks.length > 0 && blocks[blocks.length - 1].type !== 'break') blocks.push({ type: 'break' });
                return;
            }

            if (trimmed.startsWith("# ")) {
                result.title = cleanLine(trimmed.replace("#", "").trim());
                return;
            }

            if (trimmed.startsWith("##")) blocks.push({ type: 'header', content: cleanLine(trimmed.replace(/^#+\s*/, "")) });
            else if (isDictation && TIMESTAMP_REGEX.test(trimmed)) blocks.push(parseDictationLine(trimmed, cleanLine));
            else blocks.push({ type: 'paragraph', content: cleanLine(trimmed) });
        });

        let currentParagraphHtml = "";
        let lastRawChar = null;
        let lastBlockWasBreak = false; // Biến đánh dấu chuyển đoạn văn

        const flushParagraph = () => {
            if (currentParagraphHtml) {
                result.html += `<p>${currentParagraphHtml}</p>`;
                result.html += '<span class="newline-char">↵</span>';
                currentParagraphHtml = "";
                lastRawChar = null;
            }
        };

        blocks.forEach((block) => {
            if (block.type === 'header' || block.type === 'break') {
                flushParagraph();
                if (block.type === 'header') result.html += `<h3 class="visual-header">${block.content}</h3>`;
                lastBlockWasBreak = true; // Đánh dấu đã xuống dòng
                return;
            }

            const cleanFragment = cleanForTyping(block.content);
            const hasTypingContent = cleanFragment.length > 0 && cleanFragment.trim().length > 0;
            const isSkippedLine = !hasTypingContent && block.content.trim().length > 0;

            if (hasTypingContent) {
                let prefix = "";
                if (result.text.length > 0) {
                    const endsWithSpace = result.text.endsWith(" ");
                    const startsWithSpace = cleanFragment.startsWith(" ");

                    if (!endsWithSpace && !startsWithSpace) {
                        // NẾU LÀ XUỐNG DÒNG (CHUYỂN ĐOẠN VĂN MỚI): Bắt buộc chèn khoảng trắng để ấn phím Enter
                        if (lastBlockWasBreak) {
                            prefix = " ";
                        }
                        // TRONG CÙNG 1 ĐOẠN VĂN: Tiếng Trung dính liền, Tiếng Anh cách nhau
                        else {
                            if (language === 'zh') {
                                const lastChar = result.text[result.text.length - 1];
                                const firstChar = cleanFragment[0];
                                if (/[a-zA-Z0-9]/.test(lastChar) && /[a-zA-Z0-9]/.test(firstChar)) prefix = " ";
                            } else {
                                prefix = " ";
                            }
                        }
                    }
                }

                result.charStarts.push(result.text.length + prefix.length);
                result.text += prefix + cleanFragment;

                if (block.type === 'audio') result.segments.push({ audioStart: block.start, audioEnd: block.end, text: cleanFragment.trim() });

                lastBlockWasBreak = false; // Reset lại trạng thái
            }
            else if (isSkippedLine) {
                if (result.text.length > 0 && !result.text.endsWith(" ")) result.text += " ";
                lastBlockWasBreak = false;
            }

            const speakerHtml = block.speaker ? `<span class="speaker-label">${block.speaker}: </span>` : "";
            const contentHtml = formatHtmlContent(block.content);

            let htmlPrefix = "";
            if (currentParagraphHtml) {
                if (language === 'zh') {
                    if (lastRawChar && block.content) {
                        const firstChar = block.content[0];
                        if (/[a-zA-Z0-9]/.test(lastRawChar) && /[a-zA-Z0-9]/.test(firstChar)) htmlPrefix = " ";
                    }
                } else {
                    htmlPrefix = " ";
                }
            }

            currentParagraphHtml += `${htmlPrefix}${speakerHtml}${contentHtml}`;
            if (block.content && block.content.length > 0) lastRawChar = block.content[block.content.length - 1];
        });

        flushParagraph();

        if (result.html.endsWith('<span class="newline-char">↵</span>')) {
            result.html = result.html.slice(0, -'<span class="newline-char">↵</span>'.length);
        }
        if (result.text) result.text = result.text.trimEnd();

        return result;
    }
};