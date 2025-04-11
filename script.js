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
    if (!emailInput || !passwordInput || !authForm) {
        console.error("Required DOM elements are missing: emailInput, passwordInput, or authForm");
        return;
    }

    // 檢查 token 是否存在並有效
    const token = localStorage.getItem("token");
    let isTokenValid = false;
    if (token) {
        try {
            const response = await fetch(`${API_URL}/members/validate-token`, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });
            if (response.ok) {
                console.log("User is logged in with valid token:", token);
                isTokenValid = true;
                authContainer.style.display = "none";
                parkingContainer.style.display = "block";
            } else {
                console.log("Token is invalid or expired");
                localStorage.removeItem("token");
            }
        } catch (error) {
            console.error("Token validation failed:", error);
            localStorage.removeItem("token");
        }
    }

    if (!isTokenValid) {
        console.log("No valid token found, showing login form");
        authContainer.style.display = "block";
        parkingContainer.style.display = "none";
    }

    let isLogin = true;
    let sharedMap, rentMap, sharedMarkers = [], rentMarkers = [];
    const API_URL = '/api/v1'; // 後端 URL

    // 顯示錯誤訊息
    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.classList.remove("success");
    }

    // 顯示成功訊息
    function showSuccess(message) {
        errorMessage.textContent = message;
        errorMessage.classList.add("success");
    }

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

        if (!password) {
            showError("密碼不能為空！");
            return;
        }

        if (isLogin) {
            try {
                const response = await fetch(`${API_URL}/members/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                const result = await response.json();
                if (response.ok) {
                    localStorage.setItem("token", result.token);
                    alert("登入成功！");
                    authContainer.style.display = "none";
                    parkingContainer.style.display = "block";
                } else {
                    showError(result.error || "電子郵件或密碼錯誤！");
                }
            } catch (error) {
                console.error("Login failed:", error);
                showError("無法連接到伺服器，請檢查網路或後端服務");
            }
        } else {
            const name = nameInput.value.trim();
            const phone = phoneInput.value.trim();
            const role = roleInput.value;
            const payment_method = paymentMethodInput.value;
            let payment_info = cardNumberInput.value.trim();

            if (!name || !phone || !role || !payment_method) {
                showError("請填寫所有必填欄位！");
                return;
            }

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
                const result = await response.json();
                if (response.ok) {
                    localStorage.setItem("token", result.token);
                    alert("註冊成功！請使用此帳號登入。");
                    isLogin = true;
                    formTitle.textContent = "登入";
                    submitButton.textContent = "登入";
                    toggleMessage.innerHTML = '還沒有帳號？<a href="#" id="toggleLink">註冊</a>';
                    toggleFormFields();
                } else {
                    console.log("Register failed:", response.status, result);
                    showError(result.error || `註冊失敗！（錯誤碼：${response.status}）`);
                }
            } catch (error) {
                console.error("Register failed:", error);
                showError("無法連接到伺服器，請檢查網路或後端服務");
            }
        }
    });

    // 登出功能
    logoutButton.addEventListener("click", function () {
        localStorage.removeItem("token");
        authContainer.style.display = "block";
        parkingContainer.style.display = "none";
        document.querySelectorAll(".content-section").forEach(section => {
            section.style.display = "none";
        });
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
            if (spot.lat && spot.lng) {
                const marker = L.marker([spot.lat, spot.lng]).addTo(map);
                marker.bindPopup(`編號: ${spot.id}<br>類型: ${spot.type === "flat" ? "平面" : "機械"}<br>樓層: ${spot.floor === "ground" ? "地面" : "地下" + spot.floor.slice(1) + "樓"}<br>計價: ${spot.pricing === "hourly" ? "按小時" : spot.pricing === "daily" ? "按日" : "按月"}<br><br>狀態: ${spot.status}`);
                markersArray.push(marker);
            } else {
                console.warn("Invalid spot data:", spot);
            }
        });

        setTimeout(() => map.invalidateSize(), 100);
        return map;
    }

    // 更新地圖
    async function updateMap(map, category, markersArray, filterType, filterFloor, filterPricing, filterStatus, searchQuery) {
        if (!map) {
            console.error("Map object is not initialized");
            return;
        }
        markersArray.forEach(marker => marker.remove());
        markersArray.length = 0;

        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`${API_URL}/parking/${category}`, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            const spots = await response.json();
            console.log(`Fetched spots for ${category}:`, spots);

            let filteredSpots = spots;
            if (filterType !== "all") filteredSpots = filteredSpots.filter(spot => spot.type === filterType);
            if (filterFloor !== "all") filteredSpots = filteredSpots.filter(spot => spot.floor === filterFloor);
            if (filterPricing !== "all") filteredSpots = filteredSpots.filter(spot => spot.pricing === filterPricing);
            if (filterStatus !== "all") {
                filteredSpots = filteredSpots.filter(spot =>
                    filterStatus === "available" ? spot.status === "可用" :
                    filterStatus === "occupied" ? (spot.status === "已佔用" || spot.status === "預約") : true
                );
            }
            if (searchQuery) {
                filteredSpots = filteredSpots.filter(spot =>
                    spot.id.toString().toLowerCase().includes(searchQuery.toLowerCase()) ||
                    spot.status.toLowerCase().includes(searchQuery.toLowerCase())
                );
            }

            filteredSpots.forEach(spot => {
                if (spot.lat && spot.lng) {
                    const marker = L.marker([spot.lat, spot.lng]).addTo(map);
                    marker.bindPopup(`編號: ${spot.id}<br>類型: ${spot.type === "flat" ? "平面" : "機械"}<br>樓層: ${spot.floor === "ground" ? "地面" : "地下" + spot.floor.slice(1) + "樓"}<br>計價: ${spot.pricing === "hourly" ? "按小時" : spot.pricing === "daily" ? "按日" : "按月"}<br><br>狀態: ${spot.status}`);
                    markersArray.push(marker);
                }
            });
            map.invalidateSize();
        } catch (error) {
            console.error(`Failed to fetch parking spots for ${category}:`, error);
            alert("無法載入車位資料，請檢查後端服務是否運行");
        }
    }

    // 導航切換
    const navLinks = document.querySelectorAll(".nav-link");

    navLinks.forEach(link => {
        link.addEventListener("click", async function (event) {
            event.preventDefault();
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

            if (targetId === "sharedParking") {
                if (!sharedMap) {
                    try {
                        const token = localStorage.getItem("token");
                        const spots = await fetch(`${API_URL}/parking/shared`, {
                            headers: { "Authorization": `Bearer ${token}` }
                        }).then(res => res.json());
                        sharedMap = initMap("sharedMap", spots, sharedMarkers);
                        if (sharedMap) sharedMap.invalidateSize();
                    } catch (error) {
                        console.error("Failed to initialize shared map:", error);
                    }
                } else {
                    sharedMap.invalidateSize();
                }
            } else if (targetId === "rentParking") {
                if (!rentMap) {
                    try {
                        const token = localStorage.getItem("token");
                        const spots = await fetch(`${API_URL}/parking/rent`, {
                            headers: { "Authorization": `Bearer ${token}` }
                        }).then(res => res.json());
                        rentMap = initMap("rentMap", spots, rentMarkers);
                        if (rentMap) rentMap.invalidateSize();
                    } catch (error) {
                        console.error("Failed to initialize rent map:", error);
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
        const searchInput = document.getElementById("sharedSearchInput");
        const searchButton = document.getElementById("sharedSearchButton");

        if (!filterType || !filterFloor || !filterPricing || !filterStatus || !searchInput || !searchButton) {
            console.error("One or more filter elements not found");
            return;
        }

        function applySharedFilters() {
            if (sharedMap) {
                updateMap(sharedMap, 'shared', sharedMarkers,
                    filterType.value, filterFloor.value, filterPricing.value, filterStatus.value, searchInput.value
                );
            }
        }

        filterType.addEventListener("change", applySharedFilters);
        filterFloor.addEventListener("change", applySharedFilters);
        filterPricing.addEventListener("change", applySharedFilters);
        filterStatus.addEventListener("change", applySharedFilters);
        searchButton.addEventListener("click", applySharedFilters);
    }

    // 設置租賃停車篩選
    function setupRentParkingFilters() {
        const filterType = document.getElementById("rentParkingType");
        const filterFloor = document.getElementById("rentFloor");
        const filterPricing = document.getElementById("rentPricing");
        const filterStatus = document.getElementById("rentStatus");
        const searchInput = document.getElementById("rentSearchInput");
        const searchButton = document.getElementById("rentSearchButton");

        if (!filterType || !filterFloor || !filterPricing || !filterStatus || !searchInput || !searchButton) {
            console.error("One or more filter elements not found");
            return;
        }

        function applyRentFilters() {
            if (rentMap) {
                updateMap(rentMap, 'rent', rentMarkers,
                    filterType.value, filterFloor.value, filterPricing.value, filterStatus.value, searchInput.value
                );
            }
        }

        filterType.addEventListener("change", applyRentFilters);
        filterFloor.addEventListener("change", applyRentFilters);
        filterPricing.addEventListener("change", applyRentFilters);
        filterStatus.addEventListener("change", applyRentFilters);
        searchButton.addEventListener("click", applyRentFilters);
    }

    // 設置查看停車
    function setupViewParking() {
        setTimeout(async () => {
            const parkingSpaces = document.querySelectorAll("#viewParking .parking-space");
            if (parkingSpaces.length === 0) console.warn("No parking spaces found in #viewParking");

            // 從後端獲取車位狀態
            try {
                const token = localStorage.getItem("token");
                const response = await fetch(`${API_URL}/parking/available`, {
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                });
                if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
                const spots = await response.json();
                console.log("Available spots for view:", spots);

                // 更新前端車位狀態
                parkingSpaces.forEach(space => {
                    const spotId = space.getAttribute("data-id");
                    const numericSpotId = parseInt(spotId.replace("v", ""), 10);
                    const spot = spots.find(s => s.id === spotId || s.id === numericSpotId);
                    if (spot) {
                        space.classList.remove("available", "occupied", "reserved");
                        if (spot.status === "可用" || spot.status === "available") {
                            space.classList.add("available");
                            space.querySelector("span").textContent = "可用";
                        } else if (spot.status === "已佔用" || spot.status === "occupied") {
                            space.classList.add("occupied");
                            space.querySelector("span").textContent = "已佔用";
                        } else if (spot.status === "預約" || spot.status === "reserved") {
                            space.classList.add("reserved");
                            space.querySelector("span").textContent = "預約";
                        }
                        space.setAttribute("aria-label", `車位 ${spotId}，狀態：${spot.status}`);
                    }
                });

                // 重新綁定點擊事件
                parkingSpaces.forEach(space => {
                    space.removeEventListener("click", handleViewParkingClick);
                    space.addEventListener("click", handleViewParkingClick);
                });
            } catch (error) {
                console.error("Failed to fetch available spots for view:", error);
                alert("無法載入車位狀態，請檢查後端服務");
            }
        }, 100);
    }

    // 查看車位狀態
    async function handleViewParkingClick(event) {
        const space = event.currentTarget;
        const spaceId = space.getAttribute("data-id");
        const numericSpaceId = parseInt(spaceId.replace("v", ""), 10);
        const token = localStorage.getItem("token");

        if (!token) {
            alert("請先登入！");
            return;
        }

        try {
            const response = await fetch(`${API_URL}/parking/${numericSpaceId}`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });
            const result = await response.json();
            if (response.ok) {
                alert(`車位 ${spaceId} 狀態：${result.status}`);
            } else {
                if (response.status === 401) {
                    alert("登入憑證已過期，請重新登入！");
                    localStorage.removeItem("token");
                    authContainer.style.display = "block";
                    parkingContainer.style.display = "none";
                } else {
                    showError(result.error || "無法獲取車位狀態！");
                }
            }
        } catch (error) {
            console.error("Failed to fetch parking space status:", error);
            showError("無法連接到伺服器，請檢查網路或後端服務");
        }
    }

    // 設置預約停車
    async function setupReserveParking() {
        setTimeout(async () => {
            const parkingSpaces = document.querySelectorAll("#reserveParking .parking-space");
            if (parkingSpaces.length === 0) console.warn("No parking spaces found in #reserveParking");

            // 顯示載入中狀態
            parkingSpaces.forEach(space => {
                space.classList.remove("available", "occupied", "reserved");
                space.classList.add("loading");
                space.querySelector("span").textContent = "載入中...";
                space.setAttribute("aria-label", `車位 ${space.getAttribute("data-id")}，狀態：載入中`);
            });

            // 嘗試從後端獲取車位狀態，最多重試 3 次
            let retries = 3;
            let spots = null;
            while (retries > 0) {
                try {
                    const token = localStorage.getItem("token");
                    const response = await fetch(`${API_URL}/parking/available`, {
                        headers: {
                            "Authorization": `Bearer ${token}`,
                            "Content-Type": "application/json",
                        },
                    });
                    if (!response.ok) {
                        if (response.status === 401) {
                            alert("登入憑證已過期，請重新登入！");
                            localStorage.removeItem("token");
                            authContainer.style.display = "block";
                            parkingContainer.style.display = "none";
                            return;
                        }
                        throw new Error(`HTTP error! Status: ${response.status}`);
                    }
                    spots = await response.json();
                    console.log("Available spots for reserve:", spots);
                    break; // 成功獲取資料，跳出重試迴圈
                } catch (error) {
                    console.error(`Failed to fetch available spots (attempt ${4 - retries}/3):`, error);
                    retries--;
                    if (retries === 0) {
                        // 重試失敗，顯示錯誤訊息
                        alert(`無法載入車位狀態，請檢查後端服務 (錯誤: ${error.message})`);
                        parkingSpaces.forEach(space => {
                            space.classList.remove("available", "occupied", "reserved", "loading");
                            space.classList.add("unavailable");
                            space.querySelector("span").textContent = "服務不可用";
                            space.setAttribute("aria-label", `車位 ${space.getAttribute("data-id")}，狀態：服務不可用`);
                        });
                        return;
                    }
                    // 等待 1 秒後重試
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }

            // 更新前端車位狀態
            parkingSpaces.forEach(space => {
                const spotId = space.getAttribute("data-id");
                const numericSpotId = parseInt(spotId.replace("v", ""), 10);
                const spot = spots.find(s => s.id === numericSpotId);

                // 先移除所有狀態類別
                space.classList.remove("available", "occupied", "reserved", "loading", "unavailable");

                if (spot) {
                    // 映射後端返回的 status 值
                    let displayStatus = spot.status;
                    if (spot.status === "可用" || spot.status === "available") {
                        space.classList.add("available");
                        space.querySelector("span").textContent = "可用";
                        displayStatus = "可用";
                    } else if (spot.status === "已佔用" || spot.status === "occupied") {
                        space.classList.add("occupied");
                        space.querySelector("span").textContent = "已佔用";
                        displayStatus = "已佔用";
                    } else if (spot.status === "預約" || spot.status === "reserved") {
                        space.classList.add("reserved");
                        space.querySelector("span").textContent = "預約";
                        displayStatus = "預約";
                    } else {
                        // 如果後端返回未知狀態，設為已佔用
                        space.classList.add("occupied");
                        space.querySelector("span").textContent = "已佔用";
                        displayStatus = "已佔用";
                    }
                    space.setAttribute("aria-label", `車位 ${spotId}，狀態：${displayStatus}`);
                } else {
                    // 如果後端沒有該車位資料，設為不可用
                    space.classList.add("occupied");
                    space.querySelector("span").textContent = "已佔用";
                    space.setAttribute("aria-label", `車位 ${spotId}，狀態：不可用`);
                }
            });

            // 重新綁定點擊事件
            parkingSpaces.forEach(space => {
                space.removeEventListener("click", handleReserveParkingClick);
                space.addEventListener("click", handleReserveParkingClick);
            });
        }, 100);
    }

    // 預約停車點擊處理
    async function handleReserveParkingClick(event) {
        const space = event.currentTarget;
        const spotId = space.getAttribute("data-id");
        const numericSpotId = parseInt(spotId.replace("v", ""), 10);
        const token = localStorage.getItem("token");

        if (!token) {
            alert("請先登入！");
            return;
        }

        // 檢查車位是否為可用狀態
        if (!space.classList.contains("available")) {
            alert("此車位不可預約！");
            return;
        }

        try {
            if (isNaN(numericSpotId)) {
                alert("無效的車位 ID！");
                return;
            }

            const response = await fetch(`${API_URL}/rent`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ parking_spot_id: numericSpotId }),
            });
            const result = await response.json();
            console.log("Reserve response:", response.status, result);
            if (response.ok) {
                space.classList.remove("available");
                space.classList.add("reserved");
                space.querySelector("span").textContent = "預約";
                addToHistory(`預約車位 ${spotId}`);
                alert(`車位 ${spotId} 已成功預約！`);
                // 重新載入車位狀態
                setupReserveParking();
            } else {
                if (response.status === 401) {
                    alert("登入憑證已過期，請重新登入！");
                    localStorage.removeItem("token");
                    authContainer.style.display = "block";
                    parkingContainer.style.display = "none";
                } else {
                    const errorMessage = result.error || `預約失敗！（錯誤碼：${response.status}）`;
                    alert(errorMessage);
                }
            }
        } catch (error) {
            console.error("Reserve failed:", error);
            alert("伺服器錯誤，請稍後再試！");
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
        const token = localStorage.getItem("token");
        if (!token) {
            alert("請先登入！");
            return;
        }

        try {
            const response = await fetch(`${API_URL}/rent`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (!response.ok) {
                if (response.status === 401) {
                    alert("登入憑證已過期，請重新登入！");
                    localStorage.removeItem("token");
                    authContainer.style.display = "block";
                    parkingContainer.style.display = "none";
                    return;
                }
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const data = await response.json();
            historyList.innerHTML = "";
            data.forEach(record => {
                const listItem = document.createElement("li");
                listItem.textContent = `${record.action} - ${record.timestamp}`;
                historyList.appendChild(listItem);
            });
        } catch (error) {
            console.error("Failed to load history:", error);
            alert("無法載入歷史紀錄，請檢查後端服務");
        }
    }

    setupSharedParkingFilters();
    setupRentParkingFilters();
});