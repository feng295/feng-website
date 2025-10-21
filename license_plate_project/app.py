import os
import sys
import cv2
import pytesseract
import torch
import json
import re
from flask import Flask, request, jsonify, render_template, Response, send_from_directory, abort
from pathlib import Path
import logging
import threading
import time

# 設置詳細日誌
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# 設置項目根目錄
BASE_DIR = r'C:\xampp\htdocs\MYWEBSITE\license_plate_project'

# 將 custom_yolov5 加入系統路徑
sys.path.insert(0, os.path.join(BASE_DIR, 'custom_yolov5'))

# 導入 YOLOv5 模塊
from custom_yolov5.utils.augmentations import letterbox
from custom_yolov5.utils.general import non_max_suppression, scale_boxes
from custom_yolov5.utils.torch_utils import select_device
from custom_yolov5.models.yolo import DetectionModel, Model

app = Flask(__name__, template_folder=os.path.join(BASE_DIR, 'templates'), static_folder=os.path.join(BASE_DIR, 'static'))

# 配置路徑
dataset_dir = os.path.join(BASE_DIR, 'dataset')
weights_dir = os.path.join(BASE_DIR, 'custom_yolov5', 'weights')
detect_model_path = os.path.join(weights_dir, 'best.pt')  # 使用下載的 .pt 檔案

# 載入 YOLOv5 模型
device = select_device('cpu')
detect_model = None
try:
    logger.debug(f"嘗試加載模型: {detect_model_path}")
    ckpt = torch.load(detect_model_path, map_location=device)
    if isinstance(ckpt, dict) and 'model' in ckpt:
        model = ckpt['model']
        if isinstance(model, DetectionModel):
            # 直接使用 DetectionModel 實例
            detect_model = model.to(device).eval()
            logger.info("模型載入成功 (直接使用 DetectionModel)")
        else:
            # 嘗試從 state_dict 初始化新模型
            state_dict = model.state_dict() if hasattr(model, 'state_dict') else model
            if isinstance(state_dict, dict):
                new_model = Model(cfg='custom_yolov5/models/yolov5m.yaml', ch=3, nc=1)  # 使用 yolo v5m.yaml 匹配下載模型
                new_model.load_state_dict(state_dict, strict=False)
                detect_model = new_model.to(device).eval()
                logger.info("模型載入成功 (從 state_dict 初始化)")
            else:
                raise ValueError(f"Unsupported model data format: {type(model)}")
    else:
        raise ValueError(f"Invalid checkpoint format: {type(ckpt)}")
    # 測試模型是否正常工作
    if detect_model is not None:
        dummy_input = torch.zeros((1, 3, 224, 224)).to(device)
        with torch.no_grad():
            output = detect_model(dummy_input)
        logger.info("模型測試成功")
except Exception as e:
    logger.error(f"載入模型失敗: {e}")
    detect_model = None

# 配置 Tesseract 路徑
try:
    pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
    logger.debug("Tesseract 路徑設置成功")
except Exception as e:
    logger.error(f"Tesseract 配置失敗: {e}")

# 確保輸出資料夾存在並初始化 results.txt
try:
    os.makedirs(dataset_dir, exist_ok=True)
    results_file_path = os.path.join(dataset_dir, 'results.txt')
    with open(results_file_path, 'w', encoding='utf-8') as f:
        f.write('')
    logger.debug(f"results.txt 初始化於: {results_file_path}")
except Exception as e:
    logger.error(f"初始化 results.txt 失敗: {e}")

# 控制視頻流狀態
is_streaming = False
frame_generator = None
lock = threading.Lock()

# 手動實現 plot_one_box 函數
def plot_one_box(xyxy, im, label=None, color=(0, 255, 0), line_thickness=2):
    try:
        x1, y1, x2, y2 = map(int, xyxy)
        if x1 >= x2 or y1 >= y2 or x1 < 0 or y1 < 0 or x2 > im.shape[1] or y2 > im.shape[0]:
            logger.warning(f"無效坐標: {xyxy}, 圖像尺寸: {im.shape}")
            return
        cv2.rectangle(im, (x1, y1), (x2, y2), color, line_thickness)
        if label:
            tf = max(line_thickness - 1, 1)
            t_size = cv2.getTextSize(label, 0, fontScale=line_thickness / 3, thickness=tf)[0]
            c2 = x1 + t_size[0], y1 - t_size[1] - 3
            if c2[0] > im.shape[1] or c2[1] < 0:
                c2 = (x1, y1 + 2)  # 自動調整到框內側
            cv2.rectangle(im, (x1, y1), c2, color, -1, line_thickness)
            cv2.putText(im, label, (x1, y1 - 2), 0, line_thickness / 3, [225, 255, 255], thickness=tf, lineType=cv2.LINE_AA)
    except Exception as e:
        logger.error(f"繪製矩形失敗: {e}")

def find_camera_index():
    for i in range(10):
        cap = cv2.VideoCapture(i, cv2.CAP_DSHOW)
        if cap.isOpened():
            width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            logger.info(f"找到攝影機，索引: {i}, 解析度: {width}x{height}")
            cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
            cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
            cap.release()
            return i
        cap.release()
    logger.error("未找到可用攝影機，請檢查設備或手動設置索引")
    return 0

def is_valid_plate(plate_text):
    pattern = r'^[A-Z]{3}[0-9]{4}$'
    return bool(re.match(pattern, plate_text.upper()))

