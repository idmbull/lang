import { defineConfig } from 'vite'
import { resolve } from 'path'
import fs from 'fs'

// Hàm tự động quét và lấy danh sách tất cả file .html ở thư mục gốc
function getHtmlEntries() {
    const entries = {};

    // Đọc tất cả các file trong thư mục hiện tại
    const files = fs.readdirSync(__dirname);

    files.forEach(file => {
        // Nếu file có đuôi là .html
        if (file.endsWith('.html')) {
            // Lấy tên file bỏ đi đuôi .html (ví dụ 'guide.html' -> 'guide')
            const name = file.replace('.html', '');
            // Lưu vào danh sách
            entries[name] = resolve(__dirname, file);
        }
    });

    return entries;
}

export default defineConfig({
    base: '/lang/', // Giữ nguyên tên repo của bạn

    build: {
        rollupOptions: {
            // Gọi hàm tự động lấy danh sách file thay vì viết tay
            input: getHtmlEntries()
        }
    }
})
