import { EventBus } from '../core/eventBus.js';
import { setupDragDrop } from '../utils/drag-drop.js';

export class DictationManager {
    constructor() {
        this.modal = document.getElementById('dictationModal');
        this.btnLoad = document.getElementById('fileLoaderBtn'); // Nút Load ở góc dưới
        this.btnCancel = document.getElementById('dictationCancelBtn');
        this.btnStart = document.getElementById('dictationStartBtn');

        this.subInput = document.getElementById('dictationSubInput');
        this.audioInput = document.getElementById('dictationAudioInput');
        this.blindModeCheck = document.getElementById('dictationBlindMode');

        this.initEvents();
    }

    initEvents() {
        // Mở Modal khi click nút Load
        this.btnLoad.onclick = (e) => {
            e.preventDefault();
            this.modal.classList.remove('hidden');
        };

        // Đóng modal
        this.btnCancel.onclick = () => this.modal.classList.add('hidden');

        // Bật nút Start khi đã chọn file text
        this.subInput.onchange = () => {
            this.btnStart.disabled = !this.subInput.files.length;
        };

        // Khi bấm Start
        this.btnStart.onclick = () => {
            const subFile = this.subInput.files[0];
            const audioFile = this.audioInput.files[0];
            if (!subFile) return;

            const reader = new FileReader();
            reader.onload = async (e) => {
                const textContent = e.target.result;
                let audioBuffer = null;

                // Nếu có file Audio, đọc dưới dạng ArrayBuffer
                if (audioFile) {
                    audioBuffer = await audioFile.arrayBuffer();
                }

                // Phát sự kiện Load Bài Học, truyền kèm theo audioBuffer và cờ BlindMode
                EventBus.emit('app:load_local_lesson', {
                    title: subFile.name.replace(/\.[^/.]+$/, ""),
                    content: textContent,
                    audioBuffer: audioBuffer,
                    enableBlindMode: this.blindModeCheck.checked
                });

                // Cập nhật giao diện nút Load
                this.btnLoad.innerHTML = `${audioBuffer ? "🎧" : "📄"} ${subFile.name}`;
                this.modal.classList.add('hidden');
            };
            reader.readAsText(subFile, "utf-8");
        };

        // Tích hợp Kéo thả
        setupDragDrop(this.btnLoad, (files) => {
            this.modal.classList.remove("hidden");
            const dtSub = new DataTransfer();
            const dtAudio = new DataTransfer();

            files.forEach(f => {
                const name = f.name.toLowerCase();
                if (/\.(txt|tsv|md)$/.test(name)) dtSub.items.add(f);
                else if (/\.(mp3|wav|ogg|m4a)$/.test(name)) dtAudio.items.add(f);
            });

            if (dtSub.files.length) this.subInput.files = dtSub.files;
            if (dtAudio.files.length) this.audioInput.files = dtAudio.files;
            this.btnStart.disabled = !this.subInput.files.length;
        }, "Thả file vào đây!");
    }
}