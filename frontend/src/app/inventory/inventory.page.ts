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
import { CoachingPanelComponent } from '../shared/coaching-panel/coaching-panel.component';
import { CoachingNavService, CoachingPanelTab } from '../services/coaching-nav.service';
import { CoachingService } from '../services/coaching.service';
import { API_URL } from '../config/api.config';
import { getCachedData, setCachedData } from '../utils/local-cache.util';
import { CACHE_KEYS } from '../utils/cache-keys';

export interface Product {
  id:                    string;
  name:                  string;
  brand:                 string;
  icon:                  string;
  image_url?:            string;
  // Stage 6 (Loading Speed Plan): small (~300px) rendition for the grid --
  // falls back to image_url in normalizeApiProduct() below when a product
  // has no thumbnail yet (older row not re-saved since the migration).
  thumbnail_url?:        string;
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
    CoachingPanelComponent,
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
  // Stage 4: fixed-length dummy array purely to repeat the skeleton card
  // markup N times in the template (*ngFor needs something to iterate --
  // the values themselves are never read). 6 matches roughly one
  // above-the-fold screen at the grid's 2-column layout.
  readonly skeletonPlaceholders: ReadonlyArray<number> = [1, 2, 3, 4, 5, 6];

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

  private api = API_URL;

  // ── Header avatar ─────────────────────────────────────
  initials     = '';
  profileImage = '';
  /** Coach icon badge — kept in sync via CoachingService.unreadCount$ across all pages. */
  coachUnreadCount = 0;

  constructor(
    private router: Router,
    private http: HttpClient,
    private auth: AuthService,
    private coachingNav: CoachingNavService,
    private coachingService: CoachingService,
  ) {}

  ngOnInit(): void {
    this.applyPendingCoachingReopen();
    this.coachingService.unreadCount$.subscribe((count) => { this.coachUnreadCount = count; });
    void this.loadProductsWithHydration();
    this.loadMyOrders();
  }

  retryLoadProducts(): void {
    this.loadProducts();
  }

  // Guards Stage 3 cache hydration so it only ever runs (reads Preferences)
  // ONCE per page instance, and any caller that shows up before it resolves
  // awaits that SAME read instead of racing it -- see ionViewWillEnter()'s
  // doc-comment: it can fire on the very first mount too, not just
  // re-entry, so without this a fast ionViewWillEnter() could call
  // loadProducts() while `products` is still empty and flash the spinner
  // even though a cache exists.
  private productsHydration: Promise<void> | null = null;

  /**
   * Stage 3 (local-first loading) entry point. Waits for the one-time cache
   * hydration to finish -- so `products` is already populated from the last
   * snapshot BEFORE loadProducts() decides whether to show the spinner --
   * then runs the normal network load. Safe to call from multiple
   * lifecycle hooks: hydration itself only ever runs once (see
   * productsHydration above), and loadProducts() already guards against
   * overlapping HTTP requests.
   */
  private async loadProductsWithHydration(): Promise<void> {
    this.productsHydration ??= this.hydrateProductsFromCache();
    await this.productsHydration;
    this.loadProducts();
  }

  /**
   * Reads the last cached product list (written by loadProducts() below)
   * and shows it immediately, before the network request even starts.
   * Purely additive -- if there's no cache yet (first-ever launch) or the
   * read fails for any reason, this is a silent no-op and the page falls
   * back to its normal first-load spinner. Never throws -- see
   * getCachedData()'s own doc-comment in utils/local-cache.util.ts.
   */
  private async hydrateProductsFromCache(): Promise<void> {
    const cached = await getCachedData<Product[]>(CACHE_KEYS.PRODUCTS);
    if (Array.isArray(cached) && cached.length > 0) {
      this.products = cached;
    }
  }

