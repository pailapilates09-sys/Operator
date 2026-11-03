-- Collection staging schema. No operational data is included.

-- Drive Sheets are inputs. Validation precedes admission and reporting.

CREATE SCHEMA IF NOT EXISTS paila_input;

CREATE TABLE IF NOT EXISTS paila_input.locations (
  location_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Active', 'Inactive'))
);

CREATE TABLE IF NOT EXISTS paila_input.plans (
  plan_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  visits INTEGER CHECK (visits>=0),
  valid_days INTEGER CHECK (valid_days>=0),
  list_price_npr NUMERIC(16,2) CHECK (list_price_npr>=0),
  status TEXT NOT NULL CHECK (status IN ('Draft', 'Active', 'Retired'))
);

CREATE TABLE IF NOT EXISTS paila_input.team (
  staff_id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('Trainer', 'Manager', 'Admin')),
  location_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Active', 'Inactive')),
  FOREIGN KEY (location_id) REFERENCES paila_input.locations(location_id) DEFERRABLE INITIALLY DEFERRED
);

CREATE TABLE IF NOT EXISTS paila_input.customers (
  customer_id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  location_id TEXT NOT NULL,
  enquiry_date DATE NOT NULL,
  source TEXT CHECK (source IN ('Walk-in', 'Referral', 'Instagram', 'Website', 'Phone', 'Other')),
  stage TEXT NOT NULL CHECK (stage IN ('Enquiry', 'Trial booked', 'Active', 'Paused', 'Left')),
  assigned_staff_id TEXT,
  contact_reference TEXT,
  FOREIGN KEY (location_id) REFERENCES paila_input.locations(location_id) DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY (assigned_staff_id) REFERENCES paila_input.team(staff_id) DEFERRABLE INITIALLY DEFERRED
);

CREATE TABLE IF NOT EXISTS paila_input.sessions (
  session_id TEXT PRIMARY KEY,
  local_date DATE NOT NULL,
  start_time TIME WITHOUT TIME ZONE NOT NULL,
  location_id TEXT NOT NULL,
  staff_id TEXT NOT NULL,
  class_name TEXT NOT NULL,
  capacity INTEGER NOT NULL CHECK (capacity>=0),
  status TEXT NOT NULL CHECK (status IN ('Scheduled', 'Completed', 'Cancelled')),
  FOREIGN KEY (location_id) REFERENCES paila_input.locations(location_id) DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY (staff_id) REFERENCES paila_input.team(staff_id) DEFERRABLE INITIALLY DEFERRED
);

CREATE TABLE IF NOT EXISTS paila_input.expenses (
  expense_id TEXT PRIMARY KEY,
  local_date DATE NOT NULL,
  location_id TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Rent', 'Wages', 'Utilities', 'Equipment', 'Cleaning', 'Marketing', 'Other')),
  amount_npr NUMERIC(16,2) NOT NULL CHECK (amount_npr>=0),
  method TEXT NOT NULL CHECK (method IN ('Cash', 'Digital', 'Bank', 'Other')),
  supplier_reference TEXT,
  source_reference TEXT NOT NULL,
  entered_by_staff_id TEXT NOT NULL,
  FOREIGN KEY (location_id) REFERENCES paila_input.locations(location_id) DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY (entered_by_staff_id) REFERENCES paila_input.team(staff_id) DEFERRABLE INITIALLY DEFERRED
);

