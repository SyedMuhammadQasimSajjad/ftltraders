// 1. Configuration
const STORE_WHATSAPP_NUMBER = "923000708221";
const STORE_NAME = "FTL Traders";

function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function formatPKR(price) {
    return new Intl.NumberFormat('en-PK', {
        style: 'currency',
        currency: 'PKR',
        maximumFractionDigits: 0
    }).format(price);
}

const NO_IMAGE_SVG = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22400%22%20height%3D%22300%22%20style%3D%22background%3A%23222%22%3E%3Ctext%20fill%3D%22%23fff%22%20y%3D%2250%25%22%20x%3D%2250%25%22%20text-anchor%3D%22middle%22%20font-family%3D%22sans-serif%22%20font-size%3D%2220px%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fsvg%3E';

function resolveProductImage(product) {
    if (!product.media_url) return NO_IMAGE_SVG;
    const rawUrl = product.media_url.trim();
    if (rawUrl.startsWith('[')) {
        try {
            const parsedData = JSON.parse(rawUrl);
            if (parsedData.length > 0) return parsedData[0].url;
        } catch (e) {
            console.error("Parse error on product:", product.title);
        }
        return NO_IMAGE_SVG;
    }
    return rawUrl;
}

// 2. Global State for Products, Cart, & Comparison Engine
let products = [];
let cart = [];
let compareList = [];

// 3. DOM Elements
const productGrid = document.getElementById('product-grid');
const cartCount = document.getElementById('cart-count');
const cartModal = document.getElementById('cart-modal');
const cartBtn = document.getElementById('cart-btn');
const closeModalBtn = document.getElementById('close-modal-btn');
const cartItemsContainer = document.getElementById('cart-items');
const totalPriceEl = document.getElementById('total-price');
const checkoutForm = document.getElementById('checkout-form');

// Slider DOM Elements
const minPriceSlider = document.getElementById('min-price-slider');
const maxPriceSlider = document.getElementById('max-price-slider');
const sliderTrack = document.getElementById('slider-track');
const minPriceDisplay = document.getElementById('min-price-display');
const maxPriceDisplay = document.getElementById('max-price-display');
const SLIDER_MAX = 500000;

// Compare UI Elements
const compareBar = document.getElementById('compare-bar');
const compareCount = document.getElementById('compare-count');
const compareOpenBtn = document.getElementById('compare-open-btn');
const compareClearBtn = document.getElementById('compare-clear-btn');
const compareModal = document.getElementById('compare-modal');
const closeCompareModal = document.getElementById('close-compare-modal');
const compareTableBody = document.getElementById('compare-table-body');