  ionViewWillEnter(): void {
    // Re-applied on every re-entry, not just first mount -- Ionic's
    // router-outlet caches this page instance, so navigating
    // Shop -> coach profile/chat -> back reuses the SAME InventoryPage
    // instance and only fires ionViewWillEnter(), never ngOnInit() again.
    // See applyPendingCoachingReopen() / DashboardPage's identical helper.
    this.applyPendingCoachingReopen();

    // Re-fetch on every re-entry, mirroring EquipmentPage. Previously this
    // only ran once from ngOnInit(), so if that very first load ever failed
    // (cold-start race, brief network blip), the Shop tab stayed empty for
    // the rest of the session -- switching tabs back to Shop never retried,
    // only the manual "Retry" button did. loadProducts() guards against
    // overlapping calls with productsLoading, so this is safe alongside the
    // ngOnInit() call on first mount. Routed through loadProductsWithHydration()
    // (not loadProducts() directly) so that on first mount this waits for
    // Stage 3 cache hydration instead of racing it -- see that method's
    // doc-comment. On later re-entries hydration is already resolved, so
    // this adds no more than a microtask of delay.
    void this.loadProductsWithHydration();

    const user = this.auth.user;
    const name = String(user?.username || '').trim();
    this.initials = name
      ? name.split(' ').map((p: string) => p[0]).join('').toUpperCase().slice(0, 2)
      : 'U';
    this.profileImage = String(user?.profile_image || '').trim();
    this.notifPanelOpen = false;
  }

  /**
   * Reopens the coaching panel to the exact tab it was on if we landed
   * back here via ChatPage's/CoachDetailPage's back button (see
   * coaching-nav.service.ts). One-shot -- consumeReopen() clears itself,
   * so a normal visit to Shop is completely unaffected. Without this, the
   * router correctly returned the member to Shop, but the panel itself
   * never reopened -- see coaching-nav.service.ts's CoachingPanelHost
   * doc-comment for the full history of this gap.
   */
  private applyPendingCoachingReopen(): void {
    const pendingTab = this.coachingNav.consumeReopen('inventory');
    if (pendingTab) {
      this.coachingPanelInitialTab = pendingTab;
      this.coachingPanelOpen = true;
    }
  }

