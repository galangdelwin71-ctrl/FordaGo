// inventory.page.ts
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonFooter,
  IonIcon,
  IonModal,
} from '@ionic/angular/standalone';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../services/auth.service';
import { HeaderComponent } from '../shared/header/header.component';
import { NotificationPanelComponent } from '../shared/notification-panel/notification-panel.component';
import { API_BASE_URL } from '../config/api.config';

export interface Product {
  id:                    string;
  name:                  string;
  brand:                 string;
  icon:                  string;
  image_url?:            string;
  price:                 number;
  stock:                 number;
  description:           string;
  serving_size:          number;
  servings_per_container: number;
  flavor:                string;
  benefits:              string[];
}

export interface Order {
  id:              string;
  order_group_id:  string | null;
  product:         Product;
  quantity:        number;
  total:           number;
  payment_method:  'cash' | 'gcash';
  status:          'pending' | 'payment_verified' | 'completed' | 'rejected' | 'cancelled';
  date:            Date;
  user_id:         string;
}

// One line item sitting in the member's cart before checkout.
export interface CartItem {
  product:  Product;
  quantity: number;
}

// One packed checkout containing 1+ order line items. Built client-side by
// grouping the flat `Order[]` rows from /inventory/my-orders by their
// order_group_id -- mirrors what the admin side does with /inventory/orders.
export interface OrderGroup {
  id:             string;
  items:          Order[];
  total:          number;
  paymentMethod:  'cash' | 'gcash';
  status:         'pending' | 'payment_verified' | 'completed' | 'rejected' | 'cancelled';
  date:           Date;
  cancelling:     boolean;
}

