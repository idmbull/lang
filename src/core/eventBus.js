const listeners = {};

export const EventBus = {
    on(eventName, callback) {
        if (!listeners[eventName]) listeners[eventName] = [];
        listeners[eventName].push(callback);
    },
    off(eventName, callback) {
        if (!listeners[eventName]) return;
        listeners[eventName] = listeners[eventName].filter(cb => cb !== callback);
    },
    emit(eventName, data) {
        if (!listeners[eventName]) return;
        listeners[eventName].forEach(callback => {
            try {
                callback(data);
            } catch (err) {
                console.error(`[EventBus Error] "${eventName}":`, err);
            }
        });
    }
};

export const EVENTS = {
    EXERCISE_START: 'exercise:start',
    EXERCISE_STOP: 'exercise:stop',
    EXERCISE_COMPLETE: 'exercise:complete',
    INPUT_CHANGE: 'input:change',
    INPUT_NEW_WORD: 'input:new_word',
    AUDIO_PRELOAD: 'audio:preload',
    DICTATION_SEGMENT_CHANGE: 'dictation:segment_change',
    THEME_CHANGED: 'ui:theme_changed'
};