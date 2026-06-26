import { EventBus } from '../core/eventBus.js';
import { setupDragDrop } from '../utils/drag-drop.js';

export class DictationManager {
    constructor() {
        this.modal = document.getElementById('dictationModal');
        this.btnLoad = document.getElementById('fileLoaderBtn');
        this.btnCancel = document.getElementById('dictationCancelBtn');
        this.btnStart = document.getElementById('dictationStartBtn');

        this.subInput = document.getElementById('dictationSubInput');
        this.audioInput = document.getElementById('dictationAudioInput');
        this.ytInput = document.getElementById('dictationYoutubeInput');
        this.blindModeCheck = document.getElementById('dictationBlindMode');

        this.initEvents();
    }

    initEvents() {
        this.btnLoad.onclick = (e) => {
            e.preventDefault();
            this.modal.classList.remove('hidden');
        };

        this.btnCancel.onclick = () => this.modal.classList.add('hidden');

        this.subInput.onchange = () => {
            this.btnStart.disabled = !this.subInput.files.length;
        };

        this.audioInput.onchange = () => { if (this.audioInput.files.length) this.ytInput.value = ""; };
        this.ytInput.oninput = () => { if (this.ytInput.value) this.audioInput.value = ""; };

        this.btnStart.onclick = () => {
            const subFile = this.subInput.files[0];
            const mediaFile = this.audioInput.files[0];
            const ytUrl = this.ytInput.value.trim();

            if (!subFile) return;

            const reader = new FileReader();
            reader.onload = async (e) => {
                const textContent = e.target.result;

                EventBus.emit('app:load_local_lesson', {
                    title: subFile.name.replace(/\.[^/.]+$/, ""),
                    content: textContent,
                    mediaFile: mediaFile,
                    youtubeUrl: ytUrl,
                    enableBlindMode: this.blindModeCheck.checked
                });

                let icon = "📄";
                if (ytUrl) icon = "🟥";
                else if (mediaFile) icon = mediaFile.type.includes('video') ? "🎬" : "🎧";

                this.btnLoad.innerHTML = `${icon} ${subFile.name}`;
                this.modal.classList.add('hidden');
            };
            reader.readAsText(subFile, "utf-8");
        };

        setupDragDrop(this.btnLoad, (files) => {
            this.modal.classList.remove("hidden");
            const dtSub = new DataTransfer();
            const dtAudio = new DataTransfer();

            files.forEach(f => {
                const name = f.name.toLowerCase();
                if (/\.(txt|tsv|md)$/.test(name)) dtSub.items.add(f);
                else if (/\.(mp3|wav|ogg|m4a|mp4)$/.test(name)) dtAudio.items.add(f);
            });

            if (dtSub.files.length) this.subInput.files = dtSub.files;
            if (dtAudio.files.length) {
                this.audioInput.files = dtAudio.files;
                this.ytInput.value = "";
            }
            this.btnStart.disabled = !this.subInput.files.length;
        }, "Thả file vào đây!");
    }
}