import { CONFIG } from "../core/config.js";
import { LocaleService } from "../locales/index.js";

const audioCache = {};
let clickCtx = null;
let clickBuffer = null;

const checkUrl = (url) => new Promise(resolve => {
    const audio = new Audio();
    // Dùng onloadedmetadata để check header cực nhanh (không chờ tải data)
    audio.onloadedmetadata = () => resolve(true);
    audio.onerror = () => resolve(false);
    audio.src = url;
    // Nâng thời gian chờ lên 1.5 giây để từ điển nước ngoài kịp phản hồi
    setTimeout(() => resolve(false), 1500);
});

const normalize = (word) => (word || "").trim().toLowerCase().replace(/['-]/g, "_");

function getDictUrls(key, raw) {
    if (LocaleService.isChinese(raw)) {
        const encoded = encodeURIComponent(raw);
        return [
            `https://dict.youdao.com/dictvoice?audio=${encoded}&le=zh`,
            `${CONFIG.AUDIO_SOURCES.TTS}zh&text=${encoded}`
        ];
    }
    if (LocaleService.isKorean(raw)) {
        return [`${CONFIG.AUDIO_SOURCES.TTS}ko&text=${encodeURIComponent(raw)}`];
    }

    const { AUDIO_SOURCES } = CONFIG;
    const f1 = key[0] || "_";
    const f3 = key.slice(0, 3).padEnd(3, "_");
    const f5 = key.slice(0, 5).padEnd(5, "_");

    const oxfUrl = key.includes("_")
        ? `${AUDIO_SOURCES.OXFORD}${f1}/${f3}/${f5}/${key}_1_us_1.mp3`
        : `${AUDIO_SOURCES.OXFORD}${f1}/${f3}/${f5}/${key}__us_1.mp3`;

    return [
        oxfUrl,
        `${AUDIO_SOURCES.CAMBRIDGE}${f1}/${f3}/${f5}/${key}.mp3`,
        `${AUDIO_SOURCES.YOUDAO}${key}`,
        `${AUDIO_SOURCES.TTS}en&text=${encodeURIComponent(raw || key)}`
    ];
}

export const AudioResolver = {
    // === TÌM LINK TỪ ĐIỂN ===
    async resolveUrl(rawWord) {
        const key = normalize(rawWord);
        if (!key) return null;

        const dictUrls = getDictUrls(key, rawWord);
        const ttsFallback = dictUrls.pop();

        // Chạy kiểm tra tất cả các từ điển cùng 1 lúc (tăng tốc độ gấp 3 lần)
        const checkPromises = dictUrls.map(url => checkUrl(url));
        const results = await Promise.all(checkPromises);

        for (let i = 0; i < dictUrls.length; i++) {
            if (results[i]) return dictUrls[i];
        }

        return ttsFallback;
    },

    async preloadWord(word) {
        const clean = normalize(word);
        if (!clean || audioCache[clean]) return;

        audioCache[clean] = "loading";
        const url = await this.resolveUrl(word);
        if (url) {
            const audio = new Audio(url);
            audio.preload = "auto";
            audioCache[clean] = audio;
        } else {
            delete audioCache[clean];
        }
    },

    // GIỌNG ĐỌC CỨU CÁNH (Native TTS của Window/Mac)
    playNativeTTS(word) {
        console.log("🎤 Dùng giọng đọc máy tính (Native TTS) cho:", word);
        const utterance = new SpeechSynthesisUtterance(word);
        const lang = LocaleService.detectLanguage(word);
        if (lang === 'zh') utterance.lang = 'zh-CN';
        else if (lang === 'ko') utterance.lang = 'ko-KR';
        else utterance.lang = 'en-US';
        window.speechSynthesis.speak(utterance);
    },

    // === TÍNH NĂNG ĐỌC TỪ VỰNG CHÍNH ===
    async playWord(word) {
        const clean = normalize(word);
        if (!clean) return;

        console.log("Đang tải âm thanh cho từ:", word);
        let urlToPlay = null;

        if (audioCache[clean] && audioCache[clean] !== "loading") {
            urlToPlay = audioCache[clean].src;
        } else {
            urlToPlay = await this.resolveUrl(word);
            if (urlToPlay) {
                const audio = new Audio(urlToPlay);
                audio.preload = "auto";
                audioCache[clean] = audio;
            }
        }

        if (urlToPlay) {
            console.log("▶️ Phát Audio URL:", urlToPlay);
            const player = new Audio(urlToPlay);
            // Nếu trình duyệt chặn Audio (lỗi đỏ ở console), nó sẽ tự động rơi xuống đây gọi giọng đọc máy ảo
            player.play().catch(e => {
                console.warn("Trình duyệt chặn Audio web, tự động chuyển sang giọng máy (Native TTS):", e);
                this.playNativeTTS(word);
            });
        } else {
            // Nếu mạng mất, hoặc từ vựng sai, hoặc các URL đều chết
            this.playNativeTTS(word);
        }
    },

    // === TÍNH NĂNG TIẾNG GÕ PHÍM ===
    async loadClickSound() {
        if (clickBuffer) return;
        try {
            clickCtx = new (window.AudioContext || window.webkitAudioContext)();
            const resp = await fetch(CONFIG.CLICK_SOUNDS.cream);
            clickBuffer = await clickCtx.decodeAudioData(await resp.arrayBuffer());
        } catch (e) {
            console.error("Không tải được tiếng gõ phím:", e);
        }
    },

    playClick() {
        if (!clickBuffer) {
            this.loadClickSound();
            return;
        }
        if (clickCtx.state === 'suspended') clickCtx.resume();
        const src = clickCtx.createBufferSource();
        src.buffer = clickBuffer;
        const gain = clickCtx.createGain();
        gain.gain.value = 4.0;
        src.connect(gain).connect(clickCtx.destination);
        src.start(0);
    }
};