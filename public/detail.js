// 1. Configuration & Global State
const STORE_WHATSAPP_NUMBER = "923000708221";
const STORE_NAME = "FTL Traders";

const urlParams = new URLSearchParams(window.location.search);
const productId = parseInt(urlParams.get('id'));

let currentGallery = [];
let currentGalleryIndex = 0;
let currentProduct = null;

// INSTANT SEO PRE-INJECTION (Fires immediately to prevent Google duplicate canonical warnings)
const initialProductId = productId;
if (initialProductId) {
    const instantUrl = `https://ftltraders.com/product-detail.html?id=${initialProductId}`;
    const canonicalEl = document.getElementById('seo-canonical');
    const ogUrlEl = document.getElementById('seo-og-url');

    if (canonicalEl) canonicalEl.setAttribute('href', instantUrl);
    if (ogUrlEl) ogUrlEl.setAttribute('href', instantUrl);
}

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

// 2. Fetch and Render Reviews
async function fetchAndRenderReviews() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/reviews/${productId}`);
        const reviews = await response.json();

        const reviewsList = document.getElementById('reviews-list');
        const avgRatingEl = document.getElementById('average-rating');
        const totalReviewsEl = document.getElementById('total-reviews');
        const starContainer = document.getElementById('star-container');

        if (!reviewsList) return;

        if (reviews.length === 0) {
            reviewsList.innerHTML = `<p class="text-sm text-slate-500 dark:text-neutral-500 italic">No reviews yet.</p>`;
            avgRatingEl.innerText = "0.0";
            totalReviewsEl.innerText = "0";
            return;
        }

        const totalScore = reviews.reduce((sum, rev) => sum + rev.rating, 0);
        const average = (totalScore / reviews.length).toFixed(1);

        avgRatingEl.innerText = average;
        totalReviewsEl.innerText = reviews.length;

        if (starContainer) {
            const rounded = Math.round(average);
            starContainer.innerHTML = Array.from({ length: 5 }, (_, i) =>
                `<i class="${i < rounded ? 'fas' : 'far'} fa-star"></i>`
            ).join('');
        }

        reviewsList.innerHTML = reviews.map(review => `
            <div class="bg-slate-50 dark:bg-neutral-900/30 p-4 rounded-xl border border-slate-200 dark:border-white/5">
                <div class="flex items-center justify-between">
                    <p class="font-bold text-sm">${escapeHtml(review.customer_name)}</p>
                    <div class="text-yellow-400 text-xs">
                        ${Array.from({ length: 5 }, (_, i) =>
            `<i class="${i < review.rating ? 'fas' : 'far'} fa-star"></i>`
        ).join('')}
                    </div>
                </div>
                <p class="text-xs text-slate-600 dark:text-neutral-400 mt-2">${escapeHtml(review.comment)}</p>
            </div>
        `).join('');
    } catch (err) {
        console.error("Error loading reviews:", err);
    }
}

// 3. Fetch and Render Product Details
async function loadProductDetails() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/products`);
        const products = await response.json();
        const product = products.find(p => p.id === productId);

        if (product) {
            currentProduct = product;

            document.getElementById('detail-title').innerText = product.title;
            document.getElementById('detail-price').innerText = formatPKR(parseFloat(product.price));

            const brandEl = document.getElementById('detail-brand');
            if (brandEl) brandEl.innerText = product.brand || "N/A";

            const cpuEl = document.getElementById('detail-cpu');
            if (cpuEl) cpuEl.innerText = product.cpu || "N/A";

            const ramEl = document.getElementById('detail-ram');
            if (ramEl) ramEl.innerText = product.ram || "N/A";

            const storageEl = document.getElementById('detail-storage');
            if (storageEl) storageEl.innerText = product.storage || "N/A";

            // Gallery logic
            try {
                if (typeof product.media_url === 'string' && product.media_url.trim().startsWith('[')) {
                    currentGallery = JSON.parse(product.media_url);
                } else if (product.media_url) {
                    currentGallery = [{ url: product.media_url }];
                } else {
                    currentGallery = [];
                }
            } catch (e) {
                console.error("Error parsing gallery data:", e);
                currentGallery = product.media_url ? [{ url: product.media_url }] : [];
            }

            currentGalleryIndex = 0;
            const imgEl = document.getElementById('detail-image');
            if (imgEl && currentGallery.length > 0) {
                imgEl.src = currentGallery[0].url;
            }

            // GENERATE FULL SPECIFICATIONS MATRIX TABLE
            const specsTableBody = document.getElementById('detail-specs-table-body');
            if (specsTableBody) {
                const specDefinitions = [
                    { label: 'Laptop Identity ID', value: `#${product.id}` },
                    { label: 'Brand Manufacturer', value: product.brand || 'N/A' },
                    { label: 'Model Nomenclature', value: product.title || 'N/A' },
                    { label: 'Processor (CPU)', value: product.cpu || 'N/A' },
                    { label: 'CPU Cores & Threads', value: product.cpu_cores || 'Placeholder: 4 Cores / 8 Threads' },
                    { label: 'Graphics Card (GPU)', value: product.gpu || 'Placeholder: Intel Iris Xe / AMD Radeon' },
                    { label: 'Video Memory (VRAM)', value: product.vram || 'Placeholder: Shared System Memory' },
                    { label: 'Installed Memory (RAM)', value: product.ram || 'N/A' },
                    { label: 'RAM Type & Speed', value: product.ram_type || 'Placeholder: DDR4 3200MHz' },
                    { label: 'Primary Storage Drive', value: product.storage || 'N/A' },
                    { label: 'Storage Interface', value: product.storage_type || 'Placeholder: PCIe NVMe M.2 SSD' },
                    { label: 'Display Panel Properties', value: product.display_spec || 'Placeholder: 15.6" Diagonal' },
                    { label: 'Screen Resolution', value: product.resolution || 'Placeholder: 1920 x 1080 (FHD)' },
                    { label: 'Refresh Rate', value: product.refresh_rate || 'Placeholder: 60Hz' },
                    { label: 'Panel Technology', value: product.panel_type || 'Placeholder: IPS Anti-Glare' },
                    { label: 'Wireless Networking', value: product.wifi || 'Placeholder: Wi-Fi 6 (802.11ax) + Bluetooth 5.1' },
                    { label: 'Input/Output Ports', value: product.ports || 'Placeholder: 2x USB-A, 1x USB-C, HDMI, Audio Jack' },
                    { label: 'Webcam Resolution', value: product.webcam || 'Placeholder: 720p HD Camera with Privacy Shutter' },
                    { label: 'Keyboard & Input', value: product.keyboard || 'Placeholder: Standard Island-style Keyboard' },
                    { label: 'Biometrics & Security', value: product.security || 'Placeholder: TPM 2.0 Enabled' },
                    { label: 'Operating System', value: product.os || 'Placeholder: Windows 11 Pro 64-bit' },
                    { label: 'Battery Operational Status', value: product.battery_health || 'Placeholder: Tested 85%+ Capacity' },
                    { label: 'Approximate Weight', value: product.weight || 'Placeholder: 1.7 kg (3.75 lbs)' },
                    { label: 'Chassis Material', value: product.material || 'Placeholder: Aluminum / Composite Plastic' },
                    { label: 'Current Grade / Condition', value: product.condition || 'Placeholder: Pre-owned / Mint Grade A' },
                    { label: 'Warranty & Support', value: product.warranty || 'Placeholder: 15-Day Store Checking Warranty' },
                    { label: 'Wholesale Price (PKR)', value: formatPKR(product.price) }
                ];

                specsTableBody.innerHTML = specDefinitions.map(spec => `
                    <tr class="border-b border-slate-200 dark:border-white/5 last:border-b-0 hover:bg-slate-100/50 dark:hover:bg-white/5 transition-colors">
                        <td class="p-4 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500 w-1/3 bg-slate-100/30 dark:bg-neutral-950/20">${escapeHtml(spec.label)}</td>
                        <td class="p-4 text-sm font-semibold text-slate-800 dark:text-neutral-200">${escapeHtml(spec.value)}</td>
                    </tr>
                `).join('');
            }

            // Inject Dynamic Notes/Description below table
            const notesElement = document.getElementById('detail-additional-notes');
            if (notesElement) {
                const safeDescription = escapeHtml(product.description || "No additional custom notes specified by seller.");
                notesElement.innerHTML = `<p class="whitespace-pre-line">${safeDescription}</p>`;
            }

            // Inject SEO and Schema metadata
            injectSEOData(product, currentGallery);

            fetchAndRenderReviews();

        } else {
            console.error("Product not found for id:", productId);
        }
    } catch (error) {
        console.error("Error loading product:", error);
    }
    finally {
        const loader = document.getElementById('page-loader');
        if (loader) {
            loader.classList.add('opacity-0', 'pointer-events-none');
            setTimeout(() => loader.remove(), 300);
        }
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.classList.remove('hidden');
        }
    }
}

