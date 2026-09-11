const REGEX_KOREAN = /[\uAC00-\uD7AF]/;
const REGEX_CHINESE = /[\u4e00-\u9fa5]/;
const REGEX_PUNCTUATION = /^[.,!?;:'"(){}[\]\u3000-\u303F\uFF00-\uFFEF]+$/;

export const LocaleService = {
    detectLanguage(text) {
        if (!text) return 'en';
        if (REGEX_KOREAN.test(text)) return 'ko';
        if (REGEX_CHINESE.test(text)) return 'zh';
        return 'en';
    },

    isKorean(text) { return REGEX_KOREAN.test(text); },
    isChinese(text) { return REGEX_CHINESE.test(text); },
    isPunctuation(text) { return REGEX_PUNCTUATION.test(text); },

    // CỖ MÁY ÉP KIỂU DẤU CÂU THÔNG MINH
    applySmartQuotes(incomingStr, expectedText, currentCaret) {
        if (!incomingStr || !expectedText) return incomingStr;
        
        let result = "";
        
        const PUNCTUATIONS = [
            ['"', '“', '”', '«', '»'],
            ["'", '‘', '’'],
            [',', '，', '、'],
            ['.', '。'],
            ['!', '！'],
            ['?', '？'],
            [':', '：'],
            [';', '；'],
            ['(', '（'],
            [')', '）'],
            ['[', '【', '「', '『'],
            [']', '】', '」', '』'],
            ['-', '—', '–', '―', '——'] // [BỔ SUNG VÀO ĐÂY]: Anh em nhà dấu gạch ngang
        ];

        for (let i = 0; i < incomingStr.length; i++) {
            const char = incomingStr[i];
            const expectedChar = expectedText[currentCaret + i];
            
            let mappedChar = char;
            
            if (expectedChar) {
                for (const group of PUNCTUATIONS) {
                    if (group.includes(char) && group.includes(expectedChar)) {
                        mappedChar = expectedChar;
                        break;
                    }
                }
            }
            result += mappedChar;
        }
        
        return result;
    }
};
