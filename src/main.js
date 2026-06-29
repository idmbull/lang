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
import { VideoPlayer } from './services/video-player.js';
import { YouTubePlayer } from './services/youtube-player.js';

console.log("=== IDM TYPING MASTER FULLY LOADED ===");

const AUDIO_BASE = "https://cdn.jsdelivr.net/gh/idmbull/english@main/assets/audio/";

// =================================================================
// 0. KHÔI PHỤC CÀI ĐẶT NGƯỜI DÙNG
// =================================================================
function restoreUserPreferences() {
  const getBool = (key, defaultVal) => {
    const val = localStorage.getItem(key);
    return val === null ? defaultVal : val === 'true';
  };

  const soundToggle = document.getElementById('soundToggle');
  if (soundToggle) {
    soundToggle.checked = getBool('pref_sound', true);
    soundToggle.addEventListener('change', e => localStorage.setItem('pref_sound', e.target.checked));
  }

  const speakToggle = document.getElementById('autoPronounceToggle');
  if (speakToggle) {
    speakToggle.checked = getBool('pref_speak', true);
    speakToggle.addEventListener('change', e => localStorage.setItem('pref_speak', e.target.checked));
  }

  const tooltipToggle = document.getElementById('autoTooltipToggle');
  if (tooltipToggle) {
    tooltipToggle.checked = getBool('pref_tooltip', true);
    tooltipToggle.addEventListener('change', e => localStorage.setItem('pref_tooltip', e.target.checked));
  }

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
restoreUserPreferences();

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

// =================================================================
// 2. HỆ THỐNG MEDIA TRUNG TÂM
// =================================================================
const audioPlayer = new SuperAudioPlayer();
const videoPlayer = new VideoPlayer('videoPlayer');
const youtubePlayer = new YouTubePlayer('youtubePlayerPlaceholder');

let isGlobalPlaying = false;
let currentMediaUrl = null;

const MediaSystem = {
  isLoaded() {
    const type = Store.getMediaType();
    if (type === 'youtube') return youtubePlayer.isReady;
    if (type === 'video') return videoPlayer.video.src !== '';
    return audioPlayer.buffer !== null;
  },
  playSegment(start, end) {
    const type = Store.getMediaType();
    if (type === 'youtube') youtubePlayer.playSegment(start, end);
    else if (type === 'video') videoPlayer.playSegment(start, end);
    else audioPlayer.playSegment(start, end);
  },
  pause() {
    const type = Store.getMediaType();
    if (type === 'youtube') youtubePlayer.pause();
    else if (type === 'video') videoPlayer.pause();
    else audioPlayer.pause();
  },
  resume() {
    const type = Store.getMediaType();
    if (type === 'youtube') youtubePlayer.resume();
    else if (type === 'video') videoPlayer.resume();
    else audioPlayer.resume();
  },
  stop() {
    youtubePlayer.stop();
    videoPlayer.stop();
    audioPlayer.stop();
  },
  clear() {
    youtubePlayer.clear();
    videoPlayer.clear();
    audioPlayer.clear();
  },
  setVolume(v) {
    youtubePlayer.setVolume(v);
    videoPlayer.setVolume(v);
    audioPlayer.setVolume(v);
  },
  get pausedAt() {
    const type = Store.getMediaType();
    if (type === 'youtube') return youtubePlayer.pausedAt;
    return type === 'video' ? videoPlayer.pausedAt : audioPlayer.pausedAt;
  },
  set pausedAt(v) {
    const type = Store.getMediaType();
    if (type === 'youtube') youtubePlayer.pausedAt = v;
    else if (type === 'video') videoPlayer.pausedAt = v;
    else audioPlayer.pausedAt = v;
  },
  get isPlaying() {
    const type = Store.getMediaType();
    if (type === 'youtube') return youtubePlayer.isPlaying;
    return type === 'video' ? videoPlayer.isPlaying : audioPlayer.isPlaying;
  },
  resumeCtx() {
    if (Store.getMediaType() === 'audio' && audioPlayer.ctx?.state === 'suspended') audioPlayer.ctx.resume();
  }
};

function updatePlayIcon(isPlaying) {
  isGlobalPlaying = isPlaying;
  const btn = document.getElementById('dictationPlayAllBtn');
  if (btn) {
    btn.textContent = isPlaying ? "⏸" : "▶";
    btn.style.color = isPlaying ? "var(--correct-color)" : "inherit";
    btn.style.borderColor = isPlaying ? "var(--correct-color)" : "var(--border-color)";
  }
}

audioPlayer.onEnded = () => { updatePlayIcon(false); audioPlayer.pausedAt = 0; };
videoPlayer.onEnded = () => { updatePlayIcon(false); videoPlayer.pausedAt = 0; };
youtubePlayer.onEnded = () => { updatePlayIcon(false); youtubePlayer.pausedAt = 0; };

const volInput = document.getElementById('dictationVolume');
if (volInput) {
  MediaSystem.setVolume(parseFloat(volInput.value));
  volInput.oninput = (e) => MediaSystem.setVolume(parseFloat(e.target.value));
}

const playAllBtn = document.getElementById('dictationPlayAllBtn');
if (playAllBtn) {
  playAllBtn.onclick = () => {
    if (!Store.isAudio()) return;
    if (MediaSystem.isPlaying) {
      MediaSystem.pause();
      updatePlayIcon(false);
    } else {
      if (MediaSystem.pausedAt === 0) {
        const src = Store.getSource();
        if (src.segments && src.segments[src.currentSegment]) {
          MediaSystem.pausedAt = src.segments[src.currentSegment].audioStart;
        }
      }
      MediaSystem.resume();
      updatePlayIcon(true);
    }
    document.getElementById('textInput').focus();
  };
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
      MediaSystem.resumeCtx();
      const src = Store.getSource();
      const seg = src.segments[src.currentSegment];
      if (seg) {
        if (MediaSystem.isLoaded()) MediaSystem.playSegment(seg.audioStart, seg.audioEnd);
        else if (document.getElementById('autoPronounceToggle').checked && Store.getMediaType() !== 'video' && Store.getMediaType() !== 'youtube') {
          AudioResolver.playNativeTTS(seg.text);
        }
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
    MediaSystem.stop();
    updatePlayIcon(false);
  }

  textInput.disabled = false;
  textInput.focus();
}

// =================================================================
// 3. HÀM LOAD BÀI HỌC VÀO APP
// =================================================================
async function loadLessonToApp(title, content, path = null, mediaFile = null, enableBlindMode = false, youtubeUrl = null) {
  if (currentMediaUrl) { URL.revokeObjectURL(currentMediaUrl); currentMediaUrl = null; }
  MediaSystem.clear();

  document.getElementById('pageTitle').textContent = title;

  const parsed = ContentParser.parseUnified(content);
  const words = TypingEngine.computeWords(parsed.text, parsed.language);

  let mediaType = null;

  let finalYoutubeUrl = parsed.metadata.youtube || youtubeUrl;
  let metadataVideoUrl = parsed.metadata.video;
  let metadataAudioUrl = parsed.metadata.audio;

  if (finalYoutubeUrl) {
    mediaType = 'youtube';
    youtubePlayer.load(finalYoutubeUrl);
    console.log("✅ Đã nạp YouTube!");
  }
  else if (metadataVideoUrl) {
    mediaType = 'video';
    videoPlayer.load(metadataVideoUrl);
    console.log("✅ Đã nạp Video MP4!");
  }
  else if (metadataAudioUrl) {
    try {
      const resp = await fetch(metadataAudioUrl);
      if (resp.ok) {
        mediaType = 'audio';
        await audioPlayer.load(await resp.arrayBuffer());
      }
    } catch (e) { }
  }
  else if (mediaFile) {
    mediaType = mediaFile.type.startsWith('video') ? 'video' : 'audio';
    if (mediaType === 'video') {
      currentMediaUrl = URL.createObjectURL(mediaFile);
      videoPlayer.load(currentMediaUrl);
    } else {
      await audioPlayer.load(await mediaFile.arrayBuffer());
    }
  }
  else if (path && parsed.segments && parsed.segments.length > 0) {
    try {
      const mp3Url = `${AUDIO_BASE}${encodeURIComponent(title)}.mp3`;
      const resp = await fetch(mp3Url);
      if (resp.ok) {
        mediaType = 'audio';
        await audioPlayer.load(await resp.arrayBuffer());
      }
    } catch (e) { }
  }

  Store.setSourceUnified(parsed, mediaType, null, path);
  Store.getState().wordTokens = words.tokens;
  Store.getState().wordStarts = words.starts;

  const isBlind = enableBlindMode || document.getElementById('blindModeToggle').checked;
  document.body.classList.toggle('blind-mode', isBlind);

  displayUI.render(parsed.html, parsed.text);
  if (isBlind) applyBlindModeUI(0);

  const mediaControls = document.getElementById('mediaControls');
  const volumeControl = document.getElementById('volumeControl');
  const videoContainer = document.getElementById('videoContainer');

  if (mediaType !== null) {
    mediaControls.classList.remove('hidden');
    volumeControl.classList.remove('hidden');
    document.getElementById('headerSubtitle').textContent = "Nghe kỹ - Gõ chính xác";

    if (mediaType === 'youtube') {
      videoContainer.classList.remove('hidden');
      document.getElementById('videoPlayer').classList.add('hidden');
      document.getElementById('youtubePlayerPlaceholder').classList.remove('hidden');
    } else if (mediaType === 'video') {
      videoContainer.classList.remove('hidden');
      document.getElementById('videoPlayer').classList.remove('hidden');
      document.getElementById('youtubePlayerPlaceholder').classList.add('hidden');
    } else {
      videoContainer.classList.add('hidden');
    }
  } else {
    mediaControls.classList.add('hidden');
    volumeControl.classList.add('hidden');
    videoContainer.classList.add('hidden');
    document.getElementById('headerSubtitle').textContent = "Tập trung - Thư giãn - Phát triển";
  }

  words.tokens.slice(0, 5).forEach(word => AudioResolver.preloadWord(word));
  scroller.reset();

  TimerService.stop();
  updatePlayIcon(false);
  ['time', 'wpm', 'errors'].forEach(id => document.getElementById(id).textContent = id === 'errors' ? '0' : '0s');
  document.getElementById('accuracy').textContent = '100%';

  const textInput = document.getElementById('textInput');
  textInput.value = ""; inputUI.virtualValue = ""; textInput.disabled = false;

  const actionToggle = document.getElementById('actionToggle');
  if (actionToggle) actionToggle.checked = false;
  document.getElementById('actionLabel').textContent = "Start";
  document.getElementById('actionLabel').style.color = "var(--correct-color)";
  textInput.focus();
}

EventBus.on('app:load_lesson', (data) => loadLessonToApp(data.title, data.content, data.path));
EventBus.on('app:load_local_lesson', (data) => loadLessonToApp(data.title, data.content, null, data.mediaFile, data.enableBlindMode, data.youtubeUrl));
EventBus.on(EVENTS.EXERCISE_START, () => {
  const actionToggle = document.getElementById('actionToggle');
  if (actionToggle && !actionToggle.checked) toggleExercise(true);
});

// =================================================================
// 4. XỬ LÝ SỰ KIỆN GÕ BÀN PHÍM
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
        if (MediaSystem.isLoaded()) MediaSystem.playSegment(seg.audioStart, seg.audioEnd);
        else if (document.getElementById('autoPronounceToggle').checked && Store.getMediaType() !== 'video' && Store.getMediaType() !== 'youtube') {
          AudioResolver.playNativeTTS(seg.text);
        }
      }
    }
  }
  else if (data.wordToSpeak && document.getElementById('autoPronounceToggle').checked && (!Store.isAudio() || !MediaSystem.isLoaded())) {
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

document.getElementById('actionToggle').addEventListener('change', (e) => toggleExercise(e.target.checked));

// =================================================================
// 5. PHÍM TẮT & PHÁT ÂM (DOUBLE CLICK / TAB)
// =================================================================
function forceSpeakCurrentWord() {
  const state = Store.getState();
  const caret = state.prevIndex;
  let targetWord = null;
  for (let i = state.wordStarts.length - 1; i >= 0; i--) {
    if (caret >= state.wordStarts[i]) { targetWord = state.wordTokens[i]; break; }
  }
  if (targetWord) AudioResolver.playWord(targetWord);
}

function playCurrentAudioOrSegment() {
  if (Store.isAudio()) {
    const src = Store.getSource();
    const seg = src.segments[src.currentSegment];
    if (seg) {
      if (MediaSystem.isLoaded()) {
        MediaSystem.resumeCtx();
        MediaSystem.playSegment(seg.audioStart, seg.audioEnd);
      } else if (Store.getMediaType() !== 'video' && Store.getMediaType() !== 'youtube') {
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

  if (Store.isAudio()) {
    const s = Store.getSource();
    let targetSegIdx = 0;
    for (let i = s.charStarts.length - 1; i >= 0; i--) {
      if (charIndex >= s.charStarts[i]) { targetSegIdx = i; break; }
    }
    Store.setCurrentSegment(targetSegIdx);
    const seg = s.segments[targetSegIdx];
    if (seg) {
      updatePlayIcon(false);
      if (MediaSystem.isLoaded()) {
        MediaSystem.resumeCtx();
        MediaSystem.playSegment(seg.audioStart, seg.audioEnd);
      } else if (Store.getMediaType() !== 'video' && Store.getMediaType() !== 'youtube') {
        AudioResolver.playNativeTTS(seg.text);
      }
    }
  } else {
    const { wordStarts, wordTokens } = Store.getState();
    for (let i = 0; i < wordStarts.length; i++) {
      if (charIndex >= wordStarts[i] && charIndex < wordStarts[i] + wordTokens[i].length) {
        AudioResolver.playWord(wordTokens[i]);
        break;
      }
    }
  }
});

// =================================================================
// 6. QUẢN LÝ DOCKING LAYOUT VÀ DRAG VIDEO
// =================================================================
const appLayout = document.getElementById('appLayout');
const videoContainer = document.getElementById('videoContainer');
const dragHandle = document.getElementById('videoDragHandle');
const dockBtns = document.querySelectorAll('.dock-btn');

let currentLayout = localStorage.getItem('pref_layout') || 'float';

function setLayout(layoutType) {
  currentLayout = layoutType;
  localStorage.setItem('pref_layout', layoutType);

  // Đổi class của App Layout để Flexbox tự động chia màn hình
  appLayout.className = `app-layout layout-${layoutType}`;

  // Cập nhật trạng thái cho các nút bấm (Sáng viền)
  dockBtns.forEach(btn => btn.classList.remove('active'));
  document.querySelector(`.dock-btn[data-dock="${layoutType}"]`)?.classList.add('active');

  // Nếu bấm ghim Trái/Phải/Trên thì phải dọn dẹp các thông số top/left rác do lúc kéo thả (Float) tạo ra
  if (layoutType !== 'float') {
    videoContainer.style.left = ''; videoContainer.style.top = '';
    videoContainer.style.bottom = ''; videoContainer.style.right = '';
  }

  document.getElementById('textInput').focus();
}

// Chạy khởi tạo Layout đã lưu
setLayout(currentLayout);

// Lắng nghe bấm 4 nút Dock
dockBtns.forEach(btn => {
  btn.onclick = () => setLayout(btn.dataset.dock);
});

// LOGIC DRAG & DROP (Chỉ cho phép khi đang ở chế độ Trôi nổi - Float)
let isDragging = false;
let startX, startY, initialLeft, initialTop;

if (dragHandle && videoContainer) {
  dragHandle.addEventListener('mousedown', (e) => {
    if (currentLayout !== 'float') return; // Đã ghim thì cấm kéo

    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;

    const rect = videoContainer.getBoundingClientRect();
    initialLeft = rect.left;
    initialTop = rect.top;

    videoContainer.style.bottom = 'auto';
    videoContainer.style.right = 'auto';
    videoContainer.style.left = `${initialLeft}px`;
    videoContainer.style.top = `${initialTop}px`;

    document.body.style.userSelect = 'none';

    // Che youtube lại để con trỏ chuột không bị sụp hố khi kéo qua youtube
    const iframeBlocker = document.createElement('div');
    iframeBlocker.id = 'iframeBlocker';
    iframeBlocker.style = 'position:absolute; top:0; left:0; width:100%; height:100%; z-index:9999;';
    videoContainer.appendChild(iframeBlocker);
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    videoContainer.style.left = `${initialLeft + dx}px`;
    videoContainer.style.top = `${initialTop + dy}px`;
  });

  document.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      document.body.style.userSelect = '';
      const blocker = document.getElementById('iframeBlocker');
      if (blocker) blocker.remove();
    }
  });
}

// =================================================================
// 7. KẾT QUẢ & TIỆN ÍCH
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

const editBtn = document.getElementById('editBtn');
if (editBtn) {
  editBtn.onclick = () => {
    const path = Store.getState().currentLessonPath;
    if (!path) return alert("Bài tập Local không thể sửa trên GitHub.");
    window.open(`https://github.com/idmbull/lang/edit/main${path}`, '_blank');
  };
}