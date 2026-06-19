import { EventBus } from '../core/eventBus.js';
// Import file chứa ngày giờ vừa được script tự động sinh ra
import fileDates from '../file-dates.json';

export class PlaylistDropdown {
    constructor(triggerId, contentId) {
        this.trigger = document.getElementById(triggerId);
        this.content = document.getElementById(contentId);
        this.triggerText = this.trigger.querySelector('span:first-child');

        this.files = import.meta.glob('/library/**/*.md', { query: '?raw', import: 'default' });

        this.initEvents();
        this.renderTree();
    }

    initEvents() {
        this.trigger.onclick = (e) => {
            e.stopPropagation();
            this.content.classList.toggle('hidden');
        };

        document.addEventListener('click', (e) => {
            if (!this.content.contains(e.target) && e.target !== this.trigger) {
                this.content.classList.add('hidden');
            }
        });
    }

    renderTree() {
        this.content.innerHTML = '';
        const rootUl = document.createElement('ul');
        rootUl.className = 'tree-ul expanded';

        const tree = {};
        for (const path in this.files) {
            const parts = path.replace('/library/', '').split('/');
            let current = tree;
            for (let i = 0; i < parts.length - 1; i++) {
                if (!current[parts[i]]) current[parts[i]] = {};
                current = current[parts[i]];
            }
            const fileName = parts[parts.length - 1];
            current[fileName] = path;
        }

        const buildDOM = (node, parentUl) => {
            // [MỚI]: THUẬT TOÁN SẮP XẾP
            const sortedKeys = Object.keys(node).sort((a, b) => {
                const isFileA = typeof node[a] === 'string';
                const isFileB = typeof node[b] === 'string';

                // Ưu tiên Thư mục nằm trên File
                if (!isFileA && isFileB) return -1;
                if (isFileA && !isFileB) return 1;

                // Nếu cả 2 là File -> Xếp theo Thời gian sửa đổi gần nhất (Mới nhất nằm trên)
                if (isFileA && isFileB) {
                    const timeA = fileDates[node[a]] || 0;
                    const timeB = fileDates[node[b]] || 0;
                    return timeB - timeA;
                }

                // Nếu cả 2 là Thư mục -> Xếp theo ABC
                return a.localeCompare(b);
            });

            for (const key of sortedKeys) {
                const li = document.createElement('li');
                li.className = 'tree-item';

                if (typeof node[key] === 'string') {
                    const label = document.createElement('div');
                    label.className = 'tree-label is-file selectable-file';
                    const cleanName = key.replace('.md', '');
                    label.innerHTML = `<span class="tree-icon">📄</span> ${cleanName}`;

                    label.onclick = async (e) => {
                        e.stopPropagation();
                        document.querySelectorAll('.tree-label').forEach(el => el.classList.remove('active'));
                        label.classList.add('active');
                        this.content.classList.add('hidden');
                        this.triggerText.textContent = cleanName;

                        const markdownContent = await this.files[node[key]]();
                        EventBus.emit('app:load_lesson', {
                            title: cleanName,
                            content: markdownContent,
                            path: node[key]
                        });
                    };
                    li.appendChild(label);
                } else {
                    const label = document.createElement('div');
                    label.className = 'tree-label is-folder';
                    label.innerHTML = `<span class="tree-arrow">▶</span> 📁 ${key}`;

                    const ul = document.createElement('ul');
                    ul.className = 'tree-ul';

                    label.onclick = (e) => {
                        e.stopPropagation();
                        li.classList.toggle('expanded');
                        ul.classList.toggle('expanded');
                    };

                    li.appendChild(label);
                    buildDOM(node[key], ul);
                    li.appendChild(ul);
                }
                parentUl.appendChild(li);
            }
        };

        buildDOM(tree, rootUl);
        this.content.appendChild(rootUl);

        const firstFile = this.content.querySelector('.selectable-file');
        if (firstFile) firstFile.click();
    }
}