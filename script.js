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

    // 顯示主畫面，並根據角色動態調整功能清单和預設畫面
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

        if (role === "shared_owner") pageTitle.textContent = "共享者";
        else if (role === "renter") pageTitle.textContent = "租用者";
        else if (role === "admin") pageTitle.textContent = "管理員";

        const navList = document.querySelector(".function-list ul");
        if (!navList) {
            console.error("Navigation list (.function-list ul) not found");
            return;
        }

        if (role === "shared_owner") {
            navList.innerHTML = `
                <li><a href="#" class="nav-link" data-target="addParking">新增車位</a></li>
                <li><a href="#" class="nav-link" data-target="My parking space">我的車位</a></li>
                <li><a href="#" class="nav-link" data-target="incomeInquiry">收入查詢</a></li>
                <li><a href="#" class="nav-link" data-target="profile">個人資料</a></li>
            `;
        } else if (role === "renter") {
            navList.innerHTML = `
                <li><a href="#" class="nav-link" data-target="reserveParking">預約車位</a></li>
                <li><a href="#" class="nav-link" data-target="history">歷史紀錄</a></li>
                <li><a href="#" class="nav-link" data-target="profile">個人資料</a></li>
            `;
        } else if (role === "admin") {
            navList.innerHTML = `
                <li><a href="#" class="nav-link" data-target="addParking">新增車位</a></li>
                <li><a href="#" class="nav-link" data-target="My parking space">我的車位</a></li>
                <li><a href="#" class="nav-link" data-target="viewAllUsers">查看所有用戶資料</a></li>
                <li><a href="#" class="nav-link" data-target="profile">個人資料</a></li>
            `;
        }

        document.querySelectorAll(".content-section").forEach(section => {
            section.style.display = "none";
        });

        const defaultSectionId = role === "shared_owner" ? "My parking space" :
            role === "renter" ? "reserveParking" :
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
        else setupMyParkingSpace();

        const navLinks = document.querySelectorAll(".nav-link");
        // 移除舊的事件監聽器，避免重複綁定
        navLinks.forEach(link => {
            const newLink = link.cloneNode(true);
            link.parentNode.replaceChild(newLink, link);
        });

        // 重新綁定事件
        document.querySelectorAll(".nav-link").forEach(link => {
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
                if (targetId === "My parking space") setupMyParkingSpace();
                else if (targetId === "reserveParking") setupReserveParking();
                else if (targetId === "history") loadHistory();
                else if (targetId === "incomeInquiry") setupIncomeInquiry();
                else if (targetId === "viewAllUsers") setupViewAllUsers();
                else if (targetId === "addParking") setupAddParking();
                else if (targetId === "profile") setupProfile();
            });
        });
    }

    // 設置新增車位功能
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
            alert("無法載入「新增車位」頁面，頁面元素缺失，請聯繫管理員！");
            return;
        }

        // 確保 section 可見並設置內容
        addParkingSection.style.display = "block";
        if (!addParkingSection.innerHTML.trim()) {
            addParkingSection.innerHTML = `
                <p>載入中...</p>
                <!-- 其他動態內容將在此後添加 -->
            `;
        }

        // 自動填充會員 ID
        const memberIdInput = document.getElementById("memberIdInput");
        const memberId = getMemberId();
        if (!memberId) {
            alert("無法獲取會員 ID，請重新登入！");
            showLoginPage();
            return;
        }
        memberIdInput.value = memberId;

        // 動態調整費用標籤（固定為按小時，移除計價方式選擇）
        const priceLabel = document.getElementById("newPriceLabel");
        if (priceLabel) {
            priceLabel.textContent = "半小時費用（元）：";
        } else {
            console.warn("priceLabel not found, using fallback pricing setup");
            addParkingSection.innerHTML += `
                <div>
                    <label id="newPriceLabel">半小時費用（元）：</label>
                    <input type="number" id="newPrice" value="20.00" step="0.01" min="0" required>
                </div>
            `;
        }

        // 檢查 Google Maps API 是否已載入
        const addParkingMap = document.getElementById("addParkingMap");
        const latitudeInput = document.getElementById("latitudeInput");
        const longitudeInput = document.getElementById("longitudeInput");

        if (!addParkingMap || !latitudeInput || !longitudeInput) {
            console.error("Required elements for map in addParking not found: addParkingMap, latitudeInput, or longitudeInput");
            alert("地圖容器或經緯度輸入框未找到，地圖功能將不可用，但您仍可繼續新增車位。");
            addParkingSection.innerHTML += `
                <div id="addParkingMap" style="height: 400px; width: 100%; display: none;"></div>
                <div>
                    <label>經度：</label>
                    <input type="number" id="latitudeInput" value="23.57461380558428" step="0.000001" readonly>
                </div>
                <div>
                    <label>緯度：</label>
                    <input type="number" id="longitudeInput" value="119.58110318336162" step="0.000001" readonly>
                </div>
            `;
        }

        // 固定經緯度為國立澎湖科技大學
        latitudeInput.value = 23.57461380558428;
        longitudeInput.value = 119.58110318336162;
        latitudeInput.disabled = true;
        longitudeInput.disabled = true;

        let map, marker;
        if (!window.isGoogleMapsLoaded || !window.google || !google.maps) {
            console.error("Google Maps API 未載入或載入失敗");
            alert("無法載入 Google Maps API，請檢查網路連線或 API 金鑰是否有效。地圖功能將不可用，但您仍可繼續新增車位。");
            addParkingMap.style.display = "none";
        } else {
            // 初始化地圖，添加 mapId
            addParkingMap.style.display = "block";
            map = new google.maps.Map(addParkingMap, {
                center: { lat: 23.57461380558428, lng: 119.58110318336162 }, // 固定為國立澎湖科技大學
                zoom: 15,
                mapId: "4a9410e1706e086d447136ee" // 使用您提供的 mapId
            });

            marker = new google.maps.marker.AdvancedMarkerElement({
                position: { lat: 23.57461380558428, lng: 119.58110318336162 },
                map: map,
                title: "國立澎湖科技大學",
            });
        }

        // 移除地圖點擊事件，因為經緯度已固定
        latitudeInput.readOnly = true;
        longitudeInput.readOnly = true;

        // 可用日期邏輯（移除是否可用）
        const availableDaysContainer = document.getElementById("availableDaysContainer");
        const addDateButton = document.getElementById("addDateButton");

        function addDateRangeEntry() {
            const dateEntry = document.createElement("div");
            dateEntry.className = "date-range-entry";
            dateEntry.innerHTML = `
                <label>日期 (YYYY-MM-DD)：</label>
                <input type="date" class="new-available-date" required>
                <button type="button" class="remove-range">移除</button>
            `;
            availableDaysContainer.appendChild(dateEntry);

            dateEntry.querySelector(".remove-range").addEventListener("click", () => {
                dateEntry.remove();
            });
        }

        addDateButton.addEventListener("click", addDateRangeEntry);
        addDateRangeEntry(); // 初始添加一個日期輸入

        // 保存車位按鈕事件
        const saveNewSpotButton = document.getElementById("saveNewSpotButton");
        if (!saveNewSpotButton) {
            console.error("saveNewSpotButton not found in the DOM");
            alert("無法找到保存按鈕，請檢查頁面結構！");
            return;
        }
        saveNewSpotButton.addEventListener("click", async () => {
            const newSpot = {
                member_id: parseInt(memberIdInput.value),
                location: document.getElementById("newLocation").value.trim(),
                parking_type: document.getElementById("newParkingType").value,
                floor_level: document.getElementById("newFloorLevel").value.trim(),
                pricing_type: "hourly", // 固定為按小時
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

            // 固定經緯度
            newSpot.latitude = 23.57461380558428;
            newSpot.longitude = 119.58110318336162;

            // 處理可用日期（移除是否可用，假設所有日期均可用）
            const dateEntries = availableDaysContainer.querySelectorAll(".date-range-entry");
            const availableDays = [];
            for (const entry of dateEntries) {
                const date = entry.querySelector(".new-available-date").value;

                if (!date) {
                    alert("請為每個可用日期選擇日期！");
                    return;
                }
                if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
                    alert("日期格式不正確，請使用 YYYY-MM-DD 格式！");
                    return;
                }

                availableDays.push({ date });
            }
            if (availableDays.length > 0) {
                newSpot.available_days = availableDays;
            }

            try {
                const token = getToken();
                if (!token) throw new Error("認證令牌缺失，請重新登入！");

                console.log("Sending new spot data:", JSON.stringify(newSpot, null, 2));

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

        const cancelAddButton = document.getElementById("cancelAddButton");
        if (!cancelAddButton) {
            console.error("cancelAddButton not found in the DOM");
            alert("無法找到取消按鈕，請檢查頁面結構！");
            return;
        }
        cancelAddButton.addEventListener("click", () => {
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
                    const validRoles = ["shared_owner", "renter", "admin"];
                    if (!validRoles.includes(role)) {
                        showError(`後端返回的角色 "${role}" 無效，應為 ${validRoles.join(", ")} 之一！`);
                        return;
                    }
                    setRole(role);
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

    // 設置我的列表
    function setupMyParkingSpace() {
        const role = getRole();
        console.log("Current role in setupMyParkingSpace:", role);
        if (!["shared_owner", "admin"].includes(role)) {
            alert("您沒有權限訪問此功能！");
            return;
        }

        const parkingTableBody = document.getElementById("My parking spaceTableBody");
        if (!parkingTableBody) {
            console.error("Required element not found for My parking space: parkingTableBody");
            alert("無法載入「我的列表」頁面，頁面元素缺失，請聯繫管理員！");
            return;
        }

        // 進入頁面時顯示「載入中...」
        parkingTableBody.innerHTML = '<tr><td colspan="7">載入中...</td></tr>';

        // 編輯表單容器
        let editFormContainer = document.getElementById("editParkingFormContainer");
        if (!editFormContainer) {
            editFormContainer = document.createElement("div");
            editFormContainer.id = "editParkingFormContainer";
            editFormContainer.style.display = "none";
            document.getElementById("My parking space").appendChild(editFormContainer);
        }

        // 顯示編輯表單
        function showEditForm(spot) {
            editFormContainer.innerHTML = `
                <h3>編輯車位</h3>
                <form id="editParkingForm">
                    <input type="hidden" id="editSpotId" value="${spot.spot_id || ''}">
                    <div>
                        <label>位置：</label>
                        <input type="text" id="editLocation" value="${spot.location || ''}" maxlength="50" required>
                    </div>
                    <div>
                        <label>停車類型：</label>
                        <select id="editParkingType" required>
                            <option value="flat" ${spot.parking_type === 'flat' ? 'selected' : ''}>平面</option>
                            <option value="mechanical" ${spot.parking_type === 'mechanical' ? 'selected' : ''}>機械</option>
                        </select>
                    </div>
                    <div>
                        <label>樓層（"ground", "1F", "B1" 等，留空將使用預設值 "ground"）：</label>
                        <input type="text" id="editFloorLevel" value="${spot.floor_level || ''}" maxlength="20" placeholder="例如: ground, 1F, B1">
                    </div>
                    <div>
                        <label>每半小時價格（元）：</label>
                        <input type="number" id="editPricePerHalfHour" value="${spot.price_per_half_hour || 0}" step="0.01" min="0" required>
                    </div>
                    <div>
                        <label>每日最高價格（元）：</label>
                        <input type="number" id="editDailyMaxPrice" value="${spot.daily_max_price || 0}" step="0.01" min="0" required>
                    </div>
                    <div>
                        <label>經度：</label>
                        <input type="number" id="editLongitude" value="119.58110318336162" step="0.000001" readonly>
                    </div>
                    <div>
                        <label>緯度：</label>
                        <input type="number" id="editLatitude" value="23.57461380558428" step="0.000001" readonly>
                    </div>
                    <button type="button" id="saveEditSpotButton">保存</button>
                    <button type="button" id="cancelEditSpotButton">取消</button>
                </form>
            `;
            editFormContainer.style.display = "block";

            // 保存編輯
            document.getElementById("saveEditSpotButton").addEventListener("click", async () => {
                const updatedSpot = {
                    location: document.getElementById("editLocation").value.trim(),
                    parking_type: document.getElementById("editParkingType").value,
                    floor_level: document.getElementById("editFloorLevel").value.trim() || "ground",
                    pricing_type: "hourly",
                    price_per_half_hour: parseFloat(document.getElementById("editPricePerHalfHour").value) || 0,
                    daily_max_price: parseFloat(document.getElementById("editDailyMaxPrice").value) || 0,
                    longitude: 119.58110318336162,
                    latitude: 23.57461380558428,
                };

                if (!updatedSpot.location) {
                    alert("位置為必填項！");
                    return;
                }
                if (updatedSpot.location.length > 50) {
                    alert("位置最多 50 個字符！");
                    return;
                }
                if (!["flat", "mechanical"].includes(updatedSpot.parking_type)) {
                    alert("停車類型必須為 'flat' 或 'mechanical'！");
                    return;
                }
                const floorLevelPattern = /^(ground|([1-9][0-9]*[F])|(B[1-9][0-9]*))$/i;
                if (updatedSpot.floor_level && !floorLevelPattern.test(updatedSpot.floor_level)) {
                    alert("樓層格式無效！請使用 'ground', '1F', 'B1' 等格式（最多20字）。");
                    return;
                }
                if (updatedSpot.floor_level && updatedSpot.floor_level.length > 20) {
                    alert("樓層最多 20 個字符！");
                    return;
                }
                if (updatedSpot.price_per_half_hour < 0) {
                    alert("每半小時價格必須為正數！");
                    return;
                }
                if (updatedSpot.daily_max_price < 0) {
                    alert("每日最高價格必須為正數！");
                    return;
                }

                try {
                    const token = getToken();
                    if (!token) throw new Error("認證令牌缺失，請重新登入！");

                    const spotId = document.getElementById("editSpotId").value;
                    const response = await fetch(`${API_URL}/parking/${spotId}`, {
                        method: 'PUT',
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${token}`
                        },
                        body: JSON.stringify(updatedSpot)
                    });

                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({ error: '未知錯誤' }));
                        throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorData.error || '未知錯誤'}`);
                    }

                    alert("車位已成功更新！");
                    editFormContainer.style.display = "none";
                    loadAllSpots();
                } catch (error) {
                    console.error("Failed to update spot:", error);
                    alert(`無法更新車位，請檢查輸入或聯繫管理員 (錯誤: ${error.message})`);
                    if (error.message.includes("認證失敗")) {
                        removeToken();
                        showLoginPage(true);
                    }
                }
            });

            // 取消編輯
            document.getElementById("cancelEditSpotButton").addEventListener("click", () => {
                editFormContainer.style.display = "none";
            });
        }

        // 獲取並顯示所有車位
        async function loadAllSpots() {
            try {
                const token = getToken();
                if (!token) throw new Error("認證令牌缺失，請重新登入！");

                const memberId = getMemberId();
                if (!memberId) throw new Error("無法獲取會員 ID，請重新登入！");

                let url;
                if (role === "shared_owner") {
                    url = `${API_URL}/parking/my-spots`;
                } else if (role === "admin") {
                    url = `${API_URL}/parking/my-spots`;
                }

                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    if (response.status === 404) throw new Error("後端資源未找到 (404)，請檢查 API 端點是否正確配置！");
                    if (response.status === 401) throw new Error("認證失敗，請重新登入！");
                    const errorData = await response.text();
                    throw new Error(`HTTP 錯誤！狀態: ${response.status}, 回應: ${errorData}`);
                }

                const contentType = response.headers.get('content-type');
                if (!contentType || !contentType.includes('application/json')) {
                    const textResponse = await response.text();
                    throw new Error("後端返回非 JSON 響應，請檢查伺服器配置 (回應內容: " + textResponse.substring(0, 100) + "...)");
                }

                const data = await response.json();
                let spots = data.data || data.spots || data;
                if (!Array.isArray(spots)) {
                    console.warn("後端返回的車位資料非陣列，嘗試解析:", spots);
                    spots = [];
                }

                if (spots.length === 0) {
                    parkingTableBody.innerHTML = '<tr><td colspan="7">無車位資料</td></tr>';
                    return;
                }

                parkingTableBody.innerHTML = '';
                const parkingFragment = document.createDocumentFragment();

                spots.forEach(spot => {
                    if (!spot || typeof spot !== 'object') {
                        console.warn("Invalid spot data skipped:", spot);
                        return;
                    }

                    const row = document.createElement("tr");
                    row.setAttribute("data-id", `${spot.spot_id || '未知'}`);

                    const priceDisplay = `${spot.price_per_half_hour || 0} 元/半小時`;

                    row.innerHTML = `
                    <td>${spot.spot_id || '未知'}</td>
                    <td>${spot.location || '未知'}</td>
                    <td>${spot.parking_type === "flat" ? "平面" : "機械"}</td>
                    <td>${spot.floor_level === "ground" ? "地面" : `地下${spot.floor_level?.startsWith("B") ? spot.floor_level.slice(1) : spot.floor_level || '未知'}樓`}</td>
                    <td>按小時</td>
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
                        if (!confirm(`確定要刪除車位 ${spot.spot_id || '未知'} 嗎？此操作無法恢復！`)) return;

                        try {
                            const token = getToken();
                            if (!token) throw new Error("認證令牌缺失，請重新登入！");

                            const response = await fetch(`${API_URL}/parking/${spot.spot_id || ''}`, {
                                method: 'DELETE',
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

                            alert(`車位 ${spot.spot_id || '未知'} 已成功刪除！`);
                            row.remove();
                            if (parkingTableBody.children.length === 0) {
                                parkingTableBody.innerHTML = '<tr><td colspan="7">無車位資料</td></tr>';
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

                    parkingFragment.appendChild(row);
                });

                if (parkingFragment.children.length === 0) {
                    parkingTableBody.innerHTML = '<tr><td colspan="7">無車位資料</td></tr>';
                } else {
                    parkingTableBody.appendChild(parkingFragment);
                }
            } catch (error) {
                console.error("Failed to load spots:", error);
                parkingTableBody.innerHTML = `<tr><td colspan="7">載入車位資料失敗 (錯誤: ${error.message})</td></tr>`;
                if (error.message.includes("認證失敗")) {
                    removeToken();
                    showLoginPage(true);
                }
            }
        }

        // 進入頁面時自動加載所有車位
        loadAllSpots();
    }

    // 設置個人資料
    function setupProfile() {
        const role = getRole();
        console.log("Current role in setupProfile:", role);
        if (!["shared_owner", "renter", "admin"].includes(role)) {
            alert("您沒有權限訪問此功能！");
            return;
        }

        const profileSection = document.getElementById("profile");
        if (!profileSection) {
            console.error("profile section not found");
            alert("無法載入「個人資料」頁面，頁面元素缺失，請聯繫管理員！");
            return;
        }
        profileSection.style.display = "block";

        const profileData = document.getElementById("profileData");
        const editProfileForm = document.getElementById("editProfileForm");
        const editName = document.getElementById("editName");
        const editPhone = document.getElementById("editPhone");
        const editEmail = document.getElementById("editEmail");
        const editLicensePlate = document.getElementById("editLicensePlate");
        const editCarModel = document.getElementById("editCarModel");
        const editPaymentMethod = document.getElementById("editPaymentMethod");
        const editCardNumber = document.getElementById("editCardNumber");
        const saveProfileButton = document.getElementById("saveProfileButton");
        const editProfileButton = document.getElementById("editProfileButton");
        const cancelEditProfileButton = document.getElementById("cancelEditProfileButton");

        if (!profileData || !editProfileForm || !editName || !editPhone || !editEmail || !editLicensePlate || !editCarModel || !editPaymentMethod || !editCardNumber || !saveProfileButton || !editProfileButton || !cancelEditProfileButton) {
            console.error("Required elements for profile section are missing");
            alert("個人資料頁面元素缺失，請聯繫管理員！");
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

                // 根據角色動態顯示個人資料
                let profileHTML = `
                    <p><strong>姓名：</strong> ${profile.name || '未提供'}</p>
                    <p><strong>電話：</strong> ${profile.phone || '未提供'}</p>
                    <p><strong>電子郵件：</strong> ${profile.email || '未提供'}</p>
                    <p><strong>付款方式：</strong> ${profile.payment_method || '未提供'}</p>
                    <p><strong>信用卡號：</strong> ${profile.payment_info || '未提供'}</p>
                `;

                if (role === "renter") {
                    profileHTML += `
                        <p><strong>車牌號碼：</strong> ${profile.license_plate || '未提供'}</p>
                        <p><strong>車型：</strong> ${profile.car_model || '未提供'}</p>
                    `;
                }

                profileData.innerHTML = profileHTML;

                // 填充編輯表單
                editName.value = profile.name || '';
                editPhone.value = profile.phone || '';
                editEmail.value = profile.email || '';
                editLicensePlate.value = profile.license_plate || '';
                editCarModel.value = profile.car_model || '';
                editPaymentMethod.value = profile.payment_method || 'credit_card';
                editCardNumber.value = profile.payment_info || '';

                // 根據角色顯示或隱藏租用者專用欄位
                const renterEditFields = document.getElementById("renterEditFields");
                if (renterEditFields) {
                    renterEditFields.style.display = role === "renter" ? "block" : "none";
                }
            } catch (error) {
                console.error("Failed to load profile:", error);
                profileData.innerHTML = `<p>載入個人資料失敗（錯誤: ${error.message}）</p>`;
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
                payment_method: editPaymentMethod.value,
                payment_info: editCardNumber.value.trim()
            };

            // 如果是租用者，添加車牌號碼和車型
            if (role === "renter") {
                updatedProfile.license_plate = editLicensePlate.value.trim();
                updatedProfile.car_model = editCarModel.value.trim();

                // 驗證車牌號碼格式（例如 AAA-1111）
                if (updatedProfile.license_plate && !/^[A-Z]{2,3}-[0-9]{3,4}$/.test(updatedProfile.license_plate)) {
                    alert("請提供有效的車牌號碼（格式如：AAA-1111）！");
                    return;
                }

                // 驗證車型（簡單檢查不為空）
                if (!updatedProfile.car_model) {
                    alert("車型為必填項！");
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
                alert("個人資料更新成功！");
                editProfileForm.style.display = "none";
                profileData.style.display = "block";
                loadProfile();
            } catch (error) {
                console.error("Failed to update profile:", error);
                alert(`更新個人資料失敗（錯誤: ${error.message}）`);
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

    // 設置預約停車

    // 在 setupReserveParking 開始時清理舊的定時器
    let refreshIntervalId = null;

    async function setupReserveParking() {
        // 清理舊的定時器
        if (refreshIntervalId) {
            clearInterval(refreshIntervalId);
            refreshIntervalId = null;
        }

        const role = getRole();
        console.log("Current role in setupReserveParking:", role);
        // 根據後端需求，/reserve 端點允許 renter 和 shared_owner
        if (role !== "renter" && role !== "shared_owner") {
            alert("此功能僅限租用者或共享車主使用！");
            return;
        }

        if (!await checkAuth()) return;

        const reserveSection = document.getElementById("reserveParking");
        reserveSection.style.display = "block";

        const reserveDateInput = document.getElementById("reserveDate");
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

        if (!reserveDateInput || !startTimeInput || !endTimeInput || !reserveSearchButton || !parkingTableBody || !reserveParkingMap) {
            console.warn("Required elements not found for reserveParking");
            return;
        }

        const today = new Date().toISOString().split('T')[0];
        reserveDateInput.value = today;
        startTimeInput.value = "09:00";
        endTimeInput.value = "17:00";

        if (!window.isGoogleMapsLoaded || !window.google || !google.maps) {
            console.error("Google Maps API 未載入或載入失敗");
            alert("無法載入 Google Maps API，請檢查網路連線或 API 金鑰是否有效。地圖功能將不可用。");
            reserveParkingMap.style.display = "none";
            return;
        }

        let map = window.map || null;
        if (!map) {
            map = new google.maps.Map(reserveParkingMap, {
                center: { lat: 23.57461380558428, lng: 119.58110318336162 },
                zoom: 15,
                mapId: "4a9410e1706e086d447136ee"
            });
            map.markers = [];
            window.map = map;
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
            const searchQuery = reserveSearchInput ? reserveSearchInput.value.trim().toLowerCase() : '';
            const filterCity = reserveCity ? reserveCity.value : 'all';
            const filterType = reserveParkingType ? reserveParkingType.value : 'all';
            const filterFloor = reserveFloor ? reserveFloor.value : 'all';
            const filterPricing = reservePricing ? reservePricing.value : 'all';
            const filterStatus = reserveStatus ? reserveStatus.value : 'all';

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

            let latitude = 23.57461380558428;
            let longitude = 119.58110318336162;
            try {
                const position = await new Promise((resolve, reject) => {
                    if (!navigator.geolocation) reject(new Error("瀏覽器不支援地理位置功能"));
                    navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000, maximumAge: 0 });
                });
                latitude = position.coords.latitude;
                longitude = position.coords.longitude;
                map.setCenter({ lat: latitude, lng: longitude });
            } catch (error) {
                console.warn("Failed to get user location, using default:", error.message);
                alert("無法獲取您的位置，將使用預設位置（國立澎湖科技大學）。請確保已允許位置權限。");
                map.setCenter({ lat: latitude, lng: longitude });
            }

            const startDateTimeStr = startDateTime.toISOString().slice(0, 19); // 格式化為 YYYY-MM-DDThh:mm:ss
            const endDateTimeStr = endDateTime.toISOString().slice(0, 19);     // 格式化為 YYYY-MM-DDThh:mm:ss

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
                    console.log("Fetched spots:", spots);
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
                if (filterStatus !== "all") match = match && (filterStatus === "available" ? spot.status === "可用" || spot.status === "available" : filterStatus === "occupied" ? ["已佔用", "occupied", "預約", "reserved"].includes(spot.status) : true);
                return match;
            });

            if (filteredSpots.length === 0) {
                parkingTableBody.innerHTML = '<tr><td colspan="7">無符合條件的車位，請嘗試更改篩選條件</td></tr>';
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
                    const markerElement = document.createElement("div");
                    markerElement.style.width = "20px";
                    markerElement.style.height = "20px";
                    markerElement.style.borderRadius = "50%";
                    markerElement.style.border = "2px solid white";
                    console.log("Spot status:", spot.status);
                    if (spot.status === "可用" || spot.status === "available") {
                        markerElement.style.backgroundColor = "green";
                    } else if (spot.status === "已佔用" || spot.status === "occupied") {
                        markerElement.style.backgroundColor = "red";
                    } else if (spot.status === "預約" || spot.status === "reserved") {
                        markerElement.style.backgroundColor = "blue";
                    } else {
                        console.warn("Unknown status:", spot.status);
                        markerElement.style.backgroundColor = "gray";
                    }

                    const marker = new google.maps.marker.AdvancedMarkerElement({
                        position: position,
                        map: map,
                        content: markerElement,
                        title: `車位 ${spot.spot_id} - ${address}`
                    });
                    map.markers.push(marker);
                    bounds.extend(position);
                }
            });

            map.fitBounds(bounds);
            if (filteredSpots.length === 1) map.setZoom(15);

            parkingTableBody.innerHTML = '';
            const fragment = document.createDocumentFragment();
            filteredSpots.forEach(spot => {
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
                    <button class="reserve-btn" ${spot.status === "可用" || spot.status === "available" ? '' : 'disabled'}>預約</button>
                </td>
            `;
                if (spot.status === "可用" || spot.status === "available") {
                    row.querySelector(".reserve-btn").addEventListener("click", () => {
                        handleReserveParkingClick(spot.spot_id, selectedDate, selectedDate, startTime, endTime, row);
                        setParkingSpotId(spot.spot_id);
                    });
                }
                fragment.appendChild(row);
            });

            parkingTableBody.appendChild(fragment);
            parkingTableBody.style.display = 'none';
            parkingTableBody.offsetHeight;
            parkingTableBody.style.display = 'table-row-group';
        }, 500);

        refreshIntervalId = setInterval(async () => {
            if (reserveSection.style.display === "none") {
                clearInterval(refreshIntervalId);
                refreshIntervalId = null;
                return;
            }
            await debouncedHandleReserveSearch();
            console.log("車位狀態已更新");
        }, 60000);

        const newButton = reserveSearchButton.cloneNode(true);
        reserveSearchButton.parentNode.replaceChild(newButton, reserveSearchButton);
        newButton.addEventListener("click", debouncedHandleReserveSearch);

        const newInput = reserveSearchInput.cloneNode(true);
        reserveSearchInput.parentNode.replaceChild(newInput, reserveSearchInput);
        newInput.addEventListener("keypress", function (event) {
            if (event.key === "Enter") debouncedHandleReserveSearch();
        });
    }

    // 預約停車點擊處理
    async function handleReserveParkingClick(spotId, startDate, endDate, startTime, endTime, row) {
        if (!await checkAuth()) return;

        const role = getRole();
        // 根據後端需求，/reserve 端點允許 renter 和 shared_owner
        if (role !== "renter" && role !== "shared_owner") {
            alert("此功能僅限租用者或共享車主使用！");
            return;
        }

        try {
            if (isNaN(spotId)) {
                alert("無效的車位 ID！");
                return;
            }

            // 構建正確的日期時間格式 YYYY-MM-DDThh:mm:ss
            const startDateTime = new Date(`${startDate}T${startTime}:00`).toISOString().slice(0, 19);
            const endDateTime = new Date(`${endDate}T${endTime}:00`).toISOString().slice(0, 19);

            const token = getToken();
            const response = await fetch(`${API_URL}/reserve`, {
                method: 'POST',
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({
                    spot_id: spotId,
                    start_time: startDateTime,
                    end_time: endDateTime
                })
            });

            // 檢查響應狀態碼
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error("預約端點未找到（404），請確認後端服務是否運行，或檢查 API 路徑是否正確");
                }
                if (response.status === 401) {
                    throw new Error("認證失敗，請重新登入！");
                }

                // 嘗試解析錯誤訊息
                const contentType = response.headers.get('content-type');
                if (contentType?.includes('application/json')) {
                    const result = await response.json();
                    throw new Error(result.error || `預約失敗！（錯誤碼：${response.status}）`);
                } else {
                    // 如果不是 JSON，嘗試讀取純文本錯誤訊息
                    const text = await response.text();
                    throw new Error(`後端返回非 JSON 響應：${text || '未知錯誤'}，請檢查伺服器配置`);
                }
            }

            // 確保響應是 JSON 格式
            const contentType = response.headers.get('content-type');
            if (!contentType?.includes('application/json')) {
                const text = await response.text();
                throw new Error(`後端返回非 JSON 響應：${text || '未知錯誤'}，請檢查伺服器配置`);
            }

            await response.json();
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
                        const startTime = rent.start_time || 'N/A'; // 顯示完整日期時間，例如 2025-04-15 09:00:00
                        const endTime = rent.actual_end_time || 'N/A'; // 顯示完整日期時間，例如 2025-04-15 11:00:00
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
            if (!response.headers.get('content-type')?.includes('application/json')) {
                throw new Error("後端返回非 JSON 響應，請檢查伺服器配置");
            }
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