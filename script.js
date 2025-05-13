console.log("script.js loaded");

// 全局變量，用於標記 Google Maps API 是否已載入
window.isGoogleMapsLoaded = false;

// Google Maps API 載入完成後的回調函數
window.initMap = function () {
    console.log("Google Maps API loaded successfully");
    window.isGoogleMapsLoaded = true;
};

// 共用工具函數
const utils = {
    // 顯示錯誤訊息
    showError: (message, element = document.getElementById("errorMessage")) => {
        element.textContent = message;
        element.classList.remove("success");
        element.classList.add("error");
        element.style.display = "block";
        setTimeout(() => element.style.display = "none", 5000);
    },
    // 顯示成功訊息
    showSuccess: (message, element = document.getElementById("errorMessage")) => {
        element.textContent = message;
        element.classList.remove("error");
        element.classList.add("success");
        element.style.display = "block";
        setTimeout(() => element.style.display = "none", 5000);
    },
    // 發送帶認證的 API 請求
    fetchWithAuth: async (url, options = {}) => {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("認證令牌缺失，請重新登入！");
        const headers = { ...options.headers, "Authorization": `Bearer ${token}`, "Content-Type": "application/json" };
        const response = await fetch(url, { ...options, headers });
        if (!response.ok) {
            if (response.status === 401) throw new Error("認證失敗，請重新登入！");
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
        }
        return response.json();
    },
    // 獲取 token
    getToken: () => localStorage.getItem("token") || "",
    // 設置 token
    setToken: (token) => localStorage.setItem("token", token),
    // 移除 token 及相關數據
    removeToken: () => {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        localStorage.removeItem("member_id");
        localStorage.removeItem("selectedParkingSpotId");
        history.pushState({}, '', '/');
    },
    // 獲取角色
    getRole: () => localStorage.getItem("role")?.toLowerCase().trim() || "",
    // 設置角色
    setRole: (role) => {
        const validRoles = ["shared_owner", "renter", "admin"];
        const normalizedRole = role?.toLowerCase().trim();
        if (validRoles.includes(normalizedRole)) {
            localStorage.setItem("role", normalizedRole);
        }
    },
    // 獲取 member_id
    getMemberId: () => Number(localStorage.getItem("member_id")) || null,
    // 設置 member_id
    setMemberId: (id) => localStorage.setItem("member_id", id),
    // 獲取 parking_spot_id
    getParkingSpotId: () => Number(localStorage.getItem("selectedParkingSpotId")) || null,
    // 設置 parking_spot_id
    setParkingSpotId: (id) => localStorage.setItem("selectedParkingSpotId", id),
};

