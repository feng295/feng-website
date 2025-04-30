console.log("script.js loaded");

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
            } else if (activeSection.id === "viewParking") {
                setupViewParking();
            } else if (activeSection.id === "incomeInquiry") {
                setupIncomeInquiry();
            }
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

    // 當身份改變時，顯示或隱藏租用者專用欄位
    roleInput.addEventListener("change", function () {
        if (roleInput.value === "renter" && !isLogin) {
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
            if (!isLogin) {
                cardNumberInput.setAttribute("required", "true");
            }
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
        if (phoneRegex.test(value)) {
            showSuccess("電話號碼格式正確");
        } else {
            showError("請提供有效的電話號碼（10位數字）");
        }
    });

    // 車牌號碼輸入驗證（格式如 AAA-1111）
    licensePlateInput.addEventListener("input", function () {
        const licensePlate = this.value.trim();
        const licensePlateRegex = /^[A-Z]{2,3}-[0-9]{3,4}$/;
        if (licensePlateRegex.test(licensePlate)) {
            showSuccess("車牌號碼格式正確");
        } else {
            showError("請輸入有效車牌號碼（格式如 AAA-1111）");
        }
    });

    // 信用卡號輸入格式化（自動加上 "-"）
    cardNumberInput.addEventListener("input", function () {
        let value = cardNumberInput.value.replace(/\D/g, "");
        value = value.replace(/(\d{4})(?=\d)/g, "$1-");
        if (value.length > 19) value = value.slice(0, 19); // 限制為16位數字+3個破折號
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
            if (paymentMethodInput.value === "credit_card") {
                cardNumberContainer.style.display = "block";
            }
            if (roleInput.value === "renter") {
                renterFields.style.display = "block";
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
            if (roleInput.value === "renter") {
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
            const license_plate = licensePlateInput.value.trim();
            const vehicle_type = vehicleTypeInput.value.trim();

            const errors = [];
            if (!name) errors.push("請填寫姓名");
            if (!phone) errors.push("請填寫電話號碼");
            if (!role) errors.push("請選擇身份");
            if (!payment_method) errors.push("請選擇付款方式");
            if (role === "renter") {
                if (!license_plate) errors.push("請填寫車牌號碼");
                if (!vehicle_type) errors.push("請填寫車型");
                const licensePlateRegex = /^[A-Z]{2,3}-[0-9]{3,4}$/;
                if (!licensePlateRegex.test(license_plate)) {
                    errors.push("請提供有效的車牌號碼（格式如 AAA-1111）");
                }
            }

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
                    body: JSON.stringify({ name, email, password: cleanedPassword, phone, role, payment_method, payment_info, license_plate, vehicle_type })
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

    // 設置查看車位
    function setupViewParking() {
        const parkingTableBody = document.getElementById("viewParkingTableBody");
        const specificSpotInput = document.getElementById("specificSpotInput");
        const specificSpotButton = document.getElementById("specificSpotButton");

        if (!parkingTableBody || !specificSpotInput || !specificSpotButton) {
            console.warn("Required elements not found for viewParking");
            return;
        }

        // 初始化表格
        parkingTableBody.innerHTML = '<tr><td colspan="7">請點擊查詢以查看車位</td></tr>';

        // 查詢特定車位（GET /api/v1/parking/:id）
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
                const token = getToken();
                if (!token) {
                    throw new Error("認證令牌缺失，請重新登入！");
                }

                const response = await fetch(`${API_URL}/parking/${spotId}`, {
                    method: 'GET',
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    }
                });
                console.log(`Specific spot fetch response status: ${response.status}`);
                if (!response.headers.get('content-type')?.includes('application/json')) {
                    throw new Error("後端返回非 JSON 響應，請檢查伺服器配置");
                }
                if (!response.ok) {
                    if (response.status === 401) {
                        throw new Error("認證失敗，請重新登入！");
                    }
                    if (response.status === 404) {
                        throw new Error("車位不存在！");
                    }
                    const errorData = await response.json();
                    throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorData.error || '未知錯誤'}`);
                }
                const spot = await response.json();
                console.log(`Specific spot data:`, spot);

                const spotData = spot.data || spot;

                if (!spotData.spot_id) {
                    throw new Error("後端返回的車位資料格式錯誤，缺少必要字段！");
                }

                parkingTableBody.innerHTML = '';
                const row = document.createElement("tr");
                row.setAttribute("data-id", `${spotData.spot_id}`);

                row.innerHTML = `
                    <td>${spotData.spot_id}</td>
                    <td>${spotData.location || '未知'}</td>
                    <td>${spotData.parking_type === "flat" ? "平面" : "機械"}</td>
                    <td>${spotData.floor_level === "ground" ? "地面" : `地下${spotData.floor_level.startsWith("B") ? spotData.floor_level.slice(1) : spotData.floor_level}樓`}</td>
                    <td>${spotData.pricing_type === "hourly" ? "按小時" : spotData.pricing_type === "daily" ? "按日" : "按月"}</td>
                    <td>${spotData.hourly_rate || 0} 元/半小時</td>
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

        // 顯示編輯表單並處理更新（PUT /api/v1/parking/:id）
        function showEditForm(spot) {
            const existingForm = document.getElementById("editSpotForm");
            if (existingForm) {
                existingForm.remove();
            }

            const editForm = document.createElement("div");
            editForm.id = "editSpotForm";
            editForm.style.marginTop = "20px";
            editForm.innerHTML = `
                <h3>編輯車位 ${spot.spot_id}</h3>
                <div>
                    <label>地址：</label>
                    <input type="text" id="editLocation" value="${spot.location || ''}" />
                </div>
                <div>
                    <label>停車類型：</label>
                    <select id="editParkingType">
                        <option value="flat" ${spot.parking_type === "flat" ? "selected" : ""}>平面</option>
                        <option value="mechanical" ${spot.parking_type === "mechanical" ? "selected" : ""}>機械</option>
                    </select>
                </div>
                <div>
                    <label>計費方式：</label>
                    <select id="editPricingType">
                        <option value="hourly" ${spot.pricing_type === "hourly" ? "selected" : ""}>按小時</option>
                        <option value="daily" ${spot.pricing_type === "daily" ? "selected" : ""}>按日</option>
                        <option value="monthly" ${spot.pricing_type === "monthly" ? "selected" : ""}>按月</option>
                    </select>
                </div>
                <div>
                    <label>半小時費用（元）：</label>
                    <span>${spot.hourly_rate || 0} 元/半小時</span>
                </div>
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
                    const token = getToken();
                    if (!token) {
                        throw new Error("認證令牌缺失，請重新登入！");
                    }

                    const response = await fetch(`${API_URL}/parking/${spot.spot_id}`, {
                        method: 'PUT',
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${token}`
                        },
                        body: JSON.stringify(updatedSpot)
                    });
                    console.log(`Update spot response status: ${response.status}`);
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
                    const result = await response.json();
                    console.log("Spot updated successfully:", result);
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

            document.getElementById("cancelEditButton").addEventListener("click", () => {
                editForm.remove();
            });
        }

        specificSpotButton.addEventListener("click", handleSpecificSpotSearch);
        specificSpotInput.addEventListener("keypress", function (event) {
            if (event.key === "Enter") {
                handleSpecificSpotSearch();
            }
        });
    }

    // 設置預約停車
    async function setupReserveParking() {
        if (!await checkAuth()) return;

        const reserveSection = document.getElementById("reserveParking");
        console.log("Reserve section display before setup:", reserveSection.style.display);
        reserveSection.style.display = "block";
        console.log("Reserve section display after setup:", reserveSection.style.display);

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

        if (!reserveDateInput || !startTimeInput || !endTimeInput || !reserveSearchButton || !parkingTableBody) {
            console.warn("Required elements not found for reserveParking");
            return;
        }

        // 設置預設日期為今天
        const today = new Date().toISOString().split('T')[0];
        reserveDateInput.value = today;

        // 設置預設時間（例如 09:00 到 17:00）
        startTimeInput.value = "09:00";
        endTimeInput.value = "17:00";

        async function handleReserveSearch() {
            const date = reserveDateInput.value;
            const startTime = startTimeInput.value;
            const endTime = endTimeInput.value;
            const searchQuery = reserveSearchInput ? reserveSearchInput.value.trim().toLowerCase() : '';
            const filterCity = reserveCity ? reserveCity.value : 'all';
            const filterType = reserveParkingType ? reserveParkingType.value : 'all';
            const filterFloor = reserveFloor ? reserveFloor.value : 'all';
            const filterPricing = reservePricing ? reservePricing.value : 'all';
            const filterStatus = reserveStatus ? reserveStatus.value : 'all';

            // 驗證輸入
            if (!date) {
                alert("請選擇日期！");
                return;
            }
            if (!startTime || !endTime) {
                alert("請選擇開始和結束時間！");
                return;
            }
            if (startTime >= endTime) {
                alert("結束時間必須晚於開始時間！");
                return;
            }

            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!dateRegex.test(date)) {
                alert("日期格式不正確，請使用 YYYY-MM-DD 格式！");
                return;
            }

            parkingTableBody.innerHTML = '<tr><td colspan="7">載入中...</td></tr>';

            // 動態獲取經緯度
            let latitude = 25.0330; // 預設值（台北市）
            let longitude = 121.5654;
            try {
                const position = await new Promise((resolve, reject) => {
                    if (!navigator.geolocation) {
                        reject(new Error("瀏覽器不支援地理位置功能"));
                    }
                    navigator.geolocation.getCurrentPosition(resolve, reject, {
                        timeout: 10000, // 10秒超時
                        maximumAge: 0 // 不使用緩存
                    });
                });
                latitude = position.coords.latitude;
                longitude = position.coords.longitude;
                console.log(`User location: latitude=${latitude}, longitude=${longitude}`);
            } catch (error) {
                console.warn("Failed to get user location, using default:", error.message);
                console.log(`Using default location: latitude=${latitude}, longitude=${longitude}`);
                alert("無法獲取您的位置，將使用預設位置（台北市）。請確保已允許位置權限。");
            }

            // 組合 start_time 和 end_time 為 ISO 8601 格式，包含時區
            const timeZoneOffset = "+08:00"; // 假設使用台灣時區 (UTC+8)
            const startDateTime = `${date}T${startTime}:00${timeZoneOffset}`; // 例如 "2025-04-29T09:00:00+08:00"
            const endDateTime = `${date}T${endTime}:00${timeZoneOffset}`; // 例如 "2025-04-29T17:00:00+08:00"

            // 記錄請求參數
            console.log("Sending request with parameters:", {
                date,
                start_time: startDateTime,
                end_time: endDateTime,
                latitude,
                longitude,
                filterCity,
                filterType,
                filterFloor,
                filterPricing,
                filterStatus
            });

            let retries = 3;
            let spots = null;
            while (retries > 0) {
                try {
                    const token = getToken();
                    if (!token) {
                        throw new Error("認證令牌缺失，請重新登入！");
                    }

                    // 發送請求，包含所有參數
                    const queryParams = new URLSearchParams({
                        date: date,
                        start_time: startDateTime,
                        end_time: endDateTime,
                        latitude: latitude,
                        longitude: longitude
                    });
                    const requestUrl = `${API_URL}/parking/available?${queryParams.toString()}`;
                    console.log(`Fetching available spots from: ${requestUrl}`);

                    const response = await fetch(requestUrl, {
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${token}`,
                        },
                    });
                    console.log(`Reserve parking fetch response status: ${response.status}`);
                    console.log(`Response headers:`, response.headers);

                    if (!response.headers.get("content-type")?.includes("application/json")) {
                        throw new Error("後端返回非 JSON 響應，請檢查伺服器配置");
                    }
                    if (!response.ok) {
                        if (response.status === 401) {
                            throw new Error("認證失敗，請重新登入！");
                        }
                        const errorData = await response.json();
                        console.error("Error response from server:", errorData);
                        throw new Error(
                            `HTTP error! Status: ${response.status}, Message: ${errorData.error || "未知錯誤"}`
                        );
                    }

                    const data = await response.json();
                    console.log(`Raw response data:`, data);

                    spots = data;
                    if (!Array.isArray(spots)) {
                        if (data.data && Array.isArray(data.data)) {
                            spots = data.data;
                        } else if (data.spots && Array.isArray(data.spots)) {
                            spots = data.spots;
                        } else {
                            console.error("Spots data format is invalid:", data);
                            throw new Error("後端返回的車位資料格式錯誤，應為陣列");
                        }
                    }
                    console.log("Extracted spots array:", spots);
                    break;
                } catch (error) {
                    console.error(
                        `Failed to fetch available spots (attempt ${4 - retries}/3):`,
                        error
                    );
                    retries--;
                    if (retries === 0) {
                        alert(`無法載入車位資料，請檢查後端服務 (錯誤: ${error.message})`);
                        parkingTableBody.innerHTML =
                            '<tr><td colspan="7">無法載入車位資料</td></tr>';
                        if (error.message === "認證失敗，請重新登入！") {
                            removeToken();
                            showLoginPage(true);
                        }
                        return;
                    }
                    await new Promise((resolve) => setTimeout(resolve, 1000));
                }
            }

            if (!spots || spots.length === 0) {
                console.warn("No parking spots returned from the server");
                alert(
                    "後端未返回任何車位資料，可能原因：\n" +
                    "1. 所選日期或時間段沒有可用車位，請嘗試其他日期或時間。\n" +
                    "2. 當前位置範圍內無車位，請確認您的位置或允許位置權限。\n" +
                    "3. 後端服務異常，請聯繫管理員。"
                );
                parkingTableBody.innerHTML = '<tr><td colspan="7">無可用車位，請嘗試更改日期、時間或位置</td></tr>';
                return;
            }

            let filteredSpots = spots;
            console.log("Before filtering:", filteredSpots);

            // 篩選條件
            if (searchQuery) {
                filteredSpots = filteredSpots.filter(spot =>
                    spot.spot_id.toString().toLowerCase().includes(searchQuery) ||
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

            console.log("After filtering:", filteredSpots);
            console.log("Filtered spots content:", JSON.stringify(filteredSpots, null, 2));

            if (filteredSpots.length === 0) {
                console.warn("No parking spots match the filters");
                alert(`所選條件目前沒有符合的車位！請調整篩選條件（例如選擇「全部」）。`);
                parkingTableBody.innerHTML = '<tr><td colspan="7">無符合條件的車位，請嘗試更改篩選條件</td></tr>';
                return;
            }

            const fragment = document.createDocumentFragment();
            console.log("Generating parking table with filtered spots:", filteredSpots);
            filteredSpots.forEach(spot => {
                console.log("Processing spot:", spot);
                const row = document.createElement("tr");
                row.setAttribute("data-id", `${spot.spot_id}`);
                if (spot.status === "available" || spot.status === "可用") {
                    row.classList.add("available");
                } else if (spot.status === "預約") {
                    row.classList.add("reserved");
                } else {
                    row.classList.add("occupied");
                }

                row.innerHTML = `
                    <td>${spot.spot_id}</td>
                    <td>${spot.location || '未知'}</td>
                    <td>${spot.parking_type === "flat" ? "平面" : "機械"}</td>
                    <td>${spot.floor_level === "ground" ? "地面" : `地下${spot.floor_level.startsWith("B") ? spot.floor_level.slice(1) : spot.floor_level}樓`}</td>
                    <td>${spot.pricing_type === "hourly" ? "按小時" : spot.pricing_type === "daily" ? "按日" : "按月"}</td>
                    <td>${spot.status === "available" || spot.status === "可用" ? "可用" : spot.status === "occupied" || spot.status === "已佔用" ? "已佔用" : "預約"}</td>
                    <td><button class="reserve-btn" ${spot.status === "available" || spot.status === "可用" ? '' : 'disabled'}>預約</button></td>
                `;

                if (spot.status === "available" || spot.status === "可用") {
                    row.querySelector(".reserve-btn").addEventListener("click", () => {
                        handleReserveParkingClick(spot.spot_id, date, startTime, endTime, row);
                        setParkingSpotId(spot.spot_id);
                    });
                }

                fragment.appendChild(row);
            });

            parkingTableBody.innerHTML = '';
            parkingTableBody.appendChild(fragment);
            console.log("Table body after update:", parkingTableBody.innerHTML);

            // 強制觸發重繪
            parkingTableBody.style.display = 'none';
            parkingTableBody.offsetHeight; // 觸發重排
            parkingTableBody.style.display = 'table-row-group';

            setTimeout(() => {
                console.log("Table body after 1 second:", parkingTableBody.innerHTML);
            }, 1000);
        }

        reserveSearchButton.addEventListener("click", handleReserveSearch);
        reserveSearchInput.addEventListener("keypress", function (event) {
            if (event.key === "Enter") {
                handleReserveSearch();
            }
        });
    }

    // 預約停車點擊處理
    async function handleReserveParkingClick(spotId, selectedDate, startTime, endTime, row) {
        if (!await checkAuth()) return;

        try {
            if (isNaN(spotId)) {
                alert("無效的車位 ID！");
                return;
            }

            // 組合 start_time 和 end_time 為 ISO 8601 格式
            const startDateTime = `${selectedDate}T${startTime}:00`; // 例如 "2025-04-29T10:00:00"
            const endDateTime = `${selectedDate}T${endTime}:00`; // 例如 "2025-04-29T12:00:00"

            const token = getToken();
            const response = await fetch(`${API_URL}/rent`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    parking_spot_id: spotId,
                    start_time: startDateTime,
                    end_time: endDateTime
                }),
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
        const startDateInput = document.getElementById("startDate");
        const endDateInput = document.getElementById("endDate");
        const incomeSearchButton = document.getElementById("incomeSearchButton");
        const totalIncomeSpan = document.getElementById("totalIncome");
        const incomeTableBody = document.getElementById("incomeTableBody");

        if (!startDateInput || !endDateInput || !incomeSearchButton || !totalIncomeSpan || !incomeTableBody) {
            console.warn("Required elements not found for incomeInquiry");
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

            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
                alert("日期格式不正確，請使用 YYYY-MM-DD 格式！");
                return;
            }

            totalIncomeSpan.textContent = "計算中...";
            incomeTableBody.innerHTML = '<tr><td colspan="5">載入中...</td></tr>';

            try {
                const token = getToken();
                if (!token) {
                    throw new Error("認證令牌缺失，請重新登入！");
                }

                const parkingSpotId = getParkingSpotId();
                if (!parkingSpotId) {
                    throw new Error("請先在「查看車位」或「預約車位」中選擇一個停車位！");
                }

                const requestUrl = `${API_URL}/parking/${parkingSpotId}/income?start_date=${encodeURIComponent(startDate)}&end_date=${encodeURIComponent(endDate)}`;
                console.log(`Sending request to: ${requestUrl}`);
                const response = await fetch(requestUrl, {
                    method: 'GET',
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    }
                });

                console.log(`Income inquiry fetch response status: ${response.status}`);
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
                console.log(`Income data for ${startDate} to ${endDate}:`, data);

                const totalIncome = data.total_income || 0;
                totalIncomeSpan.textContent = totalIncome.toLocaleString();

                const records = data.records || [];
                if (records.length === 0) {
                    incomeTableBody.innerHTML = '<tr><td colspan="5">無收入記錄</td></tr>';
                    return;
                }

                const fragment = document.createDocumentFragment();
                records.forEach(record => {
                    const row = document.createElement("tr");
                    row.innerHTML = `
                        <td>${record.rent_id}</td>
                        <td>${record.parking_spot_id}</td>
                        <td>${new Date(record.start_time).toLocaleString("zh-TW", { hour12: false })}</td>
                        <td>${record.actual_end_time ? new Date(record.actual_end_time).toLocaleString("zh-TW", { hour12: false }) : '尚未結束'}</td>
                        <td>${record.total_cost}</td>
                    `;
                    fragment.appendChild(row);
                });
                incomeTableBody.innerHTML = '';
                incomeTableBody.appendChild(fragment);
            } catch (error) {
                console.error("Failed to fetch income data:", error);
                alert(`無法載入收入資料，請檢查後端服務 (錯誤: ${error.message})`);
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

            let data = responseData;
            if (!Array.isArray(responseData) && responseData.data && Array.isArray(responseData.data)) {
                data = responseData.data;
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

            if (targetId === "viewParking") {
                setupViewParking();
            } else if (targetId === "reserveParking") {
                setupReserveParking();
            } else if (targetId === "history") {
                loadHistory();
            } else if (targetId === "incomeInquiry") {
                setupIncomeInquiry();
            }
        });
    });
});