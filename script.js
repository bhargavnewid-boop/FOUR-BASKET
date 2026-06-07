/* ==========================================================================
   STATE MANAGEMENT (Reactive App Core)
   ========================================================================== */
const AppState = {
    cart: [],
    
    // Recalculates basket metrics and syncs information into the UI layers
    updateDisplay() {
        const totalItemsCount = this.cart.reduce((sum, item) => sum + item.quantity, 0);
        const totalPriceCalculated = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        // 1. Update Global Header components
        const cartCountBadge = document.querySelector('.cart-count');
        const cartAreaWrapper = document.querySelector('.cart-area');
        
        if (cartCountBadge) {
            cartCountBadge.textContent = totalItemsCount;
        }
        
        // Dynamic feedback tracking updates directly onto the parent pill if text exists
        if (cartAreaWrapper) {
            const priceTextNode = cartAreaWrapper.querySelector('strong') || cartAreaWrapper;
            // If text formatting exists inside, update it, otherwise gracefully degrade
            if(priceTextNode !== cartAreaWrapper) {
                 priceTextNode.textContent = `$${totalPriceCalculated.toFixed(2)}`;
            }
        }

        // 2. Update Drawer Side view totals
        const drawerTotalContainer = document.getElementById('cartTotal');
        if (drawerTotalContainer) {
            drawerTotalContainer.textContent = `$${totalPriceCalculated.toFixed(2)}`;
        }

        // 3. Re-render dynamic layout nodes inside the Fly-out Drawer panel
        this.renderCartItems();
    },

    // Handles logic execution when user increments an item card
    addItem(productData) {
        const existingItem = this.cart.find(item => item.id === productData.id);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            this.cart.push({ ...productData, quantity: 1 });
        }
        
        this.updateDisplay();
    },

    // Handles decrementing or complete removal from basket array
    changeQuantity(id, delta) {
        const targetItem = this.cart.find(item => item.id === id);
        if (!targetItem) return;

        targetItem.quantity += delta;

        if (targetItem.quantity <= 0) {
            this.cart = this.cart.filter(item => item.id !== id);
        }

        this.updateDisplay();
    },

    // Generates components structural code for the cart container viewport
    renderCartItems() {
        const itemsContainer = document.getElementById('cartItems');
        if (!itemsContainer) return;

        if (this.cart.length === 0) {
            itemsContainer.innerHTML = `
                <div style="text-align: center; padding: 3rem 1rem; color: #607367;">
                    <i style="font-size: 2.5rem; display:block; margin-bottom:0.5rem;" class="sans-serif">🛒</i>
                    <p style="font-size: 0.95rem; font-weight: 500;">Your quick-delivery basket is empty.</p>
                </div>
            `;
            return;
        }

        itemsContainer.innerHTML = this.cart.map(item => `
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 1rem 0; border-bottom: 1px solid #e2ebe5;">
                <div style="flex: 1; padding-right: 0.5rem;">
                    <h4 style="font-size: 0.9rem; font-weight: 600; color: #0f1712; margin-bottom: 0.15rem;">${item.title}</h4>
                    <span style="font-size: 0.8rem; color: #0a5c2c; font-weight: 700;">$${(item.price * item.quantity).toFixed(2)}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 0.6rem; background: #f1f6f2; padding: 0.3rem 0.6rem; border-radius: 6px;">
                    <button onclick="AppState.changeQuantity('${item.id}', -1)" style="border:none; background:none; font-weight:800; cursor:pointer; color:#0a5c2c;">-</button>
                    <span style="font-size: 0.85rem; font-weight: 700; min-width: 15px; text-align: center;">${item.quantity}</span>
                    <button onclick="AppState.changeQuantity('${item.id}', 1)" style="border:none; background:none; font-weight:800; cursor:pointer; color:#0a5c2c;">+</button>
                </div>
            </div>
        `).join('');
    }
};

