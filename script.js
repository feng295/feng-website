console.log("script.js loaded");

// 全局變量，用於標記 Google Maps API 是否已載入
window.isGoogleMapsLoaded = false;

// Google Maps API 載入完成後的回調函數
window.initMap = function () {
    console.log("Google Maps API loaded successfully");
    window.isGoogleMapsLoaded = true;
};

// 工具函數集合
const utils = {
    // 顯示錯誤訊息
    showError(message, element) {
        element.textContent = message;
        element.classList.remove("success");
        element.style.color = "red";
    },

    // 顯示成功訊息
    showSuccess(message, element) {
        element.textContent = message;
        element.classList.add("success");
        element.style.color = "green";
    },

    // 改進後的 fetch 函數，帶有認證和錯誤處理
    fetchWithAuth: async (url, options = {}) => {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("認證令牌缺失，請重新登入！");
        const headers = { ...options.headers, "Authorization": `Bearer ${token}`, "Content-Type": "application/json" };
        const response = await fetch(url, { ...options, headers });
        if (!response.ok) {
            const text = await response.text(); // 獲取原始回應
            console.error("API Error Response:", text);
            if (response.status === 401) throw new Error("認證失敗，請重新登入！");
            throw new Error(`HTTP error! Status: ${response.status}, Response: ${text}`);
        }
        return response.json();
    }
};

