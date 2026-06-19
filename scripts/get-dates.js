import fs from 'fs';
import { execSync } from 'child_process';
import path from 'path';

const metadata = {};

function walk(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walk(fullPath);
        } else if (fullPath.endsWith('.md')) {
            const normalizedPath = '/' + fullPath.replace(/\\/g, '/');

            // 1. Quét Ngày giờ (Git Date)
            let date = 0;
            try {
                const gitDate = execSync(`git log -1 --format="%ct" "${fullPath}"`).toString().trim();
                date = gitDate ? parseInt(gitDate) * 1000 : fs.statSync(fullPath).mtimeMs;
            } catch (e) {
                date = fs.statSync(fullPath).mtimeMs;
            }

            // 2. Quét Audio: Đọc nhanh nội dung file xem có chứa Timestamp không (Ví dụ: 3.200 7.860)
            const content = fs.readFileSync(fullPath, 'utf8');
            const hasAudio = /^([\d.]+)\s+([\d.]+)/m.test(content);

            // Lưu cả ngày giờ và cờ Audio
            metadata[normalizedPath] = {
                date: date,
                hasAudio: hasAudio
            };
        }
    }
}

console.log("Đang quét siêu dữ liệu (Ngày giờ & Audio)...");
walk('library');

fs.writeFileSync('src/file-dates.json', JSON.stringify(metadata, null, 2));
console.log("✅ Đã cập nhật xong siêu dữ liệu!");