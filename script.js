// API endpoints
const API_BASE = "https://openapi.programming-hero.com/api";
const ALL_PLANTS = `${API_BASE}/plants`;
const CATEGORIES = `${API_BASE}/categories`;
const CATEGORY = (id) => `${API_BASE}/category/${id}`;
const PLANT = (id) => `${API_BASE}/plant/${id}`;

// DOM references
const categoriesList = document.getElementById("categoriesList");
const cardsGrid = document.getElementById("cardsGrid");
const spinner = document.getElementById("spinner");
const categoryTitle = document.getElementById("categoryTitle");
const cartListEl = document.getElementById("cartList");
const cartTotalEl = document.getElementById("cartTotal");
const cartCountEl = document.getElementById("cartCount");
const modal = document.getElementById("modal");
const modalBody = document.getElementById("modalBody");
const modalClose = document.getElementById("modalClose");
const bannerPlantBtn = document.getElementById("bannerPlantBtn");
const plantNowBtn = document.getElementById("plantNowBtn");
const plantForm = document.getElementById("plantForm");
const yearSpan = document.getElementById("year");
const mobileMenuToggle = document.getElementById("mobileMenuToggle");
const navLinks = document.querySelector(".nav-links");
const statTrees = document.getElementById("statTrees");

yearSpan.textContent = new Date().getFullYear();

// state
let categories = [];
let currentCategoryId = null;
let plants = [];
let cart = [];

// Load cart from localStorage
function loadCart() {
  try {
    const saved = JSON.parse(localStorage.getItem("gg_cart") || "[]");
    cart = Array.isArray(saved) ? saved : [];
  } catch (e) {
    cart = [];
  }
  renderCart();
}

function saveCart() {
  localStorage.setItem("gg_cart", JSON.stringify(cart));
}

// Spinner helpers
function showSpinner() {
  spinner.classList.add("show");
}

function hideSpinner() {
  spinner.classList.remove("show");
}

// Utility: format price
function formatPrice(n) {
  return Number(n).toFixed(2);
}

// Fetch categories
async function fetchCategories() {
  categoriesList.innerHTML = "<div>Loading categories...</div>";
  try {
    const res = await fetch(CATEGORIES);
    const data = await res.json();
    const list = data?.data || data?.categories || [];
    categories = Array.isArray(list) ? list : [];
    renderCategories();
  } catch (e) {
    categoriesList.innerHTML = `<div>Failed to load categories</div>`;
    console.error(e);
  }
}

// Render categories
function renderCategories() {
  categoriesList.innerHTML = "";
  // Add "All" button
  const allBtn = document.createElement("button");
  allBtn.className =
    "category-btn" + (currentCategoryId === null ? " active" : "");
  allBtn.textContent = "All Trees";
  allBtn.onclick = () => loadAllPlants();
  categoriesList.appendChild(allBtn);

  categories.forEach((cat) => {
    const id = cat.id ?? cat.category_id;
    const name = cat.name ?? cat.category_name ?? cat.category;
    const btn = document.createElement("button");
    btn.className =
      "category-btn" +
      (String(id) === String(currentCategoryId) ? " active" : "");
    btn.textContent = name || "Unknown";
    btn.onclick = () => loadCategory(id, name);
    categoriesList.appendChild(btn);
  });
}

// Load all plants
async function loadAllPlants() {
  currentCategoryId = null;
  highlightActive();
  categoryTitle.textContent = "All Trees";
  showSpinner();
  cardsGrid.innerHTML = "";
  try {
    const res = await fetch(ALL_PLANTS);
    const data = await res.json();
    const list = data?.data || data?.plants || [];
    plants = Array.isArray(list) ? list : [];
    renderCards(plants);
  } catch (e) {
    cardsGrid.innerHTML = "<div>Failed to load plants.</div>";
    console.error(e);
  } finally {
    hideSpinner();
  }
}

// Load by category
async function loadCategory(id, name) {
  currentCategoryId = id;
  categoryTitle.textContent = name || "Category";
  highlightActive();
  showSpinner();
  cardsGrid.innerHTML = "";
  try {
    const res = await fetch(CATEGORY(id));
    const data = await res.json();
    let list = data?.data || data?.plants || [];
    if (!Array.isArray(list)) list = [];
    plants = list;
    renderCards(plants);
  } catch (e) {
    cardsGrid.innerHTML = "<div>Failed to load category plants.</div>";
    console.error(e);
  } finally {
    hideSpinner();
  }
}

