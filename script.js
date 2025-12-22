console.log("script.js loaded");
// 全局變量，用於標記 Google Maps API 是否已載入
window.isGoogleMapsLoaded = false;
// Google Maps API 載入完成後的回調函數
window.initMap = function () {
    console.log("Google Maps API loaded successfully");
    window.isGoogleMapsLoaded = true;
};
window.handleMapLoadError = function () {
    console.error("Google Maps API 載入失敗");
    window.isGoogleMapsLoaded = false;
    alert("無法載入 Google Maps API，請檢查網路連線或 API 金鑰是否有效。");
};
document.addEventListener("DOMContentLoaded", async function () {
    console.log("DOM fully loaded");
    // 定義所有 DOM 元素
    const authContainer = document.getElementById("authContainer");
    const parkingContainer = document.getElementById("parkingContainer");
    const authForm = document.getElementById("authForm");
    const formTitle = document.getElementById("formTitle");
    const submitButton = document.getElementById("submitButton");
    const toggleMessage = document.getElementById("toggleMessage");
    const errorMessage = document.getElementById("errorMessage");
    const logoutButton = document.getElementById("logoutButton");
    const historyList = document.getElementById("historyList");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const nameInput = document.getElementById("name");
    const phoneInput = document.getElementById("phone");
    const roleInput = document.getElementById("role");
    const cardNumberContainer = document.getElementById("cardNumberContainer");
    const cardNumberInput = document.getElementById("card_number");
    const renterFields = document.getElementById("renterFields");
    const licensePlateInput = document.getElementById("license_plate");
    // 檢查必要的 DOM 元素是否存在
    if (!emailInput || !passwordInput || !authForm || !logoutButton || !historyList) {
        console.error("Required DOM elements are missing: emailInput, passwordInput, authForm, logoutButton, or historyList");
        return;
    }
    let isLogin = true;
    const API_URL = '/api/v1'; // 後端 URL
    // 顯示錯誤訊息
    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.classList.remove("success");
        errorMessage.style.color = "red";
    }
    // 顯示成功訊息
    function showSuccess(message) {
        errorMessage.textContent = message;
        errorMessage.classList.add("success");
        errorMessage.style.color = "green";
    }
    // 從 localStorage 安全地獲取 token
    function getToken() {
        try {
            return localStorage.getItem("token") || "";
        } catch (error) {
            console.error("Failed to get token from localStorage:", error);
            return "";
        }
    }
    // 存儲 token 到 localStorage
    function setToken(token) {
        try {
            localStorage.setItem("token", token);
        } catch (error) {
            console.error("Failed to set token in localStorage:", error);
        }
    }
    // 移除 token
    function removeToken() {
        try {
            localStorage.removeItem("token");
            localStorage.removeItem("role");
            localStorage.removeItem("member_id");
            localStorage.removeItem("selectedParkingSpotId");
            history.pushState({}, '', '/');
        } catch (error) {
            console.error("Failed to remove token from localStorage:", error);
        }
    }
    // 從 localStorage 獲取 parking_spot_id
    function getParkingSpotId() {
        try {
            const spotId = localStorage.getItem("selectedParkingSpotId");
            return spotId ? Number(spotId) : null;
        } catch (error) {
            console.error("Failed to get parking_spot_id from localStorage:", error);
            return null;
        }
    }
    // 存儲 parking_spot_id 到 localStorage
    function setParkingSpotId(spotId) {
        try {
            localStorage.setItem("selectedParkingSpotId", spotId.toString());
        } catch (error) {
            console.error("Failed to set parking_spot_id in localStorage:", error);
        }
    }
    // 從 localStorage 獲取用戶角色
    function getRole() {
        try {
            const role = localStorage.getItem("role") || "";
            return role.toLowerCase().trim();
        } catch (error) {
            console.error("Failed to get role from localStorage:", error);
            return "";
        }
    }
    // 存儲角色到 localStorage
    function setRole(role) {
        try {
            if (!role) {
                console.warn("Attempted to set empty role, skipping.");
                return;
            }
            const validRoles = ["renter", "admin"];
            const normalizedRole = role.toLowerCase().trim();
            if (!validRoles.includes(normalizedRole)) {
                console.warn(`Invalid role "${normalizedRole}" ignored. Expected: ${validRoles.join(", ")}`);
                return;
            }
            localStorage.setItem("role", normalizedRole);
            console.log("Role set in localStorage:", normalizedRole);
        } catch (error) {
            console.error("Failed to set role in localStorage:", error);
        }
    }
    // 從 localStorage 獲取 member_id
    function getMemberId() {
        try {
            const memberId = localStorage.getItem("member_id");
            return memberId ? Number(memberId) : null;
        } catch (error) {
            console.error("Failed to get member_id from localStorage:", error);
            return null;
        }
    }
    // 顯示主畫面，並根據角色動態調整功能清單和預設畫面
    function showMainPage() {
        console.log("Entering showMainPage function");
        authContainer.style.display = "none";
        parkingContainer.style.display = "block";
        const functionList = document.querySelector(".function-list");
        const contentContainer = document.querySelector(".content-container");
        const pageTitle = document.getElementById("pageTitle");
        if (!functionList || !contentContainer || !pageTitle) {
            console.error("Required DOM elements for main page are missing: .function-list, .content-container, or pageTitle");
            return;
        }
        functionList.style.display = "block";
        contentContainer.style.display = "block";
        logoutButton.style.display = "block";
        const role = getRole();
        console.log("Current role in showMainPage:", role);
        const validRoles = ["renter", "admin"];
        if (!role || !validRoles.includes(role)) {
            console.error(`Unrecognized role: "${role}". Expected one of: ${validRoles.join(", ")}. Redirecting to login.`);
            removeToken();
            showLoginPage();
            return;
        }
        const newPath = `/${role}`;
        history.replaceState({ role }, '', newPath);
        console.log(`URL updated to: ${window.location.pathname}`);
        if (role === "renter") pageTitle.textContent = "停車位租用者";
        else if (role === "admin") pageTitle.textContent = "停車場共享者";
        const navList = document.querySelector(".function-list ul");
        if (!navList) {
            console.error("Navigation list (.function-list ul) not found");
            return;
        }
        if (role === "renter") {
            navList.innerHTML = `
                <li><a href="#" class="nav-link" data-target="parkingLotSelector">停車場進出場管理</a></li>
                <li><a href="#" class="nav-link" data-target="history">租用紀錄</a></li>
                <li><a href="#" class="nav-link" data-target="profile">個人資訊</a></li>
            `;
        } else if (role === "admin") {
            navList.innerHTML = `
                <li><a href="#" class="nav-link" data-target="addParking">新增停車場</a></li>
                <li><a href="#" class="nav-link" data-target="My parking space">停車場資訊</a></li>
                <li><a href="#" class="nav-link" data-target="incomeInquiry">收入查詢</a></li>
                <li><a href="#" class="nav-link" data-target="profile">個人資訊</a></li>
            `;
        }
        document.querySelectorAll(".content-section").forEach(section => {
            section.style.display = "none";
        });
        // role 已在上方驗證為 "renter" 或 "admin"，使用簡單的三元運算子確保有預設值
        const defaultSectionId = role === "renter" ? "history" : "My parking space";
        const defaultSection = document.getElementById(defaultSectionId);
        if (!defaultSection) {
            console.error(`Default section "${defaultSectionId}" not found`);
            return;
        }
        defaultSection.style.display = "block";
        if (defaultSectionId === "My parking space") setupMyParkingSpace();
        else if (defaultSectionId === "history") loadHistory();
        else if (defaultSectionId === "viewAllUsers") setupViewAllUsers();
        else if (defaultSectionId === "incomeInquiry") setupIncomeInquiry();
        else if (defaultSectionId === "addParking") setupAddParking();
        else if (defaultSectionId === "rentParking") setupRentParking();
        else if (defaultSectionId === "settleParking") setupSettleParking();
        else setupMyParkingSpace();
        const navLinks = document.querySelectorAll(".nav-link");
        // 移除舊的事件監聽器，避免重複綁定
        navLinks.forEach(link => {
            const newLink = link.cloneNode(true);
            link.parentNode.replaceChild(newLink, link);
            newLink.addEventListener("click", (e) => {
                e.preventDefault();
                const target = newLink.getAttribute("data-target");
                console.log(`Nav link clicked, target: ${target}`);
                document.querySelectorAll(".content-section").forEach(section => {
                    section.style.display = "none";
                });
                const section = document.getElementById(target);
                if (section) {
                    section.style.display = "block";
                    if (target === "My parking space") {
                        setupMyParkingSpace();
                    } else if (target === "reserveParking") {
                        setupReserveParking();
                    } else if (target === "history") {
                        loadHistory();
                    } else if (target === "incomeInquiry") {
                        setupIncomeInquiry();
                    } else if (target === "viewAllUsers") {
                        setupViewAllUsers();
                    } else if (target === "profile") {
                        setupProfile();
                    } else if (target === "addParking") {
                        setupAddParking();
                    } else if (target === "parkingLotSelector") {
                        setupParkingLotSelector();
                    } else if (target === "rentParking") {
                        setupRentParking();
                    } else if (target === "settleParking") {
                        setupSettleParking();
                    } else {
                        // 未定義的 target，但 section 已找到，僅記錄警告
                        console.warn(`No handler for target: ${target}`);
                    }
                } else {
                    console.error(`Section with ID "${target}" not found`);
                }
            });
        });
    }

    // 全域變數：儲存所有停車場資料
    let allParkingLots = [];
    // 載入停車場並建立下拉選單（只呼叫一次）
    async function loadParkingLotSelector() {
        const select = document.getElementById("parkingLotActionSelect");
        const status = document.getElementById("selectorStatus");
        const enterBtn = document.getElementById("enterSelectedLotBtn");
        if (!select) {
            console.error("找不到 parkingLotActionSelect 元素");
            return;
        }
        // 避免重複載入
        if (allParkingLots.length > 0) {
            console.log("停車場清單已載入，跳過重複請求");
            return;
        }
        select.innerHTML = '<option value="">載入中...</option>';
        if (status) status.textContent = "載入停車場中...";
        try {
            const token = getToken();
            if (!token) throw new Error("無效的登入狀態");
            const response = await fetch(`${API_URL}/parking/all`, {
                method: 'GET',
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });
            if (!response.ok) {
                if (response.status === 401) {
                    alert("登入過期，請重新登入");
                    removeToken();
                    showLoginPage(true);
                    return;
                }
                throw new Error(`伺服器錯誤 ${response.status}`);
            }
            const result = await response.json();
            allParkingLots = result.data || result || [];
            if (!Array.isArray(allParkingLots) || allParkingLots.length === 0) {
                select.innerHTML = '<option value="">目前無可用停車場</option>';
                if (status) status.textContent = "無停車場資料";
                return;
            }
            // 清空並重建選單
            select.innerHTML = '<option value="">-- 請選擇停車場與動作 --</option>';
            allParkingLots.forEach(lot => {
                const lotId = lot.parking_lot_id || lot.id || lot.parkingLotId;
                const lotName = lot.name || lot.location || lot.address || `未知停車場 (${lotId})`;
                if (!lotId) {
                    console.warn("停車場缺少 ID，跳過:", lot);
                    return;
                }
                // 進場選項
                const optIn = document.createElement("option");
                optIn.value = JSON.stringify({ id: lotId, action: "rent", name: lotName });
                optIn.textContent = `${lotName} ── 進場`;
                select.appendChild(optIn);
                // 出場選項
                const optOut = document.createElement("option");
                optOut.value = JSON.stringify({ id: lotId, action: "settle", name: lotName });
                optOut.textContent = `${lotName} ── 出場`;
                select.appendChild(optOut);
            });
            if (status) {
                status.textContent = `已載入 ${allParkingLots.length} 個停車場`;
                status.style.color = "green";
            }
            // 預設啟用按鈕
            if (enterBtn) enterBtn.disabled = false;
        } catch (err) {
            console.error("載入停車場清單失敗:", err);
            select.innerHTML = '<option value="">載入失敗，請重新整理</option>';
            if (status) {
                status.textContent = "載入失敗：" + err.message;
                status.style.color = "red";
            }
            alert("無法載入停車場清單，請檢查網路或稍後再試");
        }
    }
    // 設定「選擇停車場」頁面
    function setupParkingLotSelector() {
        const selectorSection = document.getElementById("parkingLotSelector");
        const rentSection = document.getElementById("rentParking");
        const settleSection = document.getElementById("settleParking");
        const select = document.getElementById("parkingLotActionSelect");

        if (!selectorSection || !rentSection || !settleSection || !select) {
            console.error("缺少必要元素，無法初始化停車場選擇器");
            return;
        }

        // 隱藏所有內容，只顯示選擇器
        document.querySelectorAll(".content-section").forEach(sec => {
            sec.style.display = "none";
        });
        selectorSection.style.display = "block";

        // 載入停車場清單
        loadParkingLotSelector();

        // 關鍵：選完立刻自動跳轉
        select.onchange = null;
        select.onchange = function () {
            const selectedValue = this.value.trim();
            if (!selectedValue) return;

            let selectedData;
            try {
                selectedData = JSON.parse(selectedValue);
            } catch (e) {
                alert("選項資料異常，請重新選擇");
                this.value = "";
                return;
            }

            const { id, action, name } = selectedData;

            // 立刻隱藏選擇器
            document.getElementById("parkingLotSelector").style.display = "none";

            if (action === "rent") {
                // === 進場模式 ===
                document.getElementById("rentParking").style.display = "block";

                // 更新標題：停車場名稱 + 進場
                document.getElementById("rentParkingName").textContent = name;
                document.getElementById("rentParkingAction").textContent = "進場";

                // 設定隱藏的 parking lot id（給後端用）
                const demoInput = document.getElementById("demoParkingLotId");
                if (demoInput) {
                    demoInput.value = id;
                    console.log("【成功】已設定停車場 ID =", id, "| 停車場名稱 =", name);
                } else {
                    console.error("找不到 demoParkingLotId 輸入框！請檢查 HTML 是否有這個 hidden input");
                }

                // 強制等 DOM 更新完再初始化進場功能（這行是救命關鍵！）
                setTimeout(() => {
                    if (typeof setupRentParking === "function") {
                        console.log("【成功】setupRentParking 延遲執行，現在一定讀得到 ID =", demoInput?.value);
                        setupRentParking();
                    }
                }, 0);

            } else if (action === "settle") {
                // === 出場模式 ===
                document.getElementById("settleParking").style.display = "block";

                // 更新標題：停車場名稱 + 出場
                document.getElementById("settleParkingName").textContent = name;
                document.getElementById("settleParkingAction").textContent = "出場";

                // 設定隱藏的 parking lot id
                const demoInput = document.getElementById("demoParkingLotId");
                if (demoInput) demoInput.value = id;

                // 出場不需要延遲
                if (typeof setupSettleParking === "function") setupSettleParking();
            }
        };
    }

    // 載入停車場列表（讓共享者看到即時剩餘車位）
    async function setupParkingList() {
        const parkingListTableBody = document.getElementById("parkingListTableBody");
        if (!parkingListTableBody) return;

        parkingListTableBody.innerHTML = '<tr><td colspan="7" class="text-center py-10">載入中...</td></tr>';

        try {
            const token = getToken();
            const response = await fetch(`${API_URL}/parking_lots`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (!response.ok) throw new Error("無法載入停車場列表");
            const data = await response.json();

            parkingListTableBody.innerHTML = "";
            if (data.length === 0) {
                parkingListTableBody.innerHTML = "<tr><td colspan='7' class='text-center py-10 text-red-600'>目前沒有停車場</td></tr>";
            } else {
                data.forEach(spot => {
                    const row = document.createElement("tr");
                    row.className = "hover:bg-gray-50 transition-colors";
                    row.innerHTML = `
                    <td class="py-6 px-8 font-bold text-gray-800">${spot.name}</td>
                    <td class="py-6 px-8">${spot.address}</td>
                    <td class="py-6 px-8">${spot.total_spots}</td>
                    <td class="py-6 px-8">${spot.hourly_rate}</td>
                    <td class="py-6 px-8">${spot.latitude.toFixed(6)}</td>
                    <td class="py-6 px-8">${spot.longitude.toFixed(6)}</td>
                    <td class="py-6 px-8 space-x-3">
                        <button class="edit-btn bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold text-lg" data-id="${spot.parking_lot_id}">編輯 ✏️</button>
                        <button class="delete-btn bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-bold text-lg" data-id="${spot.parking_lot_id}">刪除 🗑️</button>
                    </td>
                `;
                    parkingListTableBody.appendChild(row);
                });
            }
        } catch (error) {
            console.error("Failed to load parking list:", error);
            parkingListTableBody.innerHTML = "<tr><td colspan='7' class='text-center py-10 text-red-600'>載入失敗</td></tr>";
        }
    }

    // ==================== 終極進場功能（startButton 開鏡頭、rescanButton 重新掃描）====================
    function setupRentParking() {
        const role = getRole();
        if (role !== "renter") {
            alert("此功能僅限租用者使用！");
            return;
        }

        const section = document.getElementById("rentParking");
        if (!section) return;
        section.style.display = "block";

        const video = document.getElementById("videoRent");
        const fallback = document.getElementById("fallbackRent");
        const plateList = document.getElementById("plateListRent");
        const loading = document.getElementById("loadingRent");
        const error = document.getElementById("errorRent");
        const confirmButton = document.getElementById("confirmButtonRent");
        const rescanButton = document.getElementById("rescanButtonRent");
        const startButton = document.getElementById("startButtonRent");
        const stopButton = document.getElementById("stopButtonRent");

        let currentPlate = null;
        let isScanning = false;
        let stream = null;

        const demoInput = document.getElementById("demoParkingLotId");
        const parkingLotId = demoInput?.value ? parseInt(demoInput.value, 10) : null;
        if (!parkingLotId) {
            alert("請先選擇停車場！");
            return;
        }

        // 強制重置按鈕（防止重新整理殭屍狀態）
        if (confirmButton) {
            confirmButton.textContent = "確認進場";
            confirmButton.disabled = true;
            confirmButton.style.display = "inline-block";
        }
        if (startButton) startButton.textContent = "開始掃描";
        if (startButton) startButton.style.display = "inline-block";
        if (stopButton) stopButton.style.display = "none";
        if (rescanButton) rescanButton.style.display = "none";

        async function startCamera() {
            if (isScanning) return;

            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
                video.srcObject = stream;
                video.style.display = "block";
                fallback.style.display = "none";
                loading.style.display = "block";
                plateList.innerHTML = '<div class="text-gray-500 text-5xl">掃描中...</div>';
                confirmButton.disabled = true;
                rescanButton.style.display = "none";

                isScanning = true;
                scanPlate();

                startButton.style.display = "none";
                stopButton.style.display = "inline-block";

            } catch (err) {
                error.textContent = "無法開啟攝影機：" + err.message;
                error.style.display = "block";
                fallback.style.display = "block";
            }
        }

        function stopCamera() {
            if (stream) {
                stream.getTracks().forEach(t => t.stop());
                stream = null;
                video.srcObject = null;
                video.style.display = "none";
            }
            isScanning = false;
            loading.style.display = "none";

            startButton.style.display = "inline-block";
            stopButton.style.display = "none";
        }

        function resetToScanningState() {
            currentPlate = null;
            plateList.innerHTML = '<div class="text-gray-500 text-5xl">請將車牌對準鏡頭...</div>';
            confirmButton.disabled = true;
            confirmButton.style.display = "inline-block";
            rescanButton.style.display = "none";
            startButton.textContent = "開始掃描";
            startButton.style.display = "inline-block";
            stopButton.style.display = "none";
        }

        function scanPlate() {
            if (!isScanning) return;

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = video.videoWidth || 640;
            canvas.height = video.videoHeight || 480;
            ctx.drawImage(video, 0, 0);

            canvas.toBlob(async (blob) => {
                if (!blob || !isScanning) return;

                const fd = new FormData();
                fd.append('frame', blob, 'frame.jpg');

                try {
                    const res = await fetch('/license-plate/process_frame', { method: 'POST', body: fd });
                    if (!res.ok) return;
                    const data = await res.json();

                    if (data.plate && data.plate !== currentPlate) {
                        const cleanPlate = data.plate.replace(/[^A-Z0-9]/g, '').toUpperCase();
                        currentPlate = cleanPlate;

                        stopCamera();
                        loading.style.display = "none";

                        plateList.innerHTML = `
                        <div class="text-center animate-bounce">
                            <div class="text-green-600 text-9xl font-black mb-8 tracking-widest">${cleanPlate}</div>
                            <div class="bg-green-600 text-white text-6xl font-bold px-16 py-8 rounded-3xl shadow-2xl inline-block">
                                辨識成功！
                            </div>
                        </div>
                    `;

                        confirmButton.disabled = false;
                        confirmButton.textContent = "確認進場";

                        rescanButton.textContent = "重新掃描";
                        rescanButton.style.display = "inline-block";
                    }
                } catch (err) {
                    console.warn("辨識失敗：", err.message);
                }

                if (isScanning) setTimeout(scanPlate, 800);
            }, 'image/jpeg', 0.8);
        }

        // 確認進場 → 永久成功畫面
        confirmButton.onclick = async () => {
            if (!currentPlate) return;

            confirmButton.disabled = true;
            confirmButton.textContent = "進場中...";

            try {
                const token = getToken();
                const res = await fetch(`${API_URL}/rent`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({
                        license_plate: currentPlate,
                        parking_lot_id: parkingLotId,
                        start_time: new Date().toISOString()
                    })
                });

                if (res.ok) {
                    plateList.innerHTML = `
                <div class="text-center min-h-screen flex flex-col items-center justify-center bg-gray-50">
                    <div class="text-green-600 text-9xl font-black mb-12 tracking-widest">${currentPlate}</div>
                    <div class="bg-gradient-to-r from-green-600 to-emerald-700 text-white text-8xl font-extrabold px-32 py-20 rounded-3xl shadow-2xl">
                        進場成功！
                    </div>
                </div>
            `;
                    confirmButton.style.display = "none";
                    rescanButton.textContent = "重新掃描";
                    rescanButton.style.display = "inline-block";
                    startButton.style.display = "none";
                    stopButton.style.display = "none";

                    // 關鍵：進場成功後重新載入停車場列表（共享者就能看到剩餘車位減少）
                    setupParkingList();
                } else {
                    const err = await res.json().catch(() => ({}));
                    alert("進場失敗：" + (err.error || "請稍後再試"));
                }
            } catch (e) {
                alert("網路錯誤");
            } finally {
                if (!res?.ok) {
                    confirmButton.disabled = false;
                    confirmButton.textContent = "確認進場";
                }
            }
        };

        // 開始掃描（用 startButton）
        startButton.onclick = () => {
            startCamera();
        };

        // 重新掃描（用 rescanButton）
        rescanButton.onclick = () => {
            currentPlate = null;
            plateList.innerHTML = '<div class="text-gray-500 text-5xl">請將車牌對準鏡頭...</div>';
            confirmButton.disabled = true;
            confirmButton.style.display = "inline-block";
            rescanButton.textContent = "重新掃描";
            rescanButton.style.display = "inline-block";
            startButton.style.display = "none";
            stopButton.style.display = "none";
            startCamera();
        };

        stopButton.onclick = stopCamera;

        // 初始狀態
        resetToScanningState();
        startCamera();
    }

    // ==================== 終極出場功能（startButton 開鏡頭、rescanButton 重新掃描）====================
    function setupSettleParking() {
        const role = getRole();
        if (role !== "renter") {
            alert("此功能僅限租用者使用！");
            return;
        }

        const section = document.getElementById("settleParking");
        if (!section) return;
        section.style.display = "block";

        const video = document.getElementById("videoSettle");
        const fallback = document.getElementById("fallbackSettle");
        const plateList = document.getElementById("plateListSettle");
        const loading = document.getElementById("loadingSettle");
        const error = document.getElementById("errorSettle");
        const settleResult = document.getElementById("settleResult");
        const confirmButton = document.getElementById("confirmButtonSettle");
        const rescanButton = document.getElementById("rescanButtonSettle");
        const startButton = document.getElementById("startButtonSettle");
        const stopButton = document.getElementById("stopButtonSettle");

        let currentPlate = null;
        let isScanning = false;
        let stream = null;

        // 強制重置按鈕（防止重新整理殭屍狀態）
        if (confirmButton) {
            confirmButton.textContent = "確認出場";
            confirmButton.disabled = true;
            confirmButton.style.display = "inline-block";
        }
        if (startButton) {
            startButton.textContent = "開始掃描";
            startButton.style.display = "inline-block";
        }
        if (stopButton) stopButton.style.display = "none";
        if (rescanButton) rescanButton.style.display = "none";

        async function startCamera() {
            if (isScanning) return;

            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
                video.srcObject = stream;
                video.style.display = "block";
                fallback.style.display = "none";
                loading.style.display = "block";
                plateList.innerHTML = '<div class="text-gray-500 text-5xl">掃描中...</div>';
                confirmButton.disabled = true;
                rescanButton.style.display = "none";
                settleResult.style.display = "none";

                isScanning = true;
                scanPlate();

                startButton.style.display = "none";
                stopButton.style.display = "inline-block";

            } catch (err) {
                error.textContent = "無法開啟攝影機：" + err.message;
                error.style.display = "block";
                fallback.style.display = "block";
            }
        }

        function stopCamera() {
            if (stream) {
                stream.getTracks().forEach(t => t.stop());
                stream = null;
                video.srcObject = null;
                video.style.display = "none";
            }
            isScanning = false;
            loading.style.display = "none";

            startButton.style.display = "inline-block";
            stopButton.style.display = "none";
        }

        function resetToScanningState() {
            currentPlate = null;
            plateList.innerHTML = '<div class="text-gray-500 text-5xl">請將車牌對準鏡頭...</div>';
            confirmButton.disabled = true;
            confirmButton.style.display = "inline-block";
            rescanButton.style.display = "none";
            settleResult.style.display = "none";
            startButton.textContent = "開始掃描";
            startButton.style.display = "inline-block";
            stopButton.style.display = "none";
        }

        function scanPlate() {
            if (!isScanning) return;

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = video.videoWidth || 640;
            canvas.height = video.videoHeight || 480;
            ctx.drawImage(video, 0, 0);

            canvas.toBlob(async (blob) => {
                if (!blob || !isScanning) return;

                const fd = new FormData();
                fd.append('frame', blob, 'frame.jpg');

                try {
                    const res = await fetch('/license-plate/process_frame', { method: 'POST', body: fd });
                    if (!res.ok) return;
                    const data = await res.json();

                    if (data.plate && data.plate !== currentPlate) {
                        const cleanPlate = data.plate.replace(/[^A-Z0-9]/g, '').toUpperCase();
                        currentPlate = cleanPlate;

                        stopCamera();
                        loading.style.display = "none";

                        plateList.innerHTML = `
                        <div class="text-center animate-bounce">
                            <div class="text-green-600 text-9xl font-black mb-8 tracking-widest">${cleanPlate}</div>
                            <div class="bg-green-600 text-white text-6xl font-bold px-16 py-8 rounded-3xl shadow-2xl inline-block">
                                辨識成功！
                            </div>
                        </div>
                    `;

                        confirmButton.disabled = false;
                        confirmButton.textContent = "確認出場";

                        rescanButton.textContent = "重新掃描";
                        rescanButton.style.display = "inline-block";
                    }
                } catch (err) {
                    console.warn("辨識失敗：", err.message);
                }

                if (isScanning) setTimeout(scanPlate, 800);
            }, 'image/jpeg', 0.8);
        }

        // 確認出場 → 永久成功畫面
        confirmButton.onclick = async () => {
            if (!currentPlate) return;

            confirmButton.disabled = true;
            confirmButton.textContent = "結算中...";

            try {
                const token = getToken();
                const res = await fetch(`${API_URL}/rent/leave`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({
                        license_plate: currentPlate,
                        end_time: new Date().toISOString()
                    })
                });

                const result = await res.json();

                if (res.ok) {
                    const amount = result.data?.total_cost || 0;

                    settleResult.innerHTML = `
                <div class="min-h-screen flex flex-col items-center justify-center bg-gray-50">
                    <div class="text-center">
                        <div class="bg-gradient-to-r from-green-600 to-emerald-700 text-white text-8xl font-extrabold px-32 py-20 rounded-3xl shadow-2xl">
                            出場成功！<br><br>
                            應收 <span class="text-yellow-300 text-9xl">${amount}</span> 元
                        </div>
                    </div>
                </div>
            `;
                    settleResult.style.display = "block";
                    confirmButton.style.display = "none";

                    rescanButton.textContent = "重新掃描";
                    rescanButton.style.display = "inline-block";
                    startButton.style.display = "none";
                    stopButton.style.display = "none";

                    // 關鍵：出場成功後重新載入停車場列表（共享者就能看到剩餘車位增加）
                    setupParkingList();
                } else {
                    alert("出場失敗：" + (result.error || "請稍後再試"));
                }
            } catch (e) {
                alert("網路錯誤");
            } finally {
                if (!res?.ok) {
                    confirmButton.disabled = false;
                    confirmButton.textContent = "確認出場";
                }
            }
        };

        // 開始掃描（用 startButton）
        startButton.onclick = () => {
            startCamera();
        };

        // 重新掃描（用 rescanButton）
        rescanButton.onclick = () => {
            currentPlate = null;
            plateList.innerHTML = '<div class="text-gray-500 text-5xl">請將車牌對準鏡頭...</div>';
            confirmButton.disabled = true;
            confirmButton.style.display = "inline-block";
            settleResult.style.display = "none";
            rescanButton.textContent = "重新掃描";
            rescanButton.style.display = "inline-block";
            startButton.style.display = "none";
            stopButton.style.display = "none";
            startCamera();
        };

        stopButton.onclick = stopCamera;

        resetToScanningState();
        startCamera();
    }

    // 攝影機請求和重新掃描函數
    async function requestCamera(type) {
        let video = type === 'rent' ? document.getElementById('videoRent') : document.getElementById('videoSettle');
        let permissionBox = type === 'rent' ? document.getElementById('permissionBoxRent') : document.getElementById('permissionBoxSettle');
        let loadingStatus = type === 'rent' ? document.getElementById('loadingStatusRent') : document.getElementById('loadingStatusSettle');
        let fallback = type === 'rent' ? document.getElementById('fallbackRent') : document.getElementById('fallbackSettle');
        permissionBox.style.display = "none";
        loadingStatus.style.display = "block";
        fallback.style.display = "none";
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            video.srcObject = stream;
            video.style.display = "block";
            loadingStatus.style.display = "none";
            // 通知後端啟動串流
            await fetch(`${window.location.origin}/license-plate/start`, { method: 'POST' });
            // 開始輪詢
            if (type === 'rent') setupRentParking();
            else setupSettleParking();
        } catch (err) {
            console.error("攝影機權限拒絕:", err);
            video.style.display = "none";
            fallback.style.display = "block";
            loadingStatus.style.display = "none";
        }
    }
    function rescan(type) {
        let video = type === 'rent' ? document.getElementById('videoRent') : document.getElementById('videoSettle');
        let plateResult = type === 'rent' ? document.getElementById('plateResultRent') : document.getElementById('plateResultSettle');
        let detectedPlate = type === 'rent' ? document.getElementById('detectedPlateRent') : document.getElementById('detectedPlateSettle');
        let confirmBtn = type === 'rent' ? document.getElementById('confirmEntryBtnRent') : document.getElementById('confirmExitBtnSettle');
        let rescanBtn = type === 'rent' ? document.getElementById('rescanBtnRent') : document.getElementById('rescanBtnSettle');
        let loadingStatus = type === 'rent' ? document.getElementById('loadingStatusRent') : document.getElementById('loadingStatusSettle');
        // 重置狀態
        plateResult.style.display = "none";
        detectedPlate.textContent = "";
        confirmBtn.disabled = true;
        rescanBtn.style.display = "none";
        loadingStatus.style.display = "block";
        // 停止當前串流並重新請求
        if (video.srcObject) {
            video.srcObject.getTracks().forEach(track => track.stop());
            video.srcObject = null;
        }
        // 再次請求攝影機權限並啟動
        requestCamera(type);
    }
    // 在 showSection 調用中添加
    function showSection(sectionId) {
        document.querySelectorAll('.content-section').forEach(section => section.style.display = 'none');
        const section = document.getElementById(sectionId);
        if (section) {
            section.style.display = 'block';
            pageTitle.textContent = sectionId === 'rentParking' ? '租用車位(進場)' : sectionId === 'settleParking' ? '離開結算(出場)' : '行動停車場管理資訊系統';
            if (sectionId === 'rentParking') setupRentParking();
            if (sectionId === 'settleParking') setupSettleParking();
        }
    }
    // 設置新增車位功能
    async function setupAddParking() {
        const role = getRole();
        console.log("Current role in setupAddParking:", role);
        if (!["admin"].includes(role)) {
            alert("此功能僅限管理員使用！");
            return;
        }
        const addParkingSection = document.getElementById("addParking");
        if (!addParkingSection) {
            console.error("addParking section not found");
            alert("無法載入「新增車位」頁面，頁面元素缺失，請聯繫管理員！");
            return;
        }
        addParkingSection.style.display = "block";
        const priceLabel = document.getElementById("newPriceLabel");
        if (priceLabel) {
            priceLabel.textContent = "小時費用（元）：";
        }
        const addParkingMap = document.getElementById("addParkingMap");
        const latitudeInput = document.getElementById("latitudeInput");
        const longitudeInput = document.getElementById("longitudeInput");
        if (!addParkingMap || !latitudeInput || !longitudeInput) {
            console.error("Required elements for map in addParking not found: addParkingMap, latitudeInput, or longitudeInput");
            alert("地圖容器或經緯度輸入框未找到，地圖功能將不可用，但您仍可繼續新增車位。");
            addParkingMap.style.display = "none";
            return;
        }
        let userLatitude, userLongitude;
        try {
            const position = await new Promise((resolve, reject) => {
                if (!navigator.geolocation) reject(new Error("Geolocation not supported by browser"));
                navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000, maximumAge: 0 });
            });
            userLatitude = position.coords.latitude;
            userLongitude = position.coords.longitude;
        } catch (error) {
            console.warn("Unable to retrieve location, using fallback coordinates:", error.message);
            alert("無法獲取您的位置，將使用預設位置（國立澎湖科技大學）。請確認已允許定位權限。");
            userLatitude = 23.57461380558428;
            userLongitude = 119.58110318336162;
        }
        latitudeInput.value = userLatitude;
        longitudeInput.value = userLongitude;
        latitudeInput.disabled = true;
        longitudeInput.disabled = true;
        latitudeInput.readOnly = true;
        longitudeInput.readOnly = true;
        let map, marker;
        try {
            await waitForGoogleMaps();
            addParkingMap.style.display = "block";
            map = new google.maps.Map(addParkingMap, {
                center: { lat: userLatitude, lng: userLongitude },
                zoom: 15,
                mapId: "4a9410e1706e086d447136ee"
            });
            marker = new google.maps.marker.AdvancedMarkerElement({
                position: { lat: userLatitude, lng: userLongitude },
                map: map,
                title: "當前位置",
            });
        } catch (error) {
            console.error("Google Maps API 未載入或載入失敗:", error);
            alert("無法載入 Google Maps API，請檢查網路連線或 API 金鑰是否有效。地圖功能將不可用，但您仍可繼續新增車位。");
            addParkingMap.style.display = "none";
        }
        const saveNewSpotButton = document.getElementById("saveNewSpotButton");
        const cancelAddButton = document.getElementById("cancelAddButton");
        if (!saveNewSpotButton || !cancelAddButton) {
            console.error("saveNewSpotButton or cancelAddButton not found in the DOM");
            alert("無法找到保存或取消按鈕，請檢查頁面結構！");
            return;
        }
        // 移除舊的事件監聽器，避免重複綁定
        const saveButtonClone = saveNewSpotButton.cloneNode(true);
        saveNewSpotButton.parentNode.replaceChild(saveButtonClone, saveNewSpotButton);
        const cancelButtonClone = cancelAddButton.cloneNode(true);
        cancelAddButton.parentNode.replaceChild(cancelButtonClone, cancelAddButton);
        // 綁定新的事件監聽器
        saveButtonClone.addEventListener("click", async () => {
            const newSpot = {
                type: document.getElementById("newParkingType").value,
                address: document.getElementById("newLocation").value.trim(),
                hourly_rate: parseFloat(document.getElementById("newPrice").value) || 40.00,
                total_spots: parseInt(document.getElementById("newTotalSpots").value) || 1,
                latitude: userLatitude,
                longitude: userLongitude
            };
            if (!newSpot.address) {
                alert("地址為必填項！");
                return;
            }
            if (newSpot.address.length > 50) {
                alert("地址最多 50 個字符！");
                return;
            }
            if (!["flat", "mechanical"].includes(newSpot.type)) {
                alert("停車類型必須為 'flat' 或 'mechanical'！");
                return;
            }
            if (isNaN(newSpot.hourly_rate) || newSpot.hourly_rate < 0) {
                alert("費用必須為正數！");
                return;
            }
            if (isNaN(newSpot.total_spots) || newSpot.total_spots < 1) {
                alert("總停車位數量必須為正整數！");
                return;
            }
            try {
                const token = getToken();
                if (!token) throw new Error("認證令牌缺失，請重新登入！");
                console.log("Sending new spot data:", JSON.stringify(newSpot, null, 2));
                const response = await fetch(`${API_URL}/parking`, {
                    method: 'POST',
                    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                    body: JSON.stringify(newSpot)
                });
                if (!response.ok) {
                    if (response.status === 401) throw new Error("認證失敗，請重新登入！");
                    const errorData = await response.json();
                    throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorData.error || '未知錯誤'}`);
                }
                const result = await response.json();
                alert("車位已成功新增！");
                addParkingSection.innerHTML = "<p>車位已成功新增！</p>";
            } catch (error) {
                console.error("Failed to add spot:", error);
                alert(`無法新增車位，請檢查後端服務 (錯誤: ${error.message})`);
                if (error.message === "認證失敗，請重新登入！") {
                    removeToken();
                    showLoginPage(true);
                }
            }
        });
        cancelButtonClone.addEventListener("click", () => {
            addParkingSection.style.display = "none";
            const myParkingSpaceSection = document.getElementById("My parking space");
            if (myParkingSpaceSection) {
                myParkingSpaceSection.style.display = "block";
                setupMyParkingSpace();
            }
        });
    }
    // 顯示登入畫面
    function showLoginPage(sessionExpired = false) {
        if (sessionExpired) {
            alert("您的登入已在其他地方被登出或已過期，正在為您跳轉到登入頁面...");
            setTimeout(() => {
                authContainer.style.display = "block";
                parkingContainer.style.display = "none";
                document.querySelectorAll(".content-section").forEach(section => {
                    section.style.display = "none";
                });
                document.querySelector(".function-list").style.display = "none";
                document.querySelector(".content-container").style.display = "none";
                logoutButton.style.display = "none";
                history.pushState({}, '', '/');
            }, 1500);
        } else {
            authContainer.style.display = "block";
            parkingContainer.style.display = "none";
            document.querySelectorAll(".content-section").forEach(section => {
                section.style.display = "none";
            });
            document.querySelector(".function-list").style.display = "none";
            document.querySelector(".content-container").style.display = "none";
            logoutButton.style.display = "none";
            history.pushState({}, '', '/');
        }
    }
    // 檢查是否已登入（檢查 token 是否存在）
    async function checkAuth(silent = false) {
        const token = getToken();
        if (!token || token.trim() === "") {
            if (!silent) alert("請先登入！");
            showLoginPage();
            return false;
        }
        return true;
    }
    // 初始化時檢查是否已登入（靜默模式）
    (async () => {
        const isAuthenticated = await checkAuth(true);
        if (isAuthenticated) {
            const role = getRole();
            console.log("Current role during initialization:", role);
            const validRoles = ["renter", "admin"];
            if (!role || !validRoles.includes(role)) {
                console.error(`Invalid role during initialization: "${role}". Expected: ${validRoles.join(", ")}. Redirecting to login.`);
                showError("無效的用戶角色，請重新登入！");
                removeToken();
                showLoginPage();
            } else {
                showMainPage();
            }
        } else {
            showLoginPage();
        }
    })();
    // 處理頁面加載時的 URL 路徑
    window.addEventListener("popstate", function (event) {
        const role = getRole();
        const pathRole = window.location.pathname.replace('/', '');
        const validRoles = ["renter", "admin"];
        const pageTitle = document.getElementById("pageTitle");
        if (pathRole && validRoles.includes(pathRole) && pathRole === role) {
            if (pageTitle) {
                if (pathRole === "renter") pageTitle.textContent = "Renter";
                else if (pathRole === "admin") pageTitle.textContent = "Admin";
            }
            showMainPage();
        } else {
            showLoginPage();
        }
    });
    // 當身份改變時，顯示或隱藏租用者專用欄位和信用卡號
    roleInput.addEventListener("change", function () {
        if (roleInput.value.toLowerCase() === "renter" && !isLogin) {
            renterFields.style.display = "block";
            licensePlateInput.setAttribute("required", "true");
            cardNumberContainer.style.display = "block";
            cardNumberInput.setAttribute("required", "true");
        } else {
            renterFields.style.display = "none";
            licensePlateInput.removeAttribute("required");
            licensePlateInput.value = "";
            cardNumberContainer.style.display = "none";
            cardNumberInput.removeAttribute("required");
            cardNumberInput.value = "";
        }
    });
    // 電話號碼輸入驗證（只允許數字）
    phoneInput.addEventListener("input", function () {
        let value = phoneInput.value.replace(/\D/g, "");
        phoneInput.value = value;
        const phoneRegex = /^[0-9]{10}$/;
        if (phoneRegex.test(value)) showSuccess("電話號碼格式正確");
        else showError("請提供有效的電話號碼（10位數字）");
    });
    // 車牌號碼輸入驗證（格式如 AAA-1111）
    licensePlateInput.addEventListener("input", function () {
        const licensePlate = this.value.trim();
        const licensePlateRegex = /^[A-Z]{2,3}-[0-9]{3,4}$/;
        if (licensePlateRegex.test(licensePlate)) showSuccess("車牌號碼格式正確");
        else showError("請輸入有效車牌號碼（格式如 AAA-1111）");
    });
    // 信用卡號輸入格式化（自動加上 "-"）
    cardNumberInput.addEventListener("input", function () {
        let value = cardNumberInput.value.replace(/\D/g, "");
        value = value.replace(/(\d{4})(?=\d)/g, "$1-");
        if (value.length > 19) value = value.slice(0, 19);
        cardNumberInput.value = value;
    });
    // 即時密碼驗證
    passwordInput.addEventListener("input", function () {
        const password = this.value.trim();
        const hasLetter = /[a-zA-Z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const isLongEnough = password.length >= 8;
        if (hasLetter && hasNumber && isLongEnough) showSuccess("密碼格式正確");
        else showError("密碼必須至少8個字符，包含字母和數字");
    });
    // 動態隱藏註冊專用欄位
    function toggleFormFields() {
        if (isLogin) {
            nameInput.parentElement.style.display = "none";
            phoneInput.parentElement.style.display = "none";
            roleInput.parentElement.style.display = "none";
            cardNumberContainer.style.display = "none";
            renterFields.style.display = "none";
            nameInput.removeAttribute("required");
            phoneInput.removeAttribute("required");
            roleInput.removeAttribute("required");
            cardNumberInput.removeAttribute("required");
            licensePlateInput.removeAttribute("required");
            emailInput.setAttribute("required", "true");
            passwordInput.setAttribute("required", "true");
        } else {
            nameInput.parentElement.style.display = "block";
            phoneInput.parentElement.style.display = "block";
            roleInput.parentElement.style.display = "block";
            if (roleInput.value.toLowerCase() === "renter") {
                renterFields.style.display = "block";
                licensePlateInput.setAttribute("required", "true");
                cardNumberContainer.style.display = "block";
                cardNumberInput.setAttribute("required", "true");
            } else {
                renterFields.style.display = "none";
                licensePlateInput.removeAttribute("required");
                licensePlateInput.value = "";
                cardNumberContainer.style.display = "none";
                cardNumberInput.removeAttribute("required");
                cardNumberInput.value = "";
            }
            emailInput.setAttribute("required", "true");
            passwordInput.setAttribute("required", "true");
            nameInput.setAttribute("required", "true");
            phoneInput.setAttribute("required", "true");
            roleInput.setAttribute("required", "true");
        }
    }
    // ====================== 全螢幕成功動畫共用函式 ======================
    function triggerSuccessAnimation(mainText, subText, callback, duration = 2000) {
        const overlay = document.getElementById("successOverlay");
        if (!overlay) {
            // 如果忘記加 HTML 就直接執行 callback（保險）
            setTimeout(callback, 600);
            return;
        }

        // 更新文字
        overlay.querySelector(".success-text").textContent = mainText;
        overlay.querySelector(".success-subtext").textContent = subText || "請稍候...";

        // 顯示並觸發動畫
        overlay.style.display = "flex";
        void overlay.offsetWidth;               // 強制重繪
        overlay.classList.add("show");

        // 指定時間後淡出 → 執行回乎
        setTimeout(() => {
            overlay.classList.remove("show");
            setTimeout(() => {
                overlay.style.display = "none";
                if (typeof callback === "function") callback();
            }, 600); // 等待淡出動畫結束
        }, duration);
    }
    // 初始化表單顯示
    toggleFormFields();
    // 切換登入/註冊
    toggleMessage.addEventListener("click", function (event) {
        event.preventDefault();
        isLogin = !isLogin;
        formTitle.textContent = isLogin ? "登入" : "註冊";
        submitButton.textContent = isLogin ? "登入" : "註冊";
        toggleMessage.innerHTML = isLogin
            ? '還沒有帳號？<a href="#" id="toggleLink">註冊</a>'
            : '已有帳號？<a href="#" id="toggleLink">登入</a>';
        errorMessage.textContent = "";
        toggleFormFields();
    });
    // 處理登入/註冊
    authForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();
        const errors = [];

        if (!email) errors.push("電子郵件不能為空");
        if (!password) errors.push("密碼不能為空");
        const passwordRegex = /^(?=.*[a-zA-Z])(?=.*[0-9]).{8,}$/;
        if (!passwordRegex.test(password)) {
            errors.push("密碼必須至少 8 個字符，包含字母和數字");
        }

        if (!isLogin) {
            const name = nameInput.value.trim();
            const phone = phoneInput.value.trim();
            const role = roleInput.value.toLowerCase().trim();
            const license_plate = licensePlateInput.value.trim();
            if (!name) errors.push("姓名不能為空");
            if (!phone || !/^[0-9]{10}$/.test(phone)) errors.push("請提供有效的電話號碼（10 位數字）");
            if (!role) errors.push("請選擇身份");
            if (role === "renter" && !license_plate) errors.push("車牌號碼不能為空");
        }

        if (errors.length > 0) {
            showError(errors.join("；"));
            return;
        }

        // ====================== 登入 ======================
        if (isLogin) {
            try {
                const response = await fetch(`${API_URL}/members/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                if (!response.headers.get('content-type')?.includes('application/json')) {
                    throw new Error("後端返回非 JSON 響應，請檢查伺服器配置");
                }

                const result = await response.json();

                if (response.ok) {
                    // ---------- 登入成功：儲存資料 ----------
                    if (!result.data || !result.data.token) {
                        showError("後端未返回 token，請檢查後端服務！");
                        return;
                    }

                    setToken(result.data.token);

                    // 取出 member_id（多種可能格式都支援）
                    let memberId = result.data.member?.member_id ||
                        result.data.member_id ||
                        result.data.id ||
                        result.data.user_id ||
                        result.data.member?.id;

                    if (!memberId) {
                        showError("後端未返回會員 ID，請聯繫管理員！");
                        return;
                    }
                    localStorage.setItem("member_id", memberId.toString());

                    // 取出 role（多種可能格式都支援）
                    let role = (result.data.member?.role ||
                        result.data.role ||
                        result.data.user?.role ||
                        result.data.user_role ||
                        result.role || "").toString().toLowerCase().trim();

                    if (!["renter", "admin"].includes(role)) {
                        showError("角色資訊錯誤，請聯繫管理員！");
                        return;
                    }
                    setRole(role);

                    // ---------- 顯示全螢幕成功動畫 ----------
                    triggerSuccessAnimation("登入成功！", "即將進入系統...", () => {
                        const newPath = `/${role}`;
                        history.replaceState({ role }, '', newPath);
                        showMainPage();                     // 真正進入主畫面
                    });

                } else {
                    showError(result.error || "電子郵件或密碼錯誤！");
                }
            } catch (error) {
                console.error("Login failed:", error);
                showError(error.message || "無法連接到伺服器");
            }

            // ====================== 註冊 ======================
        } else {
            const name = nameInput.value.trim();
            const phone = phoneInput.value.trim();
            const role = roleInput.value.toLowerCase().trim();
            let payment_info = cardNumberInput.value.trim();
            const license_plate = licensePlateInput.value.trim();

            try {
                const response = await fetch(`${API_URL}/members/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, password, phone, role, payment_info, license_plate })
                });

                if (!response.headers.get('content-type')?.includes('application/json')) {
                    throw new Error("後端返回非 JSON 響應，請檢查伺服器配置");
                }

                const result = await response.json();

                if (response.ok) {
                    // ---------- 註冊成功動畫 ----------
                    triggerSuccessAnimation("註冊成功！", "即將切換至登入畫面", () => {
                        // 自動切回登入模式
                        isLogin = true;
                        formTitle.textContent = "行動停車場管理資訊系統 登入";
                        submitButton.textContent = "登入";
                        toggleMessage.innerHTML = '還沒有帳號？<a href="#" id="toggleLink">註冊</a>';
                        toggleFormFields();
                        // 清空密碼欄位（安全考量）
                        passwordInput.value = "";
                        showSuccess("請使用剛剛註冊的帳號登入");
                    }, 1800); // 註冊稍微短一點

                } else {
                    showError(result.error || `註冊失敗！（錯誤碼：${response.status}）`);
                }
            } catch (error) {
                console.error("Register failed:", error);
                showError(error.message || "無法連接到伺服器");
            }
        }
    });
    // 登出功能
    logoutButton.addEventListener("click", function () {
        removeToken();
        showLoginPage();
    });
    // 停車場資訊
    async function setupMyParkingSpace() {
        const role = getRole();
        console.log("Current role in setupMyParkingSpace:", role);
        if (!["admin"].includes(role)) {
            alert("您沒有權限訪問此功能！");
            return;
        }
        const section = document.querySelector('[id="My parking space"]');
        const parkingTableBody = document.querySelector('[id="My parking spaceTableBody"]');
        if (!section || !parkingTableBody) {
            console.error("Required element not found for My parking space");
            alert("無法載入「車位列表」頁面，頁面元素缺失，請聯繫管理員！");
            return;
        }
        // 顯示載入中
        parkingTableBody.innerHTML = '<tr><td colspan="7" class="text-center py-4">載入中...</td></tr>';
        try {
            const token = getToken();
            if (!token) throw new Error("認證令牌缺失，請重新登入！");
            const url = `${API_URL}/parking/all`;
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Accept": "application/json"
                }
            });
            // 檢查是否返回 HTML（未登入）
            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                const text = await response.text();
                console.error("後端返回 HTML:", text.substring(0, 200));
                throw new Error("後端返回登入頁，可能未登入或 token 過期");
            }
            if (!response.ok) {
                const errData = await response.json().catch(() => ({ message: "未知錯誤" }));
                throw new Error(`HTTP ${response.status}: ${errData.message}`);
            }
            const result = await response.json();
            if (!result.status || !Array.isArray(result.data)) {
                throw new Error(result.message || "回傳格式錯誤");
            }
            const spots = result.data;
            if (spots.length === 0) {
                parkingTableBody.innerHTML = '<tr><td colspan="7" class="text-center py-4">目前無車位資料</td></tr>';
                return;
            }
            // 清空並填入資料
            parkingTableBody.innerHTML = "";
            spots.forEach(spot => {
                const row = document.createElement("tr");
                row.innerHTML = `
                <td class="border px-4 py-2">${spot.address}</td>
                <td class="border px-4 py-2">${spot.type === "flat" ? "平面" : "機械"}</td>
                <td class="border px-4 py-2">${spot.hourly_rate}</td>
                <td class="border px-4 py-2">總車位 ${spot.total_spots} / 剩餘車位 ${spot.remaining_spots}</td>
                <td class="border px-4 py-2 text-center space-x-1">
                    <button class="edit-btn bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 rounded"
                            data-id="${spot.parking_lot_id}">編輯✏️</button>
                    <button class="delete-btn bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1 rounded"
                            data-id="${spot.parking_lot_id}">刪除🗑️</button>
                </td>
            `;
                parkingTableBody.appendChild(row);
            });
            // 綁定按鈕（避免重複）
            bindEditButtons(spots, section);
            bindDeleteButtons();
        } catch (error) {
            console.error("載入車位失敗:", error);
            if (error.message.includes("HTML") || error.message.includes("未登入") || error.message.includes("登入頁")) {
                alert("登入逾時或無權限，即將跳轉登入頁");
                removeToken();
                showLoginPage(true);
            } else {
                parkingTableBody.innerHTML = `<tr><td colspan="7" class="text-red-600 py-4 text-center">
                載入失敗：${error.message}
            </td></tr>`;
            }
        }
    }
    function bindEditButtons(spots, section) {
        document.querySelectorAll(".edit-btn").forEach(btn => {
            btn.onclick = () => {
                const id = btn.dataset.id;
                const spot = spots.find(s => s.parking_lot_id == id);
                if (spot) showEditForm(spot, section);
            };
        });
    }
    function bindDeleteButtons() {
        document.querySelectorAll(".delete-btn").forEach(btn => {
            btn.onclick = async () => {
                const id = btn.dataset.id;
                if (!confirm(`確定要刪除車位 #${id} 嗎？此操作無法復原！`)) return;
                try {
                    const token = getToken();
                    const res = await fetch(`${API_URL}/parking/${id}`, {
                        method: "DELETE",
                        headers: { "Authorization": `Bearer ${token}` }
                    });
                    if (!res.ok) {
                        const err = await res.json().catch(() => ({}));
                        throw new Error(err.message || "刪除失敗");
                    }
                    alert("車位已成功刪除！");
                    setupMyParkingSpace(); // 刷新列表
                } catch (err) {
                    alert(`刪除失敗：${err.message}`);
                    if (err.message.includes("未登入")) {
                        removeToken();
                        showLoginPage(true);
                    }
                }
            };
        });
    }
    // 顯示編輯表單
    async function showEditForm(spot, section) {
        let container = document.getElementById("editParkingFormContainer");
        if (!container) {
            container = document.createElement("div");
            container.id = "editParkingFormContainer";
            container.className = "mt-6 p-6 bg-gray-50 rounded-lg border shadow-sm";
            section.appendChild(container);
        }
        container.innerHTML = `
        <h3 class="text-xl font-bold text-blue-800 mb-4">編輯車位 #${spot.parking_lot_id}</h3>
        <form id="editParkingForm" class="space-y-3">
            <input type="hidden" id="editParkingLotId" value="${spot.parking_lot_id}">
           
            <div>
                <label class="block font-semibold">地址：</label>
                <input type="text" id="editAddress" value="${spot.address}" maxlength="50" required
                       class="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500">
            </div>
           
            <div>
                <label class="block font-semibold">停車類型：</label>
                <select id="editType" required class="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500">
                    <option value="flat" ${spot.type === "flat" ? "selected" : ""}>平面</option>
                    <option value="mechanical" ${spot.type === "mechanical" ? "selected" : ""}>機械</option>
                </select>
            </div>
           
            <div>
                <label class="block font-semibold">每小時費用（元）：</label>
                <input type="number" id="editHourlyRate" value="${spot.hourly_rate}" min="0" step="1" required
                       class="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500">
            </div>
           
            <div>
                <label class="block font-semibold">總車位數：</label>
                <input type="number" id="editTotalSpots" value="${spot.total_spots}" min="1" required
                       class="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500">
            </div>
            <div class="flex gap-2 mt-6">
                <button type="button" id="saveEditSpotButton"
                        class="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded font-medium transition">
                    保存變更
                </button>
                <button type="button" id="cancelEditSpotButton"
                        class="bg-gray-600 hover:bg-gray-700 text-white px-5 py-2 rounded font-medium transition">
                    取消
                </button>
            </div>
        </form>
    `;
        container.style.display = "block";
        // 取得按鈕並綁定事件
        const saveBtn = document.getElementById("saveEditSpotButton");
        const cancelBtn = document.getElementById("cancelEditSpotButton");
        // 清除舊事件（若存在）
        if (saveBtn) saveBtn.onclick = null;
        if (cancelBtn) cancelBtn.onclick = null;
        // 保存按鈕事件
        saveBtn.onclick = async () => {
            const address = document.getElementById("editAddress").value.trim();
            const type = document.getElementById("editType").value;
            const hourlyRate = parseFloat(document.getElementById("editHourlyRate").value);
            const totalSpots = parseInt(document.getElementById("editTotalSpots").value);
            // 嚴格驗證
            if (!address) return alert("地址為必填！");
            if (address.length > 50) return alert("地址最多 50 字！");
            if (isNaN(hourlyRate) || hourlyRate < 0) return alert("請輸入有效價格（≥0）！");
            if (isNaN(totalSpots) || totalSpots < 1) return alert("總車位數至少為 1！");
            const updated = {
                address,
                type,
                hourly_rate: hourlyRate,
                total_spots: totalSpots
                // 已移除經緯度欄位，不會傳送 latitude / longitude
            };
            saveBtn.disabled = true;
            saveBtn.textContent = "保存中...";
            try {
                const token = getToken();
                const lotId = document.getElementById("editParkingLotId").value;
                const res = await fetch(`${API_URL}/parking/${lotId}`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify(updated)
                });
                let errorMsg = "未知錯誤";
                if (res.headers.get("content-type")?.includes("application/json")) {
                    const data = await res.json();
                    errorMsg = data.message || data.error || JSON.stringify(data);
                } else {
                    errorMsg = await res.text();
                }
                if (!res.ok) {
                    throw new Error(`後端錯誤 ${res.status}: ${errorMsg}`);
                }
                alert("車位更新成功！");
                container.style.display = "none";
                setupMyParkingSpace(); // 刷新列表
            } catch (err) {
                console.error("更新失敗:", err);
                alert(`更新失敗：${err.message}`);
                if (err.message.includes("未登入") || err.message.includes("認證")) {
                    removeToken();
                    showLoginPage(true);
                }
            } finally {
                saveBtn.disabled = false;
                saveBtn.textContent = "保存變更";
            }
        };
        // 取消按鈕
        cancelBtn.onclick = () => {
            container.style.display = "none";
        };
    }
    // 設置個人資訊
    async function setupProfile() {
        const role = getRole();
        if (!["renter", "admin"].includes(role)) {
            alert("您沒有權限訪問此功能！");
            return;
        }

        const profileSection = document.getElementById("profile");
        const vehicleSection = document.getElementById("vehicleSection");

        if (!profileSection) return alert("頁面載入失敗！");

        profileSection.style.display = "block";

        // 關鍵！只有 renter 才顯示車輛管理區
        if (role === "renter") {
            vehicleSection.style.display = "block";
            await loadVehicles(); // 只有 renter 才載入車輛
        } else {
            vehicleSection.style.display = "none"; // admin 完全不顯示
        }

        // 基本資料元素
        const profileData = document.getElementById("profileData");
        const editProfileForm = document.getElementById("editProfileForm");
        const editName = document.getElementById("editName");
        const editPhone = document.getElementById("editPhone");
        const editEmail = document.getElementById("editEmail");
        const editCardNumber = document.getElementById("editCardNumber");
        const saveProfileButton = document.getElementById("saveProfileButton");
        const editProfileButton = document.getElementById("editProfileButton");
        const cancelEditProfileButton = document.getElementById("cancelEditProfileButton");

        // 車輛管理元素
        const vehicleList = document.getElementById("vehicleList");
        const newPlateInput = document.getElementById("newPlateInput");
        const addVehicleBtn = document.getElementById("addVehicleBtn");

        let memberId = null;
        let vehicles = []; // 儲存目前車輛陣列

        // 載入個人資料
        async function loadProfile() {
            try {
                const token = getToken();
                memberId = getMemberId();
                if (!token || !memberId) throw new Error("請重新登入！");

                // 1. 載入基本資料（你說這條是對的）
                const profileRes = await fetch(`${API_URL}/members/profile`, {
                    method: 'GET',
                    headers: { "Authorization": `Bearer ${token}` }
                });
                if (profileRes.ok) {
                    const profile = (await profileRes.json()).data || await profileRes.json();
                    let maskedCard = '未提供';
                    if (profile.payment_info) {
                        const c = profile.payment_info.toString().replace(/\D/g, '');
                        maskedCard = c.length === 16 ? `${c.slice(0, 4)}-****-****-${c.slice(-4)}` : profile.payment_info;
                    }
                    profileData.innerHTML = `
                    <p><strong>姓名：</strong> ${profile.name || '未提供'}</p>
                    <p><strong>電話：</strong> ${profile.phone || '未提供'}</p>
                    <p><strong>電子郵件：</strong> ${profile.email || '未提供'}</p>
                    <p><strong>信用卡號：</strong> ${maskedCard}</p>
                `;
                    editName.value = profile.name || '';
                    editPhone.value = profile.phone || '';
                    editEmail.value = profile.email || '';
                    const cleanCard = profile.payment_info ? profile.payment_info.toString().replace(/\D/g, '') : '';
                    editCardNumber.value = cleanCard.length === 16 ? cleanCard.replace(/(\d{4})(?=\d)/g, '$1-') : cleanCard;
                }

                // 2. 載入車輛清單（僅租用者）
                if (role === "renter") {
                    await loadVehicles();
                }

            } catch (err) {
                console.error(err);
                alert("載入失敗：" + err.message);
            }
        }

        // 載入車輛清單
        async function loadVehicles() {
            try {
                const token = getToken();
                if (!token) throw new Error("請重新登入");

                const res = await fetch(`${API_URL}/vehicles/vehicle`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });

                if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    throw new Error(err.error || "無法取得車輛資料");
                }

                const data = await res.json();
                vehicles = Array.isArray(data)
                    ? data
                    : data.data || data.vehicles || data.vehicle_list || [];

                renderVehicleTable(); // 改用表格渲染

            } catch (err) {
                const tbody = document.getElementById("vehicleTableBody");
                if (tbody) {
                    tbody.innerHTML = `<tr><td colspan="2" class="text-center py-12 text-red-600 text-lg">載入失敗：${err.message}</td></tr>`;
                }
                console.error("載入車輛失敗:", err);
            }
        }

        // ──────────────────────────────────────
        // 2. 渲染表格版車輛清單（全新！完美對應你的 HTML）
        function renderVehicleTable() {
            const tbody = document.getElementById("vehicleTableBody");

            if (!tbody) return;

            // 清空表格
            tbody.innerHTML = '';

            // 如果完全沒車，就什麼都不顯示（超乾淨！）
            if (vehicles.length === 0) {
                return; // 直接結束，不顯示任何訊息
            }

            // 有車才顯示
            vehicles.forEach((vehicle) => {
                const row = document.createElement("tr");
                row.className = "hover:bg-indigo-50 transition-all duration-200 border-b border-gray-100";

                row.innerHTML = `
            <td class="px-8 py-7">
                <div class="text-2xl font-mono font-black text-indigo-700 tracking-widest">
                    ${vehicle.license_plate || '未知車牌'}
                </div>
            </td>
            <td class="px-8 py-7 text-center">
                <button onclick="deleteVehicle('${vehicle.license_plate}')" 
                        class="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-9 rounded-xl 
                               shadow-md hover:shadow-xl transform hover:scale-105 transition-all duration-200 
                               focus:outline-none focus:ring-4 focus:ring-red-300">
                    刪除
                </button>
            </td>
        `;

                tbody.appendChild(row);
            });
        }

        // ──────────────────────────────────────
        // 3. 新增車輛（保持原邏輯，但重新載入表格）
        window.addVehicle = async () => {
            const input = document.getElementById("newPlateInput");
            let raw = input.value.trim().toUpperCase();

            if (!raw) {
                return alert("請輸入車牌號碼！");
            }

            // 移除所有非英數字符（包含橫線、空格等）
            let plate = raw.replace(/[^A-Z0-9]/g, '');

            // 嚴格驗證：前面2~4個字母 + 後面3~4個數字（不允許橫線）
            if (!/^[A-Z]{2,4}[0-9]{3,4}$/.test(plate)) {
                return alert("車牌格式錯誤！\n\n正確格式（不需輸入橫線）：\n• ABC1234\n• AB123\n• KLM5678\n• XYZ9999");
            }

            // 檢查是否重複（比對純字母數字）
            if (vehicles.some(v => v.license_plate === plate)) {
                return alert("此車牌已經登記過了！");
            }

            try {
                const token = getToken();
                const res = await fetch(`${API_URL}/vehicles`, {
                    method: 'POST',
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({ license_plate: plate })  // 傳純 ABC1234
                });

                if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    throw new Error(err.error || "新增失敗");
                }

                alert(`車輛新增成功！\n${plate}`);
                input.value = '';
                await loadVehicles(); // 重新載入表格

            } catch (err) {
                alert("新增失敗：" + err.message);
            }
        };

        // ──────────────────────────────────────
        // 4. 刪除車輛（二次確認 + 重新載入）
        window.deleteVehicle = async (plate) => {
            if (!confirm(`確定要刪除這台車？\n\n車牌：${plate}\n\n刪除後將無法自動進出停車場`)) {
                return;
            }

            try {
                const token = getToken();
                const res = await fetch(`${API_URL}/vehicles`, {
                    method: 'DELETE',
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({ license_plate: plate })
                });

                if (!res.ok) throw new Error("刪除失敗");

                alert("車輛已成功移除");
                await loadVehicles();

            } catch (err) {
                alert("刪除失敗：" + err.message);
            }
        };

        /// === 新增：保存個人資料變更 ===
        if (saveProfileButton) {
            saveProfileButton.onclick = async () => {
                const name = editName.value.trim();
                const phone = editPhone.value.trim();
                const email = editEmail.value.trim();
                let cardNumber = editCardNumber.value.replace(/\D/g, ''); // 只保留數字

                // 基本驗證
                if (!name || !phone || !email) {
                    alert("姓名、電話、電子郵件不能為空！");
                    return;
                }

                if (!/^[0-9]{10}$/.test(phone)) {
                    alert("電話必須為 10 位數字！");
                    return;
                }

                if (cardNumber && cardNumber.length !== 16) {
                    alert("信用卡號必須為 16 位數字！");
                    return;
                }

                try {
                    const token = getToken();
                    const res = await fetch(`${API_URL}/members/id`, {
                        method: 'PUT',
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            name,
                            phone,
                            email,
                            payment_info: cardNumber || null  // 空字串傳 null
                        })
                    });

                    if (!res.ok) {
                        const err = await res.json().catch(() => ({}));
                        throw new Error(err.error || err.message || "更新失敗");
                    }

                    alert("個人資料更新成功！");
                    editProfileForm.style.display = "none";
                    profileData.style.display = "block";
                    await loadProfile(); // 重新載入顯示最新資料

                } catch (err) {
                    console.error("更新個人資料失敗:", err);
                    alert("更新失敗：" + err.message);
                    if (err.message.includes("登入") || err.message.includes("token")) {
                        removeToken();
                        showLoginPage(true);
                    }
                }
            };
        }

        // 編輯按鈕
        if (editProfileButton) {
            editProfileButton.onclick = () => {
                editProfileForm.style.display = "block";
                profileData.style.display = "none";
            };
        }

        // 取消編輯
        if (cancelEditProfileButton) {
            cancelEditProfileButton.onclick = () => {
                editProfileForm.style.display = "none";
                profileData.style.display = "block";
            };
        }

        // 綁定新增車輛按鈕
        if (addVehicleBtn) addVehicleBtn.onclick = addVehicle;

        // 啟動載入
        loadProfile();
    }

    async function waitForGoogleMaps() {
        const maxAttempts = 30; // 最多等待 30 秒
        const interval = 1000; // 每秒檢查一次
        let attempts = 0;
        return new Promise((resolve, reject) => {
            const checkInterval = setInterval(() => {
                attempts++;
                if (window.isGoogleMapsLoaded && window.google && window.google.maps) {
                    clearInterval(checkInterval);
                    resolve(true);
                } else if (attempts >= maxAttempts) {
                    clearInterval(checkInterval);
                    reject(new Error("Google Maps API 加載超時，請檢查網路連線或 API 金鑰是否有效。"));
                }
            }, interval);
        });
    }

    // 設置收入查詢
    function setupIncomeInquiry() {
        const role = getRole();
        if (role !== "admin") {
            alert("此功能僅限管理員使用！");
            return;
        }

        const startDateInput = document.getElementById("startDate");
        const endDateInput = document.getElementById("endDate");
        const incomeSearchButton = document.getElementById("incomeSearchButton");
        const incomeTableBody = document.getElementById("incomeTableBody");
        const totalIncomeDisplay = document.getElementById("totalIncomeDisplay");

        if (!startDateInput || !endDateInput || !incomeSearchButton || !incomeTableBody || !totalIncomeDisplay) {
            console.error("收入查詢頁面缺少必要元素");
            return;
        }

        const today = new Date().toISOString().split('T')[0];
        endDateInput.value = today;

        let currentParkingLotId = null;
        let parkingLotAddress = "未知停車場"; // 儲存地址

        // 載入停車場 ID 和地址
        async function loadParkingLotId() {
            try {
                const token = getToken();
                const res = await fetch(`${API_URL}/parking/all`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                if (!res.ok) throw new Error("無法取得停車場");

                const { data } = await res.json();
                if (!data || data.length === 0) {
                    alert("你尚未管理任何停車場！");
                    return;
                }
                currentParkingLotId = data[0].parking_lot_id;
                parkingLotAddress = data[0].address || data[0].name || "未知停車場";
                console.log("收入查詢使用停車場 → ID:", currentParkingLotId, "地址:", parkingLotAddress);
            } catch (err) {
                console.error("載入停車場失敗:", err);
                alert("無法載入停車場資訊");
            }
        }

        async function searchIncome() {
            const start = startDateInput.value;
            const end = endDateInput.value;

            if (!start || !end) return alert("請選擇開始與結束日期");
            if (start > end) return alert("開始日期不能晚於結束日期");
            if (!currentParkingLotId) return alert("正在載入停車場資訊，請稍後再試");

            incomeTableBody.innerHTML = `<tr><td colspan="4">載入中...</td></tr>`;
            totalIncomeDisplay.innerHTML = `<p class="text-gray-600">載入中...</p>`;

            try {
                const token = getToken();
                const url = `${API_URL}/parking/income?start_date=${start}&end_date=${end}&parking_lot_id=${currentParkingLotId}`;

                const res = await fetch(url, {
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json"
                    }
                });

                if (!res.ok) {
                    if (res.status === 401) throw new Error("登入過期，請重新登入");
                    const err = await res.json().catch(() => ({}));
                    throw new Error(err.error || "伺服器錯誤");
                }

                const result = await res.json();
                const data = result.data;
                const records = data.records || [];
                const summary = data.summary || {};
                const address = data.parking_lot_address || parkingLotAddress;

                // 顯示總收入（上方）
                totalIncomeDisplay.innerHTML = `
                <div class="bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-8 rounded-2xl shadow-2xl text-center mb-8">
                    <p class="text-5xl font-extrabold">總金額 ${summary.total_income?.toLocaleString() || 0} 元</p>
                    <p class="text-2xl opacity-95">
                        總停車紀錄共 ${summary.total_records || 0} 筆 
                    </p>
                    <p class="text-xl opacity-80 mt-2">
                        停車時數總計 ${summary.total_hours?.toFixed(1) || 0} 小時
                    </p>
                </div>
            `;

                // 渲染明細表格
                incomeTableBody.innerHTML = "";

                if (records.length === 0) {
                    incomeTableBody.innerHTML = `
                    <tr>
                        <td colspan="4" class="py-20 text-center text-gray-500 text-2xl">
                            此區間無收入紀錄
                        </td>
                    </tr>
                `;
                    return;
                }

                records.forEach(record => {
                    const row = document.createElement("tr");
                    row.className = "hover:bg-gray-50 transition-colors";
                    row.innerHTML = `
                    <td class="py-4 px-6 font-medium text-gray-800">${address}</td>
                    <td class="py-4 px-6">${record.start_time || 'N/A'}</td>
                    <td class="py-4 px-6">${record.end_time || '進行中'}</td>
                    <td class="py-4 px-6 text-right font-bold text-green-600 text-xl">
                        ${parseInt(record.cost || 0).toLocaleString()} 元
                    </td>
                `;
                    incomeTableBody.appendChild(row);
                });

            } catch (error) {
                console.error("收入查詢失敗:", error);
                alert("查詢失敗：" + error.message);
                incomeTableBody.innerHTML = `<tr><td colspan="4" class="text-red-600 py-10 text-center">載入失敗</td></tr>`;
                totalIncomeDisplay.innerHTML = `<p class="text-red-600 text-center">無法取得資料</p>`;

                if (error.message.includes("登入")) {
                    removeToken();
                    showLoginPage(true);
                }
            }
        }

        // 點擊頁籤自動查詢
        document.querySelector('.nav-link[data-target="incomeInquiry"]')?.addEventListener("click", async () => {
            endDateInput.value = today;
            await loadParkingLotId();
            searchIncome();
        });

        incomeSearchButton.addEventListener("click", searchIncome);

        // 初始化
        loadParkingLotId();
    }
    // 添加租用紀錄
    function addToHistory(action) {
        const now = new Date();
        const timestamp = now.toLocaleString("zh-TW", { hour12: false });
        const listItem = document.createElement("li");
        listItem.textContent = `${action} - ${timestamp}`;
        historyList.appendChild(listItem);
    }
    // 載入租用紀錄
    async function loadHistory() {
        const role = getRole();
        console.log("Current role in loadHistory:", role);
        if (role !== "renter") {
            alert("此功能僅限租用者使用！");
            return;
        }
        if (!await checkAuth()) return;
        try {
            const token = getToken();
            const response = await fetch(`${API_URL}/rent`, {
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }
            });
            if (!response.headers.get('content-type')?.includes('application/json')) {
                throw new Error("後端返回非 JSON 響應，請檢查伺服器配置");
            }
            if (!response.ok) {
                if (response.status === 401) throw new Error("認證失敗，請重新登入！");
                const errorData = await response.json();
                throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorData.message || '未知錯誤'}`);
            }
            const responseData = await response.json();
            const historyList = document.getElementById("historyList");
            if (!historyList) {
                console.warn("historyList element not found");
                return;
            }
            historyList.innerHTML = "";
            let data = responseData.data || responseData;
            if (!Array.isArray(data)) {
                console.error("History data is not an array:", responseData);
                alert("租用紀錄格式錯誤，請檢查後端服務");
                return;
            }
            if (data.length === 0) {
                historyList.innerHTML = "<li>目前沒有租賃記錄</li>";
                return;
            }
            data.forEach(record => {
                const listItem = document.createElement("li");
                const startTime = record.start_time ? new Date(record.start_time).toLocaleString("zh-TW", { hour12: false }) : "無開始時間";
                const endTime = record.end_time
                    ? new Date(record.end_time).toLocaleString("zh-TW", { hour12: false })
                    : "尚未結束";
                const cost = record.total_cost ?? record.total_fee ?? 0;
                listItem.innerHTML = ` 開始時間: ${startTime}, 結束時間: ${endTime}, 費用: ${cost} 元`;
                historyList.appendChild(listItem);
            });
        } catch (error) {
            console.error("Failed to load history:", error);
            const historyList = document.getElementById("historyList");
            if (historyList) {
                historyList.innerHTML = "<li>無法載入租用紀錄，請檢查後端服務</li>";
            }
            if (error.message === "認證失敗，請重新登入！") {
                removeToken();
                showLoginPage(true);
            }
        }
    }
    async function setupViewAllUsers() {
        const role = getRole();
        if (role !== "admin") {
            alert("此功能僅限管理員使用！");
            return;
        }
        const renterTableBody = document.getElementById("renterTableBody");
        if (!renterTableBody) {
            console.error("Required DOM elements missing for view all users");
            alert("頁面元素載入失敗，請檢查 DOM 結構！");
            return;
        }
        async function loadUserData() {
            renterTableBody.innerHTML = '<tr><td colspan="6">載入中...</td></tr>';
            try {
                const token = getToken();
                if (!token) throw new Error("認證令牌缺失，請重新登入！");
                const response = await fetch(`${API_URL}/members/all`, {
                    method: 'GET',
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    }
                });
                if (!response.ok) {
                    if (response.status === 401) throw new Error("認證失敗，請重新登入！");
                    const errorData = await response.json();
                    throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorData.error || '未知錯誤'}`);
                }
                const data = await response.json();
                let users = data.data || data;
                if (!Array.isArray(users)) {
                    console.error("Users data is not an array:", data);
                    alert("後端返回的用戶資料格式錯誤，請檢查後端服務");
                    return;
                }
                const renters = users.filter(user => user.role.toLowerCase() === "renter");
                renterTableBody.innerHTML = '';
                if (renters.length === 0) {
                    renterTableBody.innerHTML = '<tr><td colspan="6">無租用者資料</td></tr>';
                } else {
                    const renterFragment = document.createDocumentFragment();
                    renters.forEach(user => {
                        const row = document.createElement("tr");
                        row.innerHTML = `
                        <td>${user.member_id || user.id || 'N/A'}</td>
                        <td>${user.name || '未知'}</td>
                        <td>${user.email || '未知'}</td>
                        <td>${user.phone || '未知'}</td>
                        <td>${user.license_plate || '無'}</td>
                    `;
                        renterFragment.appendChild(row);
                    });
                    renterTableBody.appendChild(renterFragment);
                }
            } catch (error) {
                console.error("Failed to load user data:", error);
                alert(`無法載入用戶資料，請檢查後端服務 (錯誤: ${error.message})`);
                renterTableBody.innerHTML = '<tr><td colspan="6">無法載入資料</td></tr>';
                if (error.message === "認證失敗，請重新登入！") {
                    removeToken();
                    showLoginPage(true);
                }
            }
        }
        loadUserData();
    }
});