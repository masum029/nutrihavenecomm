export type Role = "super-admin" | "admin" | "manager" | "user" | "customer";

export type DiscountType = "percentage" | "fixed";

export type ProductFlags = {
  trending: boolean;
  ramadanExclusive: boolean;
  bestSell: boolean;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  subcategory: string;
  brand: string;
  price: number;
  discountType?: DiscountType;
  discountValue?: number;
  stock: number;
  image: string;
  rating: number;
  reviews: number;
  flags: ProductFlags;
  createdAt: string;
  updatedAt: string;
};

export type User = {
  id: string;
  name: string;
  email: string;
  mobile: string;
  passwordHash: string;
  role: Role;
  isActive?: boolean;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  profilePicture?: string;
  createdAt: string;
};

export type CartItem = {
  productId: string;
  quantity: number;
};

export type Cart = {
  id: string;
  userId?: string;
  guestId?: string;
  items: CartItem[];
  updatedAt: string;
};

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "packed"
  | "shipped"
  | "delivered"
  | "cancelled";

export type OrderItem = {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
};

export type Order = {
  id: string;
  userId?: string;
  guestId?: string;
  items: OrderItem[];
  subTotal: number;
  discountTotal: number;
  total: number;
  mobile: string;
  email?: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
};

export type AuthTokenPayload = {
  sub: string;
  role: Role;
  email: string;
  exp: number;
};

export type SubcategoryMap = {
  name: string;
  category: string;
};

export type TaxonomyStore = {
  categories: string[];
  subcategories: SubcategoryMap[];
  brands: string[];
};

export type SliderImage = {
  id: string;
  image: string;
  createdAt: string;
};

export type SectionAd = {
  id: string;
  section: string;
  image: string;
  offerEndsAt: string;
  createdAt: string;
  updatedAt: string;
};