@Component({
  selector: 'app-inventory',
  templateUrl: './inventory.page.html',
  styleUrls: ['./inventory.page.scss'],
  standalone: true,
  host: { class: 'ion-page fordago-page' },
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonFooter,
    IonIcon,
    IonModal,
    HeaderComponent,
    NotificationPanelComponent,
  ],
})
export class InventoryPage implements OnInit {
  private readonly fallbackProducts: Product[] = [
    {
      id: 'whey-protein-vanilla',
      name: 'Whey Protein Powder',
      brand: 'GoldenWhey',
      icon: 'WHEY',
      price: 1200,
      stock: 45,
      description: 'Premium whey protein isolate with excellent amino acid profile. Fast-absorbing, great for post-workout recovery.',
      serving_size: 30,
      servings_per_container: 30,
      flavor: 'Vanilla',
      benefits: [
        'High protein content (25g per serving)',
        'Fast muscle recovery',
        'Low fat & sugar',
        'Easy to mix',
      ],
    },
    {
      id: 'whey-protein-choco',
      name: 'Whey Protein Powder',
      brand: 'GoldenWhey',
      icon: 'WHEY',
      price: 1200,
      stock: 38,
      description: 'Same premium formula in delicious chocolate flavor. Perfect for smooth, tasty protein shakes.',
      serving_size: 30,
      servings_per_container: 30,
      flavor: 'Chocolate',
      benefits: [
        'Rich chocolate taste',
        'Complete amino acids',
        'Mixes smooth',
        'Supports muscle growth',
      ],
    },
    {
      id: 'bcaa-complex',
      name: 'BCAA Complex Powder',
      brand: 'EliteAmino',
      icon: 'BCAA',
      price: 950,
      stock: 23,
      description: 'Branched-chain amino acids in optimal 2:1:1 ratio. Perfect for intra-workout or between meals to preserve muscle.',
      serving_size: 8,
      servings_per_container: 60,
      flavor: 'Blue Raspberry',
      benefits: [
        'Muscle preservation during fasted training',
        'Reduced muscle soreness',
        'Enhanced recovery',
        'Improves endurance',
      ],
    },
    {
      id: 'creatine-mono',
      name: 'Creatine Monohydrate',
      brand: 'PowerGain',
      icon: 'CREA',
      price: 850,
      stock: 18,
      description: 'Pure creatine monohydrate with proven results for strength and power. Helps increase ATP production for more energy.',
      serving_size: 5,
      servings_per_container: 200,
      flavor: 'Unflavored',
      benefits: [
        'Increased strength & power output',
        'Muscle endurance boost',
        'Proven formula',
        'Affordable & effective',
      ],
    },
    {
      id: 'multivitamin-daily',
      name: 'Daily Multivitamin Pack',
      brand: 'VitaMax',
      icon: 'MULT',
      price: 1500,
      stock: 32,
      description: 'Complete micronutrient blend including all essential vitamins and minerals. Supports overall health and immune function.',
      serving_size: 1,
      servings_per_container: 30,
      flavor: 'Multi-pack',
      benefits: [
        'Complete nutritional support',
        'Boosts immune system',
        'Supports energy levels',
        'Fills nutritional gaps',
      ],
    },
    {
      id: 'omega3-fish-oil',
      name: 'Omega-3 Fish Oil',
      brand: 'OceanWise',
      icon: 'OMGA',
      price: 1400,
      stock: 12,
      description: 'Premium fish oil supplement rich in EPA and DHA. Supports heart health, joint function, and cognitive performance.',
      serving_size: 2,
      servings_per_container: 60,
      flavor: 'Lemon flavor',
      benefits: [
        'Heart & cardiovascular health',
        'Joint lubrication & mobility',
        'Brain function support',
        'Anti-inflammatory properties',
      ],
    },
    {
      id: 'pre-workout-energy',
      name: 'Pre-Workout Energy',
      brand: 'ExplosiveGym',
      icon: 'PRE-W',
      price: 1100,
      stock: 28,
      description: 'Powerful pre-workout formula with caffeine, beta-alanine, and citrulline. Boosts energy, focus, and endurance.',
      serving_size: 8,
      servings_per_container: 30,
      flavor: 'Fruit Punch',
      benefits: [
        'Increased workout intensity',
        'Better muscle pump & blood flow',
        'Enhanced mental focus',
        'Extended endurance',
      ],
    },
    {
      id: 'glutamine-powder',
      name: 'L-Glutamine Powder',
      brand: 'RecoveryPro',
      icon: 'GLUT',
      price: 900,
      stock: 25,
      description: 'Pure L-Glutamine to support muscle recovery and gut health. Helps reduce muscle breakdown and supports protein synthesis.',
      serving_size: 5,
      servings_per_container: 200,
      flavor: 'Unflavored',
      benefits: [
        'Post-workout recovery',
        'Gut health support',
        'Reduced muscle breakdown',
        'Immune system support',
      ],
    },
    {
      id: 'zinc-magnesium',
      name: 'Zinc + Magnesium (ZMA)',
      brand: 'MetalMineral',
      icon: 'ZMA',
      price: 750,
      stock: 35,
      description: 'Combination of zinc, magnesium, and B6. Essential for muscle recovery, sleep quality, and hormone production.',
      serving_size: 3,
      servings_per_container: 30,
      flavor: 'Capsule',
      benefits: [
        'Better sleep quality',
        'Improved recovery',
        'Hormone support',
        'Antioxidant protection',
      ],
    },
    {
      id: 'protein-bars',
      name: 'Protein Bars Pack (Box of 12)',
      brand: 'NutriBar',
      icon: 'PBAR',
      price: 900,
      stock: 42,
      description: 'Delicious high-protein bars perfect for on-the-go nutrition. 20g protein per bar with great taste and balanced macros.',
      serving_size: 65,
      servings_per_container: 12,
      flavor: 'Chocolate Chip',
      benefits: [
        '20g protein per bar',
        'Convenient meal replacement',
        'Low sugar formula',
        'Great tasting',
      ],
    },
  ];

  // ── Products Data ─────────────────────────────────────
  products: Product[] = [];
  productsLoading = false;
  productsLoadError = false;

  // ── Order Modal State (product detail / add to cart) ──
  orderModalOpen        = false;
  selectedProduct: Product | null = null;
  orderQty              = 1;
  orderError: string     = '';