// 4. Gallery Navigation (Main Page)
window.changeGalleryImage = (direction) => {
    if (currentGallery.length <= 1) return;
    currentGalleryIndex = (currentGalleryIndex + direction + currentGallery.length) % currentGallery.length;
    const imgEl = document.getElementById('detail-image');
    if (imgEl && currentGallery[currentGalleryIndex]) {
        imgEl.src = currentGallery[currentGalleryIndex].url;
    }
};

// --- LIGHTBOX ZOOM & NEXT/PREV GALLERY POPUP LOGIC ---
document.addEventListener('DOMContentLoaded', () => {
    const mainProductImage = document.getElementById('detail-image');
    const lightboxModal = document.getElementById('image-lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const closeLightboxBtn = document.getElementById('close-lightbox');
    const prevBtn = document.getElementById('prev-lightbox');
    const nextBtn = document.getElementById('next-lightbox');

    if (mainProductImage && lightboxModal) {
        // Open lightbox with all gallery images starting from the currently active index
        mainProductImage.addEventListener('click', () => {
            if (currentGallery.length === 0) return;

            lightboxImg.src = currentGallery[currentGalleryIndex].url;
            lightboxModal.classList.remove('hidden');
            lightboxModal.classList.add('flex');
            document.body.style.overflow = 'hidden';
        });

        const closeLightbox = () => {
            lightboxModal.classList.add('hidden');
            lightboxModal.classList.remove('flex');
            document.body.style.overflow = '';
        };

        const showNextLightboxImage = () => {
            if (currentGallery.length === 0) return;
            currentGalleryIndex = (currentGalleryIndex + 1) % currentGallery.length;
            lightboxImg.src = currentGallery[currentGalleryIndex].url;
            // Sync main page view as well
            mainProductImage.src = currentGallery[currentGalleryIndex].url;
        };

        const showPrevLightboxImage = () => {
            if (currentGallery.length === 0) return;
            currentGalleryIndex = (currentGalleryIndex - 1 + currentGallery.length) % currentGallery.length;
            lightboxImg.src = currentGallery[currentGalleryIndex].url;
            // Sync main page view as well
            mainProductImage.src = currentGallery[currentGalleryIndex].url;
        };

        // Event Listeners
        closeLightboxBtn.addEventListener('click', closeLightbox);
        nextBtn.addEventListener('click', (e) => { e.stopPropagation(); showNextLightboxImage(); });
        prevBtn.addEventListener('click', (e) => { e.stopPropagation(); showPrevLightboxImage(); });

        // Close on clicking backdrop
        lightboxModal.addEventListener('click', (e) => {
            if (e.target === lightboxModal) closeLightbox();
        });

        // Keyboard navigation (Escape, Left/Right Arrows)
        document.addEventListener('keydown', (e) => {
            if (lightboxModal.classList.contains('hidden')) return;

            if (e.key === 'Escape') closeLightbox();
            if (e.key === 'ArrowRight') showNextLightboxImage();
            if (e.key === 'ArrowLeft') showPrevLightboxImage();
        });
    }
});

// 5. Theme Switcher
const themeToggleBtn = document.getElementById('theme-toggle');
if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
        document.documentElement.classList.toggle('dark');
        localStorage.setItem('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
    });
}

