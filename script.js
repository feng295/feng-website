console.log("script.js loaded");

// 全局變量，用於標記 Google Maps API 是否已載入
window.isGoogleMapsLoaded = false;

// Google Maps API 載入完成後的回調函數
window.initMap = function () {
    console.log("Google Maps API loaded successfully");
    window.isGoogleMapsLoaded = true;
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
    const paymentMethodInput = document.getElementById("payment_method");
    const cardNumberContainer = document.getElementById("cardNumberContainer");
    const cardNumberInput = document.getElementById("card_number");
    const renterFields = document.getElementById("renterFields");
    const licensePlateInput = document.getElementById("license_plate");
    const vehicleTypeInput = document.getElementById("vehicle_type");

    // 功能清單和內容區域
    const functionList = document.querySelector(".function-list");
    const contentContainer = document.querySelector(".content-container");
    const pageTitle = document.getElementById("pageTitle");

    // 新增車位
    const addParkingSection = document.getElementById("addParking");
    const memberIdInput = document.getElementById("memberIdInput");
    const newLocation = document.getElementById("newLocation");
    const newParkingType = document.getElementById("newParkingType");
    const newFloorLevel = document.getElementById("newFloorLevel");
    const newPricingType = document.getElementById("newPricingType");
    const newPrice = document.getElementById("newPrice");
    const newMaxDailyPrice = document.getElementById("newMaxDailyPrice");
    const latitudeInput = document.getElementById("latitudeInput");
    const longitudeInput = document.getElementById("longitudeInput");
    const availableDaysContainer = document.getElementById("availableDaysContainer");
    const addDateButton = document.getElementById("addDateButton");
    const saveNewSpotButton = document.getElementById("saveNewSpotButton");
    const cancelAddButton = document.getElementById("cancelAddButton");
    const addParkingMap = document.getElementById("addParkingMap");

    // 我的車位
    const myParkingSpaceTableBody = document.getElementById("myParkingSpaceTableBody");

    // 預約車位
    const reserveParkingSection = document.getElementById("reserveParking");
    const reserveSearchInput = document.getElementById("reserveSearchInput");
    const reserveCity = document.getElementById("reserveCity");
    const reserveParkingType = document.getElementById("reserveParkingType");
    const reserveFloor = document.getElementById("reserveFloor");
    const reservePricing = document.getElementById("reservePricing");
    const reserveStatus = document.getElementById("reserveStatus");
    const reserveDate = document.getElementById("reserveDate");
    const startTime = document.getElementById("startTime");
    const endTime = document.getElementById("endTime");
    const reserveSearchButton = document.getElementById("reserveSearchButton");
    const reserveParkingTableBody = document.getElementById("reserveParkingTableBody");
    const reserveParkingMap = document.getElementById("reserveParkingMap");

    // 收入查詢
    const startDateInput = document.getElementById("startDate");
    const endDateInput = document.getElementById("endDate");
    const incomeSearchButton = document.getElementById("incomeSearchButton");
    const incomeTableBody = document.getElementById("incomeTableBody");

    // 查看所有用戶資料
    const ownerTableBody = document.getElementById("ownerTableBody");
    const renterTableBody = document.getElementById("renterTableBody");

    // 個人資料
    const profileSection = document.getElementById("profileSection");
    const editProfileButton = document.getElementById("editProfileButton");
    const saveProfileButton = document.getElementById("saveProfileButton");
    const cancelProfileButton = document.getElementById("cancelProfileButton");
    const profileName = document.getElementById("profileName");
    const profilePhone = document.getElementById("profilePhone");
    const profileEmail = document.getElementById("profileEmail");
    const profilePaymentMethod = document.getElementById("profilePaymentMethod");
    const profileCardNumber = document.getElementById("profileCardNumber");

    // 檢查必要的 DOM 元素是否存在
    if (!authContainer || !parkingContainer || !authForm || !logoutButton || !historyList ||
        !emailInput || !passwordInput || !nameInput || !phoneInput || !roleInput ||
        !paymentMethodInput || !cardNumberContainer || !cardNumberInput || !renterFields ||
        !licensePlateInput || !vehicleTypeInput || !functionList || !contentContainer ||
        !pageTitle || !addParkingSection || !memberIdInput || !newLocation || !newParkingType ||
        !newFloorLevel || !newPricingType || !newPrice || !newMaxDailyPrice || !latitudeInput ||
        !longitudeInput || !availableDaysContainer || !addDateButton || !saveNewSpotButton ||
        !cancelAddButton || !addParkingMap || !myParkingSpaceTableBody || !reserveParkingSection ||
        !reserveSearchInput || !reserveCity || !reserveParkingType || !reserveFloor ||
        !reservePricing || !reserveStatus || !reserveDate || !startTime || !endTime ||
        !reserveSearchButton || !reserveParkingTableBody || !reserveParkingMap || !startDateInput ||
        !endDateInput || !incomeSearchButton || !incomeTableBody || !ownerTableBody ||
        !renterTableBody || !profileSection || !editProfileButton || !saveProfileButton ||
        !cancelProfileButton || !profileName || !profilePhone || !profileEmail ||
        !profilePaymentMethod || !profileCardNumber) {
        console.error("Required DOM elements are missing");
        return;
    }

    let isLogin = true;
    const API_URL = '/api/v1';

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
                <li><a href="#" class="nav-link" data-target="myParkingSpace">我的車位</a></li>
                <li><a href="#" class="nav-link" data-target="incomeInquiry">收入查詢</a></li>
            `;
        } else if (role === "renter") {
            navList.innerHTML = `
                <li><a href="#" class="nav-link" data-target="myParkingSpace">我的車位</a></li>
                <li><a href="#" class="nav-link" data-target="reserveParking">預約車位</a></li>
                <li><a href="#" class="nav-link" data-target="history">歷史紀錄</a></li>
            `;
        } else if (role === "admin") {
            navList.innerHTML = `
                <li><a href="#" class="nav-link" data-target="addParking">新增車位</a></li>
                <li><a href="#" class="nav-link" data-target="myParkingSpace">我的車位</a></li>
                <li><a href="#" class="nav-link" data-target="viewAllUsers">查看所有用戶資料</a></li>
            `;
        }

        document.querySelectorAll(".content-section").forEach(section => {
            section.style.display = "none";
        });

        const defaultSectionId = role === "shared_owner" ? "myParkingSpace" :
            role === "renter" ? "reserveParking" :
                role === "admin" ? "viewAllUsers" : "myParkingSpace";
        const defaultSection = document.getElementById(defaultSectionId);

        if (!defaultSection) {
            console.error(`Default section "${defaultSectionId}" not found`);
            return;
        }

        defaultSection.style.display = "block";
        if (defaultSectionId === "myParkingSpace") setupMyParkingSpace();
        else if (defaultSectionId === "reserveParking") setupReserveParking();
        else if (defaultSectionId === "viewAllUsers") setupViewAllUsers();
        else if (defaultSectionId === "incomeInquiry") setupIncomeInquiry();
        else if (defaultSectionId === "addParking") setupAddParking();
        else setupMyParkingSpace();

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
                if (targetId === "myParkingSpace") setupMyParkingSpace();
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

        addParkingSection.style.display = "block";

        // 自動填充會員 ID
        const memberId = getMemberId();
        if (!memberId) {
            alert("無法獲取會員 ID，請重新登入！");
            showLoginPage();
            return;
        }
        memberIdInput.value = memberId;

        // 動態調整費用標籤（僅保留按小時）
        newPricingType.innerHTML = `<option value="hourly">按小時</option>`;
        const priceLabel = document.getElementById("newPriceLabel");
        priceLabel.textContent = "半小時費用（元）：";

        // 修改可用日期：使用日期範圍選擇
        function generateDateRange(startDate, endDate) {
            const dates = [];
            let currentDate = new Date(startDate);
            const end = new Date(endDate);
            while (currentDate <= end) {
                dates.push(new Date(currentDate).toISOString().split('T')[0]);
                currentDate.setDate(currentDate.getDate() + 1);
            }
            return dates;
        }

        function addDateRangeEntry() {
            const dateRangeEntry = document.createElement("div");
            dateRangeEntry.className = "date-range-entry";
            dateRangeEntry.innerHTML = `
                <label>開始日期 (YYYY-MM-DD)：</label>
                <input type="date" class="start-date">
                <label>結束日期 (YYYY-MM-DD)：</label>
                <input type="date" class="end-date">
                <button type="button" class="generate-dates">生成日期</button>
                <button type="button" class="remove-range">移除</button>
                <div class="date-list"></div>
            `;
            availableDaysContainer.appendChild(dateRangeEntry);

            const startDateInput = dateRangeEntry.querySelector(".start-date");
            const endDateInput = dateRangeEntry.querySelector(".end-date");
            const generateButton = dateRangeEntry.querySelector(".generate-dates");
            const dateList = dateRangeEntry.querySelector(".date-list");

            generateButton.addEventListener("click", () => {
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

                const dates = generateDateRange(startDate, endDate);
                dateList.innerHTML = '';
                dates.forEach(date => {
                    const dateEntry = document.createElement("div");
                    dateEntry.className = "date-entry";
                    dateEntry.innerHTML = `
                        <label>日期：${date}</label>
                        <input type="hidden" class="available-date" value="${date}">
                        <label>是否可用：</label>
                        <input type="checkbox" class="available-status" checked>
                    `;
                    dateList.appendChild(dateEntry);
                });
            });

            dateRangeEntry.querySelector(".remove-range").addEventListener("click", () => {
                dateRangeEntry.remove();
            });
        }

        addDateButton.addEventListener("click", addDateRangeEntry);

        // 檢查 Google Maps API 是否已載入
        if (!window.isGoogleMapsLoaded || !window.google || !google.maps) {
            console.error("Google Maps API 未載入或載入失敗");
            alert("無法載入 Google Maps API，請檢查網路連線或 API 金鑰是否有效。地圖功能將不可用，但您仍可手動輸入經緯度。");
            addParkingMap.style.display = "none";
            latitudeInput.disabled = false;
            longitudeInput.disabled = false;
            latitudeInput.placeholder = "請手動輸入緯度";
            longitudeInput.placeholder = "請手動輸入經度";
            return;
        }

        // 初始化地圖，添加 mapId
        addParkingMap.style.display = "block";
        const map = new google.maps.Map(addParkingMap, {
            center: { lat: 23.5654, lng: 119.5762 },
            zoom: 15,
            mapId: "4a9410e1706e086d447136ee"
        });

        let marker;
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const userLocation = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    };
                    map.setCenter(userLocation);
                    latitudeInput.value = userLocation.lat;
                    longitudeInput.value = userLocation.lng;
                    marker = new google.maps.marker.AdvancedMarkerElement({
                        position: userLocation,
                        map: map,
                        title: "選定位置",
                    });
                },
                (error) => {
                    console.warn("Failed to get user location:", error.message);
                    alert("無法獲取您的位置，將使用預設位置（澎湖）。請確保已允許位置權限。");
                    latitudeInput.value = 23.5654;
                    longitudeInput.value = 119.5762;
                    marker = new google.maps.marker.AdvancedMarkerElement({
                        position: { lat: 23.5654, lng: 119.5762 },
                        map: map,
                        title: "預設位置",
                    });
                },
                { timeout: 10000, maximumAge: 0 }
            );
        } else {
            console.warn("Browser does not support geolocation");
            alert("您的瀏覽器不支援地理位置功能，將使用預設位置（澎湖）。");
            latitudeInput.value = 23.5654;
            longitudeInput.value = 119.5762;
            marker = new google.maps.marker.AdvancedMarkerElement({
                position: { lat: 23.5654, lng: 119.5762 },
                map: map,
                title: "預設位置",
            });
        }

        // 地圖點擊事件：更新經緯度和標記，並顯示資訊視窗
        map.addListener("click", (event) => {
            const lat = event.latLng.lat();
            const lng = event.latLng.lng();
            latitudeInput.value = lat.toFixed(6);
            longitudeInput.value = lng.toFixed(6);

            if (marker) {
                marker.position = event.latLng;
            } else {
                marker = new google.maps.marker.AdvancedMarkerElement({
                    position: event.latLng,
                    map: map,
                    title: "選定位置",
                });
            }

            const infoWindow = new google.maps.InfoWindow({
                content: `選定位置：<br>緯度：${lat.toFixed(6)}<br>經度：${lng.toFixed(6)}`,
            });
            infoWindow.open(map, marker);
        });

        // 保存車位按鈕事件
        saveNewSpotButton.addEventListener("click", async () => {
            const newSpot = {
                member_id: parseInt(memberIdInput.value),
                location: newLocation.value.trim(),
                parking_type: newParkingType.value,
                floor_level: newFloorLevel.value.trim(),
                pricing_type: newPricingType.value,
            };

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

            const price = newPrice.value ? parseFloat(newPrice.value) : 20.00;
            if (isNaN(price) || price < 0) {
                alert("費用必須為正數！");
                return;
            }
            newSpot.price_per_half_hour = price;

            const maxDailyPrice = newMaxDailyPrice.value ? parseFloat(newMaxDailyPrice.value) : 300.00;
            if (isNaN(maxDailyPrice) || maxDailyPrice < 0) {
                alert("每日最高價格必須為正數！");
                return;
            }
            newSpot.daily_max_price = maxDailyPrice;

            let latitude = parseFloat(latitudeInput.value) || 0.0;
            let longitude = parseFloat(longitudeInput.value) || 0.0;
            if (isNaN(latitude) || latitude < -90 || latitude > 90) {
                latitude = 0.0;
            }
            if (isNaN(longitude) || longitude < -180 || longitude > 180) {
                longitude = 0.0;
            }
            newSpot.latitude = latitude;
            newSpot.longitude = longitude;

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
                const token = getToken();
                if (!token) throw new Error("認證令牌缺失，請重新登入！");

                const response = await fetch(`${API_URL}/parking/share`, {
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

        cancelAddButton.addEventListener("click", () => {
            addParkingSection.style.display = "none";
            const myParkingSpaceSection = document.getElementById("myParkingSpace");
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
                functionList.style.display = "none";
                contentContainer.style.display = "none";
                logoutButton.style.display = "none";
                history.pushState({}, '', '/');
            }, 1500);
        } else {
            authContainer.style.display = "block";
            parkingContainer.style.display = "none";
            document.querySelectorAll(".content-section").forEach(section => {
                section.style.display = "none";
            });
            functionList.style.display = "none";
            contentContainer.style.display = "none";
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

    // 當付款方式改變時，顯示或隱藏信用卡號輸入框
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
            const payment_method = paymentMethodInput.value;
            const payment_info = cardNumberInput.value.trim();
            const license_plate = licensePlateInput.value.trim();
            const vehicle_type = vehicleTypeInput.value.trim();

            if (!name) errors.push("姓名不能為空");
            if (!phone || !/^[0-9]{10}$/.test(phone)) errors.push("請提供有效的電話號碼（10 位數字）");
            if (!role) errors.push("請選擇身份");
            if (!payment_method) errors.push("請選擇付款方式");
            if (role === "renter" && !license_plate) errors.push("車牌號碼不能為空");
            if (role === "renter" && !vehicle_type) errors.push("車型不能為空");
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
                const result = await response.json();
                if (response.ok) {
                    if (!result.data || !result.data.token) {
                        showError("後端未返回 token，請檢查後端服務！");
                        return;
                    }
                    setToken(result.data.token);

                    let memberId = null;
                    if (result.data.member && result.data.member.member_id) memberId = result.data.member.member_id;
                    else if (result.data.member_id) memberId = result.data.member_id;
                    else if (result.data.id) memberId = result.data.id;
                    else if (result.data.user_id) memberId = result.data.user_id;
                    else if (result.data.member && result.data.member.id) memberId = result.data.member.id;
                    else {
                        showError("後端未返回會員 ID，請聯繫管理員！");
                        return;
                    }
                    localStorage.setItem("member_id", memberId.toString());

                    let role = "";
                    if (result.data.member && typeof result.data.member.role === "string") role = result.data.member.role.toLowerCase().trim();
                    else if (typeof result.data.role === "string") role = result.data.role.toLowerCase().trim();
                    else if (result.data.user && typeof result.data.user.role === "string") role = result.data.user.role.toLowerCase().trim();
                    else if (result.data.roles && Array.isArray(result.data.roles) && result.data.roles.length > 0) role = result.data.roles[0].toLowerCase().trim();
                    else if (typeof result.data.user_role === "string") role = result.data.user_role.toLowerCase().trim();
                    else if (typeof result.role === "string") role = result.role.toLowerCase().trim();
                    else {
                        showError("後端未返回有效的角色資訊，請聯繫管理員！");
                        return;
                    }
                    const validRoles = ["shared_owner", "renter", "admin"];
                    if (!validRoles.includes(role)) {
                        showError(`後端返回的角色 "${role}" 無效，應為 ${validRoles.join(", ")} 之一！`);
                        return;
                    }
                    setRole(role);
                    alert("登入成功！");
                    showMainPage();
                } else {
                    showError(result.error || "電子郵件或密碼錯誤！");
                }
            } catch (error) {
                showError(error.message || "無法連接到伺服器，請檢查網路或後端服務！");
            }
        } else {
            const name = nameInput.value.trim();
            const phone = phoneInput.value.trim();
            const role = roleInput.value.toLowerCase().trim();
            const payment_method = paymentMethodInput.value;
            const payment_info = cardNumberInput.value.trim();
            const license_plate = licensePlateInput.value.trim();
            const vehicle_type = vehicleTypeInput.value.trim();

            try {
                const response = await fetch(`${API_URL}/members/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, password, phone, role, payment_method, payment_info, license_plate, vehicle_type })
                });
                const result = await response.json();
                if (response.ok) {
                    alert("註冊成功！請使用此帳號登入。");
                    isLogin = true;
                    formTitle.textContent = "登入";
                    submitButton.textContent = "登入";
                    toggleMessage.innerHTML = '還沒有帳號？<a href="#" id="toggleLink">註冊</a>';
                    toggleFormFields();
                } else {
                    showError(result.error || `註冊失敗！（錯誤碼：${response.status}）`);
                }
            } catch (error) {
                showError(error.message || "無法連接到伺服器，請檢查網路或後端服務！");
            }
        }
    });

    // 登出功能
    logoutButton.addEventListener("click", function () {
        removeToken();
        showLoginPage();
    });

    // 設置我的車位
    function setupMyParkingSpace() {
        const role = getRole();
        console.log("Current role in setupMyParkingSpace:", role);
        if (!["shared_owner", "renter", "admin"].includes(role)) {
            alert("您沒有權限訪問此功能！");
            return;
        }

        myParkingSpaceTableBody.innerHTML = '<tr><td colspan="7">載入中...</td></tr>';

        async function loadAllSpots() {
            try {
                const token = getToken();
                if (!token) throw new Error("認證令牌缺失，請重新登入！");

                const memberId = getMemberId();
                if (!memberId) throw new Error("無法獲取會員 ID，請重新登入！");

                let url;
                if (role === "shared_owner") url = `${API_URL}/parking/my-spots`;
                else if (role === "renter") url = `${API_URL}/parking/my-spots`;
                else if (role === "admin") url = `${API_URL}/parking/my-spots`;

                const response = await fetch(url, {
                    method: 'GET',
                    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }
                });

                if (!response.ok) {
                    if (response.status === 401) throw new Error("認證失敗，請重新登入！");
                    const errorData = await response.text();
                    throw new Error(`HTTP 錯誤！狀態: ${response.status}, 回應: ${errorData}`);
                }

                const contentType = response.headers.get('content-type');
                if (!contentType || !contentType.includes('application/json')) {
                    throw new Error("後端返回非 JSON 響應，請檢查伺服器配置");
                }

                const data = await response.json();
                const spots = data.data || data.spots || data;
                if (!Array.isArray(spots)) throw new Error("後端返回的車位資料格式錯誤，應為陣列");

                if (spots.length === 0) {
                    myParkingSpaceTableBody.innerHTML = '<tr><td colspan="7">無車位資料</td></tr>';
                    return;
                }

                myParkingSpaceTableBody.innerHTML = '';
                const fragment = document.createDocumentFragment();
                spots.forEach(spot => {
                    if (spot.pricing_type === "daily") {
                        console.warn(`Spot ID ${spot.spot_id} has unsupported pricing type 'daily', skipping.`);
                        return;
                    }

                    const row = document.createElement("tr");
                    row.setAttribute("data-id", `${spot.spot_id}`);

                    const priceDisplay = spot.pricing_type === "hourly"
                        ? `${spot.price_per_half_hour || 0} 元/半小時`
                        : `${spot.monthly_price || 0} 元/月`;

                    row.innerHTML = `
                        <td>${spot.spot_id}</td>
                        <td>${spot.location || '未知'}</td>
                        <td>${spot.parking_type === "flat" ? "平面" : "機械"}</td>
                        <td>${spot.floor_level === "ground" ? "地面" : `地下${spot.floor_level.startsWith("B") ? spot.floor_level.slice(1) : spot.floor_level}樓`}</td>
                        <td>${spot.pricing_type === "hourly" ? "按小時" : "按月"}</td>
                        <td>${priceDisplay}</td>
                        <td>
                            <button class="edit-btn">編輯</button>
                            <button class="delete-btn">刪除</button>
                        </td>
                    `;

                    row.querySelector(".edit-btn").addEventListener("click", (e) => {
                        e.stopPropagation();
                        showEditForm(spot);
                    });

                    row.querySelector(".delete-btn").addEventListener("click", async (e) => {
                        e.stopPropagation();
                        if (!confirm(`確定要刪除車位 ${spot.spot_id} 嗎？此操作無法恢復！`)) return;

                        try {
                            const token = getToken();
                            if (!token) throw new Error("認證令牌缺失，請重新登入！");

                            const response = await fetch(`${API_URL}/parking/${spot.spot_id}`, {
                                method: 'DELETE',
                                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }
                            });
                            if (!response.ok) {
                                if (response.status === 401) throw new Error("認證失敗，請重新登入！");
                                const errorData = await response.json();
                                throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorData.error || '未知錯誤'}`);
                            }

                            alert(`車位 ${spot.spot_id} 已成功刪除！`);
                            row.remove();
                            if (myParkingSpaceTableBody.children.length === 0) {
                                myParkingSpaceTableBody.innerHTML = '<tr><td colspan="7">無車位資料</td></tr>';
                            }
                        } catch (error) {
                            console.error("Failed to delete spot:", error);
                            alert(`無法刪除車位，請檢查後端服務 (錯誤: ${error.message})`);
                            if (error.message === "認證失敗，請重新登入！") {
                                removeToken();
                                showLoginPage(true);
                            }
                        }
                    });

                    row.addEventListener("click", () => {
                        setParkingSpotId(spot.spot_id);
                        alert(`已選擇車位 ${spot.spot_id}，您現在可以查詢此車位的收入！`);
                    });

                    fragment.appendChild(row);
                });

                if (fragment.children.length === 0) {
                    myParkingSpaceTableBody.innerHTML = '<tr><td colspan="7">無車位資料</td></tr>';
                } else {
                    myParkingSpaceTableBody.appendChild(fragment);
                }
            } catch (error) {
                console.error("Failed to fetch spots:", error);
                alert(`無法載入車位資料，請檢查後端服務 (錯誤: ${error.message})`);
                myParkingSpaceTableBody.innerHTML = '<tr><td colspan="7">無法載入車位資料</td></tr>';
                if (error.message.includes("認證失敗")) {
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

            const priceLabel = "半小時費用（元）：";
            const priceValue = `${spot.price_per_half_hour || 0} 元`;

            editForm.innerHTML = `
                <h3>編輯車位 ${spot.spot_id}</h3>
                <div><label>地址：</label><input type="text" id="editLocation" value="${spot.location || ''}" /></div>
                <div><label>停車類型：</label><select id="editParkingType">
                    <option value="flat" ${spot.parking_type === "flat" ? "selected" : ""}>平面</option>
                    <option value="mechanical" ${spot.parking_type === "mechanical" ? "selected" : ""}>機械</option>
                </select></div>
                <div><label>計費方式：</label><select id="editPricingType">
                    <option value="hourly" selected>按小時</option>
                </select></div>
                <div><label>${priceLabel}</label><span>${priceValue}</span></div>
                <button id="saveSpotButton">保存</button>
                <button id="cancelEditButton">取消</button>
            `;

            myParkingSpaceTableBody.parentElement.appendChild(editForm);

            document.getElementById("saveSpotButton").addEventListener("click", async () => {
                const updatedSpot = {
                    location: document.getElementById("editLocation").value.trim(),
                    parking_type: document.getElementById("editParkingType").value,
                    pricing_type: "hourly"
                };

                try {
                    const token = getToken();
                    if (!token) throw new Error("認證令牌缺失，請重新登入！");

                    const response = await fetch(`${API_URL}/parking/${spot.spot_id}`, {
                        method: 'PUT',
                        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                        body: JSON.stringify(updatedSpot)
                    });
                    if (!response.ok) {
                        if (response.status === 401) throw new Error("認證失敗，請重新登入！");
                        const errorData = await response.json();
                        throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorData.error || '未知錯誤'}`);
                    }
                    await response.json();
                    alert("車位信息已成功更新！");
                    editForm.remove();
                    loadAllSpots();
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

        loadAllSpots();
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

        reserveParkingSection.style.display = "block";

        const today = new Date().toISOString().split('T')[0];
        reserveDate.value = today;
        startTime.value = "09:00";
        endTime.value = "17:00";

        if (!window.isGoogleMapsLoaded || !window.google || !google.maps) {
            console.error("Google Maps API 未載入或載入失敗");
            alert("無法載入 Google Maps API，請檢查網路連線或 API 金鑰是否有效。地圖功能將不可用。");
            reserveParkingMap.style.display = "none";
            return;
        }

        let map;
        if (!map) {
            map = new google.maps.Map(reserveParkingMap, {
                center: { lat: 23.5654, lng: 119.5762 },
                zoom: 15,
                mapId: "4a9410e1706e086d447136ee"
            });
            map.markers = [];
            reserveParkingMap.style.display = "none";
        }

        async function handleReserveSearch() {
            const selectedDate = reserveDate.value;
            const startTimeVal = startTime.value;
            const endTimeVal = endTime.value;
            const searchQuery = reserveSearchInput.value.trim().toLowerCase();
            const filterCity = reserveCity.value;
            const filterType = reserveParkingType.value;
            const filterFloor = reserveFloor.value;
            const filterPricing = reservePricing.value;
            const filterStatus = reserveStatus.value;

            const selectedDateObj = new Date(selectedDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (selectedDateObj < today) {
                alert("無法選擇過去的日期！");
                return;
            }

            const [startHour, startMinute] = startTimeVal.split(":").map(Number);
            const [endHour, endMinute] = endTimeVal.split(":").map(Number);
            const startDateTime = new Date(selectedDate);
            startDateTime.setHours(startHour, startMinute);
            const endDateTime = new Date(selectedDate);
            endDateTime.setHours(endHour, endMinute);

            if (startDateTime >= endDateTime) {
                alert("結束時間必須晚於開始時間！");
                return;
            }

            reserveParkingTableBody.innerHTML = '<tr><td colspan="7">載入中...</td></tr>';

            let latitude = 23.5654, longitude = 119.5762;
            try {
                const position = await new Promise((resolve, reject) => {
                    if (!navigator.geolocation) reject(new Error("瀏覽器不支援地理位置功能"));
                    navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000, maximumAge: 0 });
                });
                latitude = position.coords.latitude;
                longitude = position.coords.longitude;
            } catch (error) {
                console.warn("Failed to get user location, using default:", error.message);
                alert("無法獲取您的位置，將使用預設位置（澎湖）。請確保已允許位置權限。");
            }

            const timeZoneOffset = "+08:00";
            const startDateTimeStr = `${selectedDate}T${startTimeVal}:00${timeZoneOffset}`;
            const endDateTimeStr = `${selectedDate}T${endTimeVal}:00${timeZoneOffset}`;

            let retries = 3, spots = null;
            while (retries > 0) {
                try {
                    const token = getToken();
                    if (!token) throw new Error("認證令牌缺失，請重新登入！");

                    const queryParams = new URLSearchParams({
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
                    break;
                } catch (error) {
                    console.error(`Failed to fetch available spots (attempt ${4 - retries}/3):`, error);
                    retries--;
                    if (retries === 0) {
                        alert(`無法載入車位資料，請檢查後端服務 (錯誤: ${error.message})`);
                        reserveParkingTableBody.innerHTML = '<tr><td colspan="7">無法載入車位資料</td></tr>';
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
                reserveParkingTableBody.innerHTML = '<tr><td colspan="7">無可用車位，請嘗試更改日期、時間或位置</td></tr>';
                return;
            }

            let filteredSpots = spots.filter(spot => {
                let match = true;
                if (searchQuery) match = match && (spot.spot_id.toString().toLowerCase().includes(searchQuery) || spot.location?.toLowerCase().includes(searchQuery));
                if (filterCity !== "all") match = match && spot.location?.includes(filterCity);
                if (filterType !== "all") match = match && spot.parking_type === filterType;
                if (filterFloor !== "all") match = match && spot.floor_level === filterFloor;
                if (filterPricing !== "all") match = match && spot.pricing_type === filterPricing;
                if (filterStatus !== "all") match = match && (filterStatus === "available" ? spot.status === "可用" : filterStatus === "occupied" ? ["已佔用", "預約"].includes(spot.status) : true);
                return match;
            });

            if (filteredSpots.length === 0) {
                reserveParkingTableBody.innerHTML = '<tr><td colspan="7">無符合條件的車位，請嘗試更改篩選條件</td></tr>';
                return;
            }

            reserveParkingMap.style.display = "block";

            if (map.markers) map.markers.forEach(marker => marker.map = null);
            map.markers = [];

            const bounds = new google.maps.LatLngBounds();
            filteredSpots.forEach(spot => {
                let latitude = spot.latitude;
                let longitude = spot.longitude;
                const address = spot.location || '未知';

                if (!latitude || !longitude) {
                    const geocoder = new google.maps.Geocoder();
                    geocoder.geocode({ address: address }, (results, status) => {
                        if (status === google.maps.GeocoderStatus.OK && results[0]) {
                            latitude = results[0].geometry.location.lat();
                            longitude = results[0].geometry.location.lng();
                            updateMarker(latitude, longitude, spot);
                        }
                    });
                } else {
                    updateMarker(latitude, longitude, spot);
                }

                function updateMarker(lat, lng, spot) {
                    const position = { lat: parseFloat(lat), lng: parseFloat(lng) };
                    let markerIcon = { url: "http://maps.google.com/mapfiles/ms/icons/green-dot.png" };
                    if (spot.status === "已佔用") markerIcon = { url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png" };
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
            });

            map.fitBounds(bounds);
            if (filteredSpots.length === 1) map.setZoom(15);

            reserveParkingTableBody.innerHTML = '';
            const fragment = document.createDocumentFragment();
            filteredSpots.forEach(spot => {
                const row = document.createElement("tr");
                row.setAttribute("data-id", spot.spot_id);
                row.classList.add(spot.status === "可用" ? "available" : spot.status === "預約" ? "reserved" : "occupied");

                const priceDisplay = spot.pricing_type === "hourly"
                    ? `${spot.price_per_half_hour || 0} 元/半小時`
                    : `${spot.monthly_price || 0} 元/月`;

                row.innerHTML = `
                    <td>${spot.spot_id}</td>
                    <td>${spot.location || '未知'}</td>
                    <td>${spot.parking_type === "flat" ? "平面" : "機械"}</td>
                    <td>${spot.floor_level === "ground" ? "地面" : `地下${spot.floor_level.startsWith("B") ? spot.floor_level.slice(1) : spot.floor_level}樓`}</td>
                    <td>${spot.pricing_type === "hourly" ? "按小時" : "按月"}</td>
                    <td>${priceDisplay}</td>
                    <td>
                        <button class="reserve-btn" ${spot.status === "可用" ? '' : 'disabled'}>預約</button>
                    </td>
                `;
                if (spot.status === "可用") {
                    row.querySelector(".reserve-btn").addEventListener("click", () => {
                        handleReserveParkingClick(spot.spot_id, selectedDate, selectedDate, startTimeVal, endTimeVal, row);
                        setParkingSpotId(spot.spot_id);
                    });
                }
                fragment.appendChild(row);
            });

            reserveParkingTableBody.appendChild(fragment);
            reserveParkingTableBody.style.display = 'none';
            reserveParkingTableBody.offsetHeight;
            reserveParkingTableBody.style.display = 'table-row-group';
        }

        const refreshInterval = setInterval(async () => {
            if (reserveParkingSection.style.display === "none") {
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

            const token = getToken();
            const response = await fetch(`${API_URL}/rent`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({ parking_spot_id: spotId, start_time: startDateTime, end_time: endDateTime })
            });
            if (!response.ok) {
                if (response.status === 401) throw new Error("認證失敗，請重新登入！");
                const result = await response.json();
                throw new Error(result.error || `預約失敗！（錯誤碼：${response.status}）`);
            }
            await response.json();
            row.classList.remove("available");
            row.classList.add("reserved");
            row.querySelector("button").disabled = true;
            row.querySelector("td:nth-child(6)").textContent = "預約";
            addToHistory(`預約車位 ${spotId} 於 ${startDateTime} 至 ${endDateTime}`);
            alert(`車位 ${spotId} 已成功預約！`);
        } catch (error) {
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

            incomeTableBody.innerHTML = '<tr><td colspan="5">載入中...</td></tr>';

            try {
                const token = getToken();
                if (!token) throw new Error("認證令牌缺失，請重新登入！");

                const parkingSpotId = getParkingSpotId();
                if (!parkingSpotId) throw new Error("請先在「我的車位」或「預約車位」中選擇一個停車位！");

                const response = await fetch(`${API_URL}/parking/${parkingSpotId}/income?start_date=${encodeURIComponent(startDate)}&end_date=${encodeURIComponent(endDate)}`, {
                    method: 'GET',
                    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }
                });
                if (!response.ok) {
                    if (response.status === 401) throw new Error("認證失敗，請重新登入！");
                    const errorData = await response.json();
                    throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorData.error || '未知錯誤'}`);
                }

                const contentType = response.headers.get('content-type');
                if (!contentType || !contentType.includes('application/json')) {
                    throw new Error("後端返回非 JSON 響應，請檢查伺服器配置");
                }

                const data = await response.json();
                let incomeData = data.data || data.results || data;
                if (typeof incomeData === 'string') incomeData = JSON.parse(incomeData);

                let rents = [];
                if (incomeData.rents) rents = incomeData.rents;
                else if (incomeData.data && Array.isArray(incomeData.data)) rents = incomeData.data;
                else if (Array.isArray(incomeData)) rents = incomeData;
                else {
                    console.warn("No known record fields found in incomeData:", incomeData);
                    alert("後端返回的數據格式不正確，無法提取收入記錄（缺少 'rents' 字段）。請檢查後端 API！");
                    incomeTableBody.innerHTML = '<tr><td colspan="5">數據格式錯誤，無法顯示收入記錄</td></tr>';
                    return;
                }

                if (!Array.isArray(rents)) {
                    console.error("Rents is not an array:", rents);
                    alert("後端返回的收入記錄格式錯誤（應為陣列），請聯繫管理員檢查 API 響應。");
                    incomeTableBody.innerHTML = '<tr><td colspan="5">收入記錄格式錯誤，請檢查後端服務</td></tr>';
                    return;
                }

                if (rents.length === 0) {
                    incomeTableBody.innerHTML = '<tr><td colspan="5">無收入記錄</td></tr>';
                    alert("目前無收入記錄，可能原因：\n1. 所選日期範圍內無記錄。\n2. 車位 ID 無效。\n3. 後端服務異常。");
                    return;
                }

                incomeTableBody.innerHTML = '';
                const fragment = document.createDocumentFragment();
                rents.forEach((rent, index) => {
                    const startTime = rent.start_time ? new Date(rent.start_time).toLocaleString("zh-TW", { hour12: false }) : 'N/A';
                    const endTime = rent.actual_end_time || rent.end_time ? new Date(rent.actual_end_time || rent.end_time).toLocaleString("zh-TW", { hour12: false }) : '尚未結束';
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
            const token = getToken();
            const response = await fetch(`${API_URL}/rent`, {
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }
            });
            if (!response.ok) {
                if (response.status === 401) throw new Error("認證失敗，請重新登入！");
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const responseData = await response.json();
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

        async function loadUserData() {
            ownerTableBody.innerHTML = '<tr><td colspan="6">載入中...</td></tr>';
            renterTableBody.innerHTML = '<tr><td colspan="6">載入中...</td></tr>';

            try {
                const token = getToken();
                if (!token) throw new Error("認證令牌缺失，請重新登入！");

                const response = await fetch(`${API_URL}/members/all`, {
                    method: 'GET',
                    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }
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
                            <td>${user.payment_method || '未知'}</td>
                            <td>${user.payment_info || '無'}</td>
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