  // ── Load Products from API ─────────────────────────────
  // NOTE: `fallbackProducts` below is used ONLY as a lookup table to enrich
  // matching API products with a nicer icon/description (see
  // normalizeApiProduct). It is intentionally never assigned directly to
  // `this.products` anymore -- doing so on an empty/errored API response
  // used to display 10 items that don't exist in the database ("phantom
  // products").
  private loadProducts(): void {
    // Guard against overlapping calls -- ngOnInit() AND ionViewWillEnter()
    // both call loadProducts() (the latter fires on first mount too, not
    // just re-entry), so without this guard the first page load could fire
    // two concurrent GET /inventory/products requests. Mirrors the same
    // isLoading guard in EquipmentPage.loadEquipment().
    if (this.productsLoading) { return; }

    if (!this.auth.token) {
      this.products = [];
      this.productsLoadError = false;
      return;
    }

    // Stage 3 (local-first / stale-while-revalidate): only show the
    // spinner when there's nothing on screen yet. If hydrateProductsFromCache()
    // (or a previous successful fetch this session) already populated
    // `products`, this request runs silently in the background and the
    // member keeps looking at the last-known list the whole time.
    const hasExistingData = this.products.length > 0;
    this.productsLoading = !hasExistingData;
    this.productsLoadError = false;

    const headers = { Authorization: `Bearer ${this.auth.token}` };
    this.http.get<any[]>(`${this.api}/inventory/products`, { headers }).subscribe({
      next: (apiProducts) => {
        this.productsLoading = false;
        const apiList = Array.isArray(apiProducts) ? apiProducts : [];
        this.products = apiList
          .map(product => this.normalizeApiProduct(product, this.fallbackProducts))
          .filter((product): product is Product => product !== null);
        // Snapshot for the next cold start / re-entry. Fire-and-forget --
        // a failed write here must never block or fail the page itself,
        // see setCachedData()'s own doc-comment.
        void setCachedData(CACHE_KEYS.PRODUCTS, this.products);
      },
      error: () => {
        this.productsLoading = false;
        // A background refresh failing while stale (cached) data is still
        // on screen must NOT blank the page or show the error banner -- the
        // member keeps browsing the last-known list, same as any other
        // stale-while-revalidate UI. Only surface the error state when
        // there was truly nothing to show to begin with.
        if (!hasExistingData) {
          this.productsLoadError = true;
          this.products = [];
        }
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
    // Stage 6: falls back to the full image when a product has no
    // thumbnail yet (older row, or the admin re-save that generates one
    // hasn't happened) -- never a broken/blank grid card either way.
    const thumbnailUrl = this.normalizeImageUrl(apiProduct?.thumbnail_url);
    const parsedPrice = Number(apiProduct?.price);
    const parsedStock = Number(apiProduct?.stock);

    return {
      id: String(apiProduct?.id ?? normalizedName),
      name: normalizedName,
      brand: typeof apiProduct?.brand === 'string' && apiProduct.brand.trim() ? apiProduct.brand.trim() : (fallbackProduct?.brand || 'FordaGO'),
      icon: fallbackProduct?.icon || 'SUPP',
      image_url: imageUrl || fallbackProduct?.image_url || undefined,
      thumbnail_url: thumbnailUrl || imageUrl || fallbackProduct?.image_url || undefined,
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
    // Grid cards bind [src]="product.thumbnail_url" (see inventory.page.html) --
    // a broken thumbnail should fall back to the full image before giving up
    // entirely, since a bad/oversized thumbnail data URL is more likely to be
    // the failure than the full-size one.
    if (product.thumbnail_url && product.thumbnail_url !== product.image_url) {
      product.thumbnail_url = product.image_url;
    } else {
      product.image_url = undefined;
      product.thumbnail_url = undefined;
    }
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

  // ── Coaching screen ────────────────────────────────────────
  // In-flow replacement for ion-content (see inventory.page.html) rather
  // than an overlay -- header and footer are untouched siblings either way.
  coachingPanelOpen = false;
  /** Set from CoachingNavService.consumeReopen() when this page is reached via a back-navigation from chat/coach-profile -- see applyPendingCoachingReopen() and coaching-nav.service.ts. Cleared whenever the panel closes so it never silently re-applies to a later, unrelated open. */
  coachingPanelInitialTab: CoachingPanelTab | null = null;

  onCoachingClick(): void {
    const nextOpen = !this.coachingPanelOpen;
    this.coachingPanelOpen = nextOpen;
    if (!nextOpen) {
      this.coachingPanelInitialTab = null;
    }
  }

  closeCoachingPanel(): void {
    this.coachingPanelOpen = false;
    this.coachingPanelInitialTab = null;
  }

  // ── Navigation ────────────────────────────────────────
  private closeOverlaysForNavigation(): void { this.notifPanelOpen = false; this.coachingPanelOpen = false; this.coachingPanelInitialTab = null; }

  // NOTE: replaceUrl: true — see the matching note in dashboard.page.ts.
  // Bottom-nav tab switches must REPLACE the current history entry, not
  // push a new one, or Location.back() (on-screen arrow / hardware back)
  // from a later drill-in page (e.g. chat) walks past several stale tab
  // visits instead of returning to whichever tab was actually active.
  goToDashboard(): void { this.closeOverlaysForNavigation(); this.router.navigate(['/dashboard'], { replaceUrl: true }); }
  goToSchedule(): void  { this.closeOverlaysForNavigation(); this.router.navigate(['/schedule'], { replaceUrl: true }); }
  goToQr(): void        { this.closeOverlaysForNavigation(); this.router.navigate(['/qr-scanner'], { replaceUrl: true }); }
  goToInventory(): void { this.closeOverlaysForNavigation(); this.router.navigate(['/inventory'], { replaceUrl: true }); }
  goToEquipment(): void { this.closeOverlaysForNavigation(); this.router.navigate(['/equipment'], { replaceUrl: true }); }
  goToProfile(): void   { this.closeOverlaysForNavigation(); this.router.navigate(['/profile'], { replaceUrl: true }); }
}