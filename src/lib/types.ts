// ============================================================
// DATA TYPES (stage 08 — data model)
//
// Two shapes per table:
//   *Row      = the database's snake_case columns (exact DDL
//               in supabase/setup.sql)
//   *         = camelCase app shape the screens render
//   map*()    = the one place the two shapes meet — screens
//               never see snake_case, SQL never sees camelCase.
// ============================================================

export type ApplicationStatus =
  | "new"
  | "reviewing"
  | "shortlisted"
  | "contacted"
  | "closed";

export type InquiryStatus = "new" | "contacted" | "booked" | "closed";

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "declined"
  | "completed";

export type TableName =
  | "creator_applications"
  | "project_inquiries"
  | "studio_bookings";

// --- Database rows (snake_case) -----------------------------

export interface CreatorApplicationRow {
  id: string;
  created_at: string;
  status: ApplicationStatus;
  full_name: string;
  phone: string;
  email: string;
  location: string;
  interests: string[] | null;
  experience: string;
  equipment: string[] | null;
  created_before: string;
  work_samples: string | null;
  video_idea: string;
  audience_interest: string;
  resourcefulness: string;
  collaboration: string;
  local_availability: string;
  schedule: string;
  motivation: string;
  creative_challenge: string;
  practical_task: string;
  confirmed_accuracy: boolean | null;
  confirmed_ownership: boolean | null;
  final_notes: string | null;
}

export interface ProjectInquiryRow {
  id: string;
  created_at: string;
  status: InquiryStatus;
  service: string;
  project_type: string;
  event_date: string | null;
  location: string | null;
  expected_guests: string | null;
  budget_range: string;
  description: string;
  additional_requirements: string | null;
  name: string;
  phone: string;
  email: string;
}

export interface StudioBookingRow {
  id: string;
  created_at: string;
  status: BookingStatus;
  studio: string;
  booking_date: string;
  booking_time: string;
  purpose: string;
  name: string;
  phone: string;
  email: string;
  notes: string | null;
}

// --- App shapes (camelCase) --------------------------------

export interface CreatorApplication {
  id: string;
  createdAt: string;
  status: ApplicationStatus;
  fullName: string;
  phone: string;
  email: string;
  location: string;
  interests: string[];
  experience: string;
  equipment: string[];
  createdBefore: string;
  workSamples: string | null;
  videoIdea: string;
  audienceInterest: string;
  resourcefulness: string;
  collaboration: string;
  localAvailability: string;
  schedule: string;
  motivation: string;
  creativeChallenge: string;
  practicalTask: string;
  confirmedAccuracy: boolean;
  confirmedOwnership: boolean;
  finalNotes: string | null;
}

export interface ProjectInquiry {
  id: string;
  createdAt: string;
  status: InquiryStatus;
  service: string;
  projectType: string;
  eventDate: string | null;
  location: string | null;
  expectedGuests: string | null;
  budgetRange: string;
  description: string;
  additionalRequirements: string | null;
  name: string;
  phone: string;
  email: string;
}

export interface StudioBooking {
  id: string;
  createdAt: string;
  status: BookingStatus;
  studio: string;
  bookingDate: string;
  bookingTime: string;
  purpose: string;
  name: string;
  phone: string;
  email: string;
  notes: string | null;
}

// --- Mappers ------------------------------------------------

export const mapApplication = (row: CreatorApplicationRow): CreatorApplication => ({
  id: row.id,
  createdAt: row.created_at,
  status: row.status,
  fullName: row.full_name,
  phone: row.phone,
  email: row.email,
  location: row.location,
  interests: row.interests ?? [],
  experience: row.experience,
  equipment: row.equipment ?? [],
  createdBefore: row.created_before,
  workSamples: row.work_samples,
  videoIdea: row.video_idea,
  audienceInterest: row.audience_interest,
  resourcefulness: row.resourcefulness,
  collaboration: row.collaboration,
  localAvailability: row.local_availability,
  schedule: row.schedule,
  motivation: row.motivation,
  creativeChallenge: row.creative_challenge,
  practicalTask: row.practical_task,
  confirmedAccuracy: row.confirmed_accuracy ?? false,
  confirmedOwnership: row.confirmed_ownership ?? false,
  finalNotes: row.final_notes,
});

export const mapInquiry = (row: ProjectInquiryRow): ProjectInquiry => ({
  id: row.id,
  createdAt: row.created_at,
  status: row.status,
  service: row.service,
  projectType: row.project_type,
  eventDate: row.event_date,
  location: row.location,
  expectedGuests: row.expected_guests,
  budgetRange: row.budget_range,
  description: row.description,
  additionalRequirements: row.additional_requirements,
  name: row.name,
  phone: row.phone,
  email: row.email,
});

export const mapBooking = (row: StudioBookingRow): StudioBooking => ({
  id: row.id,
  createdAt: row.created_at,
  status: row.status,
  studio: row.studio,
  bookingDate: row.booking_date,
  bookingTime: row.booking_time,
  purpose: row.purpose,
  name: row.name,
  phone: row.phone,
  email: row.email,
  notes: row.notes,
});
