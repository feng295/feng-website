console.log("script.js loaded");

// 確認 Leaflet 是否載入
if (typeof L === 'undefined') {
    console.error("Leaflet library not loaded. Please check the script inclusion in index.html.");
}

document.addEventListener("DOMContentLoaded", function () {
    console.log("DOM fully loaded");

    const authContainer = document.getElementById("authContainer");
    const parkingContainer = document.getElementById("parkingContainer");
    const authForm = document.getElementById("authForm");
    const formTitle = document.getElementById("formTitle");
    const submitButton = document.getElementById("submitButton");
    const toggleMessage = document.getElementById("toggleMessage");
    const errorMessage = document.getElementById("errorMessage");
    const logoutButton = document.getElementById("logoutButton");
    const historyList = document.getElementById("historyList");

    let isLogin = true;
    let sharedMap, rentMap, sharedMarkers = [], rentMarkers = [];
    const API_URL = 'http://192.168.50.222:8080/api/v1'; // 後端 URL，確認與伺服器一致

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
    });

    // 處理登入/註冊（改為連接到後端 API）
    authForm.addEventListener("submit", async function (event) {
        event.preventDefault();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value.trim();

        if (isLogin) {
            try {
                const response = await fetch(`${API_URL}/login`, {
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
                    errorMessage.textContent = result.message || "電子郵件或密碼錯誤！";
                }
            } catch (error) {
                console.error("Login failed:", error);
                errorMessage.textContent = "無法連接到伺服器，請檢查網路或後端服務";
            }
        } else {
            try {
                 const response = await fetch(`${API_URL}/members/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                const result = await response.json();
                if (response.ok) {
                    alert("註冊成功！請使用此帳號登入。");
                    isLogin = true;
                    formTitle.textContent = "登入";
                    submitButton.textContent = "登入";
                    toggleMessage.innerHTML = '還沒有帳號？<a href="#" id="toggleLink">註冊</a>';
                } else {
                    errorMessage.textContent = result.message || "註冊失敗";
                }
            } catch (error) {
                console.error("Register failed:", error);
                errorMessage.textContent = "無法連接到伺服器，請檢查網路或後端服務";
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

    // 初始化地圖
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

        setTimeout(() => map.invalidateSize(), 100); // 確保地圖尺寸更新
        return map;
    }

    // 更新地圖標記（從後端獲取資料）
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

    // 功能清單切換並初始化地圖
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

    // 共享車位過濾
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

    // 租用車位過濾
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

    // 查看車位
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

    // 預約車位
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

    // 初始化過濾功能
    setupSharedParkingFilters();
    setupRentParkingFilters();

    // 新增歷史紀錄
    function addToHistory(action) {
        const now = new Date();
        const timestamp = now.toLocaleString("zh-TW", { hour12: false });
        const listItem = document.createElement("li");
        listItem.textContent = `${action} - ${timestamp}`;
        historyList.appendChild(listItem);
    }
});