  // ── Cart State ─────────────────────────────────────────
  // Kept in memory only (never persisted) -- the cart is a pre-checkout
  // staging area with no server-side representation until the member taps
  // "Checkout", so there is nothing sensitive/durable to store.
  cart: CartItem[] = [];
  cartModalOpen          = false;
  cartPaymentMethod: 'cash' | 'gcash' = 'cash';
  checkingOut             = false;
  checkoutError: string   = '';

  get cartItemCount(): number {
    return this.cart.reduce((sum, item) => sum + item.quantity, 0);
  }

  get cartTotal(): number {
    return this.cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  }

  // Drives [class.nav-hidden] on the bottom nav. Belt-and-suspenders fix for
  // the bug where the footer nav stayed visible/clickable underneath an open
  // bottom-sheet modal -- rather than relying purely on z-index stacking
  // (fragile once any ancestor gets `contain`/`overflow` rules), the nav is
  // explicitly hidden whenever any sheet is open.
  get anyModalOpen(): boolean {
    return this.orderModalOpen || this.cartModalOpen || this.orderSuccessOpen || this.ordersModalOpen;
  }

  // ── Order Success State ───────────────────────────────
  orderSuccessOpen = false;
  lastOrderItems: CartItem[] = [];
  lastOrderTotal   = 0;
  lastOrderPayment: 'cash' | 'gcash' = 'cash';

  // ── My Orders State ───────────────────────────────────
  ordersModalOpen = false;
  myOrders: Order[] = [];

  private api = API_BASE_URL;

  // ── Header avatar ─────────────────────────────────────
  initials     = '';
  profileImage = '';

  constructor(private router: Router, private http: HttpClient, private auth: AuthService) {}

  ngOnInit(): void {
    this.loadProducts();
    this.loadMyOrders();
  }

  retryLoadProducts(): void {
    this.loadProducts();
  }

  ionViewWillEnter(): void {
    const user = this.auth.user;
    const name = String(user?.username || '').trim();
    this.initials = name
      ? name.split(' ').map((p: string) => p[0]).join('').toUpperCase().slice(0, 2)
      : 'U';
    this.profileImage = String(user?.profile_image || '').trim();
    this.notifPanelOpen = false;
  }

  // ── Load Products from API ─────────────────────────────
  // NOTE: `fallbackProducts` below is used ONLY as a lookup table to enrich
  // matching API products with a nicer icon/description (see
  // normalizeApiProduct). It is intentionally never assigned directly to
  // `this.products` anymore -- doing so on an empty/errored API response
  // used to display 10 items that don't exist in the database ("phantom
  // products").
  private loadProducts(): void {
    if (!this.auth.token) {
      this.products = [];
      this.productsLoadError = false;
      return;
    }

    this.productsLoading = true;
    this.productsLoadError = false;

    const headers = { Authorization: `Bearer ${this.auth.token}` };
    this.http.get<any[]>(`${this.api}/inventory/products`, { headers }).subscribe({
      next: (apiProducts) => {
        this.productsLoading = false;
        const apiList = Array.isArray(apiProducts) ? apiProducts : [];
        this.products = apiList
          .map(product => this.normalizeApiProduct(product, this.fallbackProducts))
          .filter((product): product is Product => product !== null);
      },
      error: () => {
        this.productsLoading = false;
        this.productsLoadError = true;
        this.products = [];
      }
    });
  }

  private normalizeApiProduct(apiProduct: any, fallbackProducts: Product[]): Product | null {
    const normalizedName = typeof apiProduct?.name === 'string' ? apiProduct.name.trim() : '';
    if (!normalizedName) {
      return null;
    }

    const fallbackProduct = fallbackProducts.find(product =>
      product.name.toLowerCase() === normalizedName.toLowerCase()
    );

    const imageUrl = this.normalizeImageUrl(apiProduct?.image_url);
    const parsedPrice = Number(apiProduct?.price);
    const parsedStock = Number(apiProduct?.stock);

    return {
      id: String(apiProduct?.id ?? normalizedName),
      name: normalizedName,
      brand: typeof apiProduct?.brand === 'string' && apiProduct.brand.trim() ? apiProduct.brand.trim() : (fallbackProduct?.brand || 'FordaGO'),
      icon: fallbackProduct?.icon || 'SUPP',
      image_url: imageUrl || fallbackProduct?.image_url || undefined,
      price: Number.isFinite(parsedPrice) ? parsedPrice : (fallbackProduct?.price || 0),
      stock: Number.isFinite(parsedStock) ? parsedStock : (fallbackProduct?.stock || 0),
      description: fallbackProduct?.description || normalizedName,
      serving_size: fallbackProduct?.serving_size || 1,
      servings_per_container: fallbackProduct?.servings_per_container || 1,
      flavor: fallbackProduct?.flavor || '',
      benefits: fallbackProduct?.benefits || [],
    };
  }

