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

    // Xử lý nắn dấu quote tuỳ theo ngôn ngữ
    applySmartQuotes(char, expectedChar) {
        const DOUBLE_QUOTES = ['"', '“', '”', '«', '»', '「', '」', '『', '』'];
        const SINGLE_QUOTES = ["'", '‘', '’'];

        if (expectedChar) {
            if (DOUBLE_QUOTES.includes(char) && DOUBLE_QUOTES.includes(expectedChar)) return expectedChar;
            if (SINGLE_QUOTES.includes(char) && SINGLE_QUOTES.includes(expectedChar)) return expectedChar;
        }
        return char;
    }
};