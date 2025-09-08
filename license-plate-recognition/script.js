document.addEventListener('DOMContentLoaded', () => {
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const plateNumber = document.getElementById('plateNumber');
    const confirmButton = document.getElementById('confirmButton');
    const rescanButton = document.getElementById('rescanButton');
    let isRecognizing = false;
    let lastPlate = '';
    let confidenceCount = 0;
    let recognitionInterval = null;

    // 存取筆電攝影機
    async function startCamera() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
            });
            video.srcObject = stream;
            video.play();
            plateNumber.textContent = '攝影機已啟動，掃描車牌中...';
            startRecognitionLoop();
        } catch (error) {
            console.error('無法存取攝影機:', error);
            plateNumber.textContent = `無法存取攝影機: ${error.message}, 請檢查權限或設備`;
        }
    }

    // 擷取影像並增強對比度，同時更新畫布
    function captureImage() {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            const brightness = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
            const contrast = (brightness - 128) * 3.2 + 128;
            data[i] = data[i + 1] = data[i + 2] = Math.max(0, Math.min(255, contrast));
        }
        ctx.putImageData(imageData, 0, 0);
        
        return canvas.toDataURL('image/jpeg');
    }

    // 驗證車牌格式
    function isValidPlate(text) {
        const regex = /^[A-Z]{3}-[0-9]{4}$/;
        const cleanedText = text.trim().toUpperCase();
        if (!regex.test(cleanedText)) return false;
        return cleanedText === text.trim();
    }

    // 即時辨識循環
    function startRecognitionLoop() {
        if (recognitionInterval) clearInterval(recognitionInterval);
        recognitionInterval = setInterval(async () => {
            if (isRecognizing) return;
            isRecognizing = true;
            plateNumber.textContent = '正在辨識...';
            try {
                const imageData = await captureImage(); // 每次循環更新畫布
                console.log('Image captured for recognition');
                const { data: { text } } = await Tesseract.recognize(
                    imageData,
                    'eng',
                    { 
                        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-',
                        logger: (m) => console.log(m)
                    }
                );
                const cleanedText = text.trim().replace(/\n/g, ' ').toUpperCase();
                console.log('Recognized text:', cleanedText);
                if (isValidPlate(cleanedText)) {
                    if (cleanedText === lastPlate) {
                        confidenceCount++;
                        if (confidenceCount >= 2) {
                            plateNumber.textContent = `車牌號碼: ${cleanedText}`;
                            clearInterval(recognitionInterval);
                            recognitionInterval = null;
                            confirmButton.style.display = 'inline-block';
                            rescanButton.style.display = 'inline-block';
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
                plateNumber.textContent = `辨識失敗: ${error.message}, 請確保車牌清晰`;
            } finally {
                isRecognizing = false;
            }
        }, 500);
    }

    // 確認按鈕事件
    confirmButton.addEventListener('click', () => {
        plateNumber.textContent = `已確認車牌號碼: ${lastPlate}`;
        confirmButton.style.display = 'none';
        rescanButton.style.display = 'none';
    });

    // 重新掃描按鈕事件
    rescanButton.addEventListener('click', () => {
        lastPlate = '';
        confidenceCount = 0;
        plateNumber.textContent = '攝影機已啟動，掃描車牌中...';
        confirmButton.style.display = 'none';
        rescanButton.style.display = 'none';
        startRecognitionLoop();
    });

    // 初始化攝影機
    startCamera();
});