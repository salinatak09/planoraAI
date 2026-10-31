import { ObjectId } from "mongodb";
import type { EventType, EventStatus, TaskPriority, TaskStatus, VendorCategory } from "./index";

export type AuthProvider = "credentials" | "google" | "github";

export type PaymentStatus = "unpaid" | "deposit_paid" | "paid";

export type PriceRange = "$" | "$$" | "$$$" | "$$$$";

export type VerificationStatus = "verified" | "unverified" | "preferred";

export type BookingStatus =
  | "shortlisted"
  | "contacted"
  | "booked"
  | "cancelled"
  | "completed"
  | "inquiry"
  | "quoted"
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
  passwordHash?: string;
  agency?: string;
  role?: string;
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

export interface EventPreferences {
  city?: string;
  venuePreference?: string;
  indoorOutdoor?: "indoor" | "outdoor" | "mixed" | string;
  colorPreferences?: string[];
  foodPreferences?: string[];
  eventPriorities?: string[];
  accessibilityNeeds?: string[];
  splurgePriority?: string;
  specialRequirements?: string[];
  notes?: string;
  [key: string]: unknown;
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
  preferences: EventPreferences;
  status: EventStatus;
  version?: number;
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
  notes?: string;
  isContingency?: boolean;
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
  category?: string;
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
  serviceDescription?: string;
  isSampleData?: boolean;
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
  estimatedAmount?: number;
  quotedAmount: number;
  actualPaid?: number;
  bookingStatus: BookingStatus;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface EventVendorWithDetails extends EventVendorModel {
  vendor?: VendorModel;
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
 * 8. ConversationMessage Model & Controlled Action Proposals
 */
export type ActionType =
  | "REDUCE_BUDGET"
  | "INCREASE_BUDGET"
  | "CREATE_TASK"
  | "CREATE_CHECKLIST"
  | "ADD_BUDGET_ITEM";

export interface ActionProposal {
  id?: string;
  type: ActionType;
  description: string;
  preview: {
    title: string;
    before?: string | number;
    after?: string | number;
    details?: Record<string, unknown> | Array<Record<string, unknown>>;
  };
  payload: Record<string, unknown>;
  status: "pending" | "confirmed" | "rejected" | "applied";
}

export interface ConversationMessageModel {
  _id?: ObjectId;
  eventId: ObjectId;
  ownerId: ObjectId;
  role: MessageRole;
  content: string;
  actionProposal?: ActionProposal;
  suggestedPrompts?: string[];
  createdAt: Date;
}

/**
 * 9. Event Change Log Model (Audit Trail & Version History)
 */
export interface EventChangeLogModel {
  _id?: ObjectId;
  eventId: ObjectId;
  ownerId: ObjectId;
  version: number;
  timestamp: Date;
  summary: string;
  changes: {
    guestCount?: { before: number; after: number };
    totalBudget?: { before: number; after: number };
    date?: { before: string; after: string; daysShifted: number };
    location?: { before: string; after: string };
    theme?: { before: string; after: string };
    status?: { before: string; after: string };
    vendorStatusChanges?: Array<{
      eventVendorId: string;
      vendorName: string;
      category: string;
      beforeStatus: string;
      afterStatus: string;
    }>;
  };
  appliedModifications: {
    budgetAdjusted: boolean;
    budgetDetails?: Array<{ category: string; previousEstimated: number; newEstimated: number }>;
    tasksRescheduledCount: number;
    tasksRescheduled?: Array<{ taskId: string; title: string; previousDueDate: string; newDueDate: string }>;
    vendorsRequiringConfirmationCount: number;
    vendorsRequiringConfirmation?: Array<{ eventVendorId: string; vendorName: string; category: string; notes: string }>;
  };
  aiRationale?: string;
}

/**
 * 10. Change Impact Proposal Structure
 */
export interface ChangeProposal {
  proposalId: string;
  eventId: string;
  baseVersion: number;
  generatedAt: string;
  changes: {
    guestCount?: { before: number; after: number };
    totalBudget?: { before: number; after: number };
    date?: { before: string; after: string; daysShifted: number };
    location?: { before: string; after: string };
    theme?: { before: string; after: string };
    vendorChanges?: Array<{
      eventVendorId: string;
      vendorName: string;
      category: string;
      beforeStatus: string;
      afterStatus: string;
    }>;
  };
  financialImpact: {
    currentTotalBudget: number;
    proposedTotalBudget: number;
    budgetDelta: number;
    currentCommitted: number;
    currentActualSpend: number;
    projectedTotalCost: number;
    projectedVariance: number;
    isBudgetFeasible: boolean;
    deficitAmount?: number;
    affectedBudgetCategories: Array<{
      category: string;
      currentEstimated: number;
      suggestedNewEstimated: number;
      difference: number;
      rationale: string;
      isVerified: boolean;
    }>;
  };
  timelineImpact: {
    daysShifted: number;
    affectedTasks: Array<{
      taskId: string;
      taskTitle: string;
      currentDueDate: string;
      suggestedNewDueDate: string;
      reason: string;
      urgency: "low" | "medium" | "high" | "urgent";
    }>;
  };
  vendorImpact: {
    vendorsRequiringConfirmation: Array<{
      eventVendorId: string;
      vendorName: string;
      category: string;
      currentStatus: string;
      actionRequired: string;
      notes: string;
    }>;
  };
  aiAnalysis: {
    summary: string;
    tradeoffs: string[];
    alternatives: Array<{
      title: string;
      description: string;
      estimatedSavingsOrCost: string;
    }>;
    risks: Array<{
      risk: string;
      severity: "low" | "medium" | "high";
      mitigation: string;
    }>;
  };
  isStale: boolean;
}
