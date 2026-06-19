export function wrapChars(text, className = "", dataNote = "") {
    const frag = document.createDocumentFragment();
    for (const ch of text) {
        if (ch === '\n') {
            const s = document.createElement('span');
            s.textContent = "↵";
            s.className = "newline-char";
            if (className) s.classList.add(className);
            frag.appendChild(s);
            const br = document.createElement('br');
            br.className = "visual-break";
            frag.appendChild(br);
        } else {
            const s = document.createElement('span');
            s.textContent = ch;
            if (className) s.classList.add(className);
            if (dataNote) s.dataset.note = dataNote;
            frag.appendChild(s);
        }
    }
    return frag;
}