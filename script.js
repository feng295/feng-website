console.log("script.js loaded");

// 確認 Leaflet 是否載入
if (typeof L === 'undefined') {
    console.error("Leaflet library not loaded. Please check the script inclusion in index.html.");
}

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
    const paymentMethodInput = document.getElementById("payment_method");
    const cardNumberContainer = document.getElementById("cardNumberContainer");
    const cardNumberInput = document.getElementById("card_number");

    // 檢查必要的 DOM 元素是否存在
    if (!emailInput || !passwordInput || !authForm || !logoutButton || !historyList) {
        console.error("Required DOM elements are missing: emailInput, passwordInput, authForm, logoutButton, or historyList");
        return;
    }

    let isLogin = true;
    let sharedMap, rentMap, sharedMarkers = [], rentMarkers = [];
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
        } catch (error) {
            console.error("Failed to remove token from localStorage:", error);
        }
    }

    // 顯示主畫面
    function showMainPage() {
        authContainer.style.display = "none";
        parkingContainer.style.display = "block";
        document.querySelector(".function-list").style.display = "block";
        document.querySelector(".content-container").style.display = "block";
        logoutButton.style.display = "block";

        // 初始化主頁面內容
        const activeSection = document.querySelector(".content-section[style='display: block;']");
        if (activeSection) {
            if (activeSection.id === "reserveParking") {
                setupReserveParking();
            } else if (activeSection.id === "history") {
                loadHistory();
            }
        }
    }

    // 顯示登入畫面
    function showLoginPage(sessionExpired = false) {
        if (sessionExpired) {
            alert("您的登入已過期，正在為您跳轉到登入頁面...");
            setTimeout(() => {
                authContainer.style.display = "block";
                parkingContainer.style.display = "none";
                document.querySelectorAll(".content-section").forEach(section => {
                    section.style.display = "none";
                });
                document.querySelector(".function-list").style.display = "none";
                document.querySelector(".content-container").style.display = "none";
                logoutButton.style.display = "none";

                // 清理地圖
                if (sharedMap) {
                    sharedMap.remove();
                    sharedMap = null;
                    sharedMarkers = [];
                }
                if (rentMap) {
                    rentMap.remove();
                    rentMap = null;
                    rentMarkers = [];
                }
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

            // 清理地圖
            if (sharedMap) {
                sharedMap.remove();
                sharedMap = null;
                sharedMarkers = [];
            }
            if (rentMap) {
                rentMap.remove();
                rentMap = null;
                rentMarkers = [];
            }
        }
    }

    // 檢查是否已登入（檢查 token 是否存在）
    async function checkAuth(silent = false) {
        const token = getToken();
        if (!token || token.trim() === "") {
            if (!silent) {
                alert("請先登入！");
            }
            showLoginPage();
            return false;
        }
        return true;
    }

    // 初始化時檢查是否已登入（靜默模式）
    (async () => {
        const isAuthenticated = await checkAuth(true); // 靜默檢查
        if (isAuthenticated) {
            showMainPage();
        } else {
            showLoginPage();
        }
    })();

    // 當付款方式改變時，顯示或隱藏信用卡號輸入框
    paymentMethodInput.addEventListener("change", function () {
        if (paymentMethodInput.value === "credit_card") {
            cardNumberContainer.style.display = "block";
        } else {
            cardNumberContainer.style.display = "none";
            cardNumberInput.value = "";
        }
    });

    // 電話號碼輸入驗證（只允許數字）
    phoneInput.addEventListener("input", function (event) {
        let value = phoneInput.value.replace(/\D/g, "");
        phoneInput.value = value;
        const phoneRegex = /^[0-9]{10}$/;
        if (phoneRegex.test(value)) {
            showSuccess("電話號碼格式正確");
        } else {
            showError("請提供有效的電話號碼（10位數字）");
        }
    });

    // 信用卡號輸入格式化（自動加上 "-"）
    cardNumberInput.addEventListener("input", function (event) {
        let value = cardNumberInput.value.replace(/\D/g, "");
        value = value.replace(/(\d{4})(?=\d)/g, "$1-");
        cardNumberInput.value = value;
    });

    // 即時密碼驗證
    passwordInput.addEventListener("input", function () {
        const password = this.value.trim();
        const hasLetter = /[a-zA-Z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const isLongEnough = password.length >= 8;
        if (hasLetter && hasNumber && isLongEnough) {
            showSuccess("密碼格式正確");
        } else {
            showError("密碼必須至少8個字符，包含字母和數字");
        }
    });

    // 動態隱藏註冊專用欄位
    function toggleFormFields() {
        if (isLogin) {
            nameInput.parentElement.style.display = "none";
            phoneInput.parentElement.style.display = "none";
            roleInput.parentElement.style.display = "none";
            paymentMethodInput.parentElement.style.display = "none";
            cardNumberContainer.style.display = "none";

            nameInput.removeAttribute("required");
            phoneInput.removeAttribute("required");
            roleInput.removeAttribute("required");
            paymentMethodInput.removeAttribute("required");
            cardNumberInput.removeAttribute("required");

            emailInput.setAttribute("required", "true");
            passwordInput.setAttribute("required", "true");
        } else {
            nameInput.parentElement.style.display = "block";
            phoneInput.parentElement.style.display = "block";
            roleInput.parentElement.style.display = "block";
            paymentMethodInput.parentElement.style.display = "block";
            if (paymentMethodInput.value === "credit_card") {
                cardNumberContainer.style.display = "block";
            }
            emailInput.setAttribute("required", "true");
            passwordInput.setAttribute("required", "true");
            nameInput.setAttribute("required", "true");
            phoneInput.setAttribute("required", "true");
            roleInput.setAttribute("required", "true");
            paymentMethodInput.setAttribute("required", "true");
            if (paymentMethodInput.value === "credit_card") {
                cardNumberInput.setAttribute("required", "true");
            }
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

        // 清除即時驗證訊息
        errorMessage.textContent = "";

        if (!email || !password) {
            showError("電子郵件和密碼不能為空！");
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
                if (response.ok) {
                    if (!result.data.token) {
                        showError("後端未返回 token，請檢查後端服務！");
                        return;
                    }
                    setToken(result.data.token);
                    console.log("Login successful, token stored");
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
            const role = roleInput.value;
            const payment_method = paymentMethodInput.value;
            let payment_info = cardNumberInput.value.trim();

            const errors = [];
            if (!name) errors.push("請填寫姓名");
            if (!phone) errors.push("請填寫電話號碼");
            if (!role) errors.push("請選擇身份");
            if (!payment_method) errors.push("請選擇付款方式");

            const phoneRegex = /^[0-9]{10}$/;
            if (!phoneRegex.test(phone)) {
                errors.push("請提供有效的電話號碼（10位數字）");
            }

            const cleanedPassword = password.replace(/[^\x20-\x7E]/g, "");
            console.log("Password after cleanup:", cleanedPassword);

            const hasLetter = /[a-zA-Z]/.test(cleanedPassword);
            const hasNumber = /[0-9]/.test(cleanedPassword);
            const isLongEnough = cleanedPassword.length >= 8;
            if (!hasLetter || !hasNumber || !isLongEnough) {
                errors.push("密碼必須至少8個字符，包含字母和數字");
            }

            if (payment_method === "credit_card" && !payment_info) {
                errors.push("請輸入信用卡號");
            }

            if (errors.length > 0) {
                showError(errors.join("；"));
                return;
            }

            try {
                const response = await fetch(`${API_URL}/members/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, password: cleanedPassword, phone, role, payment_method, payment_info })
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

    // 地圖初始化
    function initMap(mapId, spots, markersArray) {
        const mapElement = document.getElementById(mapId);
        if (!mapElement) {
            console.error(`Map container "${mapId}" not found in DOM`);
            return null;
        }
        console.log("Initializing map for " + mapId);
        const map = L.map(mapId).setView([25.0330, 121.5654], 15);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(map);

        if (!Array.isArray(spots)) {
            console.error("Spots data is not an array:", spots);
            return map;
        }

        spots.forEach(spot => {
            if (spot.latitude && spot.longitude) {
                const marker = L.marker([spot.latitude, spot.longitude]).addTo(map);
                marker.bindPopup(`編號: ${spot.spot_id}<br>縣市: ${spot.location || '未知'}<br>類型: ${spot.parking_type === "flat" ? "平面" : "機械"}<br>樓層: ${spot.floor_level === "ground" ? "地面" : "地下" + (spot.floor_level.startsWith("B") ? spot.floor_level.slice(1) : spot.floor_level) + "樓"}<br>計價: ${spot.pricing_type === "hourly" ? "按小時" : spot.pricing_type === "daily" ? "按日" : "按月"}<br><br>狀態: ${spot.status}`);
                markersArray.push(marker);
            } else {
                console.warn("Invalid spot data:", spot);
            }
        });

        setTimeout(() => map.invalidateSize(), 100);
        return map;
    }

    // 更新地圖
    async function updateMap(map, markersArray, filterType, filterFloor, filterPricing, filterStatus, filterCity, searchQuery, date) {
        if (!map) {
            console.error("Map object is not initialized");
            return;
        }

        if (!await checkAuth()) return;

        markersArray.forEach(marker => marker.remove());
        markersArray.length = 0;

        try {
            const token = getToken();
            if (!token) {
                throw new Error("認證令牌缺失，請重新登入！");
            }

            const response = await fetch(`${API_URL}/parking/available?date=${encodeURIComponent(date)}`, {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
            });
            console.log(`Map update fetch response status: ${response.status}`);
            if (!response.headers.get('content-type')?.includes('application/json')) {
                throw new Error("後端返回非 JSON 響應，請檢查伺服器配置");
            }
            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error("認證失敗，請重新登入！");
                }
                const errorData = await response.json();
                throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorData.error || '未知錯誤'}`);
            }
            const data = await response.json();
            console.log(`Fetched spots for date ${date}:`, data);

            let spots = data;
            if (!Array.isArray(spots) && data.data && Array.isArray(data.data)) {
                spots = data.data;
            }

            if (!Array.isArray(spots)) {
                console.error("Spots data format is invalid:", spots);
                throw new Error("後端返回的車位資料格式錯誤，應為陣列");
            }

            let filteredSpots = spots;
            if (filterType && filterType !== "all") filteredSpots = filteredSpots.filter(spot => spot.parking_type === filterType);
            if (filterFloor && filterFloor !== "all") filteredSpots = filteredSpots.filter(spot => spot.floor_level === filterFloor);
            if (filterPricing && filterPricing !== "all") filteredSpots = filteredSpots.filter(spot => spot.pricing_type === filterPricing);
            if (filterStatus && filterStatus !== "all") {
                filteredSpots = filteredSpots.filter(spot =>
                    filterStatus === "available" ? spot.status === "可用" :
                    filterStatus === "occupied" ? (spot.status === "已佔用" || spot.status === "預約") : true
                );
            }
            if (filterCity && filterCity !== "all") {
                filteredSpots = filteredSpots.filter(spot => spot.location === filterCity);
            }
            if (searchQuery) {
                filteredSpots = filteredSpots.filter(spot =>
                    spot.id.toString().toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (spot.location && spot.location.toLowerCase().includes(searchQuery.toLowerCase()))
                );
            }

            filteredSpots.forEach(spot => {
                if (spot.latitude && spot.longitude) {
                    const marker = L.marker([spot.latitude, spot.longitude]).addTo(map);
                    marker.bindPopup(`編號: ${spot.spot_id}<br>縣市: ${spot.location || '未知'}<br>類型: ${spot.parking_type === "flat" ? "平面" : "機械"}<br>樓層: ${spot.floor_level === "ground" ? "地面" : "地下" + (spot.floor_level.startsWith("B") ? spot.floor_level.slice(1) : spot.floor_level) + "樓"}<br>計價: ${spot.pricing_type === "hourly" ? "按小時" : spot.pricing_type === "daily" ? "按日" : "按月"}<br><br>狀態: ${spot.status}`);
                    markersArray.push(marker);
                }
            });
            map.invalidateSize();
        } catch (error) {
            console.error(`Failed to fetch parking spots for date ${date}:`, error);
            alert(`無法載入車位資料：${error.message || '請檢查後端服務是否運行'}`);
            if (error.message === "認證失敗，請重新登入！") {
                removeToken();
                showLoginPage(true);
            }
        }
    }

    // 導航切換
    const navLinks = document.querySelectorAll(".nav-link");
    navLinks.forEach(link => {
        link.addEventListener("click", async function (event) {
            event.preventDefault();

            if (!await checkAuth()) return;

            const targetId = this.getAttribute("data-target");
            document.querySelectorAll(".content-section").forEach(section => {
                section.style.display = "none";
            });
            const targetSection = document.getElementById(targetId);
            if (!targetSection) {
                console.error(`Target section "${targetId}" not found`);
                return;
            }
            targetSection.style.display = "block";

            const today = new Date().toISOString().split('T')[0];

            if (targetId === "sharedParking") {
                if (!sharedMap) {
                    try {
                        const token = getToken();
                        if (!token) {
                            throw new Error("認證令牌缺失，請重新登入！");
                        }

                        const url = `${API_URL}/parking/available?date=${encodeURIComponent(today)}`;
                        const response = await fetch(url, {
                            headers: {
                                "Content-Type": "application/json",
                                "Authorization": `Bearer ${token}`
                            }
                        });
                        console.log(`Shared parking fetch response status: ${response.status}`);
                        if (!response.headers.get('content-type')?.includes('application/json')) {
                            throw new Error("後端返回非 JSON 響應，請檢查伺服器配置");
                        }
                        if (!response.ok) {
                            if (response.status === 401) {
                                throw new Error("認證失敗，請重新登入！");
                            }
                            const result = await response.json();
                            throw new Error(`HTTP error! Status: ${response.status}, Message: ${result.error || '未知錯誤'}`);
                        }
                        const data = await response.json();
                        let spots = data;
                        if (!Array.isArray(spots) && data.data && Array.isArray(data.data)) {
                            spots = data.data;
                        }
                        if (!Array.isArray(spots)) {
                            throw new Error("後端返回的車位資料格式錯誤，應為陣列");
                        }
                        if (spots.length === 0) {
                            alert(`所選日期（${today}）目前沒有可用的共享車位！請選擇其他日期查看。`);
                            return;
                        }
                        sharedMap = initMap("sharedMap", spots, sharedMarkers);
                        if (sharedMap) sharedMap.invalidateSize();
                    } catch (error) {
                        console.error("Failed to initialize shared map:", error);
                        alert(`無法初始化共享車位地圖：${error.message}`);
                        if (error.message === "認證失敗，請重新登入！") {
                            removeToken();
                            showLoginPage(true);
                        }
                    }
                } else {
                    sharedMap.invalidateSize();
                }
            } else if (targetId === "rentParking") {
                if (!rentMap) {
                    try {
                        const token = getToken();
                        if (!token) {
                            throw new Error("認證令牌缺失，請重新登入！");
                        }

                        const url = `${API_URL}/parking/available?date=${encodeURIComponent(today)}`;
                        const response = await fetch(url, {
                            headers: {
                                "Content-Type": "application/json",
                                "Authorization": `Bearer ${token}`
                            }
                        });
                        console.log(`Rent parking fetch response status: ${response.status}`);
                        if (!response.headers.get('content-type')?.includes('application/json')) {
                            throw new Error("後端返回非 JSON 響應，請檢查伺服器配置");
                        }
                        if (!response.ok) {
                            if (response.status === 401) {
                                throw new Error("認證失敗，請重新登入！");
                            }
                            const result = await response.json();
                            throw new Error(`HTTP error! Status: ${response.status}, Message: ${result.error || '未知錯誤'}`);
                        }
                        const data = await response.json();
                        let spots = data;
                        if (!Array.isArray(spots) && data.data && Array.isArray(data.data)) {
                            spots = data.data;
                        }
                        if (!Array.isArray(spots)) {
                            throw new Error("後端返回的車位資料格式錯誤，應為陣列");
                        }
                        if (spots.length === 0) {
                            alert(`所選日期（${today}）目前沒有可用的租用車位！請選擇其他日期查看。`);
                            return;
                        }
                        rentMap = initMap("rentMap", spots, rentMarkers);
                        if (rentMap) rentMap.invalidateSize();
                    } catch (error) {
                        console.error("Failed to initialize rent map:", error);
                        alert(`無法初始化租用車位地圖：${error.message}`);
                        if (error.message === "認證失敗，請重新登入！") {
                            removeToken();
                            showLoginPage(true);
                        }
                    }
                } else {
                    rentMap.invalidateSize();
                }
            } else if (targetId === "viewParking") {
                setupViewParking();
            } else if (targetId === "reserveParking") {
                setupReserveParking();
            } else if (targetId === "history") {
                loadHistory();
            }
        });
    });

    // 設置共享停車篩選
    function setupSharedParkingFilters() {
        const filterType = document.getElementById("sharedParkingType");
        const filterFloor = document.getElementById("sharedFloor");
        const filterPricing = document.getElementById("sharedPricing");
        const filterStatus = document.getElementById("sharedStatus");
        const filterCity = document.getElementById("sharedCity");
        const searchInput = document.getElementById("sharedSearchInput");
        const searchButton = document.getElementById("sharedSearchButton");

        if (!filterType || !filterFloor || !filterPricing || !filterStatus || !filterCity || !searchInput || !searchButton) {
            console.error("One or more filter elements not found in sharedParking");
            return;
        }

        async function applySharedFilters() {
            if (sharedMap) {
                const date = new Date().toISOString().split('T')[0];
                console.log("Applying shared parking filters for date:", date);
                updateMap(sharedMap, sharedMarkers,
                    filterType.value,
                    filterFloor.value,
                    filterPricing.value,
                    filterStatus.value,
                    filterCity.value,
                    searchInput.value,
                    date
                );
            }
        }

        filterType.addEventListener("change", applySharedFilters);
        filterFloor.addEventListener("change", applySharedFilters);
        filterPricing.addEventListener("change", applySharedFilters);
        filterStatus.addEventListener("change", applySharedFilters);
        filterCity.addEventListener("change", applySharedFilters);
        searchButton.addEventListener("click", applySharedFilters);
        searchInput.addEventListener("keypress", function (event) {
            if (event.key === "Enter") {
                applySharedFilters();
            }
        });
    }

    // 設置租賃停車篩選
    function setupRentParkingFilters() {
        const filterType = document.getElementById("rentParkingType");
        const filterFloor = document.getElementById("rentFloor");
        const filterPricing = document.getElementById("rentPricing");
        const filterStatus = document.getElementById("rentStatus");
        const filterCity = document.getElementById("rentCity");
        const searchInput = document.getElementById("rentSearchInput");
        const searchButton = document.getElementById("rentSearchButton");

        if (!filterType || !filterFloor || !filterPricing || !filterStatus || !filterCity || !searchInput || !searchButton) {
            console.error("One or more filter elements not found in rentParking");
            return;
        }

        async function applyRentFilters() {
            if (rentMap) {
                const date = new Date().toISOString().split('T')[0];
                console.log("Applying rent parking filters for date:", date);
                updateMap(rentMap, rentMarkers,
                    filterType.value,
                    filterFloor.value,
                    filterPricing.value,
                    filterStatus.value,
                    filterCity.value,
                    searchInput.value,
                    date
                );
            }
        }

        filterType.addEventListener("change", applyRentFilters);
        filterFloor.addEventListener("change", applyRentFilters);
        filterPricing.addEventListener("change", applyRentFilters);
        filterStatus.addEventListener("change", applyRentFilters);
        filterCity.addEventListener("change", applyRentFilters);
        searchButton.addEventListener("click", applyRentFilters);
        searchInput.addEventListener("keypress", function (event) {
            if (event.key === "Enter") {
                applyRentFilters();
            }
        });
    }

    // 設置查看車位
    function setupViewParking() {
        const parkingSpaces = document.querySelectorAll("#viewParking .parking-space");
        if (parkingSpaces.length === 0) {
            console.warn("No parking spaces found in #viewParking");
            return;
        }

        parkingSpaces.forEach(space => {
            space.removeEventListener("click", handleViewParkingClick);
            space.addEventListener("click", handleViewParkingClick);
        });
    }

    // 查看車位狀態
    async function handleViewParkingClick(event) {
        if (!await checkAuth()) return;

        const space = event.currentTarget;
        const spaceId = space.getAttribute("data-id");
        const numericSpaceId = parseInt(spaceId.replace("v", ""), 10);

        if (isNaN(numericSpaceId)) {
            alert("無效的車位 ID！");
            return;
        }

        try {
            const token = getToken();
            if (!token) {
                throw new Error("認證令牌缺失，請重新登入！");
            }

            const response = await fetch(`${API_URL}/parking/${numericSpaceId}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
            });
            console.log(`View parking fetch response status: ${response.status}`);
            if (!response.headers.get('content-type')?.includes('application/json')) {
                throw new Error("後端返回非 JSON 響應，請檢查伺服器配置");
            }
            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error("認證失敗，請重新登入！");
                }
                const result = await response.json();
                if (response.status === 404) {
                    throw new Error("車位不存在，請確認車位 ID 是否正確！");
                }
                throw new Error(result.error || "無法獲取車位狀態！");
            }
            const result = await response.json();
            alert(`車位 ${spaceId} 狀態：${result.status}`);
        } catch (error) {
            console.error("Failed to fetch parking space status:", error);
            showError(error.message || "無法連接到伺服器，請檢查網路或後端服務");
            if (error.message === "認證失敗，請重新登入！") {
                removeToken();
                showLoginPage(true);
            }
        }
    }

    // 設置預約停車
    async function setupReserveParking() {
        if (!await checkAuth()) return;

        const parkingTableBody = document.getElementById("parkingTableBody");
        const reserveDateInput = document.getElementById("reserveDate");
        const reserveSearchButton = document.getElementById("reserveSearchButton");
        const reserveSearchInput = document.getElementById("reserveSearchInput");
        const reserveCity = document.getElementById("reserveCity");
        const reserveParkingType = document.getElementById("reserveParkingType");
        const reserveFloor = document.getElementById("reserveFloor");
        const reservePricing = document.getElementById("reservePricing");
        const reserveStatus = document.getElementById("reserveStatus");

        if (!parkingTableBody || !reserveDateInput || !reserveSearchButton) {
            console.warn("Required elements not found for reserveParking");
            return;
        }

        // 初始化表格和輸入框
        parkingTableBody.innerHTML = '<tr><td colspan="7">請選擇日期並點擊查詢以查看可用車位</td></tr>';
        reserveDateInput.value = '';
        if (reserveSearchInput) reserveSearchInput.value = '';
        if (reserveCity) reserveCity.value = 'all';
        if (reserveParkingType) reserveParkingType.value = 'all';
        if (reserveFloor) reserveFloor.value = 'all';
        if (reservePricing) reservePricing.value = 'all';
        if (reserveStatus) reserveStatus.value = 'all';

        reserveSearchButton.removeEventListener("click", handleReserveSearch);
        reserveSearchButton.addEventListener("click", handleReserveSearch);

        async function handleReserveSearch() {
            const selectedDate = reserveDateInput.value;
            const searchQuery = reserveSearchInput ? reserveSearchInput.value.trim().toLowerCase() : '';
            const filterCity = reserveCity ? reserveCity.value : 'all';
            const filterType = reserveParkingType ? reserveParkingType.value : 'all';
            const filterFloor = reserveFloor ? reserveFloor.value : 'all';
            const filterPricing = reservePricing ? reservePricing.value : 'all';
            const filterStatus = reserveStatus ? reserveStatus.value : 'all';

            if (!selectedDate) {
                alert("請選擇日期！");
                return;
            }

            const today = new Date().toISOString().split('T')[0];
            if (selectedDate < today) {
                alert("請選擇未來的日期！");
                return;
            }

            parkingTableBody.innerHTML = '<tr><td colspan="7">載入中...</td></tr>';

            let retries = 3;
            let spots = null;
            while (retries > 0) {
                try {
                    const token = getToken();
                    if (!token) {
                        throw new Error("認證令牌缺失，請重新登入！");
                    }

                    const response = await fetch(`${API_URL}/parking/available?date=${encodeURIComponent(selectedDate)}`, {
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${token}`
                        },
                    });
                    console.log(`Reserve parking fetch response status: ${response.status}`);
                    if (!response.headers.get('content-type')?.includes('application/json')) {
                        throw new Error("後端返回非 JSON 響應，請檢查伺服器配置");
                    }
                    if (!response.ok) {
                        if (response.status === 401) {
                            throw new Error("認證失敗，請重新登入！");
                        }
                        const errorData = await response.json();
                        throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorData.error || '未知錯誤'}`);
                    }
                    const data = await response.json();
                    console.log(`Available spots for reserve on ${selectedDate}:`, data);

                    if (data.error) {
                        throw new Error(data.error);
                    }
                    spots = data;
                    if (!Array.isArray(spots) && data.data && Array.isArray(data.data)) {
                        spots = data.data;
                    }

                    if (!Array.isArray(spots)) {
                        console.error("Spots data format is invalid:", spots);
                        throw new Error("後端返回的車位資料格式錯誤，應為陣列");
                    }
                    break;
                } catch (error) {
                    console.error(`Failed to fetch available spots (attempt ${4 - retries}/3):`, error);
                    retries--;
                    if (retries === 0) {
                        alert(`無法載入車位狀態，請檢查後端服務 (錯誤: ${error.message})`);
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

            let filteredSpots = spots;
            if (searchQuery) {
                filteredSpots = filteredSpots.filter(spot =>
                    spot.id.toString().toLowerCase().includes(searchQuery.replace(/^v/i, '')) ||
                    (spot.location && spot.location.toLowerCase().includes(searchQuery))
                );
            }
            if (filterCity && filterCity !== "all") {
                filteredSpots = filteredSpots.filter(spot => spot.location === filterCity);
            }
            if (filterType && filterType !== "all") {
                filteredSpots = filteredSpots.filter(spot => spot.parking_type === filterType);
            }
            if (filterFloor && filterFloor !== "all") {
                filteredSpots = filteredSpots.filter(spot => spot.floor_level === filterFloor);
            }
            if (filterPricing && filterPricing !== "all") {
                filteredSpots = filteredSpots.filter(spot => spot.pricing_type === filterPricing);
            }
            if (filterStatus && filterStatus !== "all") {
                filteredSpots = filteredSpots.filter(spot =>
                    filterStatus === "available" ? spot.status === "可用" :
                    filterStatus === "occupied" ? (spot.status === "已佔用" || spot.status === "預約") : true
                );
            }

            if (filteredSpots.length === 0) {
                console.warn("No parking spots match the filters");
                alert(`所選條件（日期：${selectedDate}）目前沒有符合的車位！請調整篩選條件。`);
                parkingTableBody.innerHTML = '<tr><td colspan="7">無符合條件的車位</td></tr>';
                return;
            }

            parkingTableBody.innerHTML = '';
            console.log("Generating parking table with filtered spots:", filteredSpots);
            filteredSpots.forEach(spot => {
                const row = document.createElement("tr");
                row.setAttribute("data-id", `v${spot.spot_id}`);
                row.classList.add(spot.status === "available" || spot.status === "可用" ? "available" : "occupied");

                const idCell = document.createElement("td");
                idCell.textContent = `v${spot.spot_id}`;
                row.appendChild(idCell);

                const locationCell = document.createElement("td");
                locationCell.textContent = spot.location || '未知';
                row.appendChild(locationCell);

                const typeCell = document.createElement("td");
                typeCell.textContent = spot.parking_type === "flat" ? "平面" : "機械";
                row.appendChild(typeCell);

                const floorCell = document.createElement("td");
                floorCell.textContent = spot.floor_level === "ground" ? "地面" : `地下${spot.floor_level.startsWith("B") ? spot.floor_level.slice(1) : spot.floor_level}樓`;
                row.appendChild(floorCell);

                const pricingCell = document.createElement("td");
                pricingCell.textContent = spot.pricing_type === "hourly" ? "按小時" : spot.pricing_type === "daily" ? "按日" : "按月";
                row.appendChild(pricingCell);

                const statusCell = document.createElement("td");
                statusCell.textContent = spot.status === "available" || spot.status === "可用" ? "可用" : spot.status === "occupied" || spot.status === "已佔用" ? "已佔用" : "預約";
                row.appendChild(statusCell);

                const actionCell = document.createElement("td");
                const reserveButton = document.createElement("button");
                reserveButton.textContent = "預約";
                reserveButton.disabled = !(spot.status === "available" || spot.status === "可用");
                actionCell.appendChild(reserveButton);
                row.appendChild(actionCell);

                reserveButton.addEventListener("click", () => handleReserveParkingClick(spot.id, selectedDate, row));
                parkingTableBody.appendChild(row);
            });
        }
    }

    // 預約停車點擊處理
    async function handleReserveParkingClick(spotId, selectedDate, row) {
        if (!await checkAuth()) return;

        try {
            if (isNaN(spotId)) {
                alert("無效的車位 ID！");
                return;
            }

            const token = getToken();
            const response = await fetch(`${API_URL}/rent`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ parking_spot_id: spotId, date: selectedDate }),
            });
            console.log(`Reserve parking response status: ${response.status}`);
            if (!response.headers.get('content-type')?.includes('application/json')) {
                throw new Error("後端返回非 JSON 響應，請檢查伺服器配置");
            }
            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error("認證失敗，請重新登入！");
                }
                const result = await response.json();
                throw new Error(result.error || `預約失敗！（錯誤碼：${response.status}）`);
            }
            const result = await response.json();
            row.classList.remove("available");
            row.classList.add("reserved");
            row.querySelector("button").disabled = true;
            row.querySelector("td:nth-child(6)").textContent = "預約";
            addToHistory(`預約車位 v${spotId} 於 ${selectedDate}`);
            alert(`車位 ${spotId} 已成功預約！`);
        } catch (error) {
            console.error("Reserve failed:", error);
            alert(error.message || "伺服器錯誤，請稍後再試！");
            if (error.message === "認證失敗，請重新登入！") {
                removeToken();
                showLoginPage(true);
            }
        }
    }

    // 添加歷史紀錄
    function addToHistory(action) {
        const now = new Date();
        const timestamp = now.toLocaleString("zh-TW", { hour12: false });
        const listItem = document.createElement("li");
        listItem.textContent = `${action} - ${timestamp}`;
        historyList.appendChild(listItem);
    }

    // 載入歷史紀錄
    async function loadHistory() {
        if (!await checkAuth()) return;
    
        try {
            const token = getToken();
            const response = await fetch(`${API_URL}/rent`, {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                }
            });
            console.log(`History fetch response status: ${response.status}`);
            if (!response.headers.get('content-type')?.includes('application/json')) {
                throw new Error("後端返回非 JSON 響應，請檢查伺服器配置");
            }
            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error("認證失敗，請重新登入！");
                }
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const responseData = await response.json();
            historyList.innerHTML = "";
    
            // 檢查回應是否為物件，且包含 data 欄位
            let data = responseData;
            if (!Array.isArray(responseData) && responseData.data && Array.isArray(responseData.data)) {
                data = responseData.data; // 提取 data 欄位
            }
    
            if (!Array.isArray(data)) {
                console.error("History data is not an array:", responseData);
                alert("歷史紀錄格式錯誤，請檢查後端服務");
                return;
            }
    
            if (data.length === 0) {
                historyList.innerHTML = "<li>目前沒有租賃記錄</li>";
                return;
            }
    
            data.forEach(record => {
                const listItem = document.createElement("li");
                const startTime = new Date(record.start_time).toLocaleString("zh-TW", { hour12: false });
                const action = `租用車位 ${record.spot.spot_id} (Rent ID: ${record.rent_id})`;
                const endTime = record.actual_end_time
                    ? new Date(record.actual_end_time).toLocaleString("zh-TW", { hour12: false })
                    : "尚未結束";
                listItem.textContent = `${action} - 開始時間: ${startTime}, 結束時間: ${endTime}, 費用: ${record.total_cost} 元`;
                historyList.appendChild(listItem);
            });
        } catch (error) {
            console.error("Failed to load history:", error);
            alert("無法載入歷史紀錄，請檢查後端服務");
            if (error.message === "認證失敗，請重新登入！") {
                removeToken();
                showLoginPage(true);
            }
        }
    }


    setupSharedParkingFilters();
    setupRentParkingFilters();
});