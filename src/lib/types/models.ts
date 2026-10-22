import { ObjectId } from "mongodb";
import type { EventType, EventStatus, TaskPriority, TaskStatus, VendorCategory } from "./index";

export type AuthProvider = "credentials" | "google" | "github";

export type PaymentStatus = "unpaid" | "deposit_paid" | "paid";

export type PriceRange = "$" | "$$" | "$$$" | "$$$$";

export type VerificationStatus = "verified" | "unverified" | "preferred";

export type BookingStatus =
  | "inquiry"
  | "quoted"
  | "shortlisted"
  | "booked"
  | "declined";

export type MessageRole = "user" | "assistant" | "system";

export type IdeaCategory =
  | "theme"
  | "decor"
  | "activity"
  | "menu"
  | "logistics";

/**
 * 1. User Model
 */
export interface UserModel {
  _id?: ObjectId;
  displayName: string;
  email: string;
  authProvider: AuthProvider;
  preferences: {
    defaultCurrency?: string;
    timezone?: string;
    notifications?: boolean;
    [key: string]: unknown;
  };
  createdAt: Date;
  updatedAt?: Date;
}

/**
 * 2. Event Model
 */
export interface EventModel {
  _id?: ObjectId;
  ownerId: ObjectId;
  title: string;
  type: EventType;
  date: string;
  timezone: string;
  location: string;
  guestCount: number;
  currency: string;
  totalBudget: number;
  theme: string;
  preferences: {
    splurgePriority?: string;
    specialRequirements?: string[];
    [key: string]: unknown;
  };
  status: EventStatus;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 3. BudgetItem Model
 */
export interface BudgetItemModel {
  _id?: ObjectId;
  eventId: ObjectId;
  ownerId: ObjectId;
  category: string;
  description: string;
  estimatedAmount: number;
  actualAmount: number;
  paymentStatus: PaymentStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * 4. Task Model
 */
export interface TaskModel {
  _id?: ObjectId;
  eventId: ObjectId;
  ownerId: ObjectId;
  title: string;
  description?: string;
  dueDate: string;
  priority: TaskPriority;
  status: TaskStatus;
  assignedTo?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * 5. Vendor Model (Global Directory or User-Scoped)
 */
export interface VendorContact {
  name?: string;
  email?: string;
  phone?: string;
  website?: string;
}

export interface VendorModel {
  _id?: ObjectId;
  ownerId?: ObjectId | null; // null if in shared community/directory scope
  isShared: boolean;
  name: string;
  category: VendorCategory;
  location: string;
  contact: VendorContact;
  priceRange: PriceRange;
  verificationStatus: VerificationStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * 6. EventVendor Model (Event-Specific Vendor Contract)
 */
export interface EventVendorModel {
  _id?: ObjectId;
  eventId: ObjectId;
  vendorId: ObjectId;
  ownerId: ObjectId;
  quotedAmount: number;
  bookingStatus: BookingStatus;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * 7. Idea Model
 */
export interface IdeaModel {
  _id?: ObjectId;
  eventId: ObjectId;
  ownerId: ObjectId;
  category: IdeaCategory;
  title: string;
  description: string;
  estimatedCost?: string;
  createdAt?: Date;
}

/**
 * 8. ConversationMessage Model
 */
export interface ConversationMessageModel {
  _id?: ObjectId;
  eventId: ObjectId;
  ownerId: ObjectId;
  role: MessageRole;
  content: string;
  createdAt: Date;
}