// 4. Fetch data from Node.js Backend
async function fetchProducts() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/products`);
        if (!response.ok) throw new Error('Network response was not ok');

        const data = await response.json();
        products = data.map(product => ({
            ...product,
            price: parseFloat(product.price)
        }));

        renderProducts(products);

    } catch (error) {
        console.error("Failed to fetch products:", error);
        productGrid.innerHTML = `
            <div class="col-span-full flex flex-col items-center justify-center py-20 text-red-500 w-full text-center">
                <i class="fas fa-exclamation-triangle text-5xl mb-4 opacity-50"></i>
                <p class="text-lg font-medium">Failed to connect to the database.</p>
            </div>`;
    }
}

// 5. Render Products to the Grid
function renderProducts(productsToRender = products) {
    productGrid.innerHTML = '';

    if (productsToRender.length === 0) {
        productGrid.innerHTML = `
            <div class="col-span-full flex flex-col items-center justify-center py-20 text-slate-500 dark:text-neutral-500 w-full text-center">
                <i class="fas fa-search-minus text-5xl mb-4 opacity-30"></i>
                <p class="text-lg font-medium">No laptops match your criteria.</p>
            </div>`;
        return;
    }

    productsToRender.forEach(product => {
        const card = document.createElement('div');
        card.className = "product-card group bg-white dark:bg-neutral-900/30 backdrop-blur-sm rounded-3xl border border-slate-200 dark:border-white/5 overflow-hidden hover:border-indigo-500/50 dark:hover:border-indigo-500/50 hover:shadow-xl dark:hover:bg-neutral-900/60 transition-all duration-500 flex flex-col relative";

        const firstImage = resolveProductImage(product);
        const safeTitle = escapeHtml(product.title);
        const safeBrand = escapeHtml(product.brand);
        const safeCpu = escapeHtml(product.cpu);
        const safeRam = escapeHtml(product.ram);
        const safeImageUrl = escapeHtml(firstImage);

        // Ensure missing categories default gracefully
        const safeCategory = escapeHtml(product.category || 'General');

        // Persistent validation status across layout updates
        const isAlreadyCompared = compareList.some(p => p.id === product.id) ? 'checked' : '';

        card.innerHTML = `
            <div class="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-indigo-500/20 rounded-full blur-[50px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <!-- Contextual Matrix Compare Option -->
            <label class="absolute top-4 right-4 z-30 flex items-center gap-1.5 bg-white/90 dark:bg-neutral-950/80 backdrop-blur-md py-1.5 px-2.5 rounded-xl border border-slate-200 dark:border-white/10 cursor-pointer text-[10px] font-bold text-slate-700 dark:text-neutral-300 select-none shadow-sm">
                <input type="checkbox" data-compare-id="${product.id}" onchange="toggleCompare(event, ${product.id})" ${isAlreadyCompared} class="compare-checkbox rounded border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-indigo-500 focus:ring-indigo-500/50 w-3.5 h-3.5 transition-all cursor-pointer">
                Compare
            </label>

              <a href="product-detail.html?id=${product.id}" class="p-4 sm:p-6 flex items-center justify-center aspect-square relative z-10 block cursor-pointer">
        <img src="${safeImageUrl}" 
             alt="${safeTitle}" 
             class="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105 drop-shadow-2xl"
             onerror="this.onerror=null; this.src='${NO_IMAGE_SVG}'">
    </a>
            <div class="p-4 sm:p-6 flex-1 flex flex-col justify-between border-t border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-neutral-950/50 relative z-10">
                <div>
                    <!-- CATEGORY TAG ADDED HERE -->
                    <div class="flex items-center gap-2 mb-3">
                        <span class="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-indigo-500 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 rounded-full border border-indigo-100 dark:border-indigo-500/20">${safeBrand}</span>
                        <span class="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-500 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 rounded-full border border-emerald-100 dark:border-emerald-500/20">${safeCategory}</span>
                    </div>
                    <a href="product-detail.html?id=${product.id}">
                        <h3 class="font-bold text-slate-900 dark:text-white text-sm sm:text-lg mb-1 leading-tight truncate hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors">${safeTitle}</h3>
                    </a>
                    <p class="text-[10px] sm:text-xs text-slate-500 dark:text-neutral-500 font-medium mb-4 truncate">${safeCpu} • ${safeRam}</p>
                </div>
                
                <div class="flex flex-col mt-auto gap-3 pt-3 border-t border-slate-200/50 dark:border-white/5">
                    <!-- ADDED: price-font class applied here -->
                    <span class="text-base sm:text-lg text-slate-900 dark:text-white tracking-tight font-bold price-font">${formatPKR(product.price)}</span>
                    <div class="flex items-center gap-2">
                        <a href="product-detail.html?id=${product.id}" class="flex-1 bg-slate-200 dark:bg-white/5 hover:bg-slate-300 dark:hover:bg-white/10 text-slate-900 dark:text-white text-xs font-semibold py-2.5 rounded-xl transition-all border border-slate-300 dark:border-white/10 text-center">
                            Details
                        </a>
                        <button onclick="addToCart(${product.id})" class="add-to-cart-btn bg-slate-900 dark:bg-white/10 hover:bg-indigo-600 dark:hover:bg-indigo-600 text-white text-sm font-semibold w-10 h-10 rounded-xl transition-all flex items-center justify-center shrink-0 border border-transparent dark:border-white/10 shadow-md dark:shadow-none">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
        productGrid.appendChild(card);
    });
}

