import './styles/variables.css';
import './styles/layout.css';
import './styles/typing.css';

import { ContentParser } from './engine/content-parser.js';
import { TypingEngine } from './engine/typing-engine.js';
import { Store } from './core/store.js';
import { EventBus, EVENTS } from './core/eventBus.js';

import { TextDisplay } from './components/TextDisplay.js';
import { InputManager } from './components/InputManager.js';
import { PlaylistDropdown } from './components/PlaylistDropdown.js';
import { AudioResolver } from './services/audio-resolver.js';
import { AutoScroller } from './utils/scroller.js';
import { TooltipManager } from './components/TooltipManager.js';
import { TimerService } from './services/timer.js';
import { VocabManager } from './components/VocabManager.js';
import { DictationManager } from './components/DictationManager.js';
import { SuperAudioPlayer } from './services/audio-player.js';

console.log("=== IDM TYPING MASTER FULLY LOADED ===");

const AUDIO_BASE = "https://cdn.jsdelivr.net/gh/idmbull/english@main/assets/audio/";

// =================================================================
// 0. KHÔI PHỤC CÀI ĐẶT NGƯỜI DÙNG (LƯU TRẠNG THÁI)
// =================================================================
function restoreUserPreferences() {
  const getBool = (key, defaultVal) => {
    const val = localStorage.getItem(key);
    return val === null ? defaultVal : val === 'true';
  };

  // Sound
  const soundToggle = document.getElementById('soundToggle');
  if (soundToggle) {
    soundToggle.checked = getBool('pref_sound', true);
    soundToggle.addEventListener('change', e => localStorage.setItem('pref_sound', e.target.checked));
  }

  // Speak
  const speakToggle = document.getElementById('autoPronounceToggle');
  if (speakToggle) {
    speakToggle.checked = getBool('pref_speak', true);
    speakToggle.addEventListener('change', e => localStorage.setItem('pref_speak', e.target.checked));
  }

  // Tooltips
  const tooltipToggle = document.getElementById('autoTooltipToggle');
  if (tooltipToggle) {
    tooltipToggle.checked = getBool('pref_tooltip', true);
    tooltipToggle.addEventListener('change', e => localStorage.setItem('pref_tooltip', e.target.checked));
  }

  // Theme (Giao diện)
  const themeSelect = document.getElementById('themeSelect');
  if (themeSelect) {
    const savedTheme = localStorage.getItem('pref_theme') || 'english';
    themeSelect.value = savedTheme;
    document.documentElement.setAttribute('data-theme', savedTheme);

    themeSelect.addEventListener('change', (e) => {
      document.documentElement.setAttribute('data-theme', e.target.value);
      localStorage.setItem('pref_theme', e.target.value);
    });
  }

  // Blind Mode (Lưu trạng thái)
  const blindToggle = document.getElementById('blindModeToggle');
  if (blindToggle) {
    const isBlind = getBool('pref_blind', false);
    blindToggle.checked = isBlind;
    document.body.classList.toggle('blind-mode', isBlind);

    blindToggle.addEventListener('change', (e) => {
      const checked = e.target.checked;
      document.body.classList.toggle('blind-mode', checked);
      localStorage.setItem('pref_blind', checked);

      if (checked) applyBlindModeUI(Store.getState().prevIndex);
      else Store.getState().textSpans.forEach(s => s.classList.remove("blind-hidden"));

      document.getElementById('textInput').focus();
    });
  }
}
restoreUserPreferences(); // Chạy ngay khi load web

// =================================================================
// 1. KHỞI TẠO CÁC COMPONENT
// =================================================================
const displayUI = new TextDisplay('textDisplay');
const inputUI = new InputManager('textInput');
const playlistUI = new PlaylistDropdown('playlistTrigger', 'playlistContent');
const scroller = new AutoScroller('textContainer');
const tooltipUI = new TooltipManager('textContainer', 'globalTooltip');
const vocabManager = new VocabManager();
const dictationUI = new DictationManager();
const audioPlayer = new SuperAudioPlayer();

let isGlobalPlaying = false;

// =================================================================
// 2. CÁC HÀM TIỆN ÍCH DÙNG CHUNG
// =================================================================
function updatePlayIcon(isPlaying) {
  isGlobalPlaying = isPlaying;
  const btn = document.getElementById('dictationPlayAllBtn');
  if (btn) {
    btn.textContent = isPlaying ? "⏸" : "▶";
    btn.style.color = isPlaying ? "var(--correct-color)" : "inherit";
    btn.style.borderColor = isPlaying ? "var(--correct-color)" : "var(--border-color)";
  }
}