def generate_frames():
    global frame_generator
    camera_index = find_camera_index()
    cap = cv2.VideoCapture(camera_index, cv2.CAP_DSHOW)
    if not cap.isOpened():
        logger.error(f"無法開啟攝影機 (索引 {camera_index})")
        yield jsonify({"error": f"無法開啟攝影機 (索引 {camera_index})"})
        return

    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
    cap.set(cv2.CAP_PROP_FPS, 10)  # 進一步降低幀率以減少卡頓
    logger.info(f"攝影機 (索引 {camera_index}) 啟動成功, 設定解析度 640x480, 幀率 10")
    
    try:
        start_time = time.time()
        while cap.isOpened():
            with lock:
                if not is_streaming:
                    break
            ret, frame = cap.read()
            if not ret:
                logger.warning("攝影機讀取失敗，嘗試重連...")
                time.sleep(1)
                continue
            
            img0 = frame.copy()
            h0, w0 = img0.shape[:2]
            img_size = 320  # 降低解析度以加快推理
            r = img_size / max(h0, w0)
            if r != 1:
                interp = cv2.INTER_AREA if r < 1 else cv2.INTER_LINEAR
                img0 = cv2.resize(img0, (int(w0 * r), int(h0 * r)), interpolation=interp)
            img = letterbox(img0, new_shape=img_size)[0]
            img = img[:, :, ::-1].transpose(2, 0, 1).copy()
            img = torch.from_numpy(img).to(device)
            img = img.float() / 255.0
            if img.ndimension() == 3:
                img = img.unsqueeze(0)

            current_result = None
            if detect_model is not None:
                pred = detect_model(img)
                pred = non_max_suppression(pred, conf_thres=0.1, iou_thres=0.3)  # 提高 conf_thres 減少檢測次數
                for det in pred:
                    if det is not None and len(det):
                        det[:, :4] = scale_boxes(img.shape[2:], det[:, :4], img0.shape).round()
                        for *xyxy, conf, cls in det:
                            x1, y1, x2, y2 = map(int, xyxy)
                            plate_img = img0[y1:y2, x1:x2]
                            gray = cv2.cvtColor(plate_img, cv2.COLOR_BGR2GRAY)
                            _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
                            plate_text = pytesseract.image_to_string(thresh, config='--psm 6 -c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', lang='eng').strip()
                            if plate_text and is_valid_plate(plate_text):
                                logger.info(f"檢測到有效台灣車牌: {plate_text} (耗時 {time.time() - start_time:.2f} 秒)")
                                plot_one_box(xyxy, img0, label=plate_text, color=(0, 255, 0), line_thickness=2)
                                current_result = plate_text
                                break
                            else:
                                logger.warning(f"無效車牌格式: {plate_text}")
            else:
                logger.warning("模型未載入，跳過檢測")

            if current_result:
                with open(results_file_path, 'a', encoding='utf-8') as result_file:
                    result_file.write(json.dumps(current_result) + '\n')
            else:
                with open(results_file_path, 'w', encoding='utf-8') as result_file:
                    result_file.write('')

            ret, buffer = cv2.imencode('.jpg', img0, [cv2.IMWRITE_JPEG_QUALITY, 90])
            if ret:
                frame = buffer.tobytes()
                logger.debug("生成並傳送視頻幀")
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')
            else:
                logger.error("圖像編碼失敗")
                break
    except Exception as e:
        logger.error(f"生成視頻幀失敗: {e}")
        yield jsonify({"error": f"生成視頻幀失敗: {e}"})
    finally:
        cap.release()
        logger.info("攝影機釋放")
        with lock:
            frame_generator = None

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/video_feed')
def video_feed():
    global frame_generator
    with lock:
        if frame_generator is None and is_streaming:
            frame_generator = generate_frames()
        return Response(frame_generator, mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/results', methods=['GET'])
def get_results():
    try:
        with open(results_file_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
            result = lines[-1:] if lines else ["尚未檢測到車牌"]
            return jsonify(result)
    except FileNotFoundError:
        logger.warning("results.txt 未找到")
        return jsonify(["尚未檢測到車牌"])

@app.route('/stop', methods=['POST'])
def stop_stream():
    global is_streaming, frame_generator
    try:
        with lock:
            is_streaming = False
            if frame_generator is not None:
                logger.info("關閉視頻流生成器")
                frame_generator = None
            logger.info("視頻流已停止")
        return jsonify({"message": "視頻流已停止"})
    except Exception as e:
        logger.error(f"停止視頻流失敗: {e}")
        return jsonify({"error": f"停止失敗: {str(e)}"}), 500

@app.route('/start', methods=['POST'])
def start_stream():
    global is_streaming, frame_generator
    with lock:
        if not is_streaming:
            is_streaming = True
            with open(results_file_path, 'w', encoding='utf-8') as f:
                f.write('')
            logger.info("清除舊的 results.txt 並重新啟動")
            frame_generator = generate_frames()
            logger.info("視頻流已重新啟動")
            return jsonify({"message": "視頻流已啟動"})
        else:
            logger.warning("視頻流已運行，忽略重複啟動")
            return jsonify({"message": "視頻流已運行"})

@app.route('/favicon.ico')
def favicon():
    try:
        return send_from_directory(app.static_folder, 'favicon.ico')
    except FileNotFoundError:
        logger.error(f"favicon.ico 未找到於 {app.static_folder}")
        return '', 204

@app.route('/static/<path:filename>')
def serve_static(filename):
    try:
        return send_from_directory(app.static_folder, filename)
    except FileNotFoundError:
        logger.error(f"靜態檔案 {filename} 未找到於 {app.static_folder}")
        abort(404)

@app.route('/.well-known/appspecific/com.chrome.devtools.json')
def chrome_devtools():
    return jsonify({})

if __name__ == '__main__':
    try:
        app.run(host='0.0.0.0', port=5000, debug=True)
    except Exception as e:
        logger.error(f"應用啟動失敗: {e}")
        sys.exit(1)