// 6. Comparison Feature Logical Core
window.toggleCompare = (event, id) => {
    event.stopPropagation();
    const isChecked = event.target.checked;

    if (isChecked) {
        if (compareList.length >= 3) {
            alert("You can compare up to 3 laptops simultaneously.");
            event.target.checked = false;
            return;
        }
        const targetedProduct = products.find(p => p.id === id);
        if (targetedProduct && !compareList.some(p => p.id === id)) {
            compareList.push(targetedProduct);
        }
    } else {
        compareList = compareList.filter(p => p.id !== id);
    }

    // Sync ALL checkboxes across the entire page
    document.querySelectorAll(`.compare-checkbox[data-compare-id="${id}"]`).forEach(cb => {
        cb.checked = isChecked;
    });

    updateCompareBarUI();
};

function renderCompareTable() {
    if (!compareTableBody) return;

    if (compareList.length === 0) {
        compareTableBody.innerHTML = '';
        return;
    }

    const rows = [
        { label: 'Model Spec', key: 'image' },
        { label: 'Product Title', key: 'title' },
        { label: 'Manufacturer', key: 'brand' },
        { label: 'Wholesale Price', key: 'price' },
        { label: 'Processor (CPU)', key: 'cpu', fallback: 'N/A' },
        { label: 'CPU Cores & Threads', key: 'cpu_cores', fallback: 'Placeholder: 4 Cores / 8 Threads' },
        { label: 'Graphics Card (GPU)', key: 'gpu', fallback: 'Placeholder: Intel Iris Xe / AMD Radeon' },
        { label: 'Video Memory (VRAM)', key: 'vram', fallback: 'Placeholder: Shared System Memory' },
        { label: 'Installed Memory (RAM)', key: 'ram', fallback: 'N/A' },
        { label: 'RAM Type & Speed', key: 'ram_type', fallback: 'Placeholder: DDR4 3200MHz' },
        { label: 'Primary Storage Drive', key: 'storage', fallback: 'N/A' },
        { label: 'Storage Interface', key: 'storage_type', fallback: 'Placeholder: PCIe NVMe M.2 SSD' },
        { label: 'Display Panel Properties', key: 'display_spec', fallback: 'Placeholder: 15.6" Diagonal' },
        { label: 'Screen Resolution', key: 'resolution', fallback: 'Placeholder: 1920 x 1080 (FHD)' },
        { label: 'Refresh Rate', key: 'refresh_rate', fallback: 'Placeholder: 60Hz' },
        { label: 'Panel Technology', key: 'panel_type', fallback: 'Placeholder: IPS Anti-Glare' },
        { label: 'Wireless Networking', key: 'wifi', fallback: 'Placeholder: Wi-Fi 6 (802.11ax) + Bluetooth 5.1' },
        { label: 'Input/Output Ports', key: 'ports', fallback: 'Placeholder: 2x USB-A, 1x USB-C, HDMI, Audio Jack' },
        { label: 'Webcam Resolution', key: 'webcam', fallback: 'Placeholder: 720p HD Camera with Privacy Shutter' },
        { label: 'Keyboard & Input', key: 'keyboard', fallback: 'Placeholder: Standard Island-style Keyboard' },
        { label: 'Biometrics & Security', key: 'security', fallback: 'Placeholder: TPM 2.0 Enabled' },
        { label: 'Operating System', key: 'os', fallback: 'Placeholder: Windows 11 Pro 64-bit' },
        { label: 'Battery Operational Status', key: 'battery_health', fallback: 'Placeholder: Tested 85%+ Capacity' },
        { label: 'Approximate Weight', key: 'weight', fallback: 'Placeholder: 1.7 kg (3.75 lbs)' },
        { label: 'Chassis Material', key: 'material', fallback: 'Placeholder: Aluminum / Composite Plastic' },
        { label: 'Current Grade / Condition', key: 'condition', fallback: 'Placeholder: Pre-owned / Mint Grade A' },
        { label: 'Warranty & Support', key: 'warranty', fallback: 'Placeholder: 15-Day Store Checking Warranty' },
        { label: 'Action Selection', key: 'action' }
    ];

    let generatedHtml = '';

    rows.forEach(row => {
        generatedHtml += `<tr class="border-b border-slate-200/80 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">`;

        // Label column — narrow on mobile, wider at md+
        generatedHtml += `<td class="p-1 sm:p-2 md:p-4 align-middle font-bold text-[8px] sm:text-[10px] md:text-xs uppercase tracking-wide text-slate-500 dark:text-neutral-400 bg-slate-100/50 dark:bg-neutral-900/50 break-words">${row.label}</td>`;

        compareList.forEach(product => {
            generatedHtml += `<td class="p-1 sm:p-2 md:p-4 align-middle text-[9px] sm:text-[11px] md:text-sm font-medium text-slate-800 dark:text-neutral-200 border-l border-slate-200/50 dark:border-white/5 overflow-hidden">`;

            if (row.key === 'image') {
                const escapedUrl = escapeHtml(resolveProductImage(product));
                generatedHtml += `
                    <div class="w-10 h-10 sm:w-16 sm:h-16 md:w-32 md:h-32 mx-auto flex items-center justify-center bg-white dark:bg-neutral-950 p-1 sm:p-2 md:p-3 rounded-lg md:rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm">
                        <img src="${escapedUrl}" class="max-w-full max-h-full object-contain">
                    </div>`;
            } else if (row.key === 'title') {
                generatedHtml += `<span class="font-bold text-slate-900 dark:text-white block text-center mt-1 md:mt-2 leading-tight break-words">${escapeHtml(product.title)}</span>`;
            } else if (row.key === 'price') {
                generatedHtml += `<span class="font-bold text-indigo-600 dark:text-indigo-400 block text-center text-[10px] sm:text-xs md:text-lg break-words price-font">${formatPKR(product.price)}</span>`;
            } else if (row.key === 'action') {
                generatedHtml += `
                    <div class="flex flex-col gap-1 sm:gap-1.5 md:gap-2 mt-1 md:mt-4">
                        <button onclick="addToCart(${product.id})" class="bg-emerald-500 hover:bg-emerald-600 text-white text-[9px] sm:text-[11px] md:text-xs font-bold py-1 sm:py-1.5 md:py-2.5 px-1 md:px-3 rounded-md md:rounded-xl transition-all text-center flex justify-center items-center gap-1"><i class="fas fa-cart-plus"></i> <span class="hidden sm:inline">Add to Cart</span><span class="sm:hidden">Add</span></button>
                        <a href="product-detail.html?id=${product.id}" class="bg-slate-100 dark:bg-neutral-800 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-neutral-300 text-[9px] sm:text-[11px] md:text-xs font-semibold py-1 sm:py-1.5 md:py-2.5 px-1 md:px-3 rounded-md md:rounded-xl text-center hover:bg-slate-200 dark:hover:bg-neutral-700 transition-all">Details</a>
                    </div>`;
            } else {
                generatedHtml += `<span class="block text-center text-slate-600 dark:text-neutral-400 leading-tight md:leading-relaxed break-words">${escapeHtml(product[row.key] || row.fallback)}</span>`;
            }

            generatedHtml += `</td>`;
        });

        generatedHtml += `</tr>`;
    });

    compareTableBody.innerHTML = generatedHtml;
}
function updateCompareBarUI() {
    if (!compareBar || !compareCount) return;

    compareCount.innerText = compareList.length;

    if (compareList.length > 0) {
        compareBar.classList.remove('hidden');
        compareBar.classList.add('flex');
    } else {
        compareBar.classList.add('hidden');
        compareBar.classList.remove('flex');
    }
}
if (compareOpenBtn) {
    compareOpenBtn.addEventListener('click', () => {
        renderCompareTable();
        compareModal.classList.remove('hidden');
        compareModal.classList.add('flex');
    });
}