CREATE TABLE IF NOT EXISTS paila_input.daily_close (
  day_id TEXT PRIMARY KEY,
  local_date DATE NOT NULL,
  location_id TEXT NOT NULL,
  opening_cash_npr NUMERIC(16,2) CHECK (opening_cash_npr>=0),
  counted_closing_cash_npr NUMERIC(16,2) CHECK (counted_closing_cash_npr>=0),
  opening_done TEXT NOT NULL CHECK (opening_done IN ('Yes', 'No')),
  cleaning_done TEXT NOT NULL CHECK (cleaning_done IN ('Yes', 'No')),
  closing_done TEXT NOT NULL CHECK (closing_done IN ('Yes', 'No')),
  reviewed_by_staff_id TEXT NOT NULL,
  source_reference TEXT,
  FOREIGN KEY (location_id) REFERENCES paila_input.locations(location_id) DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY (reviewed_by_staff_id) REFERENCES paila_input.team(staff_id) DEFERRABLE INITIALLY DEFERRED,
  UNIQUE (location_id, local_date)
);

CREATE TABLE IF NOT EXISTS paila_input.equipment (
  equipment_id TEXT PRIMARY KEY,
  location_id TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Ready', 'Check needed', 'Out of service')),
  last_check_date DATE,
  next_check_date DATE,
  checked_by_staff_id TEXT,
  source_reference TEXT,
  FOREIGN KEY (location_id) REFERENCES paila_input.locations(location_id) DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY (checked_by_staff_id) REFERENCES paila_input.team(staff_id) DEFERRABLE INITIALLY DEFERRED
);

CREATE TABLE IF NOT EXISTS paila_input.memberships (
  membership_id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL,
  plan_id TEXT NOT NULL,
  location_id TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  status TEXT NOT NULL CHECK (status IN ('Pending', 'Active', 'Paused', 'Ended', 'Cancelled')),
  terms_reference TEXT,
  FOREIGN KEY (customer_id) REFERENCES paila_input.customers(customer_id) DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY (plan_id) REFERENCES paila_input.plans(plan_id) DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY (location_id) REFERENCES paila_input.locations(location_id) DEFERRABLE INITIALLY DEFERRED
);

CREATE TABLE IF NOT EXISTS paila_input.followups (
  followup_id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL,
  assigned_staff_id TEXT NOT NULL,
  due_date DATE NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('Enquiry', 'First visit', 'Renewal', 'Feedback', 'Return visit', 'Other')),
  status TEXT NOT NULL CHECK (status IN ('Open', 'Done', 'Cancelled')),
  completed_date DATE,
  source_reference TEXT,
  FOREIGN KEY (customer_id) REFERENCES paila_input.customers(customer_id) DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY (assigned_staff_id) REFERENCES paila_input.team(staff_id) DEFERRABLE INITIALLY DEFERRED
);

CREATE TABLE IF NOT EXISTS paila_input.attendance (
  visit_id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Booked', 'Checked in', 'Attended', 'No show', 'Cancelled')),
  membership_id TEXT,
  source_reference TEXT,
  FOREIGN KEY (session_id) REFERENCES paila_input.sessions(session_id) DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY (customer_id) REFERENCES paila_input.customers(customer_id) DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY (membership_id) REFERENCES paila_input.memberships(membership_id) DEFERRABLE INITIALLY DEFERRED,
  UNIQUE (session_id, customer_id)
);

CREATE TABLE IF NOT EXISTS paila_input.payments (
  payment_id TEXT PRIMARY KEY,
  local_date DATE NOT NULL,
  customer_id TEXT NOT NULL,
  location_id TEXT NOT NULL,
  amount_npr NUMERIC(16,2) NOT NULL CHECK (amount_npr>=0),
  kind TEXT NOT NULL CHECK (kind IN ('Receipt', 'Refund')),
  method TEXT NOT NULL CHECK (method IN ('Cash', 'Digital', 'Bank', 'Other')),
  membership_id TEXT,
  refund_of_payment_id TEXT,
  source_reference TEXT NOT NULL,
  FOREIGN KEY (customer_id) REFERENCES paila_input.customers(customer_id) DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY (location_id) REFERENCES paila_input.locations(location_id) DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY (membership_id) REFERENCES paila_input.memberships(membership_id) DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY (refund_of_payment_id) REFERENCES paila_input.payments(payment_id) DEFERRABLE INITIALLY DEFERRED
);