// 6. Review Form Submission
const reviewForm = document.getElementById('review-form');
if (reviewForm) {
    reviewForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const nameInput = document.getElementById('reviewer-name');
        const ratingInput = document.getElementById('review-rating');
        const textInput = document.getElementById('review-text');
        const submitBtn = reviewForm.querySelector('button[type="submit"]');

        const customer_name = nameInput.value.trim();
        const rating = parseInt(ratingInput.value);
        const comment = textInput.value.trim();

        if (!customer_name || !rating || !comment) {
            alert("Please fill out all fields before submitting.");
            return;
        }

        const originalBtnText = submitBtn.innerText;
        submitBtn.disabled = true;
        submitBtn.innerText = "Submitting...";

        try {
            const response = await fetch(`${API_BASE_URL}/api/reviews`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    product_id: productId,
                    customer_name,
                    rating,
                    comment
                })
            });

            if (!response.ok) throw new Error('Failed to submit review');

            reviewForm.reset();
            await fetchAndRenderReviews();
        } catch (err) {
            console.error("Error submitting review:", err);
            alert("Failed to submit review. Please try again.");
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerText = originalBtnText;
        }
    });
}

// 7. WhatsApp "Order" Button
const directBuyBtn = document.getElementById('direct-buy-btn');
if (directBuyBtn) {
    directBuyBtn.addEventListener('click', () => {
        if (!currentProduct) return;

        const message =
            `Hi ${STORE_NAME}, I'm interested in ordering:\n\n` +
            `*${currentProduct.title}*\n` +
            `Brand: ${currentProduct.brand || "N/A"}\n` +
            `Price: ${formatPKR(parseFloat(currentProduct.price))}\n\n` +
            `Product link: ${window.location.href}`;

        const whatsappUrl = `https://wa.me/${STORE_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    });
}

// --- DYNAMIC SEO & SCHEMA INJECTION ---
function injectSEOData(product, gallery) {
    const pageTitle = `${product.title} Price in Pakistan | FTL Traders`;
    const pageDesc = product.description ? product.description.substring(0, 150) + "..." : `Buy the ${product.title} at wholesale price from FTL Traders.`;
    const pageUrl = window.location.href;
    const imageUrl = gallery.length > 0 ? gallery[0].url : "https://ftltraders.com/logo.jpeg";

    document.getElementById('seo-title').innerText = pageTitle;
    document.getElementById('seo-description').setAttribute("content", pageDesc);
    document.getElementById('seo-canonical').setAttribute("href", pageUrl);

    document.getElementById('seo-og-title').setAttribute("content", pageTitle);
    document.getElementById('seo-og-description').setAttribute("content", pageDesc);
    document.getElementById('seo-og-image').setAttribute("content", imageUrl);
    document.getElementById('seo-og-url').setAttribute("content", pageUrl);

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify({
        "@context": "https://schema.org/",
        "@type": "Product",
        "name": product.title,
        "image": imageUrl,
        "description": pageDesc,
        "brand": {
            "@type": "Brand",
            "name": product.brand || "N/A"
        },
        "offers": {
            "@type": "Offer",
            "url": pageUrl,
            "priceCurrency": "PKR",
            "price": product.price,
            "availability": "https://schema.org/InStock"
        }
    });
    document.head.appendChild(script);
}

// 8. Initialize
loadProductDetails();