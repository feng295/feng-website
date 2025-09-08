document.addEventListener('DOMContentLoaded', () => {
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const plateNumber = document.getElementById('plateNumber');
    let isRecognizing = false;
    let lastPlate = '';
    let confidenceCount = 0;

    // 存取筆電攝影機
    async function startCamera() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });
            video.srcObject = stream;
            plateNumber.textContent = '攝影機已啟動，掃描車牌中...';
            startRecognitionLoop();
        } catch (error) {
            console.error('無法存取攝影機:', error);
            plateNumber.textContent = '無法存取攝影機，請檢查權限或設備';
        }
    }

    // 擷取影像並增強對比度
    function captureImage() {
        // 確保最小尺寸
        const minSize = 50;
        canvas.width = Math.max(video.videoWidth, minSize);
        canvas.height = Math.max(video.videoHeight, minSize);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // 對比度增強與灰度轉換
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            const brightness = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
            const contrast = (brightness - 128) * 3.2 + 128; // 進一步提高對比度
            data[i] = data[i + 1] = data[i + 2] = Math.max(0, Math.min(255, contrast));
        }
        ctx.putImageData(imageData, 0, 0);
        
        return canvas.toDataURL('image/jpeg');
    }

    // 驗證車牌格式 (3 個大寫字母 + 連字符 + 4 位數字)
    function isValidPlate(text) {
        const regex = /^[A-Z]{3}-[0-9]{4}$/; // 3 個大寫字母 + 連字符 + 4 位數字
        const cleanedText = text.trim().toUpperCase(); // 移除多餘空格並轉為大寫
        if (!regex.test(cleanedText)) return false;
        return cleanedText === text.trim(); // 確保無多餘字符
    }

    // 即時辨識循環
    async function startRecognitionLoop() {
        setInterval(async () => {
            if (isRecognizing) return;
            isRecognizing = true;
            plateNumber.textContent = '正在辨識...';
            try {
                const imageData = await captureImage();
                const { data: { text } } = await Tesseract.recognize(
                    imageData,
                    'eng', // 僅使用英文
                    { 
                        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-',
                        logger: (m) => console.log(m) // 輸出日誌檢查
                    }
                );
                const cleanedText = text.trim().replace(/\n/g, ' ').toUpperCase();
                if (isValidPlate(cleanedText)) {
                    if (cleanedText === lastPlate) {
                        confidenceCount++;
                        if (confidenceCount >= 2) {
                            plateNumber.textContent = `車牌號碼: ${cleanedText}`;
                        }
                    } else {
                        lastPlate = cleanedText;
                        confidenceCount = 1;
                        plateNumber.textContent = `車牌號碼: ${cleanedText}`;
                    }
                } else {
                    plateNumber.textContent = '無法辨識有效車牌 (格式：LLL-NNNN)';
                }
            } catch (error) {
                console.error('辨識錯誤:', error);
                plateNumber.textContent = '辨識失敗，請確保車牌清晰';
            } finally {
                isRecognizing = false;
            }
        }, 3000); // 每 3 秒辨識一次
    }

    // 初始化攝影機
    startCamera();
});