// Highlight active category button
function highlightActive() {
  const btns = categoriesList.querySelectorAll(".category-btn");
  btns.forEach((btn) => {
    btn.classList.remove("active");
    if (currentCategoryId === null && btn.textContent.trim() === "All Trees") {
      btn.classList.add("active");
    }
  });
}

// Render cards in 3-column layout--
function renderCards(list) {
  if (!Array.isArray(list) || list.length === 0) {
    cardsGrid.innerHTML = `
      <div class="empty-state">
        <div style="font-size: 3rem; margin-bottom: 15px; opacity: 0.5;">🌳</div>
        <h3>No trees found</h3>
        <p>No trees available in this category. Please try another category.</p>
      </div>
    `;
    return;
  }

  cardsGrid.innerHTML = "";
  list.forEach((item) => {
    const id = item.id ?? item.plant_id ?? item._id ?? item.pk;
    const name = item.name ?? item.plant_name ?? item.title ?? "Unknown Tree";
    const img =
      item.image ||
      item.thumbnail ||
      item.image_url ||
      "https://images.unsplash.com/photo-1462143338528-eca9936a4d09?w=400&h=250&fit=crop";
    const description =
      item.short_description ??
      item.description?.slice?.(0, 100) ??
      item.description ??
      "No description available";
    const category =
      item.category ?? item.category_name ?? item.cat ?? "General";
    const price =
      item.price ?? item.cost ?? (Math.random() * 20 + 5).toFixed(2);

    const card = document.createElement("article");
    card.className = "card";
    card.innerHTML = `
      <img src="${img}" alt="${name}" loading="lazy" />
      <h4 class="plant-name" data-id="${id}">${escapeHtml(name)}</h4>
      <p class="desc">${escapeHtml(description)}${
      description.length >= 100 ? "..." : ""
    }</p>
      <div class="category-badge">${escapeHtml(category)}</div>
      <div class="meta">
        <div class="price">${formatPrice(price)} USD</div>
        <div style="display:flex;flex-direction:column;gap:8px;align-items:flex-end">
          <button class="btn primary add-cart" 
                  data-id="${id}" 
                  data-name="${escapeHtml(name)}" 
                  data-price="${price}">
            Add to Cart
          </button>
        </div>
      </div>
    `;

    // Add event listeners--
    card
      .querySelector(".plant-name")
      .addEventListener("click", () => openModalForPlant(id));

    const addToCartBtn = card.querySelector(".add-cart");
    addToCartBtn.addEventListener("click", (e) => {
      const btn = e.currentTarget;
      addToCart({
        id: btn.dataset.id,
        name: btn.dataset.name,
        price: Number(btn.dataset.price),
      });

      // Button feedback animation
      btn.textContent = "✓ Added!";
      btn.style.background = "var(--primary-dark)";
      setTimeout(() => {
        btn.textContent = "Add to Cart";
        btn.style.background = "";
      }, 1500);
    });

    cardsGrid.appendChild(card);
  });
}

