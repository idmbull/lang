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

            const content = fs.readFileSync(fullPath, 'utf8');
            let mediaType = 'text';

            // 2. Quét YAML Frontmatter để tìm link Youtube/Video/Audio
            const frontmatterMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
            if (frontmatterMatch) {
                const yaml = frontmatterMatch[1].toLowerCase();
                if (yaml.includes('youtube:')) mediaType = 'youtube';
                else if (yaml.includes('video:')) mediaType = 'video';
                else if (yaml.includes('audio:')) mediaType = 'audio';
            }

            // 3. Nếu không có YAML, quét xem có Timestamp (0.0 5.2) không
            if (mediaType === 'text' && /^([\d.]+)\s+([\d.]+)/m.test(content)) {
                mediaType = 'audio';
            }

            // Lưu dữ liệu để Frontend đọc
            metadata[normalizedPath] = {
                date: date,
                mediaType: mediaType
            };
        }
    }
}

console.log("Đang quét siêu dữ liệu (Ngày giờ & Media Type)...");
walk('library');

fs.writeFileSync('src/file-dates.json', JSON.stringify(metadata, null, 2));
console.log("✅ Đã cập nhật xong siêu dữ liệu bài học!");