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

# 設置日誌
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(_name_)

# 將 custom_yolov5 和 models 加入系統路徑
sys.path.append(os.path.join(os.path.dirname(_file_), 'custom_yolov5'))
sys.path.append(os.path.join(os.path.dirname(_file_), 'custom_yolov5', 'models'))

from custom_yolov5.models.experimental import attempt_load
from custom_yolov5.utils.general import non_max_suppression, scale_coords
from custom_yolov5.utils.torch_utils import select_device
from custom_yolov5.utils.datasets import letterbox
from custom_yolov5.utils.plots import plot_one_box

app = Flask(_name_)

# 明確指定 static 資料夾路徑
app.static_folder = 'C:/xampp/htdocs/MYWEBSITE/license_plate_project/static'

# 配置路徑
base_dir = 'C:/xampp/htdocs/MYWEBSITE/license_plate_project'
dataset_dir = os.path.join(base_dir, 'dataset')
weights_dir = os.path.join(base_dir, 'custom_yolov5', 'weights')
detect_model_path = os.path.join(weights_dir, 'plate_detect.pt')

# 載入 YOLOv5 模型
device = select_device('cpu')
detect_model = None
try:
    detect_model = attempt_load(detect_model_path, map_location=device)
    detect_model.eval()
    logger.info("模型載入成功")
except Exception as e:
    logger.error(f"載入模型失敗: {e}")
    detect_model = None

# 配置 Tesseract 路徑
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

# 確保輸出資料夾存在並初始化 results.txt
os.makedirs(dataset_dir, exist_ok=True)
results_file_path = os.path.join(dataset_dir, 'results.txt')
with open(results_file_path, 'w', encoding='utf-8') as f:
    f.write('')

# 控制視頻流狀態
is_streaming = True
frame_generator = None
lock = threading.Lock()

def find_camera_index():
    for i in range(3):
        cap = cv2.VideoCapture(i)
        if cap.isOpened():
            cap.release()
            logger.info(f"找到可用攝影機，索引: {i}")
            return i
        cap.release()
    logger.error("未找到可用攝影機，請檢查設備或手動設置索引")
    return None

def is_valid_plate(plate_text):
    pattern = r'^[A-Z]{3}[0-9]{4}$'
    return bool(re.match(pattern, plate_text.upper()))

def generate_frames():
    global frame_generator
    camera_index = find_camera_index() or 0
    cap = cv2.VideoCapture(camera_index)
    if not cap.isOpened():
        logger.error(f"無法開啟攝影機 (索引 {camera_index})")
        yield json.dumps({"error": f"無法開啟攝影機 (索引 {camera_index})"})
        return
    
    logger.info(f"攝影機 (索引 {camera_index}) 啟動成功")
    img_size = 640
    
    try:
        while cap.isOpened():
            with lock:
                if not is_streaming:
                    break
            ret, frame = cap.read()
            if not ret:
                logger.warning("攝影機讀取失敗，嘗試重連...")
                time.sleep(1)  # 避免過於頻繁重試
                continue
            
            img0 = frame.copy()
            h0, w0 = img0.shape[:2]
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
                pred = detect_model(img)[0]
                pred = non_max_suppression(pred, conf_thres=0.3, iou_thres=0.5)
                for det in pred:
                    if det is not None and len(det):
                        det[:, :4] = scale_coords(img.shape[2:], det[:, :4], img0.shape).round()
                        for *xyxy, conf, cls in det:
                            x1, y1, x2, y2 = map(int, xyxy)
                            plate_img = img0[y1:y2, x1:x2]
                            plate_text = pytesseract.image_to_string(plate_img, config='--psm 8 -c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', lang='eng').strip()
                            if plate_text and is_valid_plate(plate_text):
                                logger.info(f"檢測到有效台灣車牌: {plate_text}")
                                plot_one_box(xyxy, img0, label=plate_text, color=(0, 255, 0), line_thickness=2)
                                current_result = plate_text
                                break  # 只處理第一個檢測到的車牌
                            else:
                                logger.warning(f"無效車牌格式: {plate_text}")
            else:
                logger.warning("模型未載入，跳過檢測")

            if current_result:
                with open(results_file_path, 'w', encoding='utf-8') as result_file:
                    result_file.write(json.dumps(current_result) + '\n')
            elif os.path.exists(results_file_path):
                with open(results_file_path, 'w', encoding='utf-8') as result_file:
                    result_file.write('')

            ret, buffer = cv2.imencode('.jpg', img0)
            if ret:
                frame = buffer.tobytes()
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')
                time.sleep(0.1)  # 控制幀率約 10 FPS
            else:
                logger.error("圖像編碼失敗")
                break
    except Exception as e:
        logger.error(f"生成視頻幀失敗: {e}")
        yield json.dumps({"error": f"生成視頻幀失敗: {e}"})
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
        if frame_generator is None or not is_streaming:
            frame_generator = generate_frames()
        return Response(frame_generator, mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/results', methods=['GET'])
def get_results():
    try:
        with open(results_file_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
            return jsonify(lines[-1:] if lines else ["尚未檢測到車牌"])  # 只返回最新一行
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
                logger.info(f"關閉視頻流生成器: {type(frame_generator)}")
                try:
                    if hasattr(frame_generator, 'close'):
                        frame_generator.close()
                        logger.info("視頻流生成器成功關閉")
                    else:
                        logger.warning("frame_generator 無 close 方法，強制設為 None")
                except Exception as e:
                    logger.error(f"關閉生成器失敗: {type(e).__name__}: {str(e)}", exc_info=True)
                finally:
                    frame_generator = None
            else:
                logger.warning("frame_generator 已為 None，無需關閉")
            logger.info("視頻流已停止")
        return jsonify({"message": "視頻流已停止"})
    except Exception as e:
        logger.error(f"停止視頻流失敗: {type(e).__name__}: {str(e)}", exc_info=True)
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
            if frame_generator is not None:
                try:
                    if hasattr(frame_generator, 'close'):
                        frame_generator.close()
                except Exception as e:
                    logger.error(f"清理舊生成器失敗: {type(e).__name__}: {str(e)}", exc_info=True)
            frame_generator = generate_frames()
            logger.info("視頻流已重新啟動")
            return jsonify({"message": "視頻流已啟動"})
        else:
            logger.warning("視頻流已運行，忽略重複啟動")
            return jsonify({"message": "視頻流已運行"})

@app.route('/favicon.ico')
def favicon():
    static_folder = app.static_folder
    logger.info(f"嘗試提供 favicon.ico 從: {static_folder}")
    try:
        return send_from_directory(static_folder, 'favicon.ico')
    except FileNotFoundError:
        logger.error(f"favicon.ico 未找到於 {static_folder}")
        return '', 204

@app.route('/static/<path:filename>')
def serve_static(filename):
    static_folder = app.static_folder
    logger.info(f"嘗試提供靜態檔案: {os.path.join(static_folder, filename)}")
    try:
        return send_from_directory(static_folder, filename)
    except FileNotFoundError:
        logger.error(f"靜態檔案 {filename} 未找到於 {static_folder}")
        abort(404)

@app.route('/.well-known/appspecific/com.chrome.devtools.json')
def chrome_devtools():
    return jsonify({})

if _name_ == '_main_':
    app.run(host='0.0.0.0', port=5000, debug=True)