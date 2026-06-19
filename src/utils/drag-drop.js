export function setupDragDrop(element, onDropCallback, dragText = "Thả file vào đây!") {
    if (!element) return;
    let originalText = element.textContent;

    const updateOriginalText = () => {
        if (!element.classList.contains("dragging")) originalText = element.textContent;
    };
    const observer = new MutationObserver(updateOriginalText);
    observer.observe(element, { childList: true });

    element.addEventListener("dragover", (e) => {
        e.preventDefault(); e.stopPropagation();
        if (!element.classList.contains("dragging")) {
            originalText = element.textContent;
            element.classList.add("dragging");
            element.textContent = dragText;
        }
    });

    element.addEventListener("dragleave", (e) => {
        e.preventDefault(); e.stopPropagation();
        element.classList.remove("dragging");
        element.textContent = originalText;
    });

    element.addEventListener("drop", (e) => {
        e.preventDefault(); e.stopPropagation();
        element.classList.remove("dragging");
        element.textContent = originalText;
        const files = e.dataTransfer.files;
        if (files && files.length > 0) onDropCallback(Array.from(files));
    });
}