console.log("script.js loaded");

// 確認 Leaflet 是否載入
if (typeof L === 'undefined') {
    console.error("Leaflet library not loaded. Please check the script inclusion in index.html.");
}

document.addEventListener("DOMContentLoaded", function () {
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

    const emailInput = document.getElementById("email"); // 添加 emailInput 定義
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

    let isLogin = true;
    let sharedMap, rentMap, sharedMarkers = [], rentMarkers = [];
    const API_URL = '/api/v1'; // 後端 URL

    // 當付款方式改變時，顯示或隱藏信用卡號輸入框
    paymentMethodInput.addEventListener("change", function () {
        if (paymentMethodInput.value === "credit_card") {
            cardNumberContainer.style.display = "block";
        } else {
            cardNumberContainer.style.display = "none";
            cardNumberInput.value = ""; // 清空卡號欄位
        }
    });

    // 電話號碼輸入驗證（只允許數字）
    phoneInput.addEventListener("input", function (event) {
        let value = phoneInput.value.replace(/\D/g, ""); // 移除非數字
        phoneInput.value = value;
        // 即時驗證電話號碼
        const phoneRegex = /^[0-9]{10}$/;
        if (phoneRegex.test(value)) {
            errorMessage.textContent = "";
        } else {
            errorMessage.textContent = "請提供有效的電話號碼（10位數字）";
            errorMessage.style.color = "red";
        }
    });

    // 信用卡號輸入格式化（自動加上 "-"）
    cardNumberInput.addEventListener("input", function (event) {
        let value = cardNumberInput.value.replace(/\D/g, ""); // 移除非數字
        value = value.replace(/(\d{4})(?=\d)/g, "$1-"); // 每 4 位數加 "-"
        cardNumberInput.value = value;
    });

    // 即時密碼驗證
    passwordInput.addEventListener("input", function () {
        const password = this.value.trim();
        const hasLetter = /[a-zA-Z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const isLongEnough = password.length >= 8;
        if (hasLetter && hasNumber && isLongEnough) {
            errorMessage.textContent = "密碼格式正確";
            errorMessage.style.color = "green";
        } else {
            errorMessage.textContent = "密碼必須至少8個字符，包含字母和數字";
            errorMessage.style.color = "red";
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

            // 移除非必要欄位的 required 屬性
            nameInput.removeAttribute("required");
            phoneInput.removeAttribute("required");
            roleInput.removeAttribute("required");
            paymentMethodInput.removeAttribute("required");
            cardNumberInput.removeAttribute("required");

            // 確保 email 和 password 是必填
            emailInput.setAttribute("required", "true");
            passwordInput.setAttribute("required", "true");
        } else {
            // 註冊模式：顯示所有欄位
            nameInput.parentElement.style.display = "block";
            phoneInput.parentElement.style.display = "block";
            roleInput.parentElement.style.display = "block";
            paymentMethodInput.parentElement.style.display = "block";
            if (paymentMethodInput.value === "credit_card") {
                cardNumberContainer.style.display = "block";
            }
            // 添加所有欄位的 required 屬性
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

        if (isLogin) {
            // 登入只需要 email 和 password
            try {
                const response = await fetch(`${API_URL}/members/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                const result = await response.json();
                if (response.ok) {
                    alert("登入成功！");
                    authContainer.style.display = "none";
                    parkingContainer.style.display = "block";
                } else {
                    errorMessage.textContent = result.error || "電子郵件或密碼錯誤！";
                    errorMessage.style.color = "red";
                }
            } catch (error) {
                console.error("Login failed:", error);
                errorMessage.textContent = "無法連接到伺服器，請檢查網路或後端服務";
                errorMessage.style.color = "red";
            }
        } else {
            // 註冊需要所有欄位
            const name = nameInput.value.trim();
            const phone = phoneInput.value.trim();
            const role = roleInput.value;
            const payment_method = paymentMethodInput.value;
            let payment_info = cardNumberInput.value.trim();

            // 前端驗證
            if (!name || !phone || !role || !payment_method) {
                errorMessage.textContent = "請填寫所有必填欄位！";
                return;
            }

            // 收集所有驗證錯誤
            const errors = [];

            // 驗證必填欄位
            if (!name) errors.push("請填寫姓名");
            if (!phone) errors.push("請填寫電話號碼");
            if (!role) errors.push("請選擇角色");
            if (!payment_method) errors.push("請選擇付款方式");

            // 驗證電話號碼
            const phoneRegex = /^[0-9]{10}$/;
            if (!phoneRegex.test(phone)) {
                errors.push("請提供有效的電話號碼（10位數字）");
            }

            // 清理密碼中的不可見字符
            const cleanedPassword = password.replace(/[^\x20-\x7E]/g, "");
            console.log("Password after cleanup:", cleanedPassword);

            // 驗證密碼格式
            const hasLetter = /[a-zA-Z]/.test(cleanedPassword);
            const hasNumber = /[0-9]/.test(cleanedPassword);
            const isLongEnough = cleanedPassword.length >= 8;
            if (!hasLetter || !hasNumber || !isLongEnough) {
                errors.push("密碼必須至少8個字符，包含字母和數字");
            }

            // 驗證 payment_info
            if (payment_method === "credit_card" && !payment_info) {
                errors.push("請輸入信用卡號");
            }

            // 如果有錯誤，顯示所有錯誤訊息
            if (errors.length > 0) {
                errorMessage.textContent = errors.join("；");
                errorMessage.style.color = "red";
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
                    alert("註冊成功！請使用此帳號登入。");
                    isLogin = true;
                    formTitle.textContent = "登入";
                    submitButton.textContent = "登入";
                    toggleMessage.innerHTML = '還沒有帳號？<a href="#" id="toggleLink">註冊</a>';
                    toggleFormFields();
                } else {
                    console.log("Register failed:", response.status, result);
                    errorMessage.textContent = result.error || `註冊失敗！（錯誤碼：${response.status}）`;
                    errorMessage.style.color = "red";
                }
            } catch (error) {
                console.error("Register failed:", error);
                errorMessage.textContent = "無法連接到伺服器，請檢查網路或後端服務";
                errorMessage.style.color = "red";
            }
        }
    });

    // 登出功能
    logoutButton.addEventListener("click", function () {
        authContainer.style.display = "block";
        parkingContainer.style.display = "none";
        document.querySelectorAll(".content-section").forEach(section => {
            section.style.display = "none";
        });
    });

    // 以下為地圖和其他功能的程式碼，保持不變
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

    async function updateMap(map, category, markersArray, filterType, filterFloor, filterPricing, filterStatus, searchQuery) {
        if (!map) {
            console.error("Map object is not initialized");
            return;
        }
        markersArray.forEach(marker => marker.remove());
        markersArray.length = 0;

        try {
            const response = await fetch(`${API_URL}/parking/${category}`);
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
                    spot.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
                        const spots = await fetch(`${API_URL}/parking/shared`).then(res => res.json());
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
                        const spots = await fetch(`${API_URL}/parking/rent`).then(res => res.json());
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
            }
        });
    });

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

    function setupViewParking() {
        setTimeout(() => {
            const parkingSpaces = document.querySelectorAll("#viewParking .parking-space");
            if (parkingSpaces.length === 0) console.warn("No parking spaces found in #viewParking");
            parkingSpaces.forEach(space => {
                space.removeEventListener("click", handleViewParkingClick);
                space.addEventListener("click", handleViewParkingClick);
            });
        }, 100);
    }

    function handleViewParkingClick(event) {
        const space = event.currentTarget;
        const spaceId = space.getAttribute("data-space-id");
        alert(`查看車位 ${spaceId}，請從後端獲取狀態！`);
    }

    function setupReserveParking() {
        setTimeout(() => {
            const parkingSpaces = document.querySelectorAll("#reserveParking .parking-space");
            if (parkingSpaces.length === 0) console.warn("No parking spaces found in #reserveParking");
            parkingSpaces.forEach(space => {
                space.removeEventListener("click", handleReserveParkingClick);
                space.addEventListener("click", handleReserveParkingClick);
            });
        }, 100);
    }

    async function handleReserveParkingClick(event) {
        const space = event.currentTarget;
        const spaceId = space.getAttribute("data-space-id");

        if (confirm(`確定要預約車位 ${spaceId} 嗎？`)) {
            try {
                const response = await fetch(`${API_URL}/reserve`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ spaceId })
                });
                const result = await response.json();

                if (response.ok) {
                    space.classList.remove("available");
                    space.classList.add("reserved");
                    space.querySelector("span").textContent = "預約";
                    addToHistory(`預約車位 ${spaceId}`);
                    alert(`車位 ${spaceId} 已成功預約！`);
                } else {
                    alert(result.message || "預約失敗");
                }
            } catch (error) {
                console.error("Reserve failed:", error);
                alert("無法預約車位，請檢查後端服務");
            }
        }
    }

    function addToHistory(action) {
        const now = new Date();
        const timestamp = now.toLocaleString("zh-TW", { hour12: false });
        const listItem = document.createElement("li");
        listItem.textContent = `${action} - ${timestamp}`;
        historyList.appendChild(listItem);
    }

    setupSharedParkingFilters();
    setupRentParkingFilters();
});