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
            localStorage.removeItem("role"); // 清除用戶角色
            // 重置 URL 路徑
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

    // 從 localStorage 獲取用戶角色，並標準化為小寫
    function getRole() {
        try {
            const role = localStorage.getItem("role") || "";
            return role.toLowerCase().trim(); // 標準化為小寫並移除空白
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

    // 顯示主畫面，並根據角色動態調整功能清單和預設畫面
    function showMainPage() {
        console.log("Entering showMainPage function");

        authContainer.style.display = "none";
        parkingContainer.style.display = "block";
        const functionList = document.querySelector(".function-list");
        const contentContainer = document.querySelector(".content-container");
        const pageTitle = document.getElementById("pageTitle"); // 用於顯示標題

        if (!functionList || !contentContainer || !pageTitle) {
            console.error("Required DOM elements for main page are missing: .function-list, .content-container, or pageTitle");
            showError("頁面載入失敗，請檢查網頁結構！");
            return;
        }
        functionList.style.display = "block";
        contentContainer.style.display = "block";
        logoutButton.style.display = "block";

        // 獲取用戶角色
        const role = getRole();
        console.log("Current role in showMainPage:", role);

        // 檢查角色是否有效
        const validRoles = ["shared_owner", "renter", "admin"];
        if (!role || !validRoles.includes(role)) {
            console.error(`Unrecognized role: "${role}". Expected one of: ${validRoles.join(", ")}. Redirecting to login.`);
            console.log("Current localStorage contents:", {
                token: localStorage.getItem("token"),
                role: localStorage.getItem("role")
            });
            showError("無效的用戶角色，請重新登入！可能是後端未正確返回角色資訊或本地數據異常。");
            removeToken();
            showLoginPage();
            return;
        }

        // 根據角色修改 URL 路徑
        const newPath = `/${role}`;
        history.pushState({ role }, '', newPath);
        console.log(`URL updated to: ${window.location.pathname}`);

        // 設置標題
        if (role === "shared_owner") {
            pageTitle.textContent = "Shared Owner";
        } else if (role === "renter") {
            pageTitle.textContent = "Renter";
        } else if (role === "admin") {
            pageTitle.textContent = "Admin";
        }

        // 動態調整功能清單
        const navList = document.querySelector(".function-list ul");
        if (!navList) {
            console.error("Navigation list (.function-list ul) not found");
            showError("功能清單載入失敗，請檢查網頁結構！");
            return;
        }

        if (role === "shared_owner") {
            navList.innerHTML = `
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
                <li><a href="#" class="nav-link" data-target="viewParking">查看車位</a></li>
                <li><a href="#" class="nav-link" data-target="incomeInquiry">收入查詢</a></li>
                <li><a href="#" class="nav-link" data-target="adminPanel">管理員畫面</a></li>
            `;
        }

        // 設置預設畫面
        document.querySelectorAll(".content-section").forEach(section => {
            section.style.display = "none";
        });

        const defaultSectionId = role === "shared_owner" ? "viewParking" :
            role === "renter" ? "reserveParking" :
                role === "admin" ? "adminPanel" : "viewParking";
        const defaultSection = document.getElementById(defaultSectionId);

        if (!defaultSection) {
            console.error(`Default section "${defaultSectionId}" not found`);
            showError("無法載入預設畫面，請檢查網頁結構！");
            return;
        }

        defaultSection.style.display = "block";
        if (defaultSectionId === "viewParking") setupViewParking();
        else if (defaultSectionId === "reserveParking") setupReserveParking();
        else if (defaultSectionId === "adminPanel") setupAdminPanel();
        else setupViewParking();

        // 重新綁定導航事件
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
                else if (targetId === "adminPanel") setupAdminPanel();
            });
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
                // 重置 URL 路徑
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
            // 重置 URL 路徑
            history.pushState({}, '', '/');
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
        const isAuthenticated = await checkAuth(true);
        if (isAuthenticated) {
            const role = getRole();
            console.log("Current role during initialization:", role);
            const validRoles = ["shared_owner", "renter", "admin"];
            if (!role || !validRoles.includes(role)) {
                console.error(`Invalid role during initialization: "${role}". Expected: ${validRoles.join(", ")}. Redirecting to login.`);
                console.log("Current localStorage contents:", {
                    token: localStorage.getItem("token"),
                    role: localStorage.getItem("role")
                });
                showError("無效的用戶角色，請重新登入！可能是後端未正確返回角色資訊或本地數據異常。");
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
        const pathRole = window.location.pathname.replace('/', ''); // 從路徑中提取角色
        const validRoles = ["shared_owner", "renter", "admin"];
        const pageTitle = document.getElementById("pageTitle");

        if (pathRole && validRoles.includes(pathRole) && pathRole === role) {
            if (pageTitle) {
                if (pathRole === "shared_owner") {
                    pageTitle.textContent = "Shared Owner";
                } else if (pathRole === "renter") {
                    pageTitle.textContent = "Renter";
                } else if (pathRole === "admin") {
                    pageTitle.textContent = "Admin";
                }
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
            if (roleInput.value.toLowerCase() === "renter") {
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
                console.log("Login response data:", JSON.stringify(result, null, 2));
                if (response.ok) {
                    if (!result.data || !result.data.token) {
                        showError("後端未返回 token，請檢查後端服務！");
                        return;
                    }
                    setToken(result.data.token);
                    let role = "";
                    // 嘗試從多種結構中提取 role
                    if (typeof result.data.role === "string") {
                        role = result.data.role.toLowerCase().trim();
                    } else if (result.data.user && typeof result.data.user.role === "string") {
                        role = result.data.user.role.toLowerCase().trim();
                    } else if (result.data.roles && Array.isArray(result.data.roles) && result.data.roles.length > 0) {
                        role = result.data.roles[0].toLowerCase().trim();
                    } else if (typeof result.data.user_role === "string") {
                        role = result.data.user_role.toLowerCase().trim();
                    } else if (typeof result.role === "string") {
                        role = result.role.toLowerCase().trim();
                    } else if (result.data.member && typeof result.data.member.role === "string") {
                        role = result.data.member.role.toLowerCase().trim();
                    } else {
                        showError("後端未返回有效的角色資訊，請聯繫管理員或檢查後端 API！");
                        console.error("Role not provided by backend or invalid format:", JSON.stringify(result.data, null, 2));
                        console.error("Full login response:", JSON.stringify(result, null, 2));
                        return;
                    }
                    const validRoles = ["shared_owner", "renter", "admin"];
                    if (!validRoles.includes(role)) {
                        showError(`後端返回的角色 "${role}" 無效，應為 ${validRoles.join(", ")} 之一，請聯繫管理員！`);
                        console.error("Invalid role received from backend:", role);
                        return;
                    }
                    setRole(role);
                    const storedRole = getRole();
                    if (!storedRole || !validRoles.includes(storedRole)) {
                        showError("角色存儲失敗，請聯繫管理員！");
                        console.error("Role storage verification failed:", { storedRole, expected: validRoles });
                        return;
                    }
                    console.log("Login successful, role stored:", storedRole);
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

                if (spotData.pricing_type === "daily") {
                    throw new Error("此車位的計費方式為「按日」，目前不支援此類型！");
                }

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
                    const token = getToken();
                    if (!token) throw new Error("認證令牌缺失，請重新登入！");

                    const response = await fetch(`${API_URL}/parking/${spot.spot_id}`, {
                        method: 'PUT',
                        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                        body: JSON.stringify(updatedSpot)
                    });
                    if (!response.headers.get('content-type')?.includes('application/json')) {
                        throw new Error("後端返回非 JSON 響應，請檢查伺服器配置");
                    }
                    if (!response.ok) {
                        if (response.status === 401) throw new Error("認證失敗，請重新登入！");
                        const errorData = await response.json();
                        throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorData.error || '未知錯誤'}`);
                    }
                    await response.json();
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
        specificSpotInput.addEventListener("keypress", function (event) {
            if (event.key === "Enter") handleSpecificSpotSearch();
        });
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

        const today = new Date().toISOString().split('T')[0];
        reserveDateInput.value = today;
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
            if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
                alert("日期格式不正確，請使用 YYYY-MM-DD 格式！");
                return;
            }

            parkingTableBody.innerHTML = '<tr><td colspan="7">載入中...</td></tr>';

            let latitude = 25.0330, longitude = 121.5654;
            try {
                const position = await new Promise((resolve, reject) => {
                    if (!navigator.geolocation) reject(new Error("瀏覽器不支援地理位置功能"));
                    navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000, maximumAge: 0 });
                });
                latitude = position.coords.latitude;
                longitude = position.coords.longitude;
                console.log(`User location: latitude=${latitude}, longitude=${longitude}`);
            } catch (error) {
                console.warn("Failed to get user location, using default:", error.message);
                alert("無法獲取您的位置，將使用預設位置（台北市）。請確保已允許位置權限。");
            }

            const timeZoneOffset = "+08:00";
            const startDateTime = `${date}T${startTime}:00${timeZoneOffset}`;
            const endDateTime = `${date}T${endTime}:00${timeZoneOffset}`;

            console.log("Sending request with parameters:", { date, start_time: startDateTime, end_time: endDateTime, latitude, longitude, filterCity, filterType, filterFloor, filterPricing, filterStatus });

            let retries = 3, spots = null;
            while (retries > 0) {
                try {
                    const token = getToken();
                    if (!token) throw new Error("認證令牌缺失，請重新登入！");

                    const queryParams = new URLSearchParams({ date, start_time: startDateTime, end_time: endDateTime, latitude, longitude });
                    const response = await fetch(`${API_URL}/parking/available?${queryParams.toString()}`, {
                        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }
                    });
                    console.log(`Reserve parking fetch response status: ${response.status}`);
                    if (!response.headers.get('content-type')?.includes('application/json')) {
                        throw new Error("後端返回非 JSON 響應，請檢查伺服器配置");
                    }
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
                        handleReserveParkingClick(spot.spot_id, date, startTime, endTime, row);
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

        reserveSearchButton.addEventListener("click", handleReserveSearch);
        reserveSearchInput.addEventListener("keypress", function (event) {
            if (event.key === "Enter") handleReserveSearch();
        });
    }

    // 預約停車點擊處理
    async function handleReserveParkingClick(spotId, selectedDate, startTime, endTime, row) {
        if (!await checkAuth()) return;

        const role = getRole();
        console.log("Current role in handleReserveParkingClick:", role);
        if (role !== "renter") {
            alert("此功能僅限租用者使用！");
            return;
        }

        try {
            if (isNaN(spotId)) {
                alert("無效的車位 ID！");
                return;
            }

            const startDateTime = `${selectedDate}T${startTime}:00`;
            const endDateTime = `${selectedDate}T${endTime}:00`;

            const token = getToken();
            const response = await fetch(`${API_URL}/rent`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({ parking_spot_id: spotId, start_time: startDateTime, end_time: endDateTime })
            });
            if (!response.headers.get('content-type')?.includes('application/json')) {
                throw new Error("後端返回非 JSON 響應，請檢查伺服器配置");
            }
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
            console.error("Required DOM elements missing for income inquiry:", {
                startDateInput, endDateInput, incomeSearchButton, totalIncomeSpan, incomeTableBody
            });
            alert("頁面元素載入失敗，請檢查 DOM 結構！");
            return;
        }

        async function handleIncomeSearch() {
            const startDate = startDateInput.value;
            const endDate = endDateInput.value;

            // 驗證日期輸入
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
                const token = getToken();
                if (!token) throw new Error("認證令牌缺失，請重新登入！");

                const parkingSpotId = getParkingSpotId();
                if (!parkingSpotId) {
                    throw new Error("請先在「查看車位」或「預約車位」中選擇一個停車位！請檢查 localStorage.getItem('selectedParkingSpotId')");
                }

                console.log("API_URL:", API_URL);
                console.log("Token:", token);
                console.log("ParkingSpotId from localStorage:", parkingSpotId);
                console.log("Fetching income from", startDate, "to", endDate);

                const response = await fetch(`${API_URL}/parking/${parkingSpotId}/income?start_date=${encodeURIComponent(startDate)}&end_date=${encodeURIComponent(endDate)}`, {
                    method: 'GET',
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    }
                });
                console.log(`Income fetch response status: ${response.status}`);

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error("Raw response text:", errorText);
                    if (response.status === 401) throw new Error("認證失敗，請重新登入！");
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorData.error || errorText || '未知錯誤'}`);
                }

                const contentType = response.headers.get('content-type');
                if (!contentType || !contentType.includes('application/json')) {
                    throw new Error("後端返回非 JSON 響應，請檢查伺服器配置");
                }

                const data = await response.json();
                console.log("Full income response:", JSON.stringify(data, null, 2));

                let incomeData = data.data || data.results || data; // 嘗試從多層級提取
                if (typeof incomeData === 'string') {
                    console.warn("Income data is a string, attempting to parse...");
                    incomeData = JSON.parse(incomeData);
                }

                // 詳細記錄 incomeData 結構
                console.log("Detailed incomeData structure:", {
                    isObject: typeof incomeData === 'object' && incomeData !== null,
                    isArray: Array.isArray(incomeData),
                    keys: Object.keys(incomeData),
                    fullData: incomeData
                });

                const totalIncome = incomeData.total_income || incomeData.total || incomeData.totalIncome || 0;
                totalIncomeSpan.textContent = totalIncome.toLocaleString();
                console.log("Total income extracted:", totalIncome);

                let rents = [];
                if (incomeData.rents) rents = incomeData.rents; // 直接檢查 rents 字段
                else if (incomeData.data && Array.isArray(incomeData.data)) rents = incomeData.data; // 檢查嵌套 data
                else if (Array.isArray(incomeData)) rents = incomeData;
                else {
                    console.warn("No known record fields found in incomeData:", incomeData);
                    alert("後端返回的數據格式不正確，無法提取收入記錄（缺少 'rents' 字段）。請檢查後端 API 或聯繫管理員。");
                    incomeTableBody.innerHTML = '<tr><td colspan="5">數據格式錯誤，無法顯示收入記錄</td></tr>';
                    return;
                }
                console.log("Rents extracted:", JSON.stringify(rents, null, 2));

                if (!Array.isArray(rents)) {
                    console.error("Rents is not an array:", rents);
                    incomeTableBody.innerHTML = '<tr><td colspan="5">收入記錄格式錯誤，請檢查後端服務</td></tr>';
                    return;
                }

                if (rents.length === 0) {
                    console.log("Rents array is empty. Displaying '無收入記錄'.");
                    console.log("Verification steps: 1) Check database for matching records, 2) Verify parkingSpotId:", parkingSpotId, "3) Ensure date range includes records:", { startDate, endDate });
                    incomeTableBody.innerHTML = '<tr><td colspan="5">無收入記錄</td></tr>';
                    alert("目前無收入記錄，可能原因：\n1. 所選日期範圍內無記錄。\n2. 車位 ID 無效或無相關記錄。\n3. 後端服務異常。\n請嘗試：\n- 檢查日期範圍\n- 確保已選擇正確車位\n- 確認後端服務正常");
                    return;
                }

                // 渲染表格數據
                incomeTableBody.innerHTML = '';
                const fragment = document.createDocumentFragment();
                rents.forEach((rent, index) => {
                    console.log(`Processing rent ${index}:`, rent);
                    const row = document.createElement("tr");
                    const startTime = rent.start_time || rent.startTime ? new Date(rent.start_time || rent.startTime).toLocaleString("zh-TW", { hour12: false }) : 'N/A';
                    const endTime = rent.actual_end_time || rent.end_time || rent.endTime ? new Date(rent.actual_end_time || rent.end_time || rent.endTime).toLocaleString("zh-TW", { hour12: false }) : '尚未結束';
                    const cost = rent.total_cost || rent.amount || rent.cost || rent.totalCost || 0;

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
                console.log("Rents rendered successfully. Table body children:", incomeTableBody.children.length);
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

    // 設置管理員畫面（如果存在）
    function setupAdminPanel() {
        const role = getRole();
        if (role !== "admin") {
            alert("此功能僅限管理員使用！");
            return;
        }
        // 根據您的需求實現管理員畫面邏輯
        console.log("Setting up admin panel");
    }
});