// Escaping helper for safety
function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Modal: fetch and show plant details
async function openModalForPlant(id) {
  modalBody.innerHTML = "<div>Loading details...</div>";
  modal.classList.remove("hidden");
  document.body.style.overflow = "hidden";

  try {
    const res = await fetch(PLANT(id));
    const data = await res.json();
    const item = data?.data || data?.plant || data;

    modalBody.innerHTML = `
      <h2 style="margin-top: 0; color: var(--secondary);">${escapeHtml(
        item.name || item.plant_name || item.title || "Plant"
      )}</h2>
      <div style="display:flex;gap:20px;flex-wrap:wrap;margin-bottom: 20px;">
        <img src="${
          item.image ||
          item.image_url ||
          item.thumbnail ||
          "https://images.unsplash.com/photo-1462143338528-eca9936a4d09?w=400&h=250&fit=crop"
        }" style="width:300px;height:200px;object-fit:cover;border-radius:8px;flex: 0 0 auto;" alt="${escapeHtml(
      item.name || "Tree"
    )}">
        <div style="flex:1;min-width:250px">
          <p style="margin-bottom: 15px;">${escapeHtml(
            item.description ||
              item.long_description ||
              item.details ||
              "No detailed description available for this plant."
          )}</p>
          <div style="display: flex; flex-wrap: wrap; gap: 15px; margin-bottom: 20px;">
            <div style="background: rgba(42,157,143,0.1); padding: 10px 15px; border-radius: 6px;">
              <div style="font-size: 0.9rem; color: var(--muted);">Category</div>
              <div style="font-weight: 600;">${escapeHtml(
                item.category ?? item.category_name ?? "General"
              )}</div>
            </div>
            <div style="background: rgba(233,196,106,0.1); padding: 10px 15px; border-radius: 6px;">
              <div style="font-size: 0.9rem; color: var(--muted);">Price</div>
              <div style="font-weight: 700; color: var(--primary);">${formatPrice(
                item.price ?? (Math.random() * 20 + 5).toFixed(2)
              )} USD</div>
            </div>
          </div>
          <button id="modalAdd" class="btn primary" style="padding: 12px 24px;">Add to Cart</button>
        </div>
      </div>
    `;

    document.getElementById("modalAdd").addEventListener("click", () => {
      addToCart({
        id,
        name: item.name || item.plant_name || item.title || "Plant",
        price: Number(item.price ?? (Math.random() * 20 + 5).toFixed(2)),
      });
      modal.classList.add("hidden");
      document.body.style.overflow = "";
    });
  } catch (e) {
    modalBody.innerHTML = "<div>Could not load plant details.</div>";
    console.error(e);
  }
}

// Modal close handlers
modalClose.addEventListener("click", () => {
  modal.classList.add("hidden");
  document.body.style.overflow = "";
});

modal.addEventListener("click", (e) => {
  if (e.target === modal) {
    modal.classList.add("hidden");
    document.body.style.overflow = "";
  }
});

// CART functions
function addToCart(product) {
  const existing = cart.find((c) => String(c.id) === String(product.id));
  if (existing) {
    existing.qty = (existing.qty || 1) + 1;
  } else {
    cart.push({ ...product, qty: 1 });
  }

  updateTreeCount();
  saveCart();
  renderCart();
  showNotification(`${product.name} added to cart!`);
}

function removeFromCart(id) {
  cart = cart.filter((c) => String(c.id) !== String(id));
  saveCart();
  renderCart();
  showNotification("Item removed from cart");
}

function changeQty(id, qty) {
  const item = cart.find((c) => String(c.id) === String(id));
  if (!item) return;
  item.qty = qty;
  if (item.qty <= 0) removeFromCart(id);
  else {
    saveCart();
    renderCart();
  }
}

function renderCart() {
  cartListEl.innerHTML = "";
  if (cart.length === 0) {
    cartListEl.innerHTML =
      '<li style="color:var(--muted); text-align: center; padding: 20px;">Your cart is empty</li>';
    cartTotalEl.textContent = formatPrice(0);
    cartCountEl.textContent = "0";
    return;
  }

  let total = 0;
  let itemCount = 0;

  cart.forEach((item) => {
    const itemTotal = Number(item.price) * (item.qty || 1);
    total += itemTotal;
    itemCount += item.qty || 1;

    const li = document.createElement("li");
    li.className = "cart-item";
    li.innerHTML = `
      <div>
        <div class="name">${escapeHtml(item.name)}</div>
        <div class="price-info">${formatPrice(
          item.price
        )} USD × <input type="number" min="1" value="${
      item.qty
    }" data-id="${escapeHtml(item.id)}" class="qty-input" /></div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px">
        <div style="font-weight:700">${formatPrice(itemTotal)} USD</div>
        <button class="btn" data-id="${escapeHtml(item.id)}">❌</button>
      </div>
    `;

    li.querySelector("button").addEventListener("click", (e) =>
      removeFromCart(e.currentTarget.dataset.id)
    );

    li.querySelector(".qty-input").addEventListener("change", (e) => {
      const newQty = Number(e.target.value) || 1;
      changeQty(e.target.dataset.id, newQty);
    });

    cartListEl.appendChild(li);
  });

  cartTotalEl.textContent = formatPrice(total);
  cartCountEl.textContent = itemCount;
}

// Update tree count in impact section
function updateTreeCount() {
  const currentCount = parseInt(statTrees.textContent.replace(/,/g, ""));
  const newCount = currentCount + 1;
  statTrees.textContent = newCount.toLocaleString();

  statTrees.style.transform = "scale(1.2)";
  setTimeout(() => {
    statTrees.style.transform = "scale(1)";
  }, 300);
}

