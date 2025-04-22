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
    const functionList = document.getElementById("functionList");
    const historyList = document.getElementById("historyList");
    const viewParkingTableBody = document.getElementById("viewParkingTableBody");
    const incomeTableBody = document.getElementById("incomeTableBody");

    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const nameInput = document.getElementById("name");
    const phoneInput = document.getElementById("phone");
    const roleInput = document.getElementById("role");
    const paymentMethodInput = document.getElementById("payment_method");
    const cardNumberContainer = document.getElementById("cardNumberContainer");
    const cardNumberInput = document.getElementById("card_number");
    const licensePlateContainer = document.getElementById("licensePlateContainer");
    const vehicleTypeContainer = document.getElementById("vehicleTypeContainer");
    const licensePlateInput = document.getElementById("licensePlate");
    const vehicleTypeInput = document.getElementById("vehicleType");

    // 檢查必要的 DOM 元素是否存在
    if (!emailInput || !passwordInput || !authForm || !logoutButton || !functionList || !historyList || !viewParkingTableBody || !incomeTableBody) {
        console.error("Required DOM elements are missing");
        return;
    }

    let isLogin = true;
    let userRole = null; // 儲存用戶身份
    const API_URL = '/api/v1'; // 後端 API 網址

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

    // 動態生成功能清單
    function setupFunctionList() {
        functionList.innerHTML = '';
        const functions = userRole === "shared_owner" ? [
            { target: "viewParking", label: "查看車位" },
            { target: "history", label: "個人歷史紀錄" },
            { target: "incomeQuery", label: "收入查詢" }
        ] : [
            { target: "reserveParking", label: "預約車位" },
            { target: "history", label: "個人歷史紀錄" }
        ];
        functions.forEach(func => {
            const li = document.createElement("li");
            const a = document.createElement("a");
            a.href = "#";
            a.className = "nav-link";
            a.dataset.target = func.target;
            a.textContent = func.label;
            li.appendChild(a);
            functionList.appendChild(li);
        });
    }

    // 顯示主畫面
    function showMainPage() {
        authContainer.style.display = "none";
        parkingContainer.style.display = "block";
        document.querySelector(".function-list").style.display = "block";
        document.querySelector(".content-container").style.display = "block";
        logoutButton.style.display = "block";

        // 動態設置功能清單
        setupFunctionList();

        // 預設顯示第一個功能
        document.querySelectorAll(".content-section").forEach(section => {
            section.style.display = "none";
        });
        const defaultSection = userRole === "shared_owner" ? "viewParking" : "reserveParking";
        document.getElementById(defaultSection).style.display = "block";
        if (defaultSection === "viewParking") {
            setupViewParking();
        } else {
            setupReserveParking();
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

    // 檢查是否已登入
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

    // 初始化時檢查是否已登入
    (async () => {
        const isAuthenticated = await checkAuth(true);
        if (isAuthenticated) {
            showMainPage();
        } else {
            showLoginPage();
        }
    })();

    // 當身份改變時，顯示或隱藏車牌號碼和車型輸入框
    roleInput.addEventListener("change", function () {
        const isRenter = roleInput.value === "renter";
        licensePlateContainer.style.display = isRenter ? "block" : "none";
        vehicleTypeContainer.style.display = isRenter ? "block" : "none";
        licensePlateInput.required = isRenter;
        vehicleTypeInput.required = isRenter;
    });

    // 當付款方式改變時，顯示或隱藏信用卡號輸入框
    paymentMethodInput.addEventListener("change", function () {
        const isCreditCard = paymentMethodInput.value === "credit_card";
        cardNumberContainer.style.display = isCreditCard ? "block" : "none";
        cardNumberInput.required = isCreditCard;
        if (!isCreditCard) {
            cardNumberInput.value = "";
        }
    });

    // 電話號碼輸入驗證
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

    // 車牌號碼輸入驗證
    licensePlateInput.addEventListener("input", function () {
        let value = licensePlateInput.value.trim().toUpperCase();
        const plateRegex = /^[A-Z]{2,3}-[0-9]{2,4}$|^[0-9]{2,4}-[A-Z]{2,3}$/;
        if (plateRegex.test(value)) {
            showSuccess("車牌號碼格式正確");
        } else {
            showError("請輸入有效車牌號碼（例如 ABC-1234 或 1234-ABC）");
        }
    });

    // 信用卡號輸入格式化
    cardNumberInput.addEventListener("input", function () {
        let value = cardNumberInput.value.replace(/\D/g, "");
        value = value.replace(/(\d{4})(?=\d)/g, "$1-");
        cardNumberInput.value = value;
        const cardRegex = /^(\d{4}-){3}\d{4}$/;
        if (cardRegex.test(value)) {
            showSuccess("信用卡號格式正確");
        } else {
            showError("請輸入有效信用卡號（16位數字，格式如 1234-5678-9012-3456）");
        }
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
            licensePlateContainer.style.display = "none";
            vehicleTypeContainer.style.display = "none";

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
            roleInput.parentElement.style.display = "block";
            paymentMethodInput.parentElement.style.display = "block";
            const isRenter = roleInput.value === "renter";
            licensePlateContainer.style.display = isRenter ? "block" : "none";
            vehicleTypeContainer.style.display = isRenter ? "block" : "none";
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
            if (isRenter) {
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
                    if (!result.data.token || !result.data.role) {
                        showError("後端未返回 token 或 role，請檢查後端服務！");
                        return;
                    }
                    setToken(result.data.token);
                    userRole = result.data.role; // 儲存用戶身份
                    console.log("Login successful, token and role stored:", userRole);
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
            const license_plate = licensePlateInput.value.trim();
            const vehicle_type = vehicleTypeInput.value.trim();
            let payment_info = cardNumberInput.value.trim();

            const errors = [];
            if (!name) errors.push("請填寫姓名");
            if (!phone) errors.push("請填寫電話號碼");
            if (!role) errors.push("請選擇身份");
            if (!payment_method) errors.push("請選擇付款方式");
            if (role === "renter" && !license_plate) errors.push("請填寫車牌號碼");
            if (role === "renter" && !vehicle_type) errors.push("請填寫車型");

            const phoneRegex = /^[0-9]{10}$/;
            if (!phoneRegex.test(phone)) {
                errors.push("請提供有效的電話號碼（10位數字）");
            }

            const plateRegex = /^[A-Z]{2,3}-[0-9]{2,4}$|^[0-9]{2,4}-[A-Z]{2,3}$/;
            if (role === "renter" && !plateRegex.test(license_plate)) {
                errors.push("請提供有效的車牌號碼（例如 ABC-1234 或 1234-ABC）");
            }

            const cleanedPassword = password.replace(/[^\x20-\x7E]/g, "");
            const hasLetter = /[a-zA-Z]/.test(cleanedPassword);
            const hasNumber = /[0-9]/.test(cleanedPassword);
            const isLongEnough = cleanedPassword.length >= 8;
            if (!hasLetter || !hasNumber || !isLongEnough) {
                errors.push("密碼必須至少8個字符，包含字母和數字");
            }

            if (payment_method === "credit_card" && !payment_info) {
                errors.push("請輸入信用卡號");
            }
            if (payment_method === "credit_card") {
                const cardRegex = /^(\d{4}-){3}\d{4}$/;
                if (!cardRegex.test(payment_info)) {
                    errors.push("請輸入有效信用卡號（16位數字，格式如 1234-5678-9012-3456）");
                }
            }

            if (errors.length > 0) {
                showError(errors.join("；"));
                return;
            }

            try {
                const response = await fetch(`${API_URL}/members/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        name, 
                        email, 
                        password: cleanedPassword, 
                        phone, 
                        role, 
                        payment_method, 
                        payment_info,
                        license_plate: role === "renter" ? license_plate : undefined,
                        vehicle_type: role === "renter" ? vehicle_type : undefined
                    })
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
                    console.error("Register failed:", result);
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
        userRole = null;
        showLoginPage();
    });

    // 導航切換
    function setupNavigation() {
        const navLinks = document.querySelectorAll(".nav-link");
        navLinks.forEach(link => {
            link.addEventListener("click", async function (event) {
                event.preventDefault();
                if (!await checkAuth()) return;

                const targetId = this.getAttribute("data-target");
                if ((userRole === "shared_owner" && !["viewParking", "history", "incomeQuery"].includes(targetId)) ||
                    (userRole === "renter" && !["reserveParking", "history"].includes(targetId))) {
                    alert("您無權訪問此功能！");
                    return;
                }

                document.querySelectorAll(".content-section").forEach(section => {
                    section.style.display = "none";
                });
                const targetSection = document.getElementById(targetId);
                if (!targetSection) {
                    console.error(`Target section "${targetId}" not found`);
                    return;
                }
                targetSection.style.display = "block";

                if (targetId === "reserveParking") {
                    setupReserveParking();
                } else if (targetId === "viewParking") {
                    setupViewParking();
                } else if (targetId === "history") {
                    loadHistory();
                } else if (targetId === "incomeQuery") {
                    setupIncomeQuery();
                }
            });
        });
    }

    // 設置預約車位
    function setupReserveParking() {
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
            if (!await checkAuth()) return;
            if (userRole !== "renter") {
                alert("僅租用者可使用預約車位功能！");
                return;
            }

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
                    spot.spot_id.toString().toLowerCase().includes(searchQuery.replace(/^v/i, '')) ||
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
                row.setAttribute("data-id", `${spot.spot_id}`);
                row.classList.add(spot.status === "available" || spot.status === "可用" ? "available" : "occupied");

                const idCell = document.createElement("td");
                idCell.textContent = `${spot.spot_id}`;
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

                reserveButton.addEventListener("click", () => handleReserveParkingClick(spot.spot_id, selectedDate, row));
                parkingTableBody.appendChild(row);
            });
        }
    }

    // 預約停車點擊處理
    async function handleReserveParkingClick(spotId, selectedDate, row) {
        if (!await checkAuth()) return;
        if (userRole !== "renter") {
            alert("僅租用者可進行預約！");
            return;
        }

        try {
            if (!spotId) {
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
            addToHistory(`預約車位 ${spotId} 於 ${selectedDate}`);
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

    // 設置查看車位
    function setupViewParking() {
        if (userRole !== "shared_owner") {
            alert("僅車位共享者可使用查看車位功能！");
            return;
        }

        const viewParkingTableBody = document.getElementById("viewParkingTableBody");
        if (!viewParkingTableBody) {
            console.warn("Required element viewParkingTableBody not found");
            return;
        }

        viewParkingTableBody.innerHTML = '<tr><td colspan="10">載入中...</td></tr>';

        async function fetchParkingSpots() {
            try {
                const token = getToken();
                const response = await fetch(`${API_URL}/parking/owned`, {
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    }
                });
                console.log(`View parking fetch response status: ${response.status}`);
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
                let spots = responseData.data || responseData;
                if (!Array.isArray(spots)) {
                    console.error("Parking spots data is not an array:", spots);
                    alert("車位資料格式錯誤，請檢查後端服務");
                    return;
                }

                if (spots.length === 0) {
                    viewParkingTableBody.innerHTML = '<tr><td colspan="10">目前沒有車位</td></tr>';
                    return;
                }

                viewParkingTableBody.innerHTML = '';
                spots.forEach(spot => {
                    const row = document.createElement("tr");
                    row.setAttribute("data-id", `${spot.spot_id}`);
                    row.classList.add(spot.status === "可用" ? "available" : "occupied");

                    const idCell = document.createElement("td");
                    idCell.textContent = spot.spot_id;
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
                    statusCell.textContent = spot.status || '未知';
                    row.appendChild(statusCell);

                    const renterCell = document.createElement("td");
                    renterCell.textContent = spot.renter ? spot.renter.name : '-';
                    row.appendChild(renterCell);

                    const startTimeCell = document.createElement("td");
                    startTimeCell.textContent = spot.start_time ? new Date(spot.start_time).toLocaleString("zh-TW", { hour12: false }) : '-';
                    row.appendChild(startTimeCell);

                    const endTimeCell = document.createElement("td");
                    endTimeCell.textContent = spot.end_time ? new Date(spot.end_time).toLocaleString("zh-TW", { hour12: false }) : '-';
                    row.appendChild(endTimeCell);

                    const costCell = document.createElement("td");
                    costCell.textContent = spot.total_cost ? `${spot.total_cost} 元` : '-';
                    row.appendChild(costCell);

                    viewParkingTableBody.appendChild(row);
                });
            } catch (error) {
                console.error("Failed to load parking spots:", error);
                alert("無法載入車位資料，請檢查後端服務");
                if (error.message === "認證失敗，請重新登入！") {
                    removeToken();
                    showLoginPage(true);
                }
            }
        }

        fetchParkingSpots();
    }

    // 設置收入查詢
    function setupIncomeQuery() {
        if (userRole !== "shared_owner") {
            alert("僅車位共享者可使用收入查詢功能！");
            return;
        }

        const incomeTableBody = document.getElementById("incomeTableBody");
        const incomeStartDate = document.getElementById("incomeStartDate");
        const incomeEndDate = document.getElementById("incomeEndDate");
        const incomeSearchButton = document.getElementById("incomeSearchButton");

        if (!incomeTableBody || !incomeStartDate || !incomeEndDate || !incomeSearchButton) {
            console.warn("Required elements not found for incomeQuery");
            return;
        }

        incomeTableBody.innerHTML = '<tr><td colspan="5">請選擇日期範圍並點擊查詢</td></tr>';
        incomeStartDate.value = '';
        incomeEndDate.value = '';

        incomeSearchButton.removeEventListener("click", handleIncomeSearch);
        incomeSearchButton.addEventListener("click", handleIncomeSearch);

        async function handleIncomeSearch() {
            if (!await checkAuth()) return;

            const startDate = incomeStartDate.value;
            const endDate = incomeEndDate.value;

            if (!startDate || !endDate) {
                alert("請選擇開始和結束日期！");
                return;
            }

            if (startDate > endDate) {
                alert("開始日期不能晚於結束日期！");
                return;
            }

            incomeTableBody.innerHTML = '<tr><td colspan="5">載入中...</td></tr>';

            try {
                const token = getToken();
                const response = await fetch(`${API_URL}/income?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`, {
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    }
                });
                console.log(`Income query fetch response status: ${response.status}`);
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
                let records = responseData.data || responseData;
                if (!Array.isArray(records)) {
                    console.error("Income data is not an array:", records);
                    alert("收入資料格式錯誤，請檢查後端服務");
                    return;
                }

                if (records.length === 0) {
                    incomeTableBody.innerHTML = '<tr><td colspan="5">無收入記錄</td></tr>';
                    return;
                }

                incomeTableBody.innerHTML = '';
                records.forEach(record => {
                    const row = document.createElement("tr");

                    const spotIdCell = document.createElement("td");
                    spotIdCell.textContent = record.spot_id;
                    row.appendChild(spotIdCell);

                    const renterCell = document.createElement("td");
                    renterCell.textContent = record.renter ? record.renter.name : '-';
                    row.appendChild(renterCell);

                    const startTimeCell = document.createElement("td");
                    startTimeCell.textContent = new Date(record.start_time).toLocaleString("zh-TW", { hour12: false });
                    row.appendChild(startTimeCell);

                    const endTimeCell = document.createElement("td");
                    endTimeCell.textContent = record.actual_end_time ? new Date(record.actual_end_time).toLocaleString("zh-TW", { hour12: false }) : '-';
                    row.appendChild(endTimeCell);

                    const incomeCell = document.createElement("td");
                    incomeCell.textContent = `${record.total_cost} 元`;
                    row.appendChild(incomeCell);

                    incomeTableBody.appendChild(row);
                });
            } catch (error) {
                console.error("Failed to load income records:", error);
                alert("無法載入收入記錄，請檢查後端服務");
                if (error.message === "認證失敗，請重新登入！") {
                    removeToken();
                    showLoginPage(true);
                }
            }
        }
    }

    // 載入歷史紀錄
    async function loadHistory() {
        if (!await checkAuth()) return;

        try {
            const token = getToken();
            const endpoint = userRole === "shared_owner" ? `${API_URL}/rent/owned` : `${API_URL}/rent`;
            const response = await fetch(endpoint, {
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

            let data = responseData.data || responseData;
            if (!Array.isArray(data)) {
                console.error("History data is not an array:", responseData);
                alert("歷史紀錄格式錯誤，請檢查後端服務");
                return;
            }

            if (data.length === 0) {
                historyList.innerHTML = "<li>目前沒有歷史紀錄</li>";
                return;
            }

            data.forEach(record => {
                const listItem = document.createElement("li");
                const startTime = new Date(record.start_time).toLocaleString("zh-TW", { hour12: false });
                const action = userRole === "shared_owner" 
                    ? `車位 ${record.spot.spot_id} 被租用 (Rent ID: ${record.rent_id})`
                    : `租用車位 ${record.spot.spot_id} (Rent ID: ${record.rent_id})`;
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

    // 初始化導航
    setupNavigation();
});