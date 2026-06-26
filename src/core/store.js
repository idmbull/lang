const INITIAL_STATE = {
    isActive: false,
    mediaType: null, // null | 'audio' | 'video' | 'youtube'
    blindMode: false,
    currentLessonPath: null,
    source: {
        title: "",
        text: "",
        html: "",
        segments: [],
        charStarts: [],
        currentSegment: 0,
        audioUrl: null,
        language: 'en'
    },
    textSpans: [],
    wordTokens: [],
    wordStarts: [],
    startTime: null,
    endTime: null,
    stats: {
        totalKeys: 0,
        correctKeys: 0,
        errors: 0
    },
    prevInputLen: 0,
    prevIndex: 0
};

let state = JSON.parse(JSON.stringify(INITIAL_STATE));

export const Store = {
    getState: () => state,
    getSource: () => state.source,

    isAudio: () => state.mediaType !== null,
    getMediaType: () => state.mediaType,

    isBlind: () => state.blindMode,

    setCurrentSegment(index) {
        state.source.currentSegment = index;
    },

    setSourceUnified(data, mediaType, audioUrl, lessonPath = null) {
        this.reset();
        state.mediaType = mediaType;
        state.source = { ...data, audioUrl, currentSegment: 0 };
        state.currentLessonPath = lessonPath;
    },

    setBlindMode(isEnabled) { state.blindMode = isEnabled; },

    reset() {
        state.isActive = false;
        state.startTime = null;
        state.endTime = null;
        state.stats = { totalKeys: 0, correctKeys: 0, errors: 0 };
        state.prevInputLen = 0;
        state.prevIndex = 0;
        state.source.currentSegment = 0;
        state.textSpans = [];
        state.wordTokens = [];
        state.wordStarts = [];
    },

    startExercise() {
        if (state.isActive) return;
        state.isActive = true;
        state.startTime = Date.now();
        state.endTime = null;
    },

    stopExercise() {
        state.isActive = false;
        if (!state.endTime) state.endTime = Date.now();
    },

    addStats(isCorrect) {
        state.stats.totalKeys++;
        if (isCorrect) state.stats.correctKeys++;
        else state.stats.errors++;
    }
};