  private normalizeImageUrl(value: unknown): string | undefined {
    if (typeof value !== 'string') {
      return undefined;
    }

    const trimmedValue = value.trim();
    if (!trimmedValue) {
      return undefined;
    }

    if (trimmedValue.startsWith('data:image/')) {
      return trimmedValue;
    }

    if (/^https?:\/\//i.test(trimmedValue)) {
      return trimmedValue;
    }

    return undefined;
  }

  handleProductImageError(product: Product): void {
    product.image_url = undefined;
  }

  handleSelectedProductImageError(): void {
    if (this.selectedProduct) {
      this.selectedProduct.image_url = undefined;
    }
  }

  // ── Computed Properties ────────────────────────────────
  // Orders packed into their checkout groups (one card per "Checkout"
  // action, however many products it contained).
  //
  // These used to be `get` accessors that rebuilt a brand-new array of
  // brand-new objects on every single read. The template reads them more
  // than once per render pass (a badge count, an *ngIf, then an *ngFor), so
  // Angular saw a different array/object reference each time and threw
  // ExpressionChangedAfterItHasBeenCheckedError in dev mode -- which is what
  // showed up as the page "acting up"/crashing when opening Cart or Orders.
  // It also meant a group's `cancelling` flag could be blown away by a
  // rebuild mid-request. Cached fields, rebuilt only when `myOrders` itself
  // changes, fix both problems.
  orderGroups: OrderGroup[] = [];
  pendingOrderGroups: OrderGroup[] = [];

  private rebuildOrderGroups(): void {
    const groups = new Map<string, OrderGroup>();
    for (const order of this.myOrders) {
      const groupId = order.order_group_id ?? order.id;
      let group = groups.get(groupId);
      if (!group) {
        group = {
          id: groupId,
          items: [],
          total: 0,
          paymentMethod: order.payment_method,
          status: order.status,
          date: order.date,
          cancelling: false,
        };
        groups.set(groupId, group);
      }
      group.items.push(order);
      group.total += Number(order.total) || 0;
    }
    this.orderGroups = Array.from(groups.values()).sort((a, b) => b.date.getTime() - a.date.getTime());
    // Full list shown inside the "My Orders" sheet -- includes paid/rejected
    // orders too, so the user can still see their recent order history there.
    this.pendingOrderGroups = this.orderGroups.filter(g => g.status !== 'completed');
  }

  // Count used for the red header badge. Only orders still awaiting payment
  // are actionable/urgent -- once an order is paid (or rejected), it no
  // longer needs the customer's attention, so it must not keep the red
  // count lit forever. Safe as a getter (it returns a number, not a new
  // array/object, so repeated reads compare equal).
  get awaitingPaymentCount(): number {
    return this.orderGroups.filter(g => g.status === 'pending').length;
  }

  // ── Open/Close Modals ──────────────────────────────────
  openOrderModal(product: Product): void {
    this.selectedProduct = { ...product };
    this.orderQty = 1;
    this.orderError = '';
    this.orderModalOpen = true;
  }

  closeOrderModal(): void {
    this.orderModalOpen = false;
    this.selectedProduct = null;
    this.orderQty = 1;
    this.orderError = '';
  }