// Show notification
function showNotification(message) {
  const notification = document.createElement("div");
  notification.className = "notification";
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.transform = "translateX(0)";
  }, 100);

  setTimeout(() => {
    notification.style.transform = "translateX(100%)";
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 3000);
}

// Checkout handler
document.getElementById("checkoutBtn").addEventListener("click", () => {
  if (cart.length === 0) {
    showNotification("Cart is empty. Add some trees first.");
    return;
  }

  const totalTrees = cart.reduce((sum, item) => sum + (item.qty || 1), 0);
  const totalAmount = cartTotalEl.textContent;

  modalBody.innerHTML = `
    <div style="text-align: center; padding: 20px;">
      <div style="font-size: 3rem; margin-bottom: 20px;">🌳</div>
      <h2 style="color: var(--secondary); margin-bottom: 15px;">Thank You!</h2>
      <p style="margin-bottom: 20px; color: var(--muted);">
        You're planting ${totalTrees} tree(s) for a total of $${totalAmount}. 
        We'll send planting confirmation to your email.
      </p>
      <button id="confirmCheckout" class="btn primary" style="padding: 12px 30px;">Confirm Purchase</button>
    </div>
  `;

  modal.classList.remove("hidden");

  document.getElementById("confirmCheckout").addEventListener("click", () => {
    showNotification(
      `Thank you! ${totalTrees} trees will be planted. Total: $${totalAmount}`
    );
    cart = [];
    saveCart();
    renderCart();
    modal.classList.add("hidden");
    document.body.style.overflow = "";
  });
});

// Plant form submission
plantForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = document.getElementById("donorName").value;
  const email = document.getElementById("donorEmail").value;
  const count = Number(document.getElementById("donorCount").value) || 1;
  const message = document.getElementById("donorMessage").value;

  modalBody.innerHTML = `
    <div style="text-align: center; padding: 20px;">
      <div style="font-size: 3rem; margin-bottom: 20px;">🎉</div>
      <h2 style="color: var(--secondary); margin-bottom: 15px;">Thank You, ${name}!</h2>
      <p style="margin-bottom: 15px;">
        We received your request to plant <strong>${count}</strong> tree(s).
      </p>
      <p style="margin-bottom: 20px; color: var(--muted);">
        We'll contact you at <strong>${email}</strong> with next steps.
        ${message ? `<br><br>Your message: "${message}"` : ""}
      </p>
      <button id="closeSuccess" class="btn primary" style="padding: 12px 30px;">Continue</button>
    </div>
  `;

  modal.classList.remove("hidden");

  document.getElementById("closeSuccess").addEventListener("click", () => {
    modal.classList.add("hidden");
    document.body.style.overflow = "";
    plantForm.reset();

    const currentCount = parseInt(statTrees.textContent.replace(/,/g, ""));
    const newCount = currentCount + count;
    statTrees.textContent = newCount.toLocaleString();
  });
});

// Mobile menu toggle
mobileMenuToggle.addEventListener("click", () => {
  navLinks.classList.toggle("mobile-open");
  mobileMenuToggle.classList.toggle("active");
});

// Close mobile menu when clicking on a link
document.querySelectorAll(".nav-link").forEach((link) => {
  link.addEventListener("click", () => {
    navLinks.classList.remove("mobile-open");
    mobileMenuToggle.classList.remove("active");
  });
});

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute("href"));
    if (target) {
      target.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  });
});

// Connect banner buttons
bannerPlantBtn.addEventListener("click", () => {
  document.querySelector("#plant").scrollIntoView({ behavior: "smooth" });
});

plantNowBtn.addEventListener("click", () => {
  document.querySelector("#plant").scrollIntoView({ behavior: "smooth" });
});

// Initialize the application
async function init() {
  loadCart();
  await fetchCategories();
  await loadAllPlants();

  // Animate initial tree count
  animateValue(statTrees, 0, 12345, 2000);
}

// Animate number counting
function animateValue(element, start, end, duration) {
  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    const value = Math.floor(progress * (end - start) + start);
    element.textContent = value.toLocaleString();
    if (progress < 1) {
      window.requestAnimationFrame(step);
    }
  };
  window.requestAnimationFrame(step);
}

// Start the application
init();