/* ==========================================================================
   DOM EVENT ROUTERS & LISTENERS
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. DRAWER TOGGLE INTERACTION LAYERS ---
    const cartTrigger = document.getElementById('openCart') || document.querySelector('.cart-area');
    const closeCartBtn = document.getElementById('closeCart');
    const cartDrawer = document.getElementById('cartDrawer');
    const screenOverlay = document.getElementById('overlay');

    const openDrawer = () => {
        if (cartDrawer) cartDrawer.classList.add('active');
        if (screenOverlay) screenOverlay.style.display = 'block';
    };

    const closeDrawer = () => {
        if (cartDrawer) cartDrawer.classList.remove('active');
        if (screenOverlay) screenOverlay.style.display = 'none';
    };

    if (cartTrigger)  cartTrigger.addEventListener('click', openDrawer);
    if (closeCartBtn) closeCartBtn.addEventListener('click', closeDrawer);
    if (screenOverlay) screenOverlay.addEventListener('click', closeDrawer);

    // --- 2. DYNAMIC ACTION BUTTON AGGREGATORS (Rapid Add Scanners) ---
    const allProductCards = document.querySelectorAll('.card');

    allProductCards.forEach((card, index) => {
        const addButton = card.querySelector('.add-btn');
        if (!addButton) return;

        // Auto-extract item details straight out of your original HTML nodes markup safely
        const titleNode = card.querySelector('h3');
        const priceNode = card.querySelector('.price');
        
        const productTitle = titleNode ? titleNode.textContent.trim() : `Instant Catalog Item #${index + 1}`;
        let productPrice = 2.99; // Clean fallback default index valuation

        if (priceNode) {
            // Strips currency characters ($/€) to convert layout pricing values cleanly to analytical floating decimals
            const parsedPrice = parseFloat(priceNode.textContent.replace(/[^0-9.]/g, ''));
            if (!isNaN(parsedPrice)) productPrice = parsedPrice;
        }

        // Unique item hash tracker generated on the fly out of names strings signature index variations
        const generatedProductId = `prod_hash_${btoa(productTitle).substring(0, 8)}_${index}`;

        addButton.addEventListener('click', (e) => {
            e.stopPropagation(); // Avoid accidental triggers bubbling up layouts pipeline
            
            AppState.addItem({
                id: generatedProductId,
                title: productTitle,
                price: productPrice
            });

            // UI Touch Response Feedback Flash
            addButton.style.background = '#2bfd12'; 
            addButton.style.color = '#0a5c2c';
            addButton.textContent = 'ADDED ✓';
            
            setTimeout(() => {
                addButton.style.background = '';
                addButton.style.color = '';
                addButton.textContent = 'ADD';
            }, 800);
        });
    });

    // --- 3. SWIPE & HORIZONTAL SCROLL ENHANCEMENTS ---
    const horizontalTracks = document.querySelectorAll('.slider');
    
    horizontalTracks.forEach(track => {
        let isDown = false;
        let startX;
        let scrollLeft;

        // Mouse Drag to Swipe gesture implementation for standard Desktop views
        track.addEventListener('mousedown', (e) => {
            isDown = true;
            startX = e.pageX - track.offsetLeft;
            scrollLeft = track.scrollLeft;
            track.style.cursor = 'grabbing';
        });

        track.addEventListener('mouseleave', () => {
            isDown = false;
            track.style.cursor = 'grab';
        });

        track.addEventListener('mouseup', () => {
            isDown = false;
            track.style.cursor = 'grab';
        });

        track.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - track.offsetLeft;
            const walk = (x - startX) * 2; // Multiplied factor adjusts scroll acceleration speeds
            track.scrollLeft = scrollLeft - walk;
        });

        // Initialize drag instructions on desktop views natively
        track.style.cursor = 'grab';
    });

    // --- 4. CHECKOUT INITIATOR ACTION BUTTON ---
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            if (AppState.cart.length === 0) {
                alert('Your delivery basket is currently empty! Fill it up to checkout.');
                return;
            }
            
            alert('Order Received! Your 10-minute instant delivery countdown has started. 🚀');
            AppState.cart = [];
            AppState.updateDisplay();
            closeDrawer();
        });
    }

    // Run initial execution reset setup on loading initialization clearance
    AppState.updateDisplay();
});