if (closeCompareModal) {
    closeCompareModal.addEventListener('click', () => {
        compareModal.classList.add('hidden');
        compareModal.classList.remove('flex');
    });
}

if (compareClearBtn) {
    compareClearBtn.addEventListener('click', () => {
        compareList = [];
        updateCompareBarUI();
        document.querySelectorAll('.compare-checkbox').forEach(cb => cb.checked = false);
    });
}

// 7. Cart Logic
window.addToCart = (productId) => {
    const product = products.find(p => p.id === productId);
    if (product) {
        cart.push(product);
        updateCartUI();

        cartBtn.classList.add('animate-bounce');
        setTimeout(() => cartBtn.classList.remove('animate-bounce'), 1000);
    }
};

window.removeFromCart = (index) => {
    cart.splice(index, 1);
    updateCartUI();
};

function updateCartUI() {
    cartCount.innerText = cart.length;
    cartItemsContainer.innerHTML = '';
    let total = 0;

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `
            <div class="flex flex-col items-center justify-center py-10 text-neutral-500">
                <i class="fas fa-shopping-basket text-4xl mb-4 opacity-30"></i>
                <p class="text-sm font-medium uppercase tracking-widest">Your cart is empty</p>
            </div>`;
    } else {
        cart.forEach((item, index) => {
            total += item.price;
            const safeTitle = escapeHtml(item.title);
            const safeSpecs = `${escapeHtml(item.cpu)} • ${escapeHtml(item.ram)} • ${escapeHtml(item.storage)}`;
            cartItemsContainer.innerHTML += `
                <div class="flex items-center gap-4 bg-neutral-800 p-4 rounded-2xl border border-neutral-700 shadow-lg relative group transition-all hover:border-indigo-500/50">
                    <div class="w-14 h-14 bg-neutral-900 rounded-xl flex items-center justify-center border border-white/5 shrink-0 shadow-inner">
                        <i class="fas fa-laptop text-indigo-400 text-xl"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                        <h4 class="text-base font-bold text-white truncate mb-1">${safeTitle}</h4>
                        <span class="text-[10px] text-neutral-300 font-medium bg-neutral-900 px-2 py-1 rounded-md border border-neutral-700 inline-block">
                            ${safeSpecs}
                        </span>
                    </div>
                    <div class="text-right flex flex-col items-end">
                        <!-- ADDED: price-font class applied here -->
                        <span class="text-lg font-bold text-white block mb-2 price-font">${formatPKR(item.price)}</span>
                        <button onclick="removeFromCart(${index})" class="text-[10px] font-bold uppercase tracking-wider text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 px-2.5 py-1 rounded transition-colors flex items-center gap-1">
                            <i class="fas fa-trash-alt"></i> Remove
                        </button>
                    </div>
                </div>
            `;
        });
    }
    totalPriceEl.innerText = formatPKR(total);
}

