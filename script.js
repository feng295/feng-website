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
        // 新增這兩行：恢復原本標題，隱藏動態標題
        document.getElementById("pageTitle")?.style.removeProperty("display");
        document.getElementById("dynamicParkingTitle")?.style.setProperty("display", "none");
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

        if (role === "renter") pageTitle.textContent = "租用者";
        else if (role === "admin") pageTitle.textContent = "管理員";

        const navList = document.querySelector(".function-list ul");
        if (!navList) {
            console.error("Navigation list (.function-list ul) not found");
            return;
        }

        if (role === "renter") {
            navList.innerHTML = `
                <li><a href="#" class="nav-link" data-target="parkingLotSelector">停車場進出場管理</a></li>
                <li><a href="#" class="nav-link" data-target="reserveParking">預約車位</a></li>
                <li><a href="#" class="nav-link" data-target="history">租用紀錄</a></li>
                <li><a href="#" class="nav-link" data-target="profile">個人資訊</a></li>
            `;
        } else if (role === "admin") {
            navList.innerHTML = `
                <li><a href="#" class="nav-link" data-target="addParking">新增停車場</a></li>
                <li><a href="#" class="nav-link" data-target="My parking space">車位列表</a></li>
                <li><a href="#" class="nav-link" data-target="incomeInquiry">收入查詢</a></li>
                <li><a href="#" class="nav-link" data-target="viewAllUsers">查看所有用戶資料</a></li>
                <li><a href="#" class="nav-link" data-target="profile">個人資訊</a></li>
            `;
        }

        document.querySelectorAll(".content-section").forEach(section => {
            section.style.display = "none";
        });

        const defaultSectionId = role === "renter" ? "reserveParking" :
            role === "admin" ? "viewAllUsers" : "My parking space";
        const defaultSection = document.getElementById(defaultSectionId);

        if (!defaultSection) {
            console.error(`Default section "${defaultSectionId}" not found`);
            return;
        }

        defaultSection.style.display = "block";
        if (defaultSectionId === "My parking space") setupMyParkingSpace();
        else if (defaultSectionId === "reserveParking") setupReserveParking();
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
        const enterBtn = document.getElementById("enterSelectedLotBtn");
        const select = document.getElementById("parkingLotActionSelect");

        if (!selectorSection || !rentSection || !settleSection || !enterBtn || !select) {
            console.error("缺少必要元素，無法初始化停車場選擇器");
            return;
        }

        // 隱藏所有內容區塊，只顯示選擇器
        document.querySelectorAll(".content-section").forEach(sec => {
            sec.style.display = "none";
        });
        selectorSection.style.display = "block";

        // 載入停車場清單（只會真的發 request 一次）
        loadParkingLotSelector();

        // 按鈕事件（使用 addEventListener 避免重複綁定）
        enterBtn.onclick = null; // 清除舊事件
        enterBtn.onclick = () => {
            const selectedValue = select.value.trim();
            if (!selectedValue) {
                alert("請先選擇停車場與動作！");
                return;
            }
            let selectedData;
            try {
                selectedData = JSON.parse(selectedValue);
            } catch (e) {
                alert("選項資料異常，請重新選擇");
                return;
            }
            const { id, action, name } = selectedData;

            // 隱藏選擇器
            selectorSection.style.display = "none";

            // 關鍵：動態標題 + 地址
            const pageTitle = document.getElementById("pageTitle");
            const dynamicTitle = document.getElementById("dynamicParkingTitle");

            if (pageTitle) pageTitle.style.display = "none";
            if (dynamicTitle) {
                // 從 allParkingLots 找出完整資料（包含 address）
                const fullLot = allParkingLots.find(lot => {
                    const lotId = lot.parking_lot_id || lot.id;
                    return lotId == id;
                });

                const address = fullLot?.address || fullLot?.location || "未知地址";
                dynamicTitle.style.display = "block";
                dynamicTitle.innerHTML = `
            <div style="color:#1e40af; font-size:1.8rem;">${name}</div>
            <div style="color:#6b7280; font-size:1.1rem; margin-top:4px;">
                ${address}
            </div>
            <div style="color:#374151; font-weight:bold; margin-top:8px; font-size:1.4rem;">
                ${action === "rent" ? "車牌辨識進場" : "結算離場"}
            </div>
        `;
            }

            if (action === "rent") {
                rentSection.style.display = "block";
                const demoInput = document.getElementById("demoParkingLotId");
                const statusText = document.getElementById("demoLotStatus");
                if (demoInput) demoInput.value = id;
                if (statusText) {
                    statusText.innerHTML = `<strong style="color:#16a34a;">已選擇：${name} (${address})</strong>`;
                }
                setupRentParking();
            } else if (action === "settle") {
                settleSection.style.display = "block";
                const settleTitle = document.getElementById("settleParkingTitle");
                if (settleTitle) {
                    settleTitle.innerHTML = `${name} - ${address}<br><small>出場結算</small>`;
                }
                setupSettleParking();
            }
        };
    }

    function setupRentParking() {
        const role = getRole();
        if (role !== "renter") {
            alert("此功能僅限租用者使用！");
            return;
        }

        const rentParkingSection = document.getElementById("rentParking");
        rentParkingSection.style.display = "block";

        // DOM 元素
        const video = document.getElementById("videoRent");
        const fallback = document.getElementById("fallbackRent");
        const plateList = document.getElementById("plateListRent");
        const loading = document.getElementById("loadingRent");
        const error = document.getElementById("errorRent");
        const startButton = document.getElementById("startButtonRent");
        const stopButton = document.getElementById("stopButtonRent");
        const confirmButton = document.getElementById("confirmButtonRent");
        const rescanButton = document.getElementById("rescanButtonRent");


        let selectedParkingLotId = null;
        let currentPlate = null;
        let stream = null;
        let intervalId = null;
        let isScanningStopped = false;


        // 攝影機與辨識（你原本的邏輯，精簡保留）
        async function startStream() {
            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: true });
                video.srcObject = stream;
                video.style.display = "block";
                fallback.style.display = "none";
                await fetch(`${window.location.origin}/license-plate/start-rent`, { method: 'POST' });
                startLicensePlateDetection();
            } catch (err) {
                error.innerText = "無法開啟攝影機";
                error.style.display = "block";
                fallback.style.display = "block";
            }
        }

        function stopStream() {
            if (stream) stream.getTracks().forEach(t => t.stop());
            fetch(`${window.location.origin}/license-plate/stop-rent`, { method: 'POST' });
            isScanningStopped = true;
        }

        function startLicensePlateDetection() {
            if (isScanningStopped) return;
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            function capture() {
                if (!stream || isScanningStopped) return;
                if (video.readyState < 2) return setTimeout(capture, 500);

                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                ctx.drawImage(video, 0, 0);

                canvas.toBlob(blob => {
                    if (!blob) return;
                    const fd = new FormData();
                    fd.append('frame', blob, 'frame.jpg');

                    fetch(`${window.location.origin}/license-plate/process_frame-rent`, { method: 'POST', body: fd })
                        .then(r => r.ok ? r.json() : Promise.reject())
                        .then(data => {
                            const plate = data.plate && data.plate !== '尚未檢測到車牌' ? data.plate : null;
                            if (plate && plate !== currentPlate) {
                                currentPlate = plate;
                                plateList.innerHTML = `<li class="text-green-600 text-4xl font-bold">${currentPlate}</li>`;
                                confirmButton.disabled = !selectedParkingLotId;
                                rescanButton.style.display = "inline-block";
                                isScanningStopped = true;
                                stopStream();
                            }
                        })
                        .catch(() => { });

                    if (!isScanningStopped) setTimeout(capture, 1800);
                }, 'image/jpeg', 0.9);
            }
            loading.style.display = "block";
            capture();
        }

        // 確認進場（送出 license_plate + parking_lot_id + start_time）
        confirmButton.addEventListener("click", async () => {
            if (!currentPlate) return alert("請先掃描車牌！");
            if (!selectedParkingLotId) return alert("請先輸入停車場 ID！");

            confirmButton.disabled = true;
            confirmButton.textContent = "進場中...";

            try {
                const token = getToken();
                const start_time = new Date().toISOString();

                const res = await fetch(`${API_URL}/rent`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        license_plate: currentPlate,
                        parking_lot_id: selectedParkingLotId,
                        start_time: start_time
                    })
                });

                if (res.ok) {
                    plateList.innerHTML = `<li class="text-green-600 text-5xl font-bold">${currentPlate} 進場成功！</li>`;
                    alert(`進場成功！\n車牌：${currentPlate}\n停車場 ID：${selectedParkingLotId}\n時間：${new Date().toLocaleString('zh-TW')}`);

                    setTimeout(() => {
                        currentPlate = null;
                        plateList.innerHTML = '<li class="text-gray-500 text-xl">尚未檢測到車牌</li>';
                        confirmButton.disabled = true;
                        rescanButton.style.display = "none";
                        isScanningStopped = false;
                        startStream();
                    }, 8000);
                } else {
                    const err = await res.json();
                    alert("進場失敗：" + (err.error || err.message || "未知錯誤"));
                }
            } catch (e) {
                alert("網路錯誤");
            } finally {
                confirmButton.disabled = false;
                confirmButton.textContent = "確認進場";
            }
        });

        rescanButton.addEventListener("click", () => {
            currentPlate = null;
            plateList.innerHTML = '<li class="text-gray-500 text-xl">尚未檢測到車牌</li>';
            confirmButton.disabled = true;
            rescanButton.style.display = "none";
            isScanningStopped = false;
            startStream();
        });

        startButton.addEventListener("click", startStream);
        stopButton.addEventListener("click", stopStream);

        // 自動啟動
        startStream();
    }

    function setupSettleParking() {
        const role = getRole();
        console.log("Current role in setupSettleParking:", role);
        if (role !== "renter") {
            alert("此功能僅限租用者使用！");
            return;
        }

        const settleParkingSection = document.getElementById("settleParking");
        if (!settleParkingSection) {
            console.error("settleParking section not found");
            alert("無法載入「離開結算(出場)」頁面！");
            return;
        }
        settleParkingSection.style.display = "block";

        const video = document.getElementById("videoSettle");
        const fallback = document.getElementById("fallbackSettle");
        const plateList = document.getElementById("plateListSettle");
        const loading = document.getElementById("loadingSettle");
        const error = document.getElementById("errorSettle");
        const settleResult = document.getElementById("settleResult");
        const startButton = document.getElementById("startButtonSettle");
        const stopButton = document.getElementById("stopButtonSettle");
        const confirmButton = document.getElementById("confirmButtonSettle");
        const rescanButton = document.getElementById("rescanButtonSettle");

        let stream = null;
        let intervalId = null;
        let isScanningStopped = false;
        let isStopRequested = false;
        let currentPlate = null;

        async function startStream() {
            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
                video.srcObject = stream;
                video.style.display = "block";
                fallback.style.display = "none";
                error.style.display = "none";
                error.innerText = "";

                video.addEventListener('loadeddata', async () => {
                    console.log("Settle Video 數據已加載");
                    try {
                        const response = await fetch(`${window.location.origin}/license-plate/start-settle`, {
                            method: 'POST'
                        });
                        if (!response.ok) throw new Error(`啟動請求失敗: ${response.status}`);
                        const data = await response.json();
                        console.log(data.message);
                        startLicensePlateDetection();
                    } catch (err) {
                        console.error("啟動錯誤:", err);
                        error.innerText = `啟動失敗: ${err.message}`;
                        error.style.display = "block";
                    }
                }, { once: true });

                if (video.readyState >= video.HAVE_ENOUGH_DATA) {
                    video.dispatchEvent(new Event('loadeddata'));
                }
            } catch (err) {
                console.error("無法訪問攝影機:", err);
                error.innerText = `無法訪問攝影機: ${err.message}`;
                error.style.display = "block";
                video.style.display = "none";
                fallback.style.display = "block";
            }
        }

        function stopStream() {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
                stream = null;
                video.srcObject = null;
                error.innerText = "串流已停止";
                error.style.display = "block";
                video.style.display = "none";
                fallback.style.display = "block";
            }
            isStopRequested = true;
            fetch(`${window.location.origin}/license-plate/stop-settle`, {
                method: 'POST'
            })
                .then(response => {
                    if (!response.ok) throw new Error(`停止請求失敗: ${response.status}`);
                    return response.json();
                })
                .then(data => {
                    console.log(data.message);
                    isScanningStopped = true;
                    isStopRequested = false;
                    clearInterval(intervalId);
                    intervalId = null;
                })
                .catch(error => {
                    console.error("停止錯誤:", error);
                    error.innerText = `停止失敗: ${error.message}`;
                    error.style.display = "block";
                    isStopRequested = false;
                });
        }

        function startLicensePlateDetection() {
            if (!stream || isScanningStopped) return;
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');

            function captureFrame() {
                if (!stream || isScanningStopped) return;

                if (video.readyState !== video.HAVE_ENOUGH_DATA || video.videoWidth === 0 || video.videoHeight === 0) {
                    console.warn("Settle Video 未準備好，延遲重試");
                    intervalId = setTimeout(captureFrame, 500);
                    return;
                }

                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                context.drawImage(video, 0, 0, canvas.width, canvas.height);

                canvas.toBlob(blob => {
                    if (!blob) {
                        console.error("無法生成 Blob");
                        error.innerText = '無法生成影像數據';
                        error.style.display = "block";
                        intervalId = setTimeout(captureFrame, 2000);
                        return;
                    }

                    const formData = new FormData();
                    formData.append('frame', blob, 'frame.jpg');
                    console.log("發送請求到:", `/license-plate/process_frame-settle`);

                    fetch(`${window.location.origin}/license-plate/process_frame-settle`, {
                        method: 'POST',
                        body: formData
                    })
                        .then(response => {
                            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                            return response.json();
                        })
                        .then(data => {
                            let currentPlates = data.plate && data.plate !== '尚未檢測到車牌' ? [data.plate] : [];
                            loading.style.display = 'none';

                            if (currentPlates.length > 0 && currentPlates[0] !== currentPlate) {
                                currentPlate = currentPlates[0];
                                plateList.innerHTML = `<li class="text-black">${currentPlate}</li>`;
                                confirmButton.disabled = false;
                                rescanButton.style.display = "inline-block";
                                isScanningStopped = true;
                                clearInterval(intervalId);
                                intervalId = null;
                                stopStream();
                            } else {
                                plateList.innerHTML = '<li class="text-gray-500">尚未檢測到車牌</li>';
                                confirmButton.disabled = true;
                                rescanButton.style.display = "none";
                            }
                        })
                        .catch(err => {
                            console.error("處理影像失敗:", err);
                            error.innerText = `處理影像失敗: ${err.message}`;
                            error.style.display = "block";
                            loading.style.display = "none";
                        });

                    intervalId = setTimeout(captureFrame, 2000);
                }, 'image/jpeg', 0.85);
            }

            video.addEventListener('loadeddata', () => {
                console.log("Settle Video 數據已加載，開始捕獲");
                loading.style.display = 'block';
                captureFrame();
            }, { once: true });

            if (video.readyState >= video.HAVE_ENOUGH_DATA) {
                captureFrame();
            }
        }

        startButton.addEventListener("click", startStream);
        stopButton.addEventListener("click", stopStream);
        confirmButton.addEventListener("click", async () => {
            if (!currentPlate) {
                alert("請先掃描車牌！");
                return;
            }

            confirmButton.disabled = true;
            confirmButton.textContent = "結算中...";

            try {
                const token = getToken();
                if (!token) throw new Error("請先登入！");

                const end_time = new Date().toISOString();

                const response = await fetch(`${API_URL}/rent/leave`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        license_plate: currentPlate,
                        end_time: end_time
                    })
                });

                const result = await response.json();

                if (response.ok) {
                    // 支援常見的金額欄位名稱
                    const amount = result.data?.total_cost ?? 0;
                    plateList.innerHTML = `<li class="text-green-600 text-6xl font-bold">${currentPlate}</li>`;
                    settleResult.innerHTML = `
                        <div class="text-green-600 text-5xl font-bold mb-8">出場成功！</div>
                        <div class="text-4xl">應收費用：<span class="text-red-600 text-7xl font-bold">${amount}</span> 元</div>
                    `;
                    settleResult.style.display = "block";

                    alert(`出場結算成功！費用：${amount} 元`);

                    // 15 秒後自動準備下一台車
                    setTimeout(() => {
                        plateList.innerHTML = '<li class="text-gray-500 text-3xl">等待車輛進入感應區...</li>';
                        settleResult.style.display = "none";
                        currentPlate = null;
                        confirmButton.disabled = true;
                        rescanButton.style.display = "none";
                        startStream();
                    }, 15000);

                } else {
                    throw new Error(result.error || result.message || "結算失敗");
                }

            } catch (err) {
                console.error("出場失敗:", err);
                settleResult.innerHTML = `
                    <div class="text-red-600 text-4xl font-bold">出場失敗</div>
                    <div class="text-2xl mt-6">${err.message}</div>
                `;
                settleResult.style.display = "block";
                alert("出場失敗：" + err.message);
            } finally {
                confirmButton.disabled = false;
                confirmButton.textContent = "確認出場";
            }
        });

        rescanButton.addEventListener("click", () => {
            plateList.innerHTML = '<li class="text-gray-500">尚未檢測到車牌</li>';
            error.style.display = "none";
            settleResult.style.display = "none";
            confirmButton.disabled = true;
            rescanButton.style.display = "none";
            isScanningStopped = false;
            isStopRequested = false;
            clearInterval(intervalId);
            intervalId = null;
            startStream();
        });

        startStream();
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

        if (isLogin) {
            try {
                const response = await fetch(`${API_URL}/members/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                console.log(`Login response status: ${response.status}`);
                if (!response.headers.get('content-type')?.includes('application/json')) {
                    throw new Error("後端返回非 JSON 響應，請檢查伺服器配置");
                }
                const result = await response.json();
                console.log("Login response data:", JSON.stringify(result, null, 2));
                if (response.ok) {
                    if (!result.data || !result.data.token) {
                        showError("後端未返回 token，請檢查後端服務！");
                        return;
                    }
                    setToken(result.data.token);

                    let memberId = null;
                    if (result.data.member && result.data.member.member_id) {
                        memberId = result.data.member.member_id;
                    } else if (result.data.member_id) {
                        memberId = result.data.member_id;
                    } else if (result.data.id) {
                        memberId = result.data.id;
                    } else if (result.data.user_id) {
                        memberId = result.data.user_id;
                    } else if (result.data.member && result.data.member.id) {
                        memberId = result.data.member.id;
                    } else {
                        showError("後端未返回會員 ID，請聯繫管理員！");
                        return;
                    }
                    localStorage.setItem("member_id", memberId.toString());

                    let role = "";
                    if (result.data.member && typeof result.data.member.role === "string") {
                        role = result.data.member.role.toLowerCase().trim();
                    } else if (typeof result.data.role === "string") {
                        role = result.data.role.toLowerCase().trim();
                    } else if (result.data.user && typeof result.data.user.role === "string") {
                        role = result.data.user.role.toLowerCase().trim();
                    } else if (result.data.roles && Array.isArray(result.data.roles) && result.data.roles.length > 0) {
                        role = result.data.roles[0].toLowerCase().trim();
                    } else if (typeof result.data.user_role === "string") {
                        role = result.data.user_role.toLowerCase().trim();
                    } else if (typeof result.role === "string") {
                        role = result.role.toLowerCase().trim();
                    } else {
                        showError("後端未返回有效的角色資訊，請聯繫管理員！");
                        return;
                    }
                    const validRoles = ["renter", "admin"];
                    if (!validRoles.includes(role)) {
                        showError(`後端返回的角色 "${role}" 無效，應為 ${validRoles.join(", ")} 之一！`);
                        return;
                    }
                    setRole(role);
                    const newPath = `/${role}`;
                    history.replaceState({ role }, '', newPath); // 設置 URL 路徑
                    alert("登入成功！");
                    showMainPage();
                } else {
                    console.error("Login failed:", result);
                    showError(result.error || "電子郵件或密碼錯誤！");
                }
            } catch (error) {
                console.error("Login failed:", error.message);
                showError(error.message || "無法連接到伺服器，請檢查網路或後端服務！");
            }
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
                console.log(`Register response status: ${response.status}`);
                if (!response.headers.get('content-type')?.includes('application/json')) {
                    throw new Error("後端返回非 JSON 響應，請檢查伺服器配置");
                }
                const result = await response.json();
                if (response.ok) {
                    alert("註冊成功！請使用此帳號登入。");
                    isLogin = true;
                    formTitle.textContent = "登入";
                    submitButton.textContent = "登入";
                    toggleMessage.innerHTML = '還沒有帳號？<a href="#" id="toggleLink">註冊</a>';
                    toggleFormFields();
                } else {
                    console.error("Register failed:", response.status, result);
                    showError(result.error || `註冊失敗！（錯誤碼：${response.status}）`);
                }
            } catch (error) {
                console.error("Register failed:", error.message);
                showError(error.message || "無法連接到伺服器，請檢查網路或後端服務！");
            }
        }
    });

    // 登出功能
    logoutButton.addEventListener("click", function () {
        removeToken();
        showLoginPage();
    });

    // 設置車位列表（唯一版本）
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
                <td class="border px-4 py-2">${spot.parking_lot_id}</td>
                <td class="border px-4 py-2">${spot.address}</td>
                <td class="border px-4 py-2">${spot.type === "flat" ? "平面" : "機械"}</td>
                <td class="border px-4 py-2">${spot.hourly_rate}</td>
                <td class="border px-4 py-2">總 ${spot.total_spots} / 剩 ${spot.remaining_spots}</td>
                <td class="border px-4 py-2 text-center space-x-1">
                    <button class="edit-btn bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 rounded" 
                            data-id="${spot.parking_lot_id}">編輯</button>
                    <button class="delete-btn bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1 rounded" 
                            data-id="${spot.parking_lot_id}">刪除</button>
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
                <label class="block font-semibold">每小時價格（元）：</label>
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
    function setupProfile() {
        const role = getRole();
        console.log("Current role in setupProfile:", role);
        if (!["renter", "admin"].includes(role)) {
            alert("您沒有權限訪問此功能！");
            return;
        }

        const profileSection = document.getElementById("profile");
        if (!profileSection) {
            console.error("profile section not found");
            alert("無法載入「個人資訊」頁面，頁面元素缺失，請聯繫管理員！");
            return;
        }
        profileSection.style.display = "block";

        const profileData = document.getElementById("profileData");
        const editProfileForm = document.getElementById("editProfileForm");
        const editName = document.getElementById("editName");
        const editPhone = document.getElementById("editPhone");
        const editEmail = document.getElementById("editEmail");
        const editLicensePlate = document.getElementById("editLicensePlate");
        const renterEditFields = document.getElementById("renterEditFields");
        const editCardNumber = document.getElementById("editCardNumber");
        const saveProfileButton = document.getElementById("saveProfileButton");
        const editProfileButton = document.getElementById("editProfileButton");
        const cancelEditProfileButton = document.getElementById("cancelEditProfileButton");

        if (!profileData || !editProfileForm || !editName || !editPhone || !editEmail || !editLicensePlate || !renterEditFields || !editCardNumber || !saveProfileButton || !editProfileButton || !cancelEditProfileButton) {
            console.error("Required elements for profile section are missing");
            alert("個人資訊頁面元素缺失，請聯繫管理員！");
            return;
        }

        async function loadProfile() {
            try {
                const token = getToken();
                if (!token) throw new Error("認證令牌缺失，請重新登入！");

                const memberId = getMemberId();
                if (!memberId) throw new Error("無法獲取會員 ID，請重新登入！");

                const response = await fetch(`${API_URL}/members/profile`, {
                    method: 'GET',
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    if (response.status === 401) throw new Error("認證失敗，請重新登入！");
                    const errorData = await response.json();
                    throw new Error(`HTTP 錯誤！狀態: ${response.status}, 訊息: ${errorData.error || '未知錯誤'}`);
                }

                const data = await response.json();
                const profile = data.data || data.profile || data;

                // 根據角色動態顯示個人資訊，並隱藏信用卡號中間8碼
                let maskedCardNumber = '未提供';
                if (profile.payment_info) {
                    const card = profile.payment_info.replace(/\D/g, ""); // 移除非數字字符
                    if (card.length === 16) {
                        const firstFour = card.slice(0, 4);
                        const lastFour = card.slice(-4);
                        maskedCardNumber = `${firstFour}-****-****-${lastFour}`;
                    } else {
                        maskedCardNumber = profile.payment_info; // 如果格式不正確，保持原樣
                    }
                }

                let profileHTML = `
                    <p><strong>姓名：</strong> ${profile.name || '未提供'}</p>
                    <p><strong>電話：</strong> ${profile.phone || '未提供'}</p>
                    <p><strong>電子郵件：</strong> ${profile.email || '未提供'}</p>
                    <p><strong>信用卡號：</strong> ${maskedCardNumber}</p>
                `;

                if (role === "renter") {
                    profileHTML += `
                        <p><strong>車牌號碼：</strong> ${profile.license_plate || '未提供'}</p>
                    `;
                }

                profileData.innerHTML = profileHTML;

                // 填充編輯表單
                editName.value = profile.name || '';
                editPhone.value = profile.phone || '';
                editEmail.value = profile.email || '';
                editLicensePlate.value = profile.license_plate || '';
                editCardNumber.value = profile.payment_info || '';

                // 根據角色顯示或隱藏租用者專用欄位
                if (renterEditFields) {
                    renterEditFields.style.display = role === "renter" ? "block" : "none";
                }
            } catch (error) {
                console.error("Failed to load profile:", error);
                profileData.innerHTML = `<p>載入個人資訊失敗（錯誤: ${error.message}）</p>`;
                if (error.message.includes("認證失敗")) {
                    removeToken();
                    showLoginPage(true);
                }
            }
        }

        editProfileButton.addEventListener("click", () => {
            editProfileForm.style.display = "block";
            profileData.style.display = "none";
        });

        saveProfileButton.addEventListener("click", async () => {
            const updatedProfile = {
                name: editName.value.trim(),
                phone: editPhone.value.trim(),
                email: editEmail.value.trim(),
                payment_info: editCardNumber.value.trim()
            };

            // 如果是租用者，添加車牌號碼
            if (role === "renter") {
                updatedProfile.license_plate = editLicensePlate.value.trim();

                // 驗證車牌號碼格式（例如 AAA-1111）
                if (updatedProfile.license_plate && !/^[A-Z]{2,3}-[0-9]{3,4}$/.test(updatedProfile.license_plate)) {
                    alert("請提供有效的車牌號碼（格式如：AAA-1111）！");
                    return;
                }
            }

            // 共用欄位驗證
            if (!updatedProfile.name) {
                alert("姓名為必填項！");
                return;
            }
            if (!updatedProfile.phone || !/^[0-9]{10}$/.test(updatedProfile.phone)) {
                alert("請提供有效的電話號碼（10 位數字）！");
                return;
            }
            if (!updatedProfile.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updatedProfile.email)) {
                alert("請提供有效的電子郵件地址！");
                return;
            }
            if (!updatedProfile.payment_info || !/^[0-9]{16}$/.test(updatedProfile.payment_info)) {
                alert("請提供有效的信用卡號（16 位數字）！");
                return;
            }

            try {
                const token = getToken();
                if (!token) throw new Error("認證令牌缺失，請重新登入！");

                const response = await fetch(`${API_URL}/members/profile`, {
                    method: 'PUT',
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify(updatedProfile)
                });

                if (!response.ok) {
                    if (response.status === 401) throw new Error("認證失敗，請重新登入！");
                    const errorData = await response.json();
                    throw new Error(`HTTP 錯誤！狀態: ${response.status}, 訊息: ${errorData.error || '未知錯誤'}`);
                }

                const result = await response.json();
                alert("個人資訊更新成功！");
                editProfileForm.style.display = "none";
                profileData.style.display = "block";
                loadProfile();
            } catch (error) {
                console.error("Failed to update profile:", error);
                alert(`更新個人資訊失敗（錯誤: ${error.message}）`);
                if (error.message.includes("認證失敗")) {
                    removeToken();
                    showLoginPage(true);
                }
            }
        });

        cancelEditProfileButton.addEventListener("click", () => {
            editProfileForm.style.display = "none";
            profileData.style.display = "block";
            loadProfile();
        });

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

    // 設置預約停車
    let refreshIntervalId = null;

    async function setupReserveParking() {
        if (refreshIntervalId) {
            clearInterval(refreshIntervalId);
            refreshIntervalId = null;
        }

        const role = getRole();
        console.log("User role in setupReserveParking:", role);
        if (role !== "renter") {
            alert("此功能僅限租用者使用！");
            return;
        }

        if (!await checkAuth()) return;

        const reserveSection = document.getElementById("reserveParking");
        reserveSection.style.display = "block";

        const reserveDateInput = document.getElementById("reserveDate");
        const startTimeInput = document.getElementById("startTime");
        const endTimeInput = document.getElementById("endTime");
        const reserveSearchButton = document.getElementById("reserveSearchButton");
        const reserveCity = document.getElementById("reserveCity");
        const reserveParkingType = document.getElementById("reserveParkingType");
        const reserveFloor = document.getElementById("reserveFloor");
        const parkingTableBody = document.getElementById("reserveParkingTableBody");
        const reserveParkingMap = document.getElementById("reserveParkingMap");

        if (!reserveDateInput || !startTimeInput || !endTimeInput || !reserveSearchButton || !parkingTableBody || !reserveParkingMap) {
            console.warn("Required elements for reserveParking not found.");
            return;
        }

        const now = new Date(); // Current time: 2025-06-03 20:57 CST
        const today = now.toISOString().split('T')[0];
        reserveDateInput.value = today; // Set to 2025-06-03

        const currentHour = now.getHours().toString().padStart(2, '0');
        const currentMinute = now.getMinutes().toString().padStart(2, '0');
        startTimeInput.value = `${currentHour}:${currentMinute}`; // Set to "20:57"
        startTimeInput.min = `${currentHour}:${currentMinute}`; // Restrict start time to current or later

        endTimeInput.value = `${(parseInt(currentHour) + 1).toString().padStart(2, '0')}:${currentMinute}`; // Set to "21:57"
        endTimeInput.min = "00:00"; // Allow midnight start

        let map;
        let userLatitude, userLongitude;

        try {
            const position = await new Promise((resolve, reject) => {
                if (!navigator.geolocation) reject(new Error("Geolocation not supported by browser"));
                navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000, maximumAge: 0 });
            });
            userLatitude = position.coords.latitude;
            userLongitude = position.coords.longitude;
        } catch (error) {
            console.warn("Unable to retrieve location, using fallback:", error.message);
            alert("無法獲取您的位置，將使用預設位置（國立公園）。請確認已允許定位權限。");
            userLatitude = 23.574613;
            userLongitude = 119.398103;
        }

        try {
            await waitForGoogleMaps();
            map = window.map || null;
            if (!map) {
                map = new google.maps.Map(reserveParkingMap, {
                    center: { lat: userLatitude, lng: userLongitude },
                    zoom: 14,
                    mapId: "4a41f0e1706e086d"
                });
                map.markers = [];
                window.map = map;

                // Add user marker (default Google Maps marker style, consistent with setupAddParking)
                const userMarker = new google.maps.marker.AdvancedMarkerElement({
                    position: { lat: userLatitude, lng: userLongitude },
                    map: map,
                    title: "您的位置"
                });
                map.markers.push(userMarker);
            } else {
                map.setCenter({ lat: userLatitude, lng: userLongitude });

                let userMarkerExists = map.markers.some(marker => marker.title === "您的位置");
                if (!userMarkerExists) {
                    const userMarker = new google.maps.marker.AdvancedMarkerElement({
                        position: { lat: userLatitude, lng: userLongitude },
                        map: map,
                        title: "您的位置"
                    });
                    map.markers.push(userMarker);
                } else {
                    map.markers.forEach(marker => {
                        if (marker.title === "您的位置") {
                            marker.position = { lat: userLatitude, lng: userLongitude };
                        }
                    });
                }
            }
            reserveParkingMap.style.display = "none";
        } catch (error) {
            console.error("Google Maps API failed to load:", error);
            alert("無法載入 Google Maps API，請檢查網路連線或 API 金鑰是否有效。地圖功能將不可用，但您仍可繼續查詢車位。");
            reserveParkingMap.style.display = "none";
        }

        const debounce = (func, delay) => {
            let timeout;
            return function (...args) {
                clearTimeout(timeout);
                timeout = setTimeout(() => func.apply(this, args), delay);
            };
        };

        const debouncedHandleReserveSearch = debounce(async () => {
            const selectedDate = reserveDateInput.value;
            const startTime = startTimeInput.value;
            const endTime = endTimeInput.value;
            const filterCity = reserveCity ? reserveCity.value : 'all';
            const filterType = reserveParkingType ? reserveParkingType.value : 'all';
            const filterFloor = reserveFloor ? reserveFloor.value : 'all';

            const selectedDateObj = new Date(selectedDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (selectedDateObj < today) {
                alert("無法選擇過去的日期！");
                return;
            }

            const [startHour, startMinute] = startTime.split(":").map(Number);
            const [endHour, endMinute] = endTime.split(":").map(Number);
            const startDateTime = new Date(selectedDate);
            startDateTime.setHours(startHour, startMinute, 0, 0);
            const endDateTime = new Date(selectedDate);
            endDateTime.setHours(endHour, endMinute, 0, 0);

            if (startDateTime >= endDateTime) {
                alert("結束時間必須晚於開始時間！");
                return;
            }

            parkingTableBody.innerHTML = '<tr><td colspan="7">載入中...</td></tr>';

            let latitude = userLatitude;
            let longitude = userLongitude;
            try {
                const position = await new Promise((resolve, reject) => {
                    if (!navigator.geolocation) reject(new Error("Geolocation not supported by browser"));
                    navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000, maximumAge: 0 });
                });
                latitude = position.coords.latitude;
                longitude = position.coords.longitude;
                if (map) {
                    map.setCenter({ lat: latitude, lng: longitude });
                    map.markers.forEach(marker => {
                        if (marker.title === "您的位置") {
                            marker.position = { lat: latitude, lng: longitude };
                        }
                    });
                }
            } catch (error) {
                console.warn("Failed to retrieve location, using previous:", error.message);
                alert("無法獲取您的位置，將使用先前設定的位置。請確認已允許定位權限。");
                if (map) map.setCenter({ lat: latitude, lng: longitude });
            }

            const startDateTimeStr = startDateTime.toISOString();
            const endDateTimeStr = endDateTime.toISOString();

            let retries = 3, spots = null;
            while (retries > 0) {
                try {
                    const token = getToken();
                    if (!token) throw new Error("認證令牌缺失，請重新登入！");

                    const queryParams = new URLSearchParams({
                        date: selectedDate,
                        start_date: selectedDate,
                        end_date: selectedDate,
                        start_time: startDateTimeStr,
                        end_time: endDateTimeStr,
                        latitude,
                        longitude
                    });
                    const response = await fetch(`${API_URL}/parking/available?${queryParams.toString()}`, {
                        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }
                    });
                    if (!response.ok) {
                        if (response.status === 401) throw new Error("認證失敗，請重新登入！");
                        const errorData = await response.json();
                        throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorData.error || '未知錯誤'}`);
                    }

                    const data = await response.json();
                    spots = data.data || data.spots || data;
                    if (!Array.isArray(spots)) throw new Error("後端返回的車位資料格式錯誤，應為陣列");
                    console.log("Fetched parking spots:", spots);
                    break;
                } catch (error) {
                    console.error(`Fetch attempt ${4 - retries}/3 failed:`, error);
                    retries--;
                    if (retries === 0) {
                        alert(`無法載入車位資料，請檢查後端服務 (錯誤: ${error.message})`);
                        parkingTableBody.innerHTML = '<tr><td colspan="7">無法載入車位資料</td></tr>';
                        if (error.message === "認證失敗，請重新登入！") {
                            removeToken();
                            showLoginPage(true);
                        }
                        return;
                    }
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }

            if (!spots || spots.length === 0) {
                parkingTableBody.innerHTML = '<tr><td colspan="7">無可用車位，請嘗試更改日期、時間或位置</td></tr>';
                reserveParkingMap.style.display = "none";
                return;
            }

            const spotDetailsPromises = spots.map(async (spot) => {
                try {
                    const spotResponse = await fetch(`${API_URL}/parking/${spot.spot_id}`, {
                        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${getToken()}` }
                    });
                    if (!spotResponse.ok) {
                        console.error(`Failed to fetch spot ${spot.spot_id} details: ${spotResponse.status}`);
                        return { spot, isDateAvailable: false, hasConflict: false };
                    }
                    const spotData = await spotResponse.json();
                    const parkingSpot = spotData.data || spotData.parking_spot || spotData;
                    const availableDays = parkingSpot.available_days || [];
                    const isDateAvailable = availableDays.some(day => day.date === selectedDate && day.is_available);

                    const existingRents = parkingSpot.rents || [];
                    const now = new Date();
                    const hasExpired = existingRents.every(rent => {
                        const rentEnd = new Date(rent.end_time);
                        return rentEnd < now;
                    });

                    const startTimeObj = new Date(startDateTimeStr);
                    const endTimeObj = new Date(endDateTimeStr);
                    const hasConflict = existingRents.some(rent => {
                        const rentStart = new Date(rent.start_time);
                        const rentEnd = new Date(rent.end_time);
                        return (startTimeObj < rentEnd && endTimeObj > rentStart) && !hasExpired;
                    });

                    if (hasExpired && (spot.status === "預約" || spot.status === "reserved")) {
                        await updateSpotStatus(spot.spot_id, "available");
                        spot.status = "available";
                    }

                    return { spot, isDateAvailable, hasConflict };
                } catch (error) {
                    console.error(`Error fetching spot ${spot.spot_id} details:`, error);
                    return { spot, isDateAvailable: false, hasConflict: false };
                }
            });

            const spotDetails = await Promise.all(spotDetailsPromises);

            const availableSpots = spotDetails.filter(({ isDateAvailable, hasConflict }) => isDateAvailable && !hasConflict).map(({ spot }) => spot);

            let filteredSpots = availableSpots.filter(spot => {
                let match = true;
                if (filterCity !== "all") match = match && spot.location === filterCity;
                if (filterType !== "all") match = match && spot.parking_type === filterType;
                if (filterFloor !== "all") match = match && spot.floor_level === filterFloor;
                return match;
            });

            if (filteredSpots.length === 0) {
                parkingTableBody.innerHTML = '<tr><td colspan="7">無符合條件的車位，請嘗試更改篩選條件</td></tr>';
                reserveParkingMap.style.display = "none";
                return;
            }

            reserveParkingMap.style.display = "block";

            if (map && map.markers) {
                map.markers.forEach(marker => marker.map = null);
                map.markers = [];
            }

            const bounds = new google.maps.LatLngBounds();
            filteredSpots.forEach(spot => {
                let latitude = spot.latitude;
                let longitude = spot.longitude;

                if (latitude && longitude && map) {
                    const position = { lat: parseFloat(latitude), lng: parseFloat(longitude) };
                    const markerElement = document.createElement("div");
                    markerElement.style.width = "20px";
                    markerElement.style.height = "20px";
                    markerElement.style.borderRadius = "50%";
                    markerElement.style.border = "2px solid white";
                    if (spot.status === "可用" || spot.status === "available") {
                        markerElement.style.backgroundColor = "green";
                    } else if (spot.status === "已佔用" || spot.status === "occupied") {
                        markerElement.style.backgroundColor = "red";
                    } else {
                        console.warn("Unrecognized status:", spot.status);
                        markerElement.style.backgroundColor = "gray";
                    }

                    const marker = new google.maps.marker.AdvancedMarkerElement({
                        position: position,
                        map: map,
                        content: markerElement,
                        title: `車位 ${spot.spot_id}`
                    });

                    marker.addListener("gmp-click", () => {
                        if (spot.status === "可用" || spot.status === "available") {
                            handleReserveParkingClick(spot.spot_id, selectedDate, selectedDate, startTime, endTime, null);
                            alert(`已嘗試預約車位 ${spot.spot_id}，請檢查表格更新。`);
                        } else {
                            alert(`車位 ${spot.spot_id} 當前不可用（狀態：${spot.status}）。`);
                        }
                    });

                    map.markers.push(marker);
                    bounds.extend(position);
                }
            });

            // Re-add user marker (default Google Maps marker style, consistent with setupAddParking)
            const userMarker = new google.maps.marker.AdvancedMarkerElement({
                position: { lat: latitude, lng: longitude },
                map: map,
                title: "您的位置"
            });
            map.markers.push(userMarker);

            if (map && !bounds.isEmpty()) {
                map.fitBounds(bounds);
                if (filteredSpots.length === 1) map.setZoom(14);
            } else if (map) {
                map.setCenter({ lat: latitude, lng: longitude });
                map.setZoom(14);
            }

            parkingTableBody.innerHTML = '';
            const fragment = document.createDocumentFragment();
            spotDetails.forEach(({ spot, isDateAvailable, hasConflict }) => {
                const isDisabled = !isDateAvailable || hasConflict || (spot.status !== "可用" && spot.status !== "available");

                const row = document.createElement("tr");
                row.setAttribute("data-id", spot.spot_id);
                row.classList.add(spot.status === "可用" || spot.status === "available" ? "available" : spot.status === "預約" || spot.status === "reserved" ? "reserved" : "occupied");

                const priceDisplay = spot.pricing_type === "hourly"
                    ? `${spot.price_per_half_hour || 0} 元/半小時`
                    : "不適用";

                row.innerHTML = `
                    <td>${spot.spot_id}</td>
                    <td>${spot.location || '未知'}</td>
                    <td>${spot.parking_type === "flat" ? "平面" : "機械"}</td>
                    <td>${spot.floor_level === "ground" ? "地面" : `地下${spot.floor_level.startsWith("B") ? spot.floor_level.slice(1) : spot.floor_level}樓`}</td>
                    <td>${spot.pricing_type === "hourly" ? "按小時" : "不適用"}</td>
                    <td>${priceDisplay}</td>
                    <td>
                        <button class="reserve-btn" ${isDisabled ? 'disabled' : ''}>預約</button>
                    </td>
                `;
                if (!isDisabled) {
                    row.querySelector(".reserve-btn").addEventListener("click", () => {
                        handleReserveParkingClick(spot.spot_id, selectedDate, selectedDate, startTime, endTime, row);
                        setParkingSpotId(spot.spot_id);
                    });
                }
                fragment.appendChild(row);
            });

            parkingTableBody.appendChild(fragment);
            parkingTableBody.classList.remove("visible");
            parkingTableBody.offsetHeight;
            parkingTableBody.classList.add("visible");
        }, 500);

        refreshIntervalId = setInterval(async () => {
            if (reserveSection.style.display === "none") {
                clearInterval(refreshIntervalId);
                refreshIntervalId = null;
                return;
            }
            await debouncedHandleReserveSearch();
            console.log("Parking spot status updated.");
        }, 60000);

        const newButton = reserveSearchButton.cloneNode(true);
        reserveSearchButton.parentNode.replaceChild(newButton, reserveSearchButton);
        newButton.addEventListener("click", debouncedHandleReserveSearch);
    }

    async function updateSpotStatus(spotId, status) {
        try {
            const token = getToken();
            if (!token) throw new Error("認證令牌缺失，請重新登入！");

            const response = await fetch(`${API_URL}/parking/${spotId}/status`, {
                method: 'PUT',
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({ status })
            });

            if (!response.ok) {
                throw new Error(`Failed to update spot ${spotId} status, code: ${response.status}`);
            }

            console.log(`Spot ${spotId} status updated to ${status}`);
        } catch (error) {
            console.error(`Failed to update spot ${spotId} status:`, error);
        }
    }

    async function handleReserveParkingClick(spotId, startDate, endDate, startTime, endTime, row) {
        if (!await checkAuth()) return;

        const role = getRole();
        if (role !== "renter") {
            alert("此功能僅限租用者使用！");
            return;
        }

        try {
            if (isNaN(spotId)) {
                alert("無效的車位 ID！");
                return;
            }

            const startDateTimeObj = new Date(`${startDate}T${startTime}:00`);
            const endDateTimeObj = new Date(`${endDate}T${endTime}:00`);
            const startDateTime = startDateTimeObj.toISOString();
            const endDateTime = endDateTimeObj.toISOString();

            const now = new Date(); // Current time: 2025-06-03 20:57 CST
            if (startDateTimeObj < now) {
                throw new Error(`開始時間必須晚於或等於當前時間 ${now.toLocaleDateString('zh-TW')} ${now.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}！`);
            }
            if (endDateTimeObj <= startDateTimeObj) {
                throw new Error(`結束時間必須晚於開始時間 ${startTime}！`);
            }

            const selectedDate = startDate;
            const token = getToken();

            const spotResponse = await fetch(`${API_URL}/parking/${spotId}`, {
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }
            });

            if (!spotResponse.ok) {
                throw new Error("無法獲取車位詳情，請稍後再試！");
            }

            const spotData = await spotResponse.json();
            const parkingSpot = spotData.data || spotData.parking_spot || spotData;
            const availableDays = parkingSpot.available_days || [];
            const isDateAvailable = availableDays.some(day => day.date === selectedDate && day.is_available);
            if (!isDateAvailable) {
                throw new Error(`車位 ${spotId} 在 ${selectedDate} 無可用位置，無法預約！`);
            }

            const existingRents = parkingSpot.rents || [];
            const startTimeObj = new Date(startDateTime);
            const endTimeObj = new Date(endDateTime);

            const hasConflict = existingRents.some(rent => {
                const rentStart = new Date(rent.start_time);
                const rentEnd = new Date(rent.end_time);
                return (startTimeObj < rentEnd && endTimeObj > rentStart);
            });

            if (hasConflict) {
                throw new Error(`車位 ${spotId} 在指定時間段（${startTime} 至 ${endTime}）已被預約，請選擇其他時間！`);
            }

            const response = await fetch(`${API_URL}/rent/reserve`, {
                method: 'POST',
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({
                    spot_id: spotId,
                    start_time: startDateTime,
                    end_time: endDateTime
                })
            });

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error("預約端點未找到（404），請確認後端服務是否運行，或檢查 API 路徑是否正確");
                }
                if (response.status === 401) {
                    throw new Error("認證失敗，請重新登入！");
                }

                const contentType = response.headers.get('content-type');
                if (contentType?.includes('application/json')) {
                    const result = await response.json();
                    throw new Error(result.error || result.message || `預約失敗！（錯誤碼：${response.status}）`);
                } else {
                    const text = await response.text();
                    throw new Error(`後端返回非 JSON 響應：${text || '未知錯誤'}，請檢查伺服器配置`);
                }
            }

            const contentType = response.headers.get('content-type');
            if (!contentType?.includes('application/json')) {
                const text = await response.text();
                throw new Error(`後端返回非 JSON 響應：${text || '未知錯誤'}，請檢查伺服器配置`);
            }

            const result = await response.json();
            console.log("Backend response:", result);

            if (result.status === false) {
                throw new Error(result.message || "預約失敗，後端未提供具體錯誤訊息");
            }

            if (row) {
                row.classList.remove("available");
                row.classList.add("reserved");
                const reserveBtn = row.querySelector(".reserve-btn");
                reserveBtn.disabled = true;
                reserveBtn.style.display = "none";
                row.querySelector("td:nth-child(6)").textContent = "已預約";
            }

            if (window.map && window.map.markers) {
                window.map.markers.forEach(marker => {
                    const markerElement = marker.content;
                    if (markerElement && marker.title.includes(`車位 ${spotId}`)) {
                        markerElement.style.backgroundColor = "blue";
                    }
                });
            }

            addToHistory(`預約車位 ${spotId} 於 ${startDateTime} 至 ${endDateTime}`);
            alert(`車位 ${spotId} 已成功預約！`);
        } catch (error) {
            console.error("Reservation failed:", error);
            alert(error.message || "伺服器錯誤，請稍後再試！");
            if (error.message === "認證失敗，請重新登入！") {
                removeToken();
                showLoginPage(true);
            }
        }
    }

    // 設置收入查詢
    function setupIncomeInquiry() {
        const role = getRole();
        console.log("Current role in setupIncomeInquiry:", role);
        if (!["admin"].includes(role)) {
            alert("此功能僅限管理員使用！");
            return;
        }

        const startDateInput = document.getElementById("startDate");
        const endDateInput = document.getElementById("endDate");
        const incomeSearchButton = document.getElementById("incomeSearchButton");
        const incomeTableBody = document.getElementById("incomeTableBody");
        const totalIncomeDisplay = document.getElementById("totalIncomeDisplay");

        if (!startDateInput || !endDateInput || !incomeSearchButton || !incomeTableBody || !totalIncomeDisplay) {
            console.error("Required DOM elements missing for income inquiry");
            alert("頁面元素載入失敗，請檢查 DOM 結構！");
            return;
        }

        // 動態設置預設結束日期
        const today = new Date(); // 2025-05-20 20:04 CST
        const todayStr = today.toISOString().split('T')[0]; // 2025-05-20

        // 僅設置預設結束日期為今天，startDate 由使用者自行選擇
        endDateInput.value = todayStr; // 2025-05-20
        endDateInput.min = "2025-01-01"; // 設置一個合理的最小日期，例如今年1月1日

        async function handleIncomeSearch() {
            const startDate = startDateInput.value; // 使用者選擇的日期，例如 2025-05-01
            const endDate = endDateInput.value;     // 例如 2025-05-20

            if (!startDate || !endDate) {
                alert("請選擇開始和結束日期！");
                return;
            }
            if (startDate > endDate) {
                alert("開始日期不能晚於結束日期！");
                return;
            }
            if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
                alert("日期格式不正確，請使用 YYYY-MM-DD 格式！");
                return;
            }

            incomeTableBody.innerHTML = '<tr><td colspan="5">載入中...</td></tr>';

            try {
                const token = getToken();
                if (!token) throw new Error("認證令牌缺失，請重新登入！");

                const memberId = getMemberId();
                if (!memberId) throw new Error("無法獲取會員 ID，請重新登入！");

                const queryParams = new URLSearchParams({
                    start_date: startDate, // 傳遞 YYYY-MM-DD 格式
                    end_date: endDate,     // 傳遞 YYYY-MM-DD 格式
                    member_id: memberId    // 根據會員 ID 查詢
                });

                const response = await fetch(`${API_URL}/parking/income?${queryParams.toString()}`, {
                    method: 'GET',
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    if (response.status === 401) throw new Error("認證失敗，請重新登入！");
                    const errorData = await response.json().catch(() => ({ error: '未知錯誤' }));
                    throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorData.error || '未知錯誤'}`);
                }

                const data = await response.json();
                const incomeData = data.data || {};

                if (!incomeData || typeof incomeData !== 'object') {
                    throw new Error("後端返回的收入資料格式錯誤");
                }

                incomeTableBody.innerHTML = '';
                const fragment = document.createDocumentFragment();

                const rents = incomeData.rents || [];
                const spots = incomeData.spots || [];
                const totalIncome = incomeData.total_income || 0;

                if (rents.length === 0) {
                    const row = document.createElement("tr");
                    row.innerHTML = `
                    <td colspan="5">無收入記錄</td>
                `;
                    fragment.appendChild(row);
                } else {
                    rents.forEach(rent => {
                        const spot = spots.find(s => s.spot_id === rent.spot_id) || {};
                        const location = spot.location || '未知';
                        const startTime = rent.start_time || 'N/A';
                        const endTime = rent.actual_end_time || 'N/A';
                        const cost = parseFloat(rent.total_cost) || 0;

                        const row = document.createElement("tr");
                        row.innerHTML = `
                        <td>${rent.spot_id}</td>
                        <td>${location}</td>
                        <td>${startTime}</td>
                        <td>${endTime}</td>
                        <td>${cost} 元</td>
                    `;
                        fragment.appendChild(row);
                    });
                }

                incomeTableBody.appendChild(fragment);
                totalIncomeDisplay.innerHTML = `<p>總收入：${totalIncome} 元</p>`;

            } catch (error) {
                console.error("Failed to fetch income data:", error);
                alert("無法載入收入資料，請稍後再試或聯繫管理員。錯誤訊息：" + error.message);
                incomeTableBody.innerHTML = '<tr><td colspan="5">無法載入收入資料</td></tr>';
                totalIncomeDisplay.innerHTML = '<p>總收入：0 元</p>';
                if (error.message === "認證失敗，請重新登入！") {
                    removeToken();
                    showLoginPage(true);
                }
            }
        }

        // 當用戶點選「收入查詢」時，動態更新 endDate 為當天日期
        const incomeInquiryLink = document.querySelector('.nav-link[data-target="incomeInquiry"]');
        if (incomeInquiryLink) {
            incomeInquiryLink.addEventListener('click', () => {
                const currentDate = new Date().toISOString().split('T')[0]; // 當前日期：2025-05-20
                endDateInput.value = currentDate; // 更新結束日期為今天
            });
        }

        incomeSearchButton.addEventListener("click", handleIncomeSearch);
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