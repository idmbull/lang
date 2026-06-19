import { LocaleService } from '../locales/index.js';

export const TypingEngine = {
    // 1. Phân tách từ vựng để phát âm
    computeWords(text, language) {
        const tokens = [];
        const starts = [];
        if (!text) return { tokens, starts };

        if (typeof Intl !== 'undefined' && Intl.Segmenter) {
            const segmenter = new Intl.Segmenter(language, { granularity: 'word' });
            for (const segment of segmenter.segment(text)) {
                if (segment.isWordLike) {
                    tokens.push(segment.segment);
                    starts.push(segment.index);
                }
            }
        } else {
            const re = /[a-z0-9\u4e00-\u9fa5\uAC00-\uD7AF]+(?:[,'./-][a-z0-9\u4e00-\u9fa5\uAC00-\uD7AF]+)*/gi;
            let m;
            while ((m = re.exec(text)) !== null) {
                tokens.push(m[0]);
                starts.push(m.index);
            }
        }
        return { tokens, starts };
    },

    // 2. Phân tích trạng thái khi người dùng đang gõ
    evaluateTyping(currentText, expectedText, prevInputLen, wordStarts, wordTokens, furthestSpokenIndex) {
        const caret = currentText.length;
        const isComplete = (caret === expectedText.length && currentText === expectedText);
        const isDeleting = caret < prevInputLen;

        let newFurthestIndex = furthestSpokenIndex;
        let wordToSpeak = null;

        // Nếu xoá chữ, lùi mốc phát âm lại
        if (isDeleting) {
            if (caret === 0) newFurthestIndex = -1;
            else {
                const currentWordIdx = this._getWordIndexAtCaret(caret, wordStarts, wordTokens);
                if (currentWordIdx !== -1) {
                    newFurthestIndex = Math.min(newFurthestIndex, currentWordIdx + 1);
                }
            }
        } else {
            // Nếu gõ tới từ mới, phát âm từ đó
            for (let i = 0; i < wordStarts.length; i++) {
                const start = wordStarts[i];
                const end = start + wordTokens[i].length;

                if (caret >= start && caret <= end) {
                    const token = wordTokens[i];
                    if (!LocaleService.isPunctuation(token) && (caret === start + 1 || caret === end) && i > newFurthestIndex) {
                        newFurthestIndex = i;
                        wordToSpeak = token;
                        break;
                    }
                }
            }
        }

        return {
            caret,
            isComplete,
            wordToSpeak,
            newFurthestIndex,
            isCorrect: caret > 0 && currentText[caret - 1] === expectedText[caret - 1]
        };
    },

    _getWordIndexAtCaret(caret, wordStarts, wordTokens) {
        for (let i = 0; i < wordStarts.length; i++) {
            if (caret >= wordStarts[i] && caret <= wordStarts[i] + wordTokens[i].length) return i;
        }
        for (let i = wordStarts.length - 1; i >= 0; i--) {
            if (caret >= wordStarts[i]) return i;
        }
        return -1;
    }
};