  // ── Quantity Control ───────────────────────────────────
  // Bounded by remaining stock MINUS whatever the member already has queued
  // in the cart for this same product, so the cart can never be made to
  // stage more units than actually exist.
  private qtyAlreadyInCart(productId: string): number {
    return this.cart.find(item => item.product.id === productId)?.quantity || 0;
  }

  incrementQty(): void {
    if (!this.selectedProduct) return;
    const available = this.selectedProduct.stock - this.qtyAlreadyInCart(this.selectedProduct.id);
    if (this.orderQty < available) {
      this.orderQty++;
    }
  }

  decrementQty(): void {
    if (this.orderQty > 1) {
      this.orderQty--;
    }
  }

  // ── Add to Cart ─────────────────────────────────────────
  // Purely client-side staging -- nothing is sent to the server (and no
  // stock is reserved) until checkoutCart() runs, which re-validates stock
  // atomically on the backend anyway.
  addToCart(product: Product, quantity: number = 1): void {
    const numericId = Number(product.id);
    if (!Number.isFinite(numericId) || numericId <= 0 || product.stock <= 0) return;

    const alreadyQueued = this.qtyAlreadyInCart(product.id);
    const room = product.stock - alreadyQueued;
    if (room <= 0) return;
    const qtyToAdd = Math.min(quantity, room);

    const existing = this.cart.find(item => item.product.id === product.id);
    if (existing) {
      existing.quantity += qtyToAdd;
    } else {
      this.cart.push({ product: { ...product }, quantity: qtyToAdd });
    }
  }

  addSelectedToCart(): void {
    if (!this.selectedProduct) return;
    this.addToCart(this.selectedProduct, this.orderQty);
    this.closeOrderModal();
  }

  // ── Place Order Now (skip cart) ─────────────────────────
  // Quick-buy path for a single product: checks out immediately with just
  // this product/quantity via the same atomic checkout endpoint the cart
  // uses, without ever touching `this.cart`. Kept alongside addToCart /
  // checkoutCart (not a replacement) so members can still batch multiple
  // products into one cart checkout when they want to.
  placingOrder = false;

  placeOrderNow(): void {
    if (!this.selectedProduct || this.placingOrder) return;
    if (this.selectedProduct.stock === 0) return;

    if (!this.auth.token) {
      this.orderError = 'Please log in again to place an order.';
      return;
    }

    this.orderError = '';
    this.placingOrder = true;

    const product = this.selectedProduct;
    const quantity = this.orderQty;
    const paymentMethod = this.cartPaymentMethod;
    const headers = { Authorization: `Bearer ${this.auth.token}` };

    this.http.post<any>(`${this.api}/inventory/cart/checkout`, {
      items: [{ product_id: Number(product.id), quantity }],
      payment_method: paymentMethod,
    }, { headers }).subscribe({
      next: (res) => {
        this.placingOrder = false;

        // Refresh from server: real stock after decrement, real order rows.
        this.loadProducts();
        this.loadMyOrders();

        this.lastOrderItems = [{ product, quantity }];
        this.lastOrderTotal = Number(res?.total ?? product.price * quantity);
        this.lastOrderPayment = paymentMethod;

        this.closeOrderModal();
        this.orderSuccessOpen = true;
      },
      error: (err) => {
        this.placingOrder = false;
        this.orderError = err?.error?.message || 'Could not place order. Please try again.';
      },
    });
  }

  cartQtyFor(productId: string): number {
    return this.qtyAlreadyInCart(productId);
  }

  // ── Quick Order (from the product grid, no modal) ────────────
  // Lets a member place a single-unit order straight from the product card
  // without opening the full detail sheet -- but always through a small
  // confirmation step first, so a stray/accidental tap never places a real
  // order. Confirming uses the same atomic checkout endpoint as Place Order
  // Now / cart checkout. Errors stay inside the confirm dialog (instead of
  // jumping to another modal) so the member can just retry or cancel.
  quickOrderingId: string | null = null;
  quickOrderConfirmOpen = false;
  quickOrderProduct: Product | null = null;
  quickOrderConfirmError = '';

