document.addEventListener('DOMContentLoaded', () => {
    const video = document.getElementById('video');
    const plateNumber = document.getElementById('plateNumber');
    const confirmButton = document.getElementById('confirmButton');
    const rescanButton = document.getElementById('rescanButton');
    let isRecognizing = false;
    let lastPlate = '';
    let confidenceCount = 0;
    let recognitionInterval = null;

    // 載入本地 OpenCV.js 備用
    function loadLocalOpenCV() {
        const localScript = document.createElement('script');
        localScript.src = 'opencv.js'; // 確保已下載並放置在項目中
        localScript.onload = () => console.log('本地 OpenCV 加載成功');
        localScript.onerror = () => {
            plateNumber.textContent = 'OpenCV 加載失敗 (CDN 和本地均不可用)，請檢查網路或檔案。';
            console.error('無法加載 OpenCV.js');
        };
        document.head.appendChild(localScript);
    }

    // 確保 OpenCV.js 加載完成
    function onOpenCvReady() {
        if (!window.cv) {
            plateNumber.textContent = 'OpenCV 未加載，請檢查網路或使用本地檔案。';
            console.error('cv 物件未定義');
            return;
        }

        cv['onRuntimeInitialized'] = () => {
            console.log('OpenCV 已加載完成');
            startCamera();
        };

        // 設置超時檢查
        setTimeout(() => {
            if (!cv['onRuntimeInitialized']) {
                plateNumber.textContent = 'OpenCV 初始化超時，請重新載入頁面或檢查網路。';
                console.error('OpenCV 初始化超時');
            }
        }, 10000); // 10 秒超時
    }

    // 存取筆電攝影機
    async function startCamera() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
            });
            video.srcObject = stream;
            video.play();
            plateNumber.textContent = '攝影機已啟動，掃描車牌中...';
            startRecognitionLoop();
        } catch (error) {
            console.error('無法存取攝影機:', error);
            plateNumber.textContent = `無法存取攝影機: ${error.message}`;
        }
    }

    // 擷取影像、自動裁切車牌區域並預處理
    function captureAndCropImage() {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.setAttribute('willReadFrequently', 'true');
        tempCanvas.width = video.videoWidth;
        tempCanvas.height = video.videoHeight;
        const ctx = tempCanvas.getContext('2d');
        ctx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);

        let src = cv.imread(tempCanvas);
        let gray = new cv.Mat();
        cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);

        // 增強對比度 (CLAHE)
        let clahe = new cv.CLAHE(2.0, new cv.Size(8, 8));
        clahe.apply(gray, gray);

        // 二值化
        cv.adaptiveThreshold(gray, gray, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, 11, 2);

        // 噪聲減少 (中值濾波)
        cv.medianBlur(gray, gray, 3);

        // 自動檢測車牌區域 (邊緣檢測 + 輪廓)
        let edges = new cv.Mat();
        cv.Canny(gray, edges, 50, 150);

        let contours = new cv.MatVector();
        let hierarchy = new cv.Mat();
        cv.findContours(edges, contours, hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE);

        let plateRegion = null;
        for (let i = 0; i < contours.size(); ++i) {
            let cnt = contours.get(i);
            let rect = cv.boundingRect(cnt);
            let aspectRatio = rect.width / rect.height;
            let area = cv.contourArea(cnt);
            if (aspectRatio > 2 && aspectRatio < 5 && area > 1000 && area < (video.videoWidth * video.videoHeight / 2)) {
                plateRegion = rect;
                break;
            }
        }

        let plateImage = null;
        if (plateRegion) {
            let roi = src.roi(plateRegion);
            let cropCanvas = document.createElement('canvas');
            cropCanvas.setAttribute('willReadFrequently', 'true');
            cropCanvas.width = roi.cols;
            cropCanvas.height = roi.rows;
            cv.imshow(cropCanvas, roi);
            plateImage = cropCanvas.toDataURL('image/jpeg');
            roi.delete();
        } else {
            plateImage = tempCanvas.toDataURL('image/jpeg'); // 若無檢測到，傳回完整影像
        }

        src.delete(); gray.delete(); edges.delete(); contours.delete(); hierarchy.delete();
        return plateImage;
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
                const imageData = await captureAndCropImage();
                console.log('Image captured for recognition');
                const { data: { text, confidence } } = await Tesseract.recognize(
                    imageData,
                    'eng',
                    { 
                        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-',
                        psm: 7,
                        logger: (m) => console.log(m)
                    }
                );
                const cleanedText = text.trim().replace(/\n/g, ' ').toUpperCase();
                console.log('Recognized text:', cleanedText, 'Confidence:', confidence);
                if (isValidPlate(cleanedText) && confidence > 50) {
                    if (cleanedText === lastPlate) {
                        confidenceCount++;
                        if (confidenceCount >= 2) {
                            plateNumber.textContent = `車牌號碼: ${cleanedText}`;
                            clearInterval(recognitionInterval);
                            recognitionInterval = null;
                            confirmButton.style.display = 'inline-block';
                            rescanButton.style.display = 'inline-block';
                            video.pause();
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
        }, 1000);
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
        video.play();
        startRecognitionLoop();
    });

    // 初始化 OpenCV 和攝影機
    onOpenCvReady();
});