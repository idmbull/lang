import { AudioResolver } from '../services/audio-resolver.js';
import { Store } from '../core/store.js';
import { EventBus } from '../core/eventBus.js'; // [SỬA LỖI]: Bổ sung import EventBus

export class VocabManager {
    constructor() {
        this.vocabList = [];
        this.floatingBtn = document.getElementById('floatingHighlightBtn');
        this.modal = document.getElementById('vocabModal');
        this.listContainer = document.getElementById('vocabList');

        this.selectedWord = "";
        this.selectedIndex = -1;

        this.initEvents();

        // [SỬA LỖI]: Dùng EventBus để bắt đúng kênh khi bài học mới được tải
        EventBus.on('app:load_lesson', () => this.clearList());
        EventBus.on('app:load_local_lesson', () => this.clearList());
    }

    clearList() {
        this.vocabList = [];
        if (this.listContainer) this.listContainer.innerHTML = "";
    }

    initEvents() {
        // 1. Lắng nghe bôi đen văn bản
        const textDisplay = document.getElementById('textDisplay');
        if (textDisplay) {
            textDisplay.addEventListener("mouseup", () => {
                setTimeout(() => {
                    const selection = window.getSelection();
                    const text = selection.toString().trim();

                    if (text.length > 0 && text.length < 50 && this.floatingBtn) {
                        this.selectedWord = text;

                        const range = selection.getRangeAt(0);
                        let startNode = range.startContainer;
                        if (startNode.nodeType === 3) startNode = startNode.parentElement;

                        const spans = Store.getState().textSpans;
                        this.selectedIndex = spans.indexOf(startNode);

                        const rect = range.getBoundingClientRect();
                        this.floatingBtn.style.top = `${rect.top - 40}px`;
                        this.floatingBtn.style.left = `${rect.left + (rect.width / 2) - 45}px`;
                        this.floatingBtn.classList.remove("hidden");
                    } else if (this.floatingBtn) {
                        this.floatingBtn.classList.add("hidden");
                    }
                }, 50);
            });
        }

        // 2. Click ra ngoài để ẩn nút nổi
        document.addEventListener("mousedown", (e) => {
            if (this.floatingBtn && e.target !== this.floatingBtn) {
                this.floatingBtn.classList.add("hidden");
            }
        });

        // 3. Click nút nổi để Lưu từ
        if (this.floatingBtn) {
            this.floatingBtn.addEventListener("mousedown", (e) => {
                e.preventDefault();
                this.saveWord(this.selectedWord, this.selectedIndex);
                window.getSelection().removeAllRanges();
                const input = document.getElementById('textInput');
                if (input && !input.disabled) input.focus();
            });
        }

        // 4. Mở/Đóng Modal
        const vocabBtn = document.getElementById('vocabBtn');
        if (vocabBtn && this.modal) {
            vocabBtn.onclick = () => {
                this.renderList();
                this.modal.classList.remove('hidden');
            };

            this.modal.addEventListener('click', (e) => {
                if (e.target === this.modal || e.target.id === 'vocabCloseBtn') {
                    this.modal.classList.add('hidden');
                    const input = document.getElementById('textInput');
                    if (input && !input.disabled) input.focus();
                }
            });
        }

        // 5. Xuất file
        const exportBtn = document.getElementById('vocabExportBtn');
        if (exportBtn) {
            exportBtn.onclick = () => this.exportFiles();
        }
    }

    saveWord(word, index) {
        if (!this.floatingBtn) return;
        const isExist = this.vocabList.some(item => item.word.toLowerCase() === word.toLowerCase());

        if (!isExist) {
            this.vocabList.unshift({ word, index });
            this.floatingBtn.textContent = "✔️ Đã lưu";
        } else {
            this.floatingBtn.textContent = "Đã có!";
        }

        setTimeout(() => {
            if (this.floatingBtn) {
                this.floatingBtn.textContent = "✨ Lưu từ";
                this.floatingBtn.classList.add("hidden");
            }
        }, 1000);
    }

