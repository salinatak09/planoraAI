export * from "./models";
export type EventType = "wedding" | "birthday" | "anniversary" | "community" | "other";

export type EventStatus = "planning" | "confirmed" | "in_progress" | "completed" | "cancelled";

export type TaskPriority = "low" | "medium" | "high" | "urgent";

export type TaskStatus = "pending" | "in_progress" | "completed";

export type VendorCategory =
  | "venue"
  | "catering"
  | "photography"
  | "music"
  | "decor"
  | "florals"
  | "attire"
  | "other";

export type VendorStatus = "contacted" | "shortlisted" | "booked" | "declined";

export interface EventTask {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  priority: TaskPriority;
  status: TaskStatus;
  assignedTo?: string;
  estimatedCost?: number;
}

export interface TimelineItem {
  id: string;
  time: string; // e.g. "14:00" or "2:00 PM"
  title: string;
  description?: string;
  durationMinutes?: number;
  location?: string;
  completed?: boolean;
}

export interface Vendor {
  id: string;
  name: string;
  category: VendorCategory;
  contactName?: string;
  email?: string;
  phone?: string;
  estimatedCost: number;
  actualCost?: number;
  status: VendorStatus;
  notes?: string;
}

export interface AIIdea {
  id: string;
  title: string;
  description: string;
  category: "theme" | "decor" | "activity" | "menu" | "logistics";
  estimatedCostRange?: string;
  tags: string[];
  createdAt: string;
}

export interface EventDocument {
  _id?: string;
  id: string;
  userId: string;
  title: string;
  type: EventType;
  date: string;
  location: string;
  guestCount: number;
  budgetTotal: number;
  budgetSpent: number;
  theme: string;
  notes?: string;
  status: EventStatus;
  tasks: EventTask[];
  timeline: TimelineItem[];
  vendors: Vendor[];
  aiIdeas: AIIdea[];
  createdAt: string;
  updatedAt: string;
}

export interface UserSession {
  userId: string;
  email: string;
  name: string;
  agency: string;
  role: "organizer" | "admin";
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}