// DOM 載入完成後執行
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

    // 顯示登入畫面
    function showLoginPage(sessionExpired = false) {
        if (sessionExpired) {
            utils.showError("您的登入已在其他地方被登出或已過期，正在跳轉...");
            setTimeout(() => {
                authContainer.style.display = "block";
                parkingContainer.style.display = "none";
                document.querySelectorAll(".content-section").forEach(section => section.style.display = "none");
                document.querySelector(".function-list").style.display = "none";
                document.querySelector(".content-container").style.display = "none";
                logoutButton.style.display = "none";
                history.pushState({}, '', '/');
            }, 1500);
        } else {
            authContainer.style.display = "block";
            parkingContainer.style.display = "none";
            document.querySelectorAll(".content-section").forEach(section => section.style.display = "none");
            document.querySelector(".function-list").style.display = "none";
            document.querySelector(".content-container").style.display = "none";
            logoutButton.style.display = "none";
            history.pushState({}, '', '/');
        }
    }

    // 顯示主畫面
    function showMainPage() {
        console.log("Entering showMainPage function");
        authContainer.style.display = "none";
        parkingContainer.style.display = "block";
        const functionList = document.querySelector(".function-list");
        const contentContainer = document.querySelector(".content-container");
        const pageTitle = document.getElementById("pageTitle");

        if (!functionList || !contentContainer || !pageTitle) {
            console.error("Required DOM elements for main page are missing");
            return;
        }
        functionList.style.display = "block";
        contentContainer.style.display = "block";
        logoutButton.style.display = "block";

        const role = utils.getRole();
        console.log("Current role in showMainPage:", role);

        const validRoles = ["shared_owner", "renter", "admin"];
        if (!role || !validRoles.includes(role)) {
            console.error(`Unrecognized role: "${role}"`);
            utils.showError("無效的用戶角色，請重新登入！");
            utils.removeToken();
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

        document.querySelectorAll(".content-section").forEach(section => section.style.display = "none");

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

        document.querySelectorAll(".nav-link").forEach(link => {
            link.addEventListener("click", async function (event) {
                event.preventDefault();
                if (!await checkAuth()) return;

                const targetId = this.getAttribute("data-target");
                document.querySelectorAll(".content-section").forEach(section => section.style.display = "none");

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

    // 初始化地圖
    async function initMap(containerId, defaultLat = 25.0330, defaultLng = 121.5654) {
        const mapContainer = document.getElementById(containerId);
        const maxAttempts = 20;
        let attempts = 0;

        while (!window.isGoogleMapsLoaded && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 500)); // 每 500ms 檢查一次
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

    // 新增車位功能
    async function setupAddParking() {
        const role = utils.getRole();
        console.log("Current role in setupAddParking:", role);
        if (!["shared_owner", "admin"].includes(role)) {
            utils.showError("此功能僅限車位共享者和管理員使用！");
            return;
        }

        const addParkingSection = document.getElementById("addParking");
        if (!addParkingSection) {
            console.error("addParking section not found");
            utils.showError("無法找到新增車位區域！");
            return;
        }

        addParkingSection.style.display = "block";

        const memberIdInput = document.getElementById("memberIdInput");
        const memberId = utils.getMemberId();
        if (!memberId) {
            utils.showError("無法獲取會員 ID，請重新登入！");
            showLoginPage();
            return;
        }
        memberIdInput.value = memberId;

        const pricingTypeSelect = document.getElementById("newPricingType");
        const priceLabel = document.getElementById("newPriceLabel");
        pricingTypeSelect.innerHTML = `<option value="hourly">按小時</option>`;
        priceLabel.textContent = "半小時費用（元）：";

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
            dateEntry.querySelector(".remove-date").addEventListener("click", () => dateEntry.remove());
        }

        addDateButton.addEventListener("click", () => addDateEntry());

        const addParkingMap = document.getElementById("addParkingMap");
        const latitudeInput = document.getElementById("latitudeInput");
        const longitudeInput = document.getElementById("longitudeInput");

        if (!addParkingMap || !latitudeInput || !longitudeInput) {
            console.error("Required elements for map in addParking not found");
            utils.showError("地圖容器或經緯度輸入框未找到！");
            return;
        }

        let map, marker;
        const mapInstance = await initMap("addParkingMap");
        if (mapInstance) {
            map = mapInstance;
            addParkingMap.style.display = "block";
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const userLocation = { lat: position.coords.latitude, lng: position.coords.longitude };
                        map.setCenter(userLocation);
                        latitudeInput.value = userLocation.lat.toFixed(6);
                        longitudeInput.value = userLocation.lng.toFixed(6);
                        marker = new google.maps.Marker({ position: userLocation, map, title: "選定位置" });
                    },
                    () => {
                        utils.showError("無法獲取位置，使用預設位置。");
                        latitudeInput.value = 25.0330;
                        longitudeInput.value = 121.5654;
                        marker = new google.maps.Marker({ position: { lat: 25.0330, lng: 121.5654 }, map, title: "預設位置" });
                    },
                    { timeout: 10000, maximumAge: 0 }
                );
            } else {
                utils.showError("瀏覽器不支援地理位置功能，使用預設位置。");
                latitudeInput.value = 25.0330;
                longitudeInput.value = 121.5654;
                marker = new google.maps.Marker({ position: { lat: 25.0330, lng: 121.5654 }, map, title: "預設位置" });
            }

            map.addListener("click", (event) => {
                const lat = event.latLng.lat();
                const lng = event.latLng.lng();
                latitudeInput.value = lat.toFixed(6);
                longitudeInput.value = lng.toFixed(6);
                if (marker) marker.setPosition(event.latLng);
                else marker = new google.maps.Marker({ position: event.latLng, map, title: "選定位置" });

                const infoWindow = new google.maps.InfoWindow({
                    content: `選定位置：<br>緯度：${lat.toFixed(6)}<br>經度：${lng.toFixed(6)}`,
                });
                infoWindow.open(map, marker);
            });
        } else {
            latitudeInput.disabled = false;
            longitudeInput.disabled = false;
            latitudeInput.placeholder = "請手動輸入緯度";
            longitudeInput.placeholder = "請手動輸入經度";
        }

        document.getElementById("saveNewSpotButton").addEventListener("click", async () => {
            const newSpot = {
                member_id: parseInt(memberIdInput.value),
                location: document.getElementById("newLocation").value.trim(),
                parking_type: document.getElementById("newParkingType").value,
                floor_level: document.getElementById("newFloorLevel").value.trim(),
                pricing_type: document.getElementById("newPricingType").value,
            };

            if (!newSpot.member_id) return utils.showError("會員 ID 為必填項！");
            if (!newSpot.location) return utils.showError("地址為必填項！");
            if (newSpot.location.length > 50) return utils.showError("地址最多 50 個字符！");
            if (!["flat", "mechanical"].includes(newSpot.parking_type)) return utils.showError("停車類型必須為 'flat' 或 'mechanical'！");
            if (newSpot.floor_level && newSpot.floor_level.length > 20) return utils.showError("樓層最多 20 個字符！");
            if (newSpot.pricing_type !== "hourly") return utils.showError("計費方式必須為 'hourly'！");

            const priceInput = document.getElementById("newPrice").value;
            const price = priceInput ? parseFloat(priceInput) : 20.00;
            if (isNaN(price) || price < 0) return utils.showError("費用必須為正數！");
            newSpot.price_per_half_hour = price;

            const maxDailyPriceInput = document.getElementById("newMaxDailyPrice").value;
            const maxDailyPrice = maxDailyPriceInput ? parseFloat(maxDailyPriceInput) : 300.00;
            if (isNaN(maxDailyPrice) || maxDailyPrice < 0) return utils.showError("每日最高價格必須為正數！");
            newSpot.daily_max_price = maxDailyPrice;

            let latitude = parseFloat(latitudeInput.value) || 0.0;
            let longitude = parseFloat(longitudeInput.value) || 0.0;
            if (isNaN(latitude) || latitude < -90 || latitude > 90) latitude = 0.0;
            if (isNaN(longitude) || longitude < -180 || longitude > 180) longitude = 0.0;
            newSpot.latitude = latitude;
            newSpot.longitude = longitude;

            const dateEntries = availableDaysContainer.querySelectorAll(".date-entry");
            const availableDays = [];
            for (const entry of dateEntries) {
                const date = entry.querySelector(".available-date").value;
                const isAvailable = entry.querySelector(".available-status").checked;
                if (!date) return utils.showError("請為每個可用日期選擇日期！");
                if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return utils.showError("日期格式不正確，請使用 YYYY-MM-DD 格式！");
                availableDays.push({ date, is_available: isAvailable });
            }
            if (availableDays.length > 0) newSpot.available_days = availableDays;

            try {
                const result = await utils.fetchWithAuth(`${API_URL}/parking/share`, {
                    method: 'POST',
                    body: JSON.stringify(newSpot)
                });
                utils.showSuccess("車位已成功新增！");
                addParkingSection.innerHTML = "<p>車位已成功新增！</p>";
            } catch (error) {
                console.error("Failed to add spot:", error);
                utils.showError(`無法新增車位：${error.message}`);
                if (error.message === "認證失敗，請重新登入！") showLoginPage(true);
            }
        });

        document.getElementById("cancelAddButton").addEventListener("click", () => {
            addParkingSection.style.display = "none";
            const viewParkingSection = document.getElementById("viewParking");
            if (viewParkingSection) {
                viewParkingSection.style.display = "block";
                setupViewParking();
            }
        });
    }

    // 檢查是否已登入
    async function checkAuth(silent = false) {
        const token = utils.getToken();
        if (!token || token.trim() === "") {
            if (!silent) utils.showError("請先登入！");
            showLoginPage();
            return false;
        }
        return true;
    }

    // 初始化檢查
    (async () => {
        const isAuthenticated = await checkAuth(true);
        if (isAuthenticated) {
            const role = utils.getRole();
            console.log("Current role during initialization:", role);
            const validRoles = ["shared_owner", "renter", "admin"];
            if (!role || !validRoles.includes(role)) {
                utils.showError("無效的用戶角色，請重新登入！");
                utils.removeToken();
                showLoginPage();
            } else {
                showMainPage();
            }
        } else {
            showLoginPage();
        }
    })();

    // 處理頁面切換
    window.addEventListener("popstate", function (event) {
        const role = utils.getRole();
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

    // 身份改變時顯示/隱藏租用者欄位
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

    // 付款方式改變時顯示/隱藏信用卡號輸入框
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

    // 電話號碼驗證
    phoneInput.addEventListener("input", function () {
        let value = phoneInput.value.replace(/\D/g, "");
        phoneInput.value = value;
        const phoneRegex = /^[0-9]{10}$/;
        if (phoneRegex.test(value)) utils.showSuccess("電話號碼格式正確");
        else utils.showError("請提供有效的電話號碼（10位數字）");
    });

    // 車牌號碼驗證
    licensePlateInput.addEventListener("input", function () {
        const licensePlate = this.value.trim();
        const licensePlateRegex = /^[A-Z]{2,3}-[0-9]{3,4}$/;
        if (licensePlateRegex.test(licensePlate)) utils.showSuccess("車牌號碼格式正確");
        else utils.showError("請輸入有效車牌號碼（格式如 AAA-1111）");
    });

    // 信用卡號格式化
    cardNumberInput.addEventListener("input", function () {
        let value = cardNumberInput.value.replace(/\D/g, "");
        value = value.replace(/(\d{4})(?=\d)/g, "$1-").slice(0, 19);
        cardNumberInput.value = value;
        const lastFour = value.slice(-4) || "";
        cardNumberInput.dataset.maskedValue = lastFour ? `****-****-****-${lastFour}` : "";
    });

    // 密碼驗證
    passwordInput.addEventListener("input", function () {
        const password = this.value.trim();
        const hasLetter = /[a-zA-Z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const isLongEnough = password.length >= 8;
        if (hasLetter && hasNumber && isLongEnough) utils.showSuccess("密碼格式正確");
        else utils.showError("密碼必須至少8個字符，包含字母和數字");
    });

    // 動態隱藏註冊欄位
    function toggleFormFields() {
        if (isLogin) {
            nameInput.parentElement.style.display = "none";
            phoneInput.parentElement.style.display = "none";
            roleInput.parentElement.style.display = "none";
            paymentMethodInput.parentElement.style.display = "none";
            cardNumberContainer.style.display = "none";
            renterFields.style.display = "none";

            [nameInput, phoneInput, roleInput, paymentMethodInput, cardNumberInput, licensePlateInput, vehicleTypeInput]
                .forEach(el => el.removeAttribute("required"));

            emailInput.setAttribute("required", "true");
            passwordInput.setAttribute("required", "true");
        } else {
            nameInput.parentElement.style.display = "block";
            phoneInput.parentElement.style.display = "block";
            paymentMethodInput.parentElement.style.display = "block";
            roleInput.parentElement.style.display = "block";
            if (paymentMethodInput.value === "credit_card") cardNumberContainer.style.display = "block";
            if (roleInput.value.toLowerCase() === "renter") renterFields.style.display = "block";

            [emailInput, passwordInput, nameInput, phoneInput, roleInput, paymentMethodInput].forEach(el => el.setAttribute("required", "true"));
            if (paymentMethodInput.value === "credit_card") cardNumberInput.setAttribute("required", "true");
            if (roleInput.value.toLowerCase() === "renter") {
                licensePlateInput.setAttribute("required", "true");
                vehicleTypeInput.setAttribute("required", "true");
            }
        }
    }

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
        if (!/^(?=.*[a-zA-Z])(?=.*[0-9]).{8,}$/.test(password)) errors.push("密碼必須至少8個字符，包含字母和數字");

        if (!isLogin) {
            const name = nameInput.value.trim();
            const phone = phoneInput.value.trim();
            const role = roleInput.value.toLowerCase().trim();
            const payment_method = paymentMethodInput.value;
            const payment_info = cardNumberInput.dataset.maskedValue || "";
            const license_plate = licensePlateInput.value.trim();

            if (!name) errors.push("姓名不能為空");
            if (!phone || !/^[0-9]{10}$/.test(phone)) errors.push("請提供有效的電話號碼（10位數字）");
            if (!role) errors.push("請選擇身份");
            if (!payment_method) errors.push("請選擇付款方式");
            if (role === "renter" && !license_plate) errors.push("車牌號碼不能為空");
        }

        if (errors.length > 0) {
            utils.showError(errors.join("；"));
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
                    if (!result.data || !result.data.token) {
                        utils.showError("後端未返回 token！");
                        return;
                    }
                    utils.setToken(result.data.token);

                    let memberId = result.data.member_id || result.data.id || result.data.user_id || (result.data.member?.id);
                    if (!memberId) {
                        utils.showError("後端未返回會員 ID！");
                        return;
                    }
                    utils.setMemberId(memberId);

                    let role = result.data.role || result.data.member?.role || result.data.user_role || result.role;
                    if (!role) {
                        utils.showError("後端未返回角色資訊！");
                        return;
                    }
                    const validRoles = ["shared_owner", "renter", "admin"];
                    role = role.toLowerCase().trim();
                    if (!validRoles.includes(role)) {
                        utils.showError(`後端返回的角色 "${role}" 無效！`);
                        return;
                    }
                    utils.setRole(role);
                    utils.showSuccess("登入成功！");
                    showMainPage();
                } else {
                    utils.showError(result.error || "電子郵件或密碼錯誤！");
                }
            } catch (error) {
                console.error("Login failed:", error.message);
                utils.showError(error.message || "無法連接到伺服器！");
            }
        } else {
            const name = nameInput.value.trim();
            const phone = phoneInput.value.trim();
            const role = roleInput.value.toLowerCase().trim();
            const payment_method = paymentMethodInput.value;
            const payment_info = cardNumberInput.dataset.maskedValue || "";
            const license_plate = licensePlateInput.value.trim();
            const vehicle_type = vehicleTypeInput.value.trim();

            try {
                const response = await fetch(`${API_URL}/members/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, password, phone, role, payment_method, payment_info, license_plate, vehicle_type })
                });
                console.log(`Register response status: ${response.status}`);
                if (!response.headers.get('content-type')?.includes('application/json')) {
                    throw new Error("後端返回非 JSON 響應，請檢查伺服器配置");
                }
                const result = await response.json();
                if (response.ok) {
                    utils.showSuccess("註冊成功！請使用此帳號登入。");
                    isLogin = true;
                    formTitle.textContent = "登入";
                    submitButton.textContent = "登入";
                    toggleMessage.innerHTML = '還沒有帳號？<a href="#" id="toggleLink">註冊</a>';
                    toggleFormFields();
                } else {
                    utils.showError(result.error || `註冊失敗！（錯誤碼：${response.status}）`);
                }
            } catch (error) {
                console.error("Register failed:", error.message);
                utils.showError(error.message || "無法連接到伺服器！");
            }
        }
    });

    // 登出功能
    logoutButton.addEventListener("click", function () {
        utils.removeToken();
        showLoginPage();
    });

    // 設置查看車位
    function setupViewParking() {
        const role = utils.getRole();
        console.log("Current role in setupViewParking:", role);
        if (!["shared_owner", "renter", "admin"].includes(role)) {
            utils.showError("您沒有權限訪問此功能！");
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
            if (!spotId) return utils.showError("請輸入車位 ID！");
            if (isNaN(spotId)) return utils.showError("車位 ID 必須為數字！");

            parkingTableBody.innerHTML = '<tr><td colspan="7">載入中...</td></tr>';

            try {
                const spot = await utils.fetchWithAuth(`${API_URL}/parking/${spotId}`);
                const spotData = spot.data || spot;

                if (!spotData.spot_id) throw new Error("後端返回的車位資料格式錯誤！");
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
                    utils.setParkingSpotId(spotData.spot_id);
                    utils.showSuccess(`已選擇車位 ${spotData.spot_id}！`);
                });

                parkingTableBody.appendChild(row);
            } catch (error) {
                console.error("Failed to fetch specific spot:", error);
                utils.showError(`無法載入車位資料：${error.message}`);
                parkingTableBody.innerHTML = '<tr><td colspan="7">無法載入車位資料</td></tr>';
                if (error.message === "認證失敗，請重新登入！") showLoginPage(true);
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
                    utils.showSuccess("車位信息已成功更新！");
                    editForm.remove();
                    handleSpecificSpotSearch();
                } catch (error) {
                    console.error("Failed to update spot:", error);
                    utils.showError(`無法更新車位資料：${error.message}`);
                    if (error.message === "認證失敗，請重新登入！") showLoginPage(true);
                }
            });

            document.getElementById("cancelEditButton").addEventListener("click", () => editForm.remove());
        }

        specificSpotButton.addEventListener("click", handleSpecificSpotSearch);
        specificSpotInput.addEventListener("keypress", function (event) {
            if (event.key === "Enter") handleSpecificSpotSearch();
        });
    }

    // 設置預約停車
    async function setupReserveParking() {
        const role = utils.getRole();
        console.log("Current role in setupReserveParking:", role);
        if (role !== "renter") {
            utils.showError("此功能僅限租用者使用！");
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
            reserveParkingMap.style.display = "none";
            return;
        }
        reserveParkingMap.style.display = "block";

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
            if (selectedStartDate < today) return utils.showError("無法選擇過去的開始日期！");
            if (startDate > endDate) return utils.showError("結束日期不能早於開始日期！");

            const [startHour, startMinute] = startTime.split(":").map(Number);
            const [endHour, endMinute] = endTime.split(":").map(Number);
            const startDateTime = new Date(startDate);
            startDateTime.setHours(startHour, startMinute);
            const endDateTime = new Date(endDate);
            endDateTime.setHours(endHour, endMinute);

            if (startDateTime >= endDateTime) return utils.showError("結束時間必須晚於開始時間！");

            parkingTableBody.innerHTML = '<tr><td colspan="7">載入中...</td></tr>';

            let latitude = 25.0330, longitude = 121.5654;
            try {
                const position = await new Promise((resolve, reject) => {
                    if (!navigator.geolocation) reject(new Error("瀏覽器不支援地理位置功能"));
                    navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000, maximumAge: 0 });
                });
                latitude = position.coords.latitude;
                longitude = position.coords.longitude;
            } catch (error) {
                console.warn("Failed to get user location:", error.message);
                utils.showError("無法獲取您的位置，將使用預設位置。");
            }

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
                    if (!Array.isArray(spots)) throw new Error("後端返回的車位資料格式錯誤");
                    break;
                } catch (error) {
                    console.error(`Failed to fetch available spots (attempt ${4 - retries}/3):`, error);
                    retries--;
                    if (retries === 0) {
                        utils.showError(`無法載入車位資料：${error.message}`);
                        parkingTableBody.innerHTML = '<tr><td colspan="7">無法載入車位資料</td></tr>';
                        if (error.message === "認證失敗，請重新登入！") showLoginPage(true);
                        return;
                    }
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }

            if (!spots || spots.length === 0) {
                utils.showError("所選日期或時間段沒有可用車位！");
                parkingTableBody.innerHTML = '<tr><td colspan="7">無可用車位，請嘗試更改日期或時間</td></tr>';
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
                utils.showError("所選條件目前沒有符合的車位！");
                parkingTableBody.innerHTML = '<tr><td colspan="7">無符合條件的車位，請調整篩選條件</td></tr>';
                return;
            }

            if (map.markers) map.markers.forEach(marker => marker.setMap(null));
            map.markers = [];

            const bounds = new google.maps.LatLngBounds();
            for (let spot of filteredSpots) {
                let latitude = spot.latitude;
                let longitude = spot.longitude;
                const address = spot.location || '未知';

                if (!latitude || !longitude) {
                    const geocoder = new google.maps.Geocoder();
                    const geocodeResult = await new Promise((resolve, reject) => {
                        geocoder.geocode({ address }, (results, status) => {
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

                const marker = new google.maps.Marker({
                    position,
                    map,
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
                        utils.setParkingSpotId(spot.spot_id);
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
        reserveSearchInput.addEventListener("keypress", function (event) {
            if (event.key === "Enter") handleReserveSearch();
        });
    }

    // 預約停車點擊處理
    async function handleReserveParkingClick(spotId, startDate, endDate, startTime, endTime, row) {
        if (!await checkAuth()) return;

        const role = utils.getRole();
        if (role !== "renter") {
            utils.showError("此功能僅限租用者使用！");
            return;
        }

        try {
            if (isNaN(spotId)) {
                utils.showError("無效的車位 ID！");
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
            utils.showSuccess(`車位 ${spotId} 已成功預約！`);
        } catch (error) {
            console.error("Reserve failed:", error);
            utils.showError(error.message || "伺服器錯誤，請稍後再試！");
            if (error.message === "認證失敗，請重新登入！") showLoginPage(true);
        }
    }

    // 設置收入查詢
    function setupIncomeInquiry() {
        const role = utils.getRole();
        console.log("Current role in setupIncomeInquiry:", role);
        if (!["shared_owner", "admin"].includes(role)) {
            utils.showError("此功能僅限車位共享者和管理員使用！");
            return;
        }

        const startDateInput = document.getElementById("startDate");
        const endDateInput = document.getElementById("endDate");
        const incomeSearchButton = document.getElementById("incomeSearchButton");
        const totalIncomeSpan = document.getElementById("totalIncome");
        const incomeTableBody = document.getElementById("incomeTableBody");

        if (!startDateInput || !endDateInput || !incomeSearchButton || !totalIncomeSpan || !incomeTableBody) {
            console.error("Required DOM elements missing for income inquiry");
            utils.showError("頁面元素載入失敗！");
            return;
        }

        async function handleIncomeSearch() {
            const startDate = startDateInput.value;
            const endDate = endDateInput.value;

            if (!startDate || !endDate) return utils.showError("請選擇開始和結束日期！");
            if (startDate > endDate) return utils.showError("開始日期不能晚於結束日期！");
            if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) return utils.showError("日期格式不正確！");

            totalIncomeSpan.textContent = "計算中...";
            incomeTableBody.innerHTML = '<tr><td colspan="5">載入中...</td></tr>';

            try {
                const parkingSpotId = utils.getParkingSpotId();
                if (!parkingSpotId) throw new Error("請先選擇一個停車位！");

                const data = await utils.fetchWithAuth(`${API_URL}/parking/${parkingSpotId}/income?start_date=${encodeURIComponent(startDate)}&end_date=${encodeURIComponent(endDate)}`);
                let incomeData = data.data || data.results || data;

                const totalIncome = incomeData.total_income || incomeData.total || incomeData.totalIncome || 0;
                totalIncomeSpan.textContent = totalIncome.toLocaleString();

                let rents = incomeData.rents || incomeData.data || (Array.isArray(incomeData) ? incomeData : []);
                if (!Array.isArray(rents)) {
                    utils.showError("後端返回的收入記錄格式錯誤！");
                    incomeTableBody.innerHTML = '<tr><td colspan="5">收入記錄格式錯誤</td></tr>';
                    return;
                }

                if (rents.length === 0) {
                    incomeTableBody.innerHTML = '<tr><td colspan="5">無收入記錄</td></tr>';
                    utils.showError("目前無收入記錄！");
                    return;
                }

                incomeTableBody.innerHTML = '';
                const fragment = document.createDocumentFragment();
                rents.forEach(rent => {
                    const startTime = rent.start_time ? new Date(rent.start_time).toLocaleString("zh-TW", { hour12: false }) : 'N/A';
                    const endTime = rent.actual_end_time || rent.end_time ? new Date(rent.actual_end_time || rent.end_time).toLocaleString("zh-TW", { hour12: false }) : '尚未結束';
                    const cost = rent.total_cost || rent.amount || rent.cost || 0;

                    const row = document.createElement("tr");
                    row.innerHTML = `
                        <td>${rent.rent_id || rent.id || 'N/A'}</td>
                        <td>${rent.parking_spot_id || rent.spot_id || 'N/A'}</td>
                        <td>${startTime}</td>
                        <td>${endTime}</td>
                        <td>${cost}</td>
                    `;
                    fragment.appendChild(row);
                });
                incomeTableBody.appendChild(fragment);
            } catch (error) {
                console.error("Failed to fetch income data:", error);
                utils.showError("無法載入收入資料！");
                totalIncomeSpan.textContent = "0";
                incomeTableBody.innerHTML = '<tr><td colspan="5">無法載入收入資料</td></tr>';
                if (error.message === "認證失敗，請重新登入！") showLoginPage(true);
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
        const role = utils.getRole();
        console.log("Current role in loadHistory:", role);
        if (role !== "renter") {
            utils.showError("此功能僅限租用者使用！");
            return;
        }

        if (!await checkAuth()) return;

        try {
            const data = await utils.fetchWithAuth(`${API_URL}/rent`);
            historyList.innerHTML = "";

            let records = data.data || data;
            if (!Array.isArray(records)) {
                utils.showError("歷史紀錄格式錯誤！");
                return;
            }

            if (records.length === 0) {
                historyList.innerHTML = "<li>目前沒有租賃記錄</li>";
                return;
            }

            records.forEach(record => {
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
            utils.showError("無法載入歷史紀錄！");
            if (error.message === "認證失敗，請重新登入！") showLoginPage(true);
        }
    }

    // 設置查看所有用戶資料
    async function setupViewAllUsers() {
        const role = utils.getRole();
        if (role !== "admin") {
            utils.showError("此功能僅限管理員使用！");
            return;
        }

        const ownerTableBody = document.getElementById("ownerTableBody");
        const renterTableBody = document.getElementById("renterTableBody");

        if (!ownerTableBody || !renterTableBody) {
            console.error("Required DOM elements missing for view all users");
            utils.showError("頁面元素載入失敗！");
            return;
        }

        async function loadUserData() {
            ownerTableBody.innerHTML = '<tr><td colspan="6">載入中...</td></tr>';
            renterTableBody.innerHTML = '<tr><td colspan="6">載入中...</td></tr>';

            try {
                const data = await utils.fetchWithAuth(`${API_URL}/members/all`);
                let users = data.data || data;
                if (!Array.isArray(users)) {
                    utils.showError("後端返回的用戶資料格式錯誤！");
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
                utils.showError(`無法載入用戶資料：${error.message}`);
                ownerTableBody.innerHTML = '<tr><td colspan="6">無法載入資料</td></tr>';
                renterTableBody.innerHTML = '<tr><td colspan="6">無法載入資料</td></tr>';
                if (error.message === "認證失敗，請重新登入！") showLoginPage(true);
            }
        }

        loadUserData();
    }
});