    renderList() {
        if (!this.listContainer) return;
        this.listContainer.innerHTML = "";

        if (this.vocabList.length === 0) {
            this.listContainer.innerHTML = `<li style="text-align:center; color:gray; padding: 20px;">Danh sách trống.</li>`;
            return;
        }

        this.vocabList.forEach(item => {
            const li = document.createElement("li");
            li.style = "display: flex; justify-content: space-between; padding: 10px; border-bottom: 1px solid var(--border-color);";

            const textSpan = document.createElement("span");
            textSpan.textContent = item.word;
            textSpan.style = "font-weight: bold;";

            const actionDiv = document.createElement("div");

            const btnSpeak = document.createElement("button");
            btnSpeak.textContent = "🔊";
            btnSpeak.style = "background:none; border:none; cursor:pointer; margin-right: 10px;";
            btnSpeak.onclick = () => AudioResolver.playWord(item.word);

            const btnDel = document.createElement("button");
            btnDel.textContent = "🗑️";
            btnDel.style = "background:none; border:none; cursor:pointer;";
            btnDel.onclick = () => {
                this.vocabList = this.vocabList.filter(w => w.word !== item.word);
                this.renderList();
            };

            actionDiv.appendChild(btnSpeak);
            actionDiv.appendChild(btnDel);
            li.appendChild(textSpan);
            li.appendChild(actionDiv);
            this.listContainer.appendChild(li);
        });
    }

    async exportFiles() {
        if (this.vocabList.length === 0) return alert("Danh sách trống!");

        const state = Store.getState();
        const source = state.source;
        const hasAudio = Store.isAudio();
        const segments = source.segments || [];
        const charStarts = source.charStarts || [];

        const sortedList = [...this.vocabList].sort((a, b) => a.index - b.index);
        let textData = "";

        // 1. Tạo dữ liệu File Text
        sortedList.forEach(item => {
            let startTime = "", endTime = "";
            if (hasAudio && segments.length > 0) {
                let segIdx = 0;
                for (let i = charStarts.length - 1; i >= 0; i--) {
                    if (item.index >= charStarts[i]) { segIdx = i; break; }
                }
                const seg = segments[segIdx];
                if (seg) {
                    startTime = parseFloat(seg.audioStart).toFixed(6) + "\t";
                    endTime = parseFloat(seg.audioEnd).toFixed(6) + "\t";
                }
            }
            textData += `${startTime}${endTime}${item.word}\n`;
        });

        // Hàm hỗ trợ tải file mượt mà, dọn dẹp rác bộ nhớ sau 1 giây
        const downloadBlob = (blob, filename) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        };

        // Lấy tên file chính xác để làm tên tải xuống
        let exactFileName = source.title || "Tu_vung_IDM";
        if (state.currentLessonPath) {
            // Rút trích từ path: "/library/Tieng_Anh/Bai_01.md" -> "Bai_01"
            exactFileName = state.currentLessonPath.split('/').pop().replace(/\.md$/, '').replace(/\.txt$/, '');
        }

        const textBlob = new Blob([textData], { type: "text/plain" });
        const textFileName = `${exactFileName}_vocab.txt`;

        // Nếu bài không có Audio, chỉ tải Text rồi thoát luôn
        if (!hasAudio) {
            downloadBlob(textBlob, textFileName);
            return;
        }

        // 2. Kéo file Audio MP3 từ GitHub về
        const btn = document.getElementById('vocabExportBtn');
        const originalText = btn.textContent;
        btn.textContent = "⏳ Đang gom file tải về...";
        btn.disabled = true;

        try {
            const AUDIO_BASE = "https://cdn.jsdelivr.net/gh/idmbull/english@main/assets/audio/";
            const mp3Url = `${AUDIO_BASE}${encodeURIComponent(exactFileName)}.mp3`;

            const res = await fetch(mp3Url);
            if (!res.ok) throw new Error("Không tìm thấy file MP3 trên máy chủ.");
            const audioBlob = await res.blob();

            // MẸO VƯỢT TƯỜNG LỬA TRÌNH DUYỆT:
            // Tải MP3 trước tiên (ưu tiên cao)
            downloadBlob(audioBlob, `${exactFileName}.mp3`);

            // Chờ 500ms rồi tiếp tục tải file TXT (Tránh bị chặn Multiple Downloads)
            setTimeout(() => {
                downloadBlob(textBlob, textFileName);
            }, 500);

        } catch (err) {
            console.warn("Lỗi tải MP3:", err);
            alert("Không tìm thấy Audio gốc. Hệ thống sẽ chỉ tải file Text.");
            downloadBlob(textBlob, textFileName);
        } finally {
            btn.textContent = originalText;
            btn.disabled = false;
        }
    }
}