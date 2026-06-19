import fs from 'fs';
import { execSync } from 'child_process';
import path from 'path';

const dates = {};

function walk(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walk(fullPath);
        } else if (fullPath.endsWith('.md')) {
            const normalizedPath = '/' + fullPath.replace(/\\/g, '/');
            try {
                // Hỏi Git xem file này được sửa lần cuối khi nào
                const gitDate = execSync(`git log -1 --format="%ct" "${fullPath}"`).toString().trim();
                if (gitDate) {
                    dates[normalizedPath] = parseInt(gitDate) * 1000;
                } else {
                    // Nếu file mới tạo chưa kịp commit lên Git thì lấy giờ của máy tính
                    dates[normalizedPath] = fs.statSync(fullPath).mtimeMs;
                }
            } catch (e) {
                dates[normalizedPath] = fs.statSync(fullPath).mtimeMs;
            }
        }
    }
}

console.log("Đang quét lịch sử chỉnh sửa file...");
walk('library');

// Lưu kết quả vào src để code Frontend đọc được
fs.writeFileSync('src/file-dates.json', JSON.stringify(dates, null, 2));
console.log("✅ Đã cập nhật xong thời gian sửa đổi!");