function applyBlindModeUI(caretPos) {
  Store.getState().textSpans.forEach((s, i) => s.classList.toggle("blind-hidden", i > caretPos));
}

function toggleExercise(isStarting) {
  const textInput = document.getElementById('textInput');
  const actionToggle = document.getElementById('actionToggle');
  if (actionToggle) actionToggle.checked = isStarting;

  if (isStarting) {
    document.getElementById('actionLabel').textContent = "Stop";
    document.getElementById('actionLabel').style.color = "var(--incorrect-color)";
    Store.startExercise();

    AudioResolver.playClick();

    if (Store.isAudio()) {
      if (audioPlayer.ctx?.state === 'suspended') audioPlayer.ctx.resume();
      const src = Store.getSource();
      const seg = src.segments[src.currentSegment];
      if (seg) {
        if (audioPlayer.buffer) audioPlayer.playSegment(seg.audioStart, seg.audioEnd);
        else if (document.getElementById('autoPronounceToggle').checked) AudioResolver.playNativeTTS(seg.text);
      }
    }

    TimerService.start(({ time, wpm }) => {
      document.getElementById('time').textContent = time;
      document.getElementById('wpm').textContent = wpm;
    });
  } else {
    document.getElementById('actionLabel').textContent = "Start";
    document.getElementById('actionLabel').style.color = "var(--correct-color)";
    Store.stopExercise();
    TimerService.stop();
    audioPlayer.stop();
    updatePlayIcon(false);
  }

  textInput.disabled = false;
  textInput.focus();
}

// =================================================================
// 3. CẤU HÌNH AUDIO PLAYER
// =================================================================
const volInput = document.getElementById('dictationVolume');
if (volInput) {
  audioPlayer.setVolume(parseFloat(volInput.value));
  volInput.oninput = (e) => audioPlayer.setVolume(parseFloat(e.target.value));
}

const playAllBtn = document.getElementById('dictationPlayAllBtn');
if (playAllBtn) {
  audioPlayer.onEnded = () => {
    updatePlayIcon(false);
    audioPlayer.pausedAt = 0;
  };
  playAllBtn.onclick = () => {
    if (!Store.isAudio()) return;
    if (audioPlayer.isPlaying) {
      audioPlayer.pause();
      updatePlayIcon(false);
    } else {
      if (audioPlayer.pausedAt === 0) {
        const src = Store.getSource();
        if (src.segments && src.segments[src.currentSegment]) {
          audioPlayer.pausedAt = src.segments[src.currentSegment].audioStart;
        }
      }
      audioPlayer.resume();
      updatePlayIcon(true);
    }
    document.getElementById('textInput').focus();
  };
}

// =================================================================
// 4. HÀM LOAD BÀI HỌC VÀO APP
// =================================================================
async function loadLessonToApp(title, content, path = null, audioBuffer = null, enableBlindMode = false) {
  document.getElementById('pageTitle').textContent = title;

  const parsed = ContentParser.parseUnified(content);
  const words = TypingEngine.computeWords(parsed.text, parsed.language);

  let finalAudioBuffer = audioBuffer;

  if (!finalAudioBuffer && path && parsed.segments && parsed.segments.length > 0) {
    console.log(`Đang tải file MP3 cho bài: ${title}...`);
    try {
      const mp3Url = `${AUDIO_BASE}${encodeURIComponent(title)}.mp3`;
      const resp = await fetch(mp3Url);
      if (resp.ok) finalAudioBuffer = await resp.arrayBuffer();
      else console.warn("Không tìm thấy file MP3 tương ứng trên server.");
    } catch (e) { console.error("Lỗi tải MP3:", e); }
  }

  const hasAudio = finalAudioBuffer !== null || (parsed.segments && parsed.segments.length > 0);

  Store.setSourceUnified(parsed, hasAudio, null, path);
  Store.getState().wordTokens = words.tokens;
  Store.getState().wordStarts = words.starts;

  // Apply Blind mode (Kết hợp logic Cài đặt và logic Modal)
  const isBlind = enableBlindMode || document.getElementById('blindModeToggle').checked;
  document.body.classList.toggle('blind-mode', isBlind);

  displayUI.render(parsed.html, parsed.text);
  if (isBlind) applyBlindModeUI(0);

  if (finalAudioBuffer) {
    await audioPlayer.load(finalAudioBuffer);
    console.log("✅ Đã nạp MP3 thành công!");
  } else {
    audioPlayer.clear();
  }

  const mediaControls = document.getElementById('mediaControls');
  const volumeControl = document.getElementById('volumeControl');
  if (hasAudio && audioPlayer.buffer) {
    mediaControls.classList.remove('hidden');
    volumeControl.classList.remove('hidden');
    document.getElementById('headerSubtitle').textContent = "Nghe kỹ - Gõ chính xác";
  } else {
    mediaControls.classList.add('hidden');
    volumeControl.classList.add('hidden');
    document.getElementById('headerSubtitle').textContent = "Tập trung - Thư giãn - Phát triển";
  }

  words.tokens.slice(0, 5).forEach(word => AudioResolver.preloadWord(word));

  scroller.reset();

  TimerService.stop();
  updatePlayIcon(false);
  ['time', 'wpm', 'errors'].forEach(id => document.getElementById(id).textContent = id === 'errors' ? '0' : '0s');
  document.getElementById('accuracy').textContent = '100%';

  const textInput = document.getElementById('textInput');
  textInput.value = "";
  inputUI.virtualValue = "";
  textInput.disabled = false;

  const actionToggle = document.getElementById('actionToggle');
  if (actionToggle) actionToggle.checked = false;
  document.getElementById('actionLabel').textContent = "Start";
  document.getElementById('actionLabel').style.color = "var(--correct-color)";
  textInput.focus();
}