  openQuickOrderConfirm(product: Product, event: Event): void {
    event.stopPropagation();
    if (product.stock === 0 || this.quickOrderingId !== null) return;
    this.quickOrderProduct = product;
    this.quickOrderConfirmError = '';
    this.quickOrderConfirmOpen = true;
  }

  closeQuickOrderConfirm(): void {
    if (this.quickOrderingId !== null) return; // don't dismiss mid-request
    this.quickOrderConfirmOpen = false;
    this.quickOrderProduct = null;
    this.quickOrderConfirmError = '';
  }

  confirmQuickOrder(): void {
    const product = this.quickOrderProduct;
    if (!product || product.stock === 0 || this.quickOrderingId !== null) return;

    if (!this.auth.token) {
      this.quickOrderConfirmError = 'Please log in again to place an order.';
      return;
    }

    this.quickOrderConfirmError = '';
    this.quickOrderingId = product.id;
    const headers = { Authorization: `Bearer ${this.auth.token}` };

    this.http.post<any>(`${this.api}/inventory/cart/checkout`, {
      items: [{ product_id: Number(product.id), quantity: 1 }],
      payment_method: this.cartPaymentMethod,
    }, { headers }).subscribe({
      next: (res) => {
        this.quickOrderingId = null;

        this.loadProducts();
        this.loadMyOrders();

        this.lastOrderItems = [{ product, quantity: 1 }];
        this.lastOrderTotal = Number(res?.total ?? product.price);
        this.lastOrderPayment = this.cartPaymentMethod;

        this.quickOrderConfirmOpen = false;
        this.quickOrderProduct = null;
        this.orderSuccessOpen = true;
      },
      error: (err) => {
        this.quickOrderingId = null;
        this.quickOrderConfirmError = err?.error?.message || 'Could not place order. Please try again.';
      },
    });
  }

  // ── Cart Modal ───────────────────────────────────────────
  openCart(): void {
    this.checkoutError = '';
    this.cartModalOpen = true;
  }

  closeCart(): void {
    this.cartModalOpen = false;
    this.checkoutError = '';
  }

  incrementCartItem(item: CartItem): void {
    if (item.quantity < item.product.stock) {
      item.quantity++;
    }
  }

  decrementCartItem(item: CartItem): void {
    if (item.quantity > 1) {
      item.quantity--;
    } else {
      this.removeCartItem(item);
    }
  }

  removeCartItem(item: CartItem): void {
    this.cart = this.cart.filter(i => i.product.id !== item.product.id);
  }

  selectCartPaymentMethod(method: 'cash' | 'gcash'): void {
    this.cartPaymentMethod = method;
  }

  // ── Checkout Cart ───────────────────────────────────────
  // Sends every cart line in one request; the backend places them as a
  // single atomic order group (all-or-nothing stock check), so the customer
  // pays for and picks up the whole cart together. Backend remains the
  // source of truth -- nothing here is optimistic.
  checkoutCart(): void {
    if (this.checkingOut || this.cart.length === 0) return;

    if (!this.auth.token) {
      this.checkoutError = 'Please log in again to place an order.';
      return;
    }

    this.checkoutError = '';
    this.checkingOut = true;

    const items = this.cart.map(item => ({
      product_id: Number(item.product.id),
      quantity: item.quantity,
    }));

    const headers = { Authorization: `Bearer ${this.auth.token}` };
    this.http.post<any>(`${this.api}/inventory/cart/checkout`, {
      items,
      payment_method: this.cartPaymentMethod,
    }, { headers }).subscribe({
      next: (res) => {
        this.checkingOut = false;

        // Refresh from server: real stock after decrement, real order rows.
        this.loadProducts();
        this.loadMyOrders();

        this.lastOrderItems = this.cart;
        this.lastOrderTotal = Number(res?.total ?? this.cartTotal);
        this.lastOrderPayment = this.cartPaymentMethod;

        this.cart = [];
        this.orderSuccessOpen = true;
        this.closeCart();
      },
      error: (err) => {
        this.checkingOut = false;
        this.checkoutError = err?.error?.message || 'Could not place order. Please try again.';
      },
    });
  }