// 8. Modal Toggles
cartBtn.addEventListener('click', () => {
    cartModal.classList.remove('hidden');
    cartModal.classList.add('flex');
});
closeModalBtn.addEventListener('click', () => {
    cartModal.classList.add('hidden');
    cartModal.classList.remove('flex');
});
cartModal.addEventListener('click', (e) => {
    if (e.target === cartModal) {
        cartModal.classList.add('hidden');
        cartModal.classList.remove('flex');
    }
});

// 9. Generate WhatsApp Order Message
checkoutForm.addEventListener('submit', (e) => {
    e.preventDefault();

    if (cart.length === 0) {
        alert("Your cart is empty!");
        return;
    }

    const name = document.getElementById('customer-name').value;
    const phone = document.getElementById('customer-phone').value;
    const address = document.getElementById('customer-address').value;
    const total = cart.reduce((sum, item) => sum + item.price, 0);

    let message = `*New Order from ${STORE_NAME}*\n\n`;
    message += `*Customer Details:*\nName: ${name}\nPhone: ${phone}\nAddress: ${address}\n\n`;
    message += `*Order Items:*\n`;

    const itemCounts = {};
    cart.forEach(item => {
        const key = `${item.title} (${item.cpu}/${item.ram}/${item.storage}) - ${formatPKR(item.price)}`;
        itemCounts[key] = (itemCounts[key] || 0) + 1;
    });

    for (const [itemString, qty] of Object.entries(itemCounts)) {
        message += `• ${itemString} x ${qty}\n`;
    }

    message += `\n*Total Amount: ${formatPKR(total)}*`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${STORE_WHATSAPP_NUMBER}?text=${encodedMessage}`, '_blank');
});

// 10. Unified Filter, Search, and Sort Engine
const searchInput = document.getElementById('search-input');
const sortSelect = document.getElementById('sort-select');
const applyFiltersBtn = document.getElementById('apply-filters');
const clearFiltersBtn = document.getElementById('clear-filters');

function includesLoose(haystack, needle) {
    if (!haystack) return false;
    return haystack.toString().toLowerCase().includes(needle.toLowerCase());
}

function updateSliderUI() {
    if(!minPriceSlider || !maxPriceSlider) return;

    let minVal = parseInt(minPriceSlider.value);
    let maxVal = parseInt(maxPriceSlider.value);

    if (minVal > maxVal - 5000) {
        minVal = maxVal - 5000;
        minPriceSlider.value = minVal;
    }
    if (maxVal < minVal + 5000) {
        maxVal = minVal + 5000;
        maxPriceSlider.value = maxVal;
    }

    const minPercent = (minVal / SLIDER_MAX) * 100;
    const maxPercent = (maxVal / SLIDER_MAX) * 100;
    sliderTrack.style.left = `${minPercent}%`;
    sliderTrack.style.right = `${100 - maxPercent}%`;

    minPriceDisplay.innerText = formatPKR(minVal);
    maxPriceDisplay.innerText = maxVal >= SLIDER_MAX ? formatPKR(maxVal) + '+' : formatPKR(maxVal);
}

if(minPriceSlider && maxPriceSlider) {
    minPriceSlider.addEventListener('input', updateSliderUI);
    maxPriceSlider.addEventListener('input', updateSliderUI);
}

function filterAndSortProducts() {
    const selectedBrands = Array.from(document.querySelectorAll('input[name="brand"]:checked')).map(el => el.value);
    const selectedCPUs = Array.from(document.querySelectorAll('input[name="cpu"]:checked')).map(el => el.value);
    const selectedRAMs = Array.from(document.querySelectorAll('input[name="ram"]:checked')).map(el => el.value);
    const selectedStorages = Array.from(document.querySelectorAll('input[name="storage"]:checked')).map(el => el.value);
    const searchQuery = searchInput.value.toLowerCase().trim();

    const minPrice = parseInt(minPriceSlider ? minPriceSlider.value : 0);
    const maxPrice = parseInt(maxPriceSlider ? maxPriceSlider.value : SLIDER_MAX);
    const isMaxInfinity = maxPrice >= SLIDER_MAX;

    // Get the current active category from the pill
    const activeCategoryLabel = categoryPill.classList.contains('flex') ? categoryPillLabel.innerText : null;

    let processedProducts = products.filter(product => {
        // 1. Existing Filters
        const matchesBrand = selectedBrands.length === 0 || selectedBrands.some(v => includesLoose(product.brand, v));
        const matchesCPU = selectedCPUs.length === 0 || selectedCPUs.some(v => includesLoose(product.cpu, v));
        const matchesRAM = selectedRAMs.length === 0 || selectedRAMs.some(v => includesLoose(product.ram, v));
        const matchesStorage = selectedStorages.length === 0 || selectedStorages.some(v => includesLoose(product.storage, v));

        const productPrice = parseFloat(product.price);
        const matchesPrice = productPrice >= minPrice && (isMaxInfinity || productPrice <= maxPrice);

        const matchesSearch = !searchQuery ||
            includesLoose(product.title, searchQuery) ||
            includesLoose(product.brand, searchQuery) ||
            includesLoose(product.cpu, searchQuery) ||
            includesLoose(product.description, searchQuery);

        // 2. New Exact Database Category Match
        const matchesCategory = !activeCategoryLabel || product.category === getCategoryKeyByLabel(activeCategoryLabel);

        return matchesBrand && matchesCPU && matchesRAM && matchesStorage && matchesSearch && matchesPrice && matchesCategory;
    });

    // 3. Sorting
    const sortValue = sortSelect.value;
    if (sortValue === "price-low") {
        processedProducts.sort((a, b) => a.price - b.price);
    } else if (sortValue === "price-high") {
        processedProducts.sort((a, b) => b.price - a.price);
    }

    renderProducts(processedProducts);
}


applyFiltersBtn.addEventListener('click', filterAndSortProducts);
sortSelect.addEventListener('change', filterAndSortProducts);
searchInput.addEventListener('input', filterAndSortProducts);

clearFiltersBtn.addEventListener('click', () => {
    document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => checkbox.checked = false);
    searchInput.value = '';
    sortSelect.value = 'default';

    if(minPriceSlider && maxPriceSlider) {
        minPriceSlider.value = 0;
        maxPriceSlider.value = SLIDER_MAX;
        updateSliderUI();
    }

    hideCategoryPill();
    renderProducts(products);
});

// 11. Categories & Gaming Showcase
const categoryLabels = {
    business: 'Business Laptops',
    budget: 'Student & Budget Laptops',
    gaming: 'Gaming Laptops',
    apple: 'Apple / MacBook',
    general: 'General Laptops' // <-- NEW CATEGORY ADDED
};

const categoryPill = document.getElementById('category-pill');
const categoryPillLabel = document.getElementById('category-pill-label');
const clearCategoryPillBtn = document.getElementById('clear-category-pill');

function showCategoryPill(label) {
    categoryPillLabel.innerText = label;
    categoryPill.classList.remove('hidden');
    categoryPill.classList.add('flex');
}

function hideCategoryPill() {
    categoryPill.classList.add('hidden');
    categoryPill.classList.remove('flex');
}

function applyCategory(categoryKey) {
    // Clear all existing checkbox filters when clicking a main category pill
    document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
    searchInput.value = '';
    sortSelect.value = 'default';
    if(minPriceSlider && maxPriceSlider) {
        minPriceSlider.value = 0;
        maxPriceSlider.value = SLIDER_MAX;
        updateSliderUI();
    }

    // Set UI Pill and trigger standard filter
    showCategoryPill(categoryLabels[categoryKey] || categoryKey);
    filterAndSortProducts();

    productGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

document.querySelectorAll('[data-category]').forEach(btn => {
    btn.addEventListener('click', () => applyCategory(btn.dataset.category));
});

if (clearCategoryPillBtn) {
    clearCategoryPillBtn.addEventListener('click', () => {
        hideCategoryPill();
        filterAndSortProducts();
    });
}

// 12. Mobile Filter Toggle
const mobileFilterToggle = document.getElementById('mobile-filter-toggle');
const filterContent = document.getElementById('filter-content');
const filterChevron = document.getElementById('filter-chevron');

if (mobileFilterToggle) {
    mobileFilterToggle.addEventListener('click', () => {
        filterContent.classList.toggle('hidden');
        filterChevron.classList.toggle('rotate-180');
    });
}

// 13. Theme Switcher Logic
const themeToggleBtn = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');

if (localStorage.getItem('theme') === 'light') {
    document.documentElement.classList.remove('dark');
    themeIcon.className = 'fas fa-sun';
} else {
    document.documentElement.classList.add('dark');
    themeIcon.className = 'fas fa-moon';
}

themeToggleBtn.addEventListener('click', () => {
    document.documentElement.classList.toggle('dark');
    const isDark = document.documentElement.classList.contains('dark');
    themeIcon.className = isDark ? 'fas fa-moon' : 'fas fa-sun';
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
});

// Helper to reverse map UI label to DB Key
function getCategoryKeyByLabel(label) {
    return Object.keys(categoryLabels).find(key => categoryLabels[key] === label) || null;
}

// Initialize the app
updateSliderUI();
fetchProducts();
updateCartUI();