// 初始化地圖函數，增加錯誤處理和重試機制
async function initMap(containerId, defaultLat = 23.5654, defaultLng = 119.5863) {
    const mapContainer = document.getElementById(containerId);
    const maxAttempts = 20;
    let attempts = 0;

    while (!window.isGoogleMapsLoaded && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 500));
        attempts++;
    }

    if (!window.isGoogleMapsLoaded || !window.google || !google.maps) {
        utils.showError("Google Maps API 載入失敗，請檢查 API 金鑰或網路連線，並手動輸入經緯度。", mapContainer.nextElementSibling);
        console.error("Google Maps API failed to load. Check your API key or network.");
        mapContainer.style.display = "none";
        return null;
    }

    return new google.maps.Map(mapContainer, {
        center: { lat: defaultLat, lng: defaultLng },
        zoom: 15,
    });
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
    const renterFields = document.getElementById("renterFields");
    const licensePlateInput = document.getElementById("license_plate");
    const vehicleTypeInput = document.getElementById("vehicle_type");

    // 檢查必要的 DOM 元素是否存在
    if (!emailInput || !passwordInput || !authForm || !logoutButton || !historyList) {
        console.error("Required DOM elements are missing: emailInput, passwordInput, authForm, logoutButton, or historyList");
        return;
    }

    let isLogin = true;
    const API_URL = '/api/v1'; // 後端 URL

    // 顯示錯誤訊息
    function showError(message) {
        utils.showError(message, errorMessage);
    }

    // 顯示成功訊息
    function showSuccess(message) {
        utils.showSuccess(message, errorMessage);
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
            const validRoles = ["shared_owner", "renter", "admin"];
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

        const validRoles = ["shared_owner", "renter", "admin"];
        if (!role || !validRoles.includes(role)) {
            console.error(`Unrecognized role: "${role}". Expected one of: ${validRoles.join(", ")}. Redirecting to login.`);
            removeToken();
            showLoginPage();
            return;
        }

        const newPath = `/${role}`;
        history.pushState({ role }, '', newPath);
        console.log(`URL updated to: ${window.location.pathname}`);

        if (role === "shared_owner") pageTitle.textContent = "Shared Owner";
        else if (role === "renter") pageTitle.textContent = "Renter";
        else if (role === "admin") pageTitle.textContent = "Admin";

        const navList = document.querySelector(".function-list ul");
        if (!navList) {
            console.error("Navigation list (.function-list ul) not found");
            return;
        }

        if (role === "shared_owner") {
            navList.innerHTML = `
                <li><a href="#" class="nav-link" data-target="addParking">新增車位</a></li>
                <li><a href="#" class="nav-link" data-target="viewParking">查看車位</a></li>
                <li><a href="#" class="nav-link" data-target="incomeInquiry">收入查詢</a></li>
            `;
        } else if (role === "renter") {
            navList.innerHTML = `
                <li><a href="#" class="nav-link" data-target="viewParking">查看車位</a></li>
                <li><a href="#" class="nav-link" data-target="reserveParking">預約車位</a></li>
                <li><a href="#" class="nav-link" data-target="history">歷史紀錄</a></li>
            `;
        } else if (role === "admin") {
            navList.innerHTML = `
                <li><a href="#" class="nav-link" data-target="addParking">新增車位</a></li>
                <li><a href="#" class="nav-link" data-target="viewParking">查看車位</a></li>
                <li><a href="#" class="nav-link" data-target="viewAllUsers">查看所有用戶資料</a></li>
            `;
        }

        document.querySelectorAll(".content-section").forEach(section => {
            section.style.display = "none";
        });

        const defaultSectionId = role === "shared_owner" ? "viewParking" :
            role === "renter" ? "reserveParking" :
            role === "admin" ? "viewAllUsers" : "viewParking";
        const defaultSection = document.getElementById(defaultSectionId);

        if (!defaultSection) {
            console.error(`Default section "${defaultSectionId}" not found`);
            return;
        }

        defaultSection.style.display = "block";
        if (defaultSectionId === "viewParking") setupViewParking();
        else if (defaultSectionId === "reserveParking") setupReserveParking();
        else if (defaultSectionId === "viewAllUsers") setupViewAllUsers();
        else if (defaultSectionId === "incomeInquiry") setupIncomeInquiry();
        else if (defaultSectionId === "addParking") setupAddParking();
        else setupViewParking();

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
                if (targetId === "viewParking") setupViewParking();
                else if (targetId === "reserveParking") setupReserveParking();
                else if (targetId === "history") loadHistory();
                else if (targetId === "incomeInquiry") setupIncomeInquiry();
                else if (targetId === "viewAllUsers") setupViewAllUsers();
                else if (targetId === "addParking") setupAddParking();
            });
        });
    }

    // 新增車位功能
    function setupAddParking() {
        const role = getRole();
        console.log("Current role in setupAddParking:", role);
        if (!["shared_owner", "admin"].includes(role)) {
            alert("此功能僅限車位共享者和管理員使用！");
            return;
        }

        const addParkingSection = document.getElementById("addParking");
        if (!addParkingSection) {
            console.error("addParking section not found");
            return;
        }

        addParkingSection.style.display = "block";

        // 自動填充會員 ID
        const memberIdInput = document.getElementById("memberIdInput");
        const memberId = getMemberId();
        if (!memberId) {
            alert("無法獲取會員 ID，請重新登入！");
            showLoginPage();
            return;
        }
        memberIdInput.value = memberId;

        // 動態調整費用標籤（僅保留按小時）
        const pricingTypeSelect = document.getElementById("newPricingType");
        const priceLabel = document.getElementById("newPriceLabel");
        pricingTypeSelect.innerHTML = `<option value="hourly">按小時</option>`;
        priceLabel.textContent = "半小時費用（元）：";

        // 動態添加可用日期
        const availableDaysContainer = document.getElementById("availableDaysContainer");
        const addDateButton = document.getElementById("addDateButton");

        function addDateEntry(date = "", isAvailable = true) {
            const dateEntry = document.createElement("div");
            dateEntry.className = "date-entry";
            dateEntry.innerHTML = `
                <label>日期 (YYYY-MM-DD)：</label>
                <input type="date" class="available-date" value="${date}">
                <label>是否可用：</label>
                <input type="checkbox" class="available-status" ${isAvailable ? "checked" : ""}>
                <button type="button" class="remove-date">移除</button>
            `;
            availableDaysContainer.appendChild(dateEntry);

            dateEntry.querySelector(".remove-date").addEventListener("click", () => {
                dateEntry.remove();
            });
        }

        if (addDateButton) {
            addDateButton.addEventListener("click", () => addDateEntry());
        } else {
            console.warn("addDateButton not found");
        }

        // 檢查 Google Maps API 是否已載入
        const addParkingMap = document.getElementById("addParkingMap");
        const latitudeInput = document.getElementById("latitudeInput");
        const longitudeInput = document.getElementById("longitudeInput");

        if (!addParkingMap || !latitudeInput || !longitudeInput) {
            console.error("Required elements for map in addParking not found: addParkingMap, latitudeInput, or longitudeInput");
            alert("地圖容器或經緯度輸入框未找到，地圖功能將不可用。");
            return;
        }

        let map, marker;
        (async () => {
            map = await initMap("addParkingMap");
            if (!map) {
                latitudeInput.disabled = false;
                longitudeInput.disabled = false;
                latitudeInput.placeholder = "請手動輸入緯度";
                longitudeInput.placeholder = "請手動輸入經度";
                return;
            }

            // 顯示地圖並設置預設位置（澎湖縣）
            addParkingMap.style.display = "block";
            latitudeInput.value = 23.5654;
            longitudeInput.value = 119.5863;

            // 使用 AdvancedMarkerElement 替代 Marker
            marker = new google.maps.marker.AdvancedMarkerElement({
                position: { lat: 23.5654, lng: 119.5863 },
                map: map,
                title: "預設位置",
            });

            // 地圖點擊事件：更新經緯度和標記，並顯示資訊視窗
            map.addListener("click", (event) => {
                const lat = event.latLng.lat();
                const lng = event.latLng.lng();
                latitudeInput.value = lat.toFixed(6);
                longitudeInput.value = lng.toFixed(6);

                if (marker) {
                    marker.position = { lat, lng };
                } else {
                    marker = new google.maps.marker.AdvancedMarkerElement({
                        position: { lat, lng },
                        map: map,
                        title: "選定位置",
                    });
                }

                const infoWindow = new google.maps.InfoWindow({
                    content: `選定位置：<br>緯度：${lat.toFixed(6)}<br>經度：${lng.toFixed(6)}`,
                });
                infoWindow.open(map, marker);
            });
        })();

        const saveNewSpotButton = document.getElementById("saveNewSpotButton");
        if (saveNewSpotButton) {
            saveNewSpotButton.addEventListener("click", async () => {
                const newSpot = {
                    member_id: parseInt(memberIdInput.value),
                    location: document.getElementById("newLocation").value.trim(),
                    parking_type: document.getElementById("newParkingType").value,
                    floor_level: document.getElementById("newFloorLevel").value.trim(),
                    pricing_type: document.getElementById("newPricingType").value,
                };

                // 驗證必填字段
                if (!newSpot.member_id) {
                    alert("會員 ID 為必填項！");
                    return;
                }
                if (!newSpot.location) {
                    alert("地址為必填項！");
                    return;
                }
                if (newSpot.location.length > 50) {
                    alert("地址最多 50 個字符！");
                    return;
                }
                if (!["flat", "mechanical"].includes(newSpot.parking_type)) {
                    alert("停車類型必須為 'flat' 或 'mechanical'！");
                    return;
                }
                if (newSpot.floor_level && newSpot.floor_level.length > 20) {
                    alert("樓層最多 20 個字符！");
                    return;
                }
                if (newSpot.pricing_type !== "hourly") {
                    alert("計費方式必須為 'hourly'！");
                    return;
                }

                // 處理費用字段
                const priceInput = document.getElementById("newPrice").value;
                const price = priceInput ? parseFloat(priceInput) : 20.00;
                if (isNaN(price) || price < 0) {
                    alert("費用必須為正數！");
                    return;
                }
                newSpot.price_per_half_hour = price;

                const maxDailyPriceInput = document.getElementById("newMaxDailyPrice").value;
                const maxDailyPrice = maxDailyPriceInput ? parseFloat(maxDailyPriceInput) : 300.00;
                if (isNaN(maxDailyPrice) || maxDailyPrice < 0) {
                    alert("每日最高價格必須為正數！");
                    return;
                }
                newSpot.daily_max_price = maxDailyPrice;

                // 處理經緯度
                let latitude = parseFloat(latitudeInput.value) || 0.0;
                let longitude = parseFloat(longitudeInput.value) || 0.0;
                if (isNaN(latitude) || latitude < -90 || latitude > 90) {
                    console.warn(`Latitude ${latitude} out of range (-90 to 90), resetting to default 0.0`);
                    latitude = 0.0;
                }
                if (isNaN(longitude) || longitude < -180 || longitude > 180) {
                    console.warn(`Longitude ${longitude} out of range (-180 to 180), resetting to default 0.0`);
                    longitude = 0.0;
                }
                newSpot.latitude = latitude;
                newSpot.longitude = longitude;

                // 處理可用日期
                const dateEntries = availableDaysContainer.querySelectorAll(".date-entry");
                const availableDays = [];
                for (const entry of dateEntries) {
                    const date = entry.querySelector(".available-date").value;
                    const isAvailable = entry.querySelector(".available-status").checked;

                    if (!date) {
                        alert("請為每個可用日期選擇日期！");
                        return;
                    }
                    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
                        alert("日期格式不正確，請使用 YYYY-MM-DD 格式！");
                        return;
                    }

                    availableDays.push({ date, is_available: isAvailable });
                }
                if (availableDays.length > 0) {
                    newSpot.available_days = availableDays;
                }

                try {
                    const response = await utils.fetchWithAuth(`${API_URL}/parking/share`, {
                        method: 'POST',
                        body: JSON.stringify(newSpot)
                    });

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
        }

        const cancelAddButton = document.getElementById("cancelAddButton");
        if (cancelAddButton) {
            cancelAddButton.addEventListener("click", () => {
                addParkingSection.style.display = "none";
                const viewParkingSection = document.getElementById("viewParking");
                if (viewParkingSection) {
                    viewParkingSection.style.display = "block";
                    setupViewParking();
                }
            });
        }
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
            const validRoles = ["shared_owner", "renter", "admin"];
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
        const validRoles = ["shared_owner", "renter", "admin"];
        const pageTitle = document.getElementById("pageTitle");

        if (pathRole && validRoles.includes(pathRole) && pathRole === role) {
            if (pageTitle) {
                if (pathRole === "shared_owner") pageTitle.textContent = "Shared Owner";
                else if (pathRole === "renter") pageTitle.textContent = "Renter";
                else if (pathRole === "admin") pageTitle.textContent = "Admin";
            }
            showMainPage();
        } else {
            showLoginPage();
        }
    });

    // 當身份改變時，顯示或隱藏租用者專用欄位
    if (roleInput) {
        roleInput.addEventListener("change", function () {
            if (roleInput.value.toLowerCase() === "renter" && !isLogin) {
                renterFields.style.display = "block";
                licensePlateInput.setAttribute("required", "true");
                vehicleTypeInput.setAttribute("required", "true");
            } else {
                renterFields.style.display = "none";
                licensePlateInput.removeAttribute("required");
                vehicleTypeInput.removeAttribute("required");
                licensePlateInput.value = "";
                vehicleTypeInput.value = "";
            }
        });
    }

    // 當付款方式改變時，顯示或隱藏信用卡號輸入框
    if (paymentMethodInput) {
        paymentMethodInput.addEventListener("change", function () {
            if (paymentMethodInput.value === "credit_card") {
                cardNumberContainer.style.display = "block";
                if (!isLogin) cardNumberInput.setAttribute("required", "true");
            } else {
                cardNumberContainer.style.display = "none";
                cardNumberInput.removeAttribute("required");
                cardNumberInput.value = "";
            }
        });
    }

    // 電話號碼輸入驗證（只允許數字）
    if (phoneInput) {
        phoneInput.addEventListener("input", function () {
            let value = phoneInput.value.replace(/\D/g, "");
            phoneInput.value = value;
            const phoneRegex = /^[0-9]{10}$/;
            if (phoneRegex.test(value)) showSuccess("電話號碼格式正確");
            else showError("請提供有效的電話號碼（10位數字）");
        });
    }

    // 車牌號碼輸入驗證（格式如 AAA-1111）
    if (licensePlateInput) {
        licensePlateInput.addEventListener("input", function () {
            const licensePlate = this.value.trim();
            const licensePlateRegex = /^[A-Z]{2,3}-[0-9]{3,4}$/;
            if (licensePlateRegex.test(licensePlate)) showSuccess("車牌號碼格式正確");
            else showError("請輸入有效車牌號碼（格式如 AAA-1111）");
        });
    }

    // 信用卡號輸入格式化（自動加上 "-"）
    if (cardNumberInput) {
        cardNumberInput.addEventListener("input", function () {
            let value = cardNumberInput.value.replace(/\D/g, "");
            value = value.replace(/(\d{4})(?=\d)/g, "$1-");
            if (value.length > 19) value = value.slice(0, 19);
            cardNumberInput.value = value;
        });
    }

    // 即時密碼驗證
    if (passwordInput) {
        passwordInput.addEventListener("input", function () {
            const password = this.value.trim();
            const hasLetter = /[a-zA-Z]/.test(password);
            const hasNumber = /[0-9]/.test(password);
            const isLongEnough = password.length >= 8;
            if (hasLetter && hasNumber && isLongEnough) showSuccess("密碼格式正確");
            else showError("密碼必須至少8個字符，包含字母和數字");
        });
    }

    // 動態隱藏註冊專用欄位
    function toggleFormFields() {
        if (isLogin) {
            nameInput.parentElement.style.display = "none";
            phoneInput.parentElement.style.display = "none";
            roleInput.parentElement.style.display = "none";
            paymentMethodInput.parentElement.style.display = "none";
            cardNumberContainer.style.display = "none";
            renterFields.style.display = "none";

            nameInput.removeAttribute("required");
            phoneInput.removeAttribute("required");
            roleInput.removeAttribute("required");
            paymentMethodInput.removeAttribute("required");
            cardNumberInput.removeAttribute("required");
            licensePlateInput.removeAttribute("required");
            vehicleTypeInput.removeAttribute("required");

            emailInput.setAttribute("required", "true");
            passwordInput.setAttribute("required", "true");
        } else {
            nameInput.parentElement.style.display = "block";
            phoneInput.parentElement.style.display = "block";
            paymentMethodInput.parentElement.style.display = "block";
            roleInput.parentElement.style.display = "block";
            if (paymentMethodInput.value === "credit_card") cardNumberContainer.style.display = "block";
            if (roleInput.value.toLowerCase() === "renter") renterFields.style.display = "block";
            emailInput.setAttribute("required", "true");
            passwordInput.setAttribute("required", "true");
            nameInput.setAttribute("required", "true");
            phoneInput.setAttribute("required", "true");
            roleInput.setAttribute("required", "true");
            paymentMethodInput.setAttribute("required", "true");
            if (paymentMethodInput.value === "credit_card") cardNumberInput.setAttribute("required", "true");
            if (roleInput.value.toLowerCase() === "renter") {
                licensePlateInput.setAttribute("required", "true");
                vehicleTypeInput.setAttribute("required", "true");
            }
        }
    }

    // 初始化表單顯示
    toggleFormFields();

    // 切換登入/註冊
    if (toggleMessage) {
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
    }

    // 處理登入/註冊
    if (authForm) {
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
                const payment_method = paymentMethodInput.value;
                const license_plate = licensePlateInput.value.trim();

                if (!name) errors.push("姓名不能為空");
                if (!phone || !/^[0-9]{10}$/.test(phone)) errors.push("請提供有效的電話號碼（10 位數字）");
                if (!role) errors.push("請選擇身份");
                if (!payment_method) errors.push("請選擇付款方式");
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
                    if (!response.ok) throw new Error(`Login failed with status: ${response.status}`);
                    const result = await response.json();
                    if (result.data && result.data.token) {
                        setToken(result.data.token);
                        let memberId = result.data.member?.member_id || result.data.member_id || result.data.id || result.data.user_id || result.data.member?.id;
                        if (!memberId) throw new Error("後端未返回會員 ID");
                        localStorage.setItem("member_id", memberId.toString());

                        let role = result.data.member?.role || result.data.role || result.data.user?.role || result.data.user_role || result.role;
                        if (Array.isArray(result.data.roles) && result.data.roles.length > 0) role = result.data.roles[0];
                        if (!role) throw new Error("後端未返回角色資訊");
                        const validRoles = ["shared_owner", "renter", "admin"];
                        role = role.toLowerCase().trim();
                        if (!validRoles.includes(role)) throw new Error(`無效角色: ${role}`);
                        setRole(role);
                        alert("登入成功！");
                        showMainPage();
                    } else {
                        throw new Error("後端未返回 token");
                    }
                } catch (error) {
                    console.error("Login failed:", error);
                    showError(error.message || "無法連接到伺服器，請檢查網路或後端服務！");
                }
            } else {
                const name = nameInput.value.trim();
                const phone = phoneInput.value.trim();
                const role = roleInput.value.toLowerCase().trim();
                const payment_method = paymentMethodInput.value;
                let payment_info = cardNumberInput.value.trim();
                const license_plate = licensePlateInput.value.trim();
                const vehicle_type = vehicleTypeInput.value.trim();

                try {
                    const response = await fetch(`${API_URL}/members/register`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name, email, password, phone, role, payment_method, payment_info, license_plate, vehicle_type })
                    });
                    if (!response.ok) throw new Error(`Register failed with status: ${response.status}`);
                    await response.json();
                    alert("註冊成功！請使用此帳號登入。");
                    isLogin = true;
                    formTitle.textContent = "登入";
                    submitButton.textContent = "登入";
                    toggleMessage.innerHTML = '還沒有帳號？<a href="#" id="toggleLink">註冊</a>';
                    toggleFormFields();
                } catch (error) {
                    console.error("Register failed:", error);
                    showError(error.message || "無法連接到伺服器，請檢查網路或後端服務！");
                }
            }
        });
    }

    // 登出功能
    if (logoutButton) {
        logoutButton.addEventListener("click", function () {
            removeToken();
            showLoginPage();
        });
    }

    // 設置查看車位
    function setupViewParking() {
        const role = getRole();
        console.log("Current role in setupViewParking:", role);
        if (!["shared_owner", "renter", "admin"].includes(role)) {
            alert("您沒有權限訪問此功能！");
            return;
        }

        const parkingTableBody = document.getElementById("viewParkingTableBody");
        const specificSpotInput = document.getElementById("specificSpotInput");
        const specificSpotButton = document.getElementById("specificSpotButton");

        if (!parkingTableBody || !specificSpotInput || !specificSpotButton) {
            console.warn("Required elements not found for viewParking");
            return;
        }

        parkingTableBody.innerHTML = '<tr><td colspan="7">請點擊查詢以查看車位</td></tr>';

        async function handleSpecificSpotSearch() {
            const spotId = specificSpotInput.value.trim();
            if (!spotId) {
                alert("請輸入車位 ID！");
                return;
            }
            if (isNaN(spotId)) {
                alert("車位 ID 必須為數字！");
                return;
            }

            parkingTableBody.innerHTML = '<tr><td colspan="7">載入中...</td></tr>';

            try {
                const spot = await utils.fetchWithAuth(`${API_URL}/parking/${spotId}`, { method: 'GET' });
                const spotData = spot.data || spot;

                if (!spotData.spot_id) throw new Error("後端返回的車位資料格式錯誤，缺少必要字段！");

                if (spotData.pricing_type === "daily") throw new Error("此車位的計費方式為「按日」，目前不支援此類型！");

                parkingTableBody.innerHTML = '';
                const row = document.createElement("tr");
                row.setAttribute("data-id", `${spotData.spot_id}`);

                const priceDisplay = spotData.pricing_type === "hourly"
                    ? `${spotData.price_per_half_hour || 0} 元/半小時`
                    : `${spotData.monthly_price || 0} 元/月`;

                row.innerHTML = `
                    <td>${spotData.spot_id}</td>
                    <td>${spotData.location || '未知'}</td>
                    <td>${spotData.parking_type === "flat" ? "平面" : "機械"}</td>
                    <td>${spotData.floor_level === "ground" ? "地面" : `地下${spotData.floor_level.startsWith("B") ? spotData.floor_level.slice(1) : spotData.floor_level}樓`}</td>
                    <td>${spotData.pricing_type === "hourly" ? "按小時" : "按月"}</td>
                    <td>${priceDisplay}</td>
                    <td><button class="edit-btn">編輯</button></td>
                `;

                row.querySelector(".edit-btn").addEventListener("click", (e) => {
                    e.stopPropagation();
                    showEditForm(spotData);
                });

                row.addEventListener("click", () => {
                    setParkingSpotId(spotData.spot_id);
                    alert(`已選擇車位 ${spotData.spot_id}，您現在可以查詢此車位的收入！`);
                });

                parkingTableBody.appendChild(row);
            } catch (error) {
                console.error("Failed to fetch specific spot:", error);
                alert(`無法載入車位資料，請檢查後端服務 (錯誤: ${error.message})`);
                parkingTableBody.innerHTML = '<tr><td colspan="7">無法載入車位資料</td></tr>';
                if (error.message === "認證失敗，請重新登入！") {
                    removeToken();
                    showLoginPage(true);
                }
            }
        }

        function showEditForm(spot) {
            const existingForm = document.getElementById("editSpotForm");
            if (existingForm) existingForm.remove();

            const editForm = document.createElement("div");
            editForm.id = "editSpotForm";
            editForm.style.marginTop = "20px";

            const priceLabel = spot.pricing_type === "hourly" ? "半小時費用（元）：" : "每月費用（元）：";
            const priceValue = spot.pricing_type === "hourly"
                ? `${spot.price_per_half_hour || 0} 元`
                : `${spot.monthly_price || 0} 元`;

            editForm.innerHTML = `
                <h3>編輯車位 ${spot.spot_id}</h3>
                <div><label>地址：</label><input type="text" id="editLocation" value="${spot.location || ''}" /></div>
                <div><label>停車類型：</label><select id="editParkingType">
                    <option value="flat" ${spot.parking_type === "flat" ? "selected" : ""}>平面</option>
                    <option value="mechanical" ${spot.parking_type === "mechanical" ? "selected" : ""}>機械</option>
                </select></div>
                <div><label>計費方式：</label><select id="editPricingType">
                    <option value="hourly" ${spot.pricing_type === "hourly" ? "selected" : ""}>按小時</option>
                    <option value="monthly" ${spot.pricing_type === "monthly" ? "selected" : ""}>按月</option>
                </select></div>
                <div><label>${priceLabel}</label><span>${priceValue}</span></div>
                <button id="saveSpotButton">保存</button>
                <button id="cancelEditButton">取消</button>
            `;

            parkingTableBody.parentElement.appendChild(editForm);

            document.getElementById("saveSpotButton").addEventListener("click", async () => {
                const updatedSpot = {
                    location: document.getElementById("editLocation").value.trim(),
                    parking_type: document.getElementById("editParkingType").value,
                    pricing_type: document.getElementById("editPricingType").value
                };

                try {
                    await utils.fetchWithAuth(`${API_URL}/parking/${spot.spot_id}`, {
                        method: 'PUT',
                        body: JSON.stringify(updatedSpot)
                    });
                    alert("車位信息已成功更新！");
                    editForm.remove();
                    handleSpecificSpotSearch();
                } catch (error) {
                    console.error("Failed to update spot:", error);
                    alert(`無法更新車位資料，請檢查後端服務 (錯誤: ${error.message})`);
                    if (error.message === "認證失敗，請重新登入！") {
                        removeToken();
                        showLoginPage(true);
                    }
                }
            });

            document.getElementById("cancelEditButton").addEventListener("click", () => editForm.remove());
        }

        specificSpotButton.addEventListener("click", handleSpecificSpotSearch);
        if (specificSpotInput) {
            specificSpotInput.addEventListener("keypress", function (event) {
                if (event.key === "Enter") handleSpecificSpotSearch();
            });
        }
    }

    // 設置預約停車
    async function setupReserveParking() {
        const role = getRole();
        console.log("Current role in setupReserveParking:", role);
        if (role !== "renter") {
            alert("此功能僅限租用者使用！");
            return;
        }

        if (!await checkAuth()) return;

        const reserveSection = document.getElementById("reserveParking");
        reserveSection.style.display = "block";

        const reserveStartDateInput = document.getElementById("reserveStartDate");
        const reserveEndDateInput = document.getElementById("reserveEndDate");
        const startTimeInput = document.getElementById("startTime");
        const endTimeInput = document.getElementById("endTime");
        const reserveSearchButton = document.getElementById("reserveSearchButton");
        const reserveSearchInput = document.getElementById("reserveSearchInput");
        const reserveCity = document.getElementById("reserveCity");
        const reserveParkingType = document.getElementById("reserveParkingType");
        const reserveFloor = document.getElementById("reserveFloor");
        const reservePricing = document.getElementById("reservePricing");
        const reserveStatus = document.getElementById("reserveStatus");
        const parkingTableBody = document.getElementById("reserveParkingTableBody");
        const reserveParkingMap = document.getElementById("reserveParkingMap");

        if (!reserveStartDateInput || !reserveEndDateInput || !startTimeInput || !endTimeInput || !reserveSearchButton || !parkingTableBody || !reserveParkingMap) {
            console.warn("Required elements not found for reserveParking");
            return;
        }

        const today = new Date().toISOString().split('T')[0];
        reserveStartDateInput.value = today;
        reserveEndDateInput.value = today;
        startTimeInput.value = "09:00";
        endTimeInput.value = "17:00";

        let map = await initMap("reserveParkingMap");
        if (!map) {
            alert("無法載入 Google Maps API，請檢查網路連線或 API 金鑰是否有效。地圖功能將不可用。");
            reserveParkingMap.style.display = "none";
            return;
        }
        reserveParkingMap.style.display = "none";

        async function handleReserveSearch() {
            const startDate = reserveStartDateInput.value;
            const endDate = reserveEndDateInput.value;
            const startTime = startTimeInput.value;
            const endTime = endTimeInput.value;
            const searchQuery = reserveSearchInput ? reserveSearchInput.value.trim().toLowerCase() : '';
            const filterCity = reserveCity ? reserveCity.value : 'all';
            const filterType = reserveParkingType ? reserveParkingType.value : 'all';
            const filterFloor = reserveFloor ? reserveFloor.value : 'all';
            const filterPricing = reservePricing ? reservePricing.value : 'all';
            const filterStatus = reserveStatus ? reserveStatus.value : 'all';

            const selectedStartDate = new Date(startDate);
            const selectedEndDate = new Date(endDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (selectedStartDate < today) {
                alert("無法選擇過去的開始日期！");
                return;
            }
            if (startDate > endDate) {
                alert("結束日期不能早於開始日期！");
                return;
            }

            const [startHour, startMinute] = startTime.split(":").map(Number);
            const [endHour, endMinute] = endTime.split(":").map(Number);
            const startDateTime = new Date(startDate);
            startDateTime.setHours(startHour, startMinute);
            const endDateTime = new Date(endDate);
            endDateTime.setHours(endHour, endMinute);

            if (startDateTime >= endDateTime) {
                alert("結束時間必須晚於開始時間！");
                return;
            }

            parkingTableBody.innerHTML = '<tr><td colspan="7">載入中...</td></tr>';

            let latitude = 23.5654, longitude = 119.5863; // 預設為澎湖縣

            const timeZoneOffset = "+08:00";
            const startDateTimeStr = `${startDate}T${startTime}:00${timeZoneOffset}`;
            const endDateTimeStr = `${endDate}T${endTime}:00${timeZoneOffset}`;

            let retries = 3, spots = null;
            while (retries > 0) {
                try {
                    const queryParams = new URLSearchParams({
                        start_date: startDate,
                        end_date: endDate,
                        start_time: startDateTimeStr,
                        end_time: endDateTimeStr,
                        latitude,
                        longitude
                    });
                    const data = await utils.fetchWithAuth(`${API_URL}/parking/available?${queryParams.toString()}`);
                    spots = data.data || data.spots || data;
                    if (!Array.isArray(spots)) throw new Error("後端返回的車位資料格式錯誤，應為陣列");
                    break;
                } catch (error) {
                    console.error(`Failed to fetch available spots (attempt ${4 - retries}/3):`, error);
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
                alert("後端未返回任何車位資料，可能原因：\n1. 所選日期或時間段沒有可用車位。\n2. 當前位置範圍內無車位。\n3. 後端服務異常。");
                parkingTableBody.innerHTML = '<tr><td colspan="7">無可用車位，請嘗試更改日期、時間或位置</td></tr>';
                return;
            }

            let filteredSpots = spots.filter(spot => {
                let match = true;
                if (searchQuery) match = match && (spot.spot_id.toString().toLowerCase().includes(searchQuery) || spot.location?.toLowerCase().includes(searchQuery));
                if (filterCity !== "all") match = match && spot.location === filterCity;
                if (filterType !== "all") match = match && spot.parking_type === filterType;
                if (filterFloor !== "all") match = match && spot.floor_level === filterFloor;
                if (filterPricing !== "all") match = match && spot.pricing_type === filterPricing;
                if (filterStatus !== "all") match = match && (filterStatus === "available" ? spot.status === "可用" : filterStatus === "occupied" ? ["已佔用", "預約"].includes(spot.status) : true);
                return match;
            });

            if (filteredSpots.length === 0) {
                alert("所選條件目前沒有符合的車位！請調整篩選條件。");
                parkingTableBody.innerHTML = '<tr><td colspan="7">無符合條件的車位，請嘗試更改篩選條件</td></tr>';
                return;
            }

            reserveParkingMap.style.display = "block";

            if (map.markers) map.markers.forEach(marker => marker.map = null);
            map.markers = [];

            const bounds = new google.maps.LatLngBounds();
            for (let spot of filteredSpots) {
                let latitude = spot.latitude;
                let longitude = spot.longitude;
                const address = spot.location || '未知';

                if (!latitude || !longitude) {
                    const geocoder = new google.maps.Geocoder();
                    const geocodeResult = await new Promise((resolve, reject) => {
                        geocoder.geocode({ address: address }, (results, status) => {
                            if (status === google.maps.GeocoderStatus.OK && results[0]) {
                                resolve({
                                    lat: results[0].geometry.location.lat(),
                                    lng: results[0].geometry.location.lng()
                                });
                            } else reject(new Error(`無法解析地址 "${address}"：${status}`));
                        });
                    });
                    latitude = geocodeResult.lat;
                    longitude = geocodeResult.lng;
                }

                const position = { lat: parseFloat(latitude), lng: parseFloat(longitude) };
                let markerIcon;

                if (spot.status === "可用") markerIcon = { url: "http://maps.google.com/mapfiles/ms/icons/green-dot.png" };
                else if (spot.status === "已佔用") markerIcon = { url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png" };
                else if (spot.status === "預約") markerIcon = { url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png" };

                const marker = new google.maps.marker.AdvancedMarkerElement({
                    position: position,
                    map: map,
                    title: `車位 ${spot.spot_id} - ${address}`,
                    icon: markerIcon
                });
                map.markers.push(marker);
                bounds.extend(position);
            }

            map.fitBounds(bounds);
            if (filteredSpots.length === 1) map.setZoom(15);

            const fragment = document.createDocumentFragment();
            filteredSpots.forEach(spot => {
                const row = document.createElement("tr");
                row.setAttribute("data-id", spot.spot_id);
                row.classList.add(spot.status === "可用" ? "available" : spot.status === "預約" ? "reserved" : "occupied");
                row.innerHTML = `
                    <td>${spot.spot_id}</td>
                    <td>${spot.location || '未知'}</td>
                    <td>${spot.parking_type === "flat" ? "平面" : "機械"}</td>
                    <td>${spot.floor_level === "ground" ? "地面" : `地下${spot.floor_level.startsWith("B") ? spot.floor_level.slice(1) : spot.floor_level}樓`}</td>
                    <td>${spot.pricing_type === "hourly" ? "按小時" : spot.pricing_type === "daily" ? "按日" : "按月"}</td>
                    <td>${spot.status === "可用" ? "可用" : spot.status === "已佔用" ? "已佔用" : "預約"}</td>
                    <td><button class="reserve-btn" ${spot.status === "可用" ? '' : 'disabled'}>預約</button></td>
                `;
                if (spot.status === "可用") {
                    row.querySelector(".reserve-btn").addEventListener("click", () => {
                        handleReserveParkingClick(spot.spot_id, startDate, endDate, startTime, endTime, row);
                        setParkingSpotId(spot.spot_id);
                    });
                }
                fragment.appendChild(row);
            });

            parkingTableBody.innerHTML = '';
            parkingTableBody.appendChild(fragment);
            parkingTableBody.style.display = 'none';
            parkingTableBody.offsetHeight;
            parkingTableBody.style.display = 'table-row-group';
        }

        const refreshInterval = setInterval(async () => {
            if (reserveSection.style.display === "none") {
                clearInterval(refreshInterval);
                return;
            }
            await handleReserveSearch();
            console.log("車位狀態已更新");
        }, 30000);

        reserveSearchButton.addEventListener("click", handleReserveSearch);
        if (reserveSearchInput) {
            reserveSearchInput.addEventListener("keypress", function (event) {
                if (event.key === "Enter") handleReserveSearch();
            });
        }
    }

    // 預約停車點擊處理
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

            const startDateTime = `${startDate}T${startTime}:00`;
            const endDateTime = `${endDate}T${endTime}:00`;

            await utils.fetchWithAuth(`${API_URL}/rent`, {
                method: "POST",
                body: JSON.stringify({ parking_spot_id: spotId, start_time: startDateTime, end_time: endDateTime })
            });

            row.classList.remove("available");
            row.classList.add("reserved");
            row.querySelector("button").disabled = true;
            row.querySelector("td:nth-child(6)").textContent = "預約";
            addToHistory(`預約車位 ${spotId} 於 ${startDateTime} 至 ${endDateTime}`);
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

    // 設置收入查詢
    function setupIncomeInquiry() {
        const role = getRole();
        console.log("Current role in setupIncomeInquiry:", role);
        if (!["shared_owner", "admin"].includes(role)) {
            alert("此功能僅限車位共享者和管理員使用！");
            return;
        }

        const startDateInput = document.getElementById("startDate");
        const endDateInput = document.getElementById("endDate");
        const incomeSearchButton = document.getElementById("incomeSearchButton");
        const totalIncomeSpan = document.getElementById("totalIncome");
        const incomeTableBody = document.getElementById("incomeTableBody");

        if (!startDateInput || !endDateInput || !incomeSearchButton || !totalIncomeSpan || !incomeTableBody) {
            console.error("Required DOM elements missing for income inquiry");
            alert("頁面元素載入失敗，請檢查 DOM 結構！");
            return;
        }

        async function handleIncomeSearch() {
            const startDate = startDateInput.value;
            const endDate = endDateInput.value;

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

            totalIncomeSpan.textContent = "計算中...";
            incomeTableBody.innerHTML = '<tr><td colspan="5">載入中...</td></tr>';

            try {
                const parkingSpotId = getParkingSpotId();
                if (!parkingSpotId) throw new Error("請先在「查看車位」或「預約車位」中選擇一個停車位！");

                const data = await utils.fetchWithAuth(`${API_URL}/parking/${parkingSpotId}/income?start_date=${encodeURIComponent(startDate)}&end_date=${encodeURIComponent(endDate)}`, {
                    method: 'GET'
                });

                let incomeData = data.data || data.results || data;
                if (typeof incomeData === 'string') incomeData = JSON.parse(incomeData);

                const totalIncome = incomeData.total_income || incomeData.total || incomeData.totalIncome || 0;
                totalIncomeSpan.textContent = totalIncome.toLocaleString();

                let rents = incomeData.rents || incomeData.data || incomeData;
                if (!Array.isArray(rents)) {
                    console.error("Rents is not an array:", rents);
                    alert("後端返回的收入記錄格式錯誤（應為陣列）");
                    incomeTableBody.innerHTML = '<tr><td colspan="5">收入記錄格式錯誤</td></tr>';
                    return;
                }

                if (rents.length === 0) {
                    incomeTableBody.innerHTML = '<tr><td colspan="5">無收入記錄</td></tr>';
                    alert("目前無收入記錄");
                    return;
                }

                incomeTableBody.innerHTML = '';
                const fragment = document.createDocumentFragment();
                rents.forEach((rent, index) => {
                    const startTime = rent.start_time || rent.startTime ? new Date(rent.start_time || rent.startTime).toLocaleString("zh-TW", { hour12: false }) : 'N/A';
                    const endTime = rent.actual_end_time || rent.end_time || rent.endTime ? new Date(rent.actual_end_time || rent.end_time || rent.endTime).toLocaleString("zh-TW", { hour12: false }) : '尚未結束';
                    const cost = rent.total_cost || rent.amount || rent.cost || rent.totalCost || 0;

                    const row = document.createElement("tr");
                    row.innerHTML = `
                        <td>${rent.rent_id || rent.id || rent.rentalId || 'N/A'}</td>
                        <td>${rent.parking_spot_id || rent.spot_id || rent.parkingSpotId || 'N/A'}</td>
                        <td>${startTime}</td>
                        <td>${endTime}</td>
                        <td>${cost}</td>
                    `;
                    fragment.appendChild(row);
                });
                incomeTableBody.appendChild(fragment);
            } catch (error) {
                console.error("Failed to fetch income data:", error);
                alert("無法載入收入資料，請稍後再試或聯繫管理員。");
                totalIncomeSpan.textContent = "0";
                incomeTableBody.innerHTML = '<tr><td colspan="5">無法載入收入資料</td></tr>';
                if (error.message === "認證失敗，請重新登入！") {
                    removeToken();
                    showLoginPage(true);
                }
            }
        }

        incomeSearchButton.addEventListener("click", handleIncomeSearch);
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
        const role = getRole();
        console.log("Current role in loadHistory:", role);
        if (role !== "renter") {
            alert("此功能僅限租用者使用！");
            return;
        }

        if (!await checkAuth()) return;

        try {
            const responseData = await utils.fetchWithAuth(`${API_URL}/rent`);
            historyList.innerHTML = "";

            let data = responseData.data || responseData;
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
                const action = `租用車位 ${record.spot?.spot_id || record.parking_spot_id} (Rent ID: ${record.rent_id})`;
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

    // 設置查看所有用戶資料
    async function setupViewAllUsers() {
        const role = getRole();
        if (role !== "admin") {
            alert("此功能僅限管理員使用！");
            return;
        }

        const ownerTableBody = document.getElementById("ownerTableBody");
        const renterTableBody = document.getElementById("renterTableBody");

        if (!ownerTableBody || !renterTableBody) {
            console.error("Required DOM elements missing for view all users");
            alert("頁面元素載入失敗，請檢查 DOM 結構！");
            return;
        }

        async function loadUserData() {
            ownerTableBody.innerHTML = '<tr><td colspan="6">載入中...</td></tr>';
            renterTableBody.innerHTML = '<tr><td colspan="6">載入中...</td></tr>';

            try {
                const data = await utils.fetchWithAuth(`${API_URL}/members/all`, { method: 'GET' });
                let users = data.data || data;
                if (!Array.isArray(users)) {
                    console.error("Users data is not an array:", data);
                    alert("後端返回的用戶資料格式錯誤，請檢查後端服務");
                    return;
                }

                const owners = users.filter(user => user.role.toLowerCase() === "shared_owner");
                const renters = users.filter(user => user.role.toLowerCase() === "renter");

                ownerTableBody.innerHTML = '';
                renterTableBody.innerHTML = '';

                if (owners.length === 0) {
                    ownerTableBody.innerHTML = '<tr><td colspan="6">無車位共享者資料</td></tr>';
                } else {
                    const ownerFragment = document.createDocumentFragment();
                    owners.forEach(user => {
                        const row = document.createElement("tr");
                        row.innerHTML = `
                            <td>${user.member_id || user.id || 'N/A'}</td>
                            <td>${user.name || '未知'}</td>
                            <td>${user.email || '未知'}</td>
                            <td>${user.phone || '未知'}</td>
                            <td>${user.payment_method || '未知'}</td>
                            <td>${user.payment_info || '無'}</td>
                        `;
                        ownerFragment.appendChild(row);
                    });
                    ownerTableBody.appendChild(ownerFragment);
                }

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
                            <td>${user.vehicle_type || '無'}</td>
                        `;
                        renterFragment.appendChild(row);
                    });
                    renterTableBody.appendChild(renterFragment);
                }
            } catch (error) {
                console.error("Failed to load user data:", error);
                alert(`無法載入用戶資料，請檢查後端服務 (錯誤: ${error.message})`);
                ownerTableBody.innerHTML = '<tr><td colspan="6">無法載入資料</td></tr>';
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