  closeOrderSuccess(): void {
    this.orderSuccessOpen = false;
  }

  // ── Orders Modal ───────────────────────────────────────
  openOrders(): void {
    // Clear any stale error from a previous cancel attempt so a past
    // failure doesn't keep showing on top of an otherwise-fine list.
    this.orderError = '';
    this.ordersModalOpen = true;
  }

  closeOrders(): void {
    this.ordersModalOpen = false;
  }

  // ── Cancel Order ─────────────────────────────────────────
  // Only offered in the template while the checkout is still pending -- once
  // it's approved/rejected/completed the backend rejects the cancel request
  // anyway, this just keeps the UI honest about what's currently allowed.
  cancelOrder(group: OrderGroup): void {
    if (group.cancelling || group.status !== 'pending') return;
    if (!this.auth.token) return;

    group.cancelling = true;
    const headers = { Authorization: `Bearer ${this.auth.token}` };
    this.http.put(`${this.api}/inventory/order-groups/${group.id}/cancel`, {}, { headers }).subscribe({
      next: () => {
        this.loadProducts(); // stock was restored server-side
        this.loadMyOrders();
      },
      error: (err) => {
        group.cancelling = false;
        this.orderError = err?.error?.message || 'Could not cancel this order. Please try again.';
      },
    });
  }

  // ── Order Status Label ─────────────────────────────────
  statusLabel(status: string): string {
    const labels: any = {
      'pending': 'Waiting Payment',
      'payment_verified': 'Paid',
      'completed': 'Received',
      'rejected': 'Rejected',
      'cancelled': 'Cancelled',
    };
    return labels[status] || status;
  }

  // ── Load Orders from Backend ───────────────────────────
  private loadMyOrders(): void {
    if (!this.auth.token) {
      this.myOrders = [];
      this.rebuildOrderGroups();
      return;
    }

    const headers = { Authorization: `Bearer ${this.auth.token}` };
    this.http.get<any[]>(`${this.api}/inventory/my-orders`, { headers }).subscribe({
      next: (orders) => {
        this.myOrders = orders.map(o => ({
          id: String(o.id),
          order_group_id: o.order_group_id !== null && o.order_group_id !== undefined ? String(o.order_group_id) : null,
          product: { name: o.product_name_db || 'Unknown product' } as any,
          quantity: o.quantity,
          total: o.total,
          payment_method: (o.group_payment_method || o.payment_method || 'cash') as 'cash' | 'gcash',
          status: o.status === 'approved' ? 'payment_verified' :
                  o.status === 'rejected' ? 'rejected' :
                  o.status === 'cancelled' ? 'cancelled' :
                  o.status === 'completed' ? 'completed' : 'pending',
          date: new Date(o.group_created_at || o.created_at),
          user_id: String(o.user_id),
        }));
        this.rebuildOrderGroups();
      },
      error: () => { this.myOrders = []; this.rebuildOrderGroups(); }
    });
  }

  // ── Notifications panel ────────────────────────────────
  notifPanelOpen = false;
  unreadCount = 0;

  openNotifPanel(): void {
    this.notifPanelOpen = true;
  }

  closeNotifPanel(): void { this.notifPanelOpen = false; }

  onUnreadCountChange(count: number): void {
    this.unreadCount = count;
  }

  // ── Navigation ────────────────────────────────────────
  private closeOverlaysForNavigation(): void { this.notifPanelOpen = false; }

  goToDashboard(): void { this.closeOverlaysForNavigation(); this.router.navigate(['/dashboard']); }
  goToSchedule(): void  { this.closeOverlaysForNavigation(); this.router.navigate(['/schedule']); }
  goToQr(): void        { this.closeOverlaysForNavigation(); this.router.navigate(['/qr-scanner']); }
  goToInventory(): void { this.closeOverlaysForNavigation(); this.router.navigate(['/inventory']); }
  goToEquipment(): void { this.closeOverlaysForNavigation(); this.router.navigate(['/equipment']); }
  goToProfile(): void   { this.closeOverlaysForNavigation(); this.router.navigate(['/profile']); }
}