# 🚀 IDM Typing Master 
**Multi-Language Typing & Dictation Practice Web App**

🌐 **[Live Demo / Chơi ngay tại đây](https://idmbull.github.io/lang/)** 

---

## 🇻🇳 TIẾNG VIỆT

**IDM Typing Master** là một ứng dụng web tĩnh (Zero-Backend) được thiết kế đặc biệt để luyện gõ phím và luyện nghe chép chính tả (Dictation) hỗ trợ đa ngôn ngữ (Anh, Trung, Hàn). 

Dự án chạy hoàn toàn trên trình duyệt, không cần máy chủ, và được tự động hóa hoàn toàn bằng GitHub Actions.

### ✨ Tính năng nổi bật
* **🎧 Chép chính tả (Dictation Mode):** Đồng bộ hóa chính xác từng câu gõ với file âm thanh `.mp3` dựa trên timestamp. Tự động chuyển câu khi gõ xong.
* **🗣️ Đọc từ vựng tự động (TTS & Dictionary):** Tự động phát âm từ vựng vừa gõ hoặc khi click đúp bằng cách fetch từ các từ điển lớn (Oxford, Youdao) hoặc sử dụng Giọng đọc máy tính (Native Web Speech API).
* **⌨️ Hỗ trợ Bộ gõ IME Hoàn hảo:** Tối ưu hóa tuyệt đối cho việc gõ Tiếng Trung (Pinyin) và Tiếng Hàn (Hangul). Khung chọn chữ bám sát con trỏ, không bị lỗi chớp nháy (Jitter).
* **👁️‍🗨️ Chế độ mù (Blind Mode):** Giấu văn bản để rèn luyện trí nhớ cơ bắp và kỹ năng nghe.
* **📝 Sổ Từ Vựng (Flashcard Ready):** Bôi đen văn bản để lưu từ. Hỗ trợ xuất file `.txt` (kèm timestamp) và tải file `.mp3` về máy để đưa thẳng vào Anki.
* **📂 Tải bài tập Local:** Người dùng có thể kéo thả file `.txt/.md` và `.mp3` từ máy tính cá nhân thẳng vào trình duyệt để tự luyện mà không cần upload lên mạng.
* **⚡ Tự động hóa CI/CD:** Chỉ cần ném file bài học `.md` vào thư mục `library` trên GitHub. Hệ thống sẽ tự động quét, sắp xếp theo thời gian mới nhất và xuất bản lên web.

### ⌨️ Phím tắt (Shortcuts)
* `Tab` (Nhấn 1 lần): Đọc lại đoạn Audio hiện tại / Hoặc đọc câu TTS.
* `Tab` (Nhấn đúp): Ép buộc đọc phát âm của riêng Từ vựng đang đứng.
* `Ctrl + Space`: Đọc lại Audio (Tương tự nhấn Tab 1 lần).
* `Ctrl + B`: Bật / Tắt chế độ Blind Mode (Giấu chữ).

### 🛠️ Dành cho Quản trị viên (Cách thêm bài học)
1. Trên trang chủ GitHub của repo này, mở thư mục `library`.
2. Kéo thả file Markdown (`.md`) bài học mới vào thư mục.
3. Bấm **Commit changes**.
4. GitHub Actions sẽ tự động Build bằng Vite và trang web sẽ tự động cập nhật sau 1 phút!

---

## 🇬🇧 ENGLISH

**IDM Typing Master** is a zero-backend, fully static web application tailored for typing practice and audio dictation. It features native support for multi-language learners (English, Mandarin Chinese, and Korean).

The app runs entirely in the browser and leverages GitHub Actions for zero-configuration deployments.

### ✨ Key Features
* **🎧 Dictation Mode:** Syncs typing inputs with `.mp3` audio files using timestamps. Automatically plays the next audio segment upon completing a sentence.
* **🗣️ Smart Pronunciation (TTS & Dict):** Automatically pronounces completed words or double-clicked words by fetching from major dictionaries (Oxford, Youdao) with a robust Native Web Speech API fallback.
* **⌨️ Flawless IME Support:** Deeply optimized for Chinese Pinyin and Korean Hangul inputs. The composition tooltip follows the caret smoothly without UI jittering.
* **👁️‍🗨️ Blind Mode:** Hides the text layout to strictly train muscle memory and listening comprehension.
* **📝 Vocabulary Manager (Flashcard Ready):** Highlight any text to save it to your vocabulary list. Export directly to a `.txt` file (with audio timestamps) and download the `.mp3` for seamless Anki integration.
* **📂 Local File Load (Drag & Drop):** Users can drop their own `.txt/.md` and `.mp3` files directly into the browser to practice offline. No server upload required.
* **⚡ Zero-Config CI/CD:** Just drop a new `.md` lesson file into the `library` folder on GitHub. Vite and GitHub Actions will automatically scan, sort by the latest modification date, and deploy the site.

### ⌨️ Keyboard Shortcuts
* `Tab` (Single press): Replay the current Audio segment / Read the sentence via TTS.
* `Tab` (Double press): Force pronounce the specific vocabulary word at the caret.
* `Ctrl + Space`: Replay Audio (Same as single Tab).
* `Ctrl + B`: Toggle Blind Mode (Hide text).

### 🛠️ How to Add New Lessons (For Repo Owners)
1. Navigate to the `library` folder in this GitHub repository.
2. Drag and drop your new Markdown (`.md`) file.
3. Click **Commit changes**.
4. GitHub Actions will trigger a Vite build, and your site will be updated automatically in about 1 minute!

---

### 💻 Local Development
If you want to run or modify this project on your local machine:
```bash
# Clone the repository
git clone https://github.com/idmbull/lang.git

# Navigate to the directory
cd lang

# Install dependencies
npm install

# Start the development server
npm run dev