EventBus.on('app:load_lesson', (data) => loadLessonToApp(data.title, data.content, data.path));
EventBus.on('app:load_local_lesson', (data) => loadLessonToApp(data.title, data.content, null, data.audioBuffer, data.enableBlindMode));

EventBus.on(EVENTS.EXERCISE_START, () => {
  const actionToggle = document.getElementById('actionToggle');
  if (actionToggle && !actionToggle.checked) {
    toggleExercise(true);
  }
});

// =================================================================
// 5. XỬ LÝ SỰ KIỆN GÕ BÀN PHÍM
// =================================================================
EventBus.on(EVENTS.INPUT_CHANGE, (data) => {
  if (document.getElementById('soundToggle').checked) AudioResolver.playClick();

  displayUI.updateCursor(data.caret, data.changed, data.expectedText, data.currentText);

  const currentSpan = Store.getState().textSpans[data.caret];
  if (currentSpan) {
    scroller.scrollTo(currentSpan);
    if (document.getElementById('autoTooltipToggle').checked) tooltipUI.showAtSpan(currentSpan);
    else tooltipUI.hide();
  }

  if (document.body.classList.contains('blind-mode')) applyBlindModeUI(data.caret);

  if (Store.isAudio() && !isGlobalPlaying) {
    const src = Store.getSource();
    const oldSegIdx = src.currentSegment;

    let newSegIdx = 0;
    for (let i = src.charStarts.length - 1; i >= 0; i--) {
      if (data.caret >= src.charStarts[i]) { newSegIdx = i; break; }
    }

    if (newSegIdx > oldSegIdx) {
      Store.setCurrentSegment(newSegIdx);
      const seg = src.segments[newSegIdx];
      if (seg) {
        if (audioPlayer.buffer) audioPlayer.playSegment(seg.audioStart, seg.audioEnd);
        else if (document.getElementById('autoPronounceToggle').checked) AudioResolver.playNativeTTS(seg.text);
      }
    }
  }
  else if (data.wordToSpeak && document.getElementById('autoPronounceToggle').checked && (!Store.isAudio() || !audioPlayer.buffer)) {
    AudioResolver.playWord(data.wordToSpeak);
  }

  const stats = Store.getState().stats;
  const accuracy = stats.totalKeys > 0 ? Math.floor((stats.correctKeys / stats.totalKeys) * 100) : 100;
  document.getElementById('accuracy').textContent = accuracy + '%';
  document.getElementById('errors').textContent = stats.errors;

  if (data.isComplete) {
    toggleExercise(false);
    document.getElementById('textInput').disabled = true;

    document.getElementById('resAcc').textContent = accuracy + '%';
    document.getElementById('resWpm').textContent = document.getElementById('wpm').textContent;
    document.getElementById('resTime').textContent = document.getElementById('time').textContent;
    document.getElementById('resErr').textContent = stats.errors;

    document.getElementById('resultModal').classList.remove('hidden');
  }
});

const actionToggle = document.getElementById('actionToggle');
if (actionToggle) actionToggle.addEventListener('change', (e) => toggleExercise(e.target.checked));

// =================================================================
// 6. PHÍM TẮT & PHÁT ÂM (DOUBLE CLICK / TAB)
// =================================================================
function forceSpeakCurrentWord() {
  const state = Store.getState();
  const caret = state.prevIndex;
  let targetWord = null;
  for (let i = state.wordStarts.length - 1; i >= 0; i--) {
    if (caret >= state.wordStarts[i]) {
      targetWord = state.wordTokens[i];
      break;
    }
  }
  if (targetWord) AudioResolver.playWord(targetWord);
}

function playCurrentAudioOrSegment() {
  if (Store.isAudio()) {
    const src = Store.getSource();
    const seg = src.segments[src.currentSegment];
    if (seg) {
      if (audioPlayer.buffer) {
        if (audioPlayer.ctx?.state === 'suspended') audioPlayer.ctx.resume();
        audioPlayer.playSegment(seg.audioStart, seg.audioEnd);
      } else {
        AudioResolver.playNativeTTS(seg.text);
      }
    }
  } else {
    forceSpeakCurrentWord();
  }
}

let shortcutTimer = null;
document.addEventListener('keydown', (e) => {
  if (e.code === "Tab") {
    e.preventDefault();
    if (e.repeat) return;

    if (shortcutTimer) {
      clearTimeout(shortcutTimer);
      shortcutTimer = null;
      forceSpeakCurrentWord();
    } else {
      shortcutTimer = setTimeout(() => {
        playCurrentAudioOrSegment();
        shortcutTimer = null;
      }, 300);
    }
  }

  if (e.ctrlKey && e.code === "Space") {
    e.preventDefault();
    playCurrentAudioOrSegment();
  }

  if (e.ctrlKey && e.code === "KeyB") {
    e.preventDefault();
    const blindToggle = document.getElementById('blindModeToggle');
    if (blindToggle) blindToggle.click();
  }
});

document.getElementById('textDisplay').addEventListener("dblclick", (e) => {
  if (e.target.tagName !== "SPAN" || e.target.classList.contains("newline-char")) return;
  const charIndex = Store.getState().textSpans.indexOf(e.target);
  if (charIndex === -1) return;

  const { wordStarts, wordTokens } = Store.getState();
  for (let i = 0; i < wordStarts.length; i++) {
    if (charIndex >= wordStarts[i] && charIndex < wordStarts[i] + wordTokens[i].length) {
      AudioResolver.playWord(wordTokens[i]);
      break;
    }
  }
});

// =================================================================
// 7. CÁC TIỆN ÍCH KẾT QUẢ VÀ NÚT CHỨC NĂNG
// =================================================================
const resultModal = document.getElementById('resultModal');

document.getElementById('btnReplay').onclick = () => {
  resultModal.classList.add('hidden');
  const input = document.getElementById('textInput');
  input.value = ""; inputUI.virtualValue = "";

  Store.getState().prevIndex = 0; Store.getState().prevInputLen = 0;
  Store.getState().stats = { totalKeys: 0, correctKeys: 0, errors: 0 };
  Store.getState().furthestSpokenIndex = -1;
  if (Store.isAudio()) Store.setCurrentSegment(0);

  const allIndices = Array.from(Array(Store.getState().textSpans.length).keys());
  displayUI.updateCursor(0, allIndices, Store.getSource().text, "");

  ['time', 'wpm', 'errors'].forEach(id => document.getElementById(id).textContent = id === 'errors' ? '0' : '0s');
  document.getElementById('accuracy').textContent = '100%';

  toggleExercise(true);
};

document.getElementById('btnNext').onclick = () => {
  resultModal.classList.add('hidden');
  const currentActive = document.querySelector('.tree-label.active');
  if (currentActive && currentActive.parentElement) {
    let nextLi = currentActive.parentElement.nextElementSibling;
    while (nextLi) {
      const nextLabel = nextLi.querySelector('.selectable-file');
      if (nextLabel) { nextLabel.click(); return; }
      nextLi = nextLi.nextElementSibling;
    }
  }
  alert("Đã hết bài tập trong thư mục này!");
};

resultModal.onclick = (e) => { if (e.target === resultModal) resultModal.classList.add("hidden"); };

document.getElementById('textContainer').onclick = () => {
  if (window.getSelection().toString().trim().length > 0) return;
  const input = document.getElementById('textInput');
  if (input && !input.disabled) input.focus();
};

// =================================================================
// 8. TÍNH NĂNG EDIT TRÊN GITHUB
// =================================================================
const editBtn = document.getElementById('editBtn');
if (editBtn) {
  editBtn.onclick = () => {
    const path = Store.getState().currentLessonPath;
    if (!path) {
      alert("Bài tập này được tải từ máy tính của bạn, không thể chỉnh sửa trên GitHub.");
      return;
    }
    // Link repo gốc của bạn. Giả định kho chứa là idmbull/english
    const githubUrl = `https://github.com/idmbull/lang/edit/main${path}`;
    window.open(githubUrl, '_blank');
  };
}