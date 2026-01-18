# Product Requirements Document: PaskuhayConnect MVP

## Product Overview
**App Name:** PaskuhayConnect
**Tagline:** "Ang modernong listahan para sa hapsay nga Kapunungan." (The modern list for an organized Organization.)
**Launch Goal:** To replace the manual, error-prone Excel spreadsheet with a centralized, automated web database that ensures 100% calculation accuracy and transparency for members.
**Target Launch:** 6-8 weeks

## Who It's For

### Primary User: The Treasurer/Admin
**User Persona:** "Tita Treasurer"
She manages the funds for over 80 members (Alia, Sasil, Sanchez families, etc.). She currently spends hours manually inputting data into Excel, calculating 10% interest rates, and chasing people for signatures.

**Their Current Pain:**
- **Calculation Errors:** Manually computing 10% interest on "Hulam" (Loans) and summing up "Put-ups" leads to mistakes.
- **Data Fragility:** If the `KAPUNUNGAN 2025.xlsx` file gets corrupted or deleted, all financial history is lost.
- **Lack of Transparency:** Members constantly text her asking, "Pila akong utang?" (How much do I owe?) or "Pila na akong pondo?" (How much are my savings?).

**What They Need:**
- Automated interest and penalty calculations.
- A secure, cloud-based database (accessible from phone or laptop).
- A way for members to check their own balances without bothering the admin.

### Example User Story
"Meet **Lorena**, the group treasurer who struggles with managing the financial records of 85 members using a confusing Excel sheet. Every collection date (e.g., Jan 19), she manually types in loans and cross-references attendance. She needs **PaskuhayConnect** so she can instantly record a payment, have the system auto-calculate the remaining balance, and generate a summary report for the year-end party."

## The Problem We're Solving
The current system relies on a complex Excel sheet with multiple tabs ("NAMES", "JAN-FEB 2025"). As the organization grows (currently ~85 members), manual row entries lead to "formula drift," broken links, and version control issues (e.g., `updated1 (version 1).xlsb`).

**Why Existing Solutions Fall Short:**
- **Excel/Spreadsheets:** Hard to view on mobile during meetings; prone to human error when dragging formulas; difficult to audit who changed what.
- **Notebooks:** Impossible to backup; hard to calculate totals quickly.

## User Journey

### Discovery → First Use → Success

1. **Discovery Phase**
   - **How they find us:** The Treasurer introduces the new link during the monthly meeting.
   - **Decision trigger:** The promise that they don't have to sign a physical paper anymore (Digital logs).

2. **Onboarding (First 5 Minutes)**
   - **Land on:** Admin Login Page / Member Public Dashboard.
   - **First action:** Admin uploads the existing CSV to migrate the 85 members and current balances.
   - **Quick win:** The Dashboard immediately shows the "Total Capital" and "Total Interest" matching their bank cash on hand.

3. **Core Usage Loop**
   - **Trigger:** Monthly meeting (e.g., Feb 16).
   - **Action:** Admin selects a member (e.g., "Alia, Annalyn"), enters a new Loan (Hulam) of 4,000.
   - **Reward:** System automatically calculates the 400 Interest and updates the Total Hulam.
   - **Investment:** Historical data builds up, making the Year-End Paskuhay distribution calculation instant.

4. **Success Moment**
   - **"Aha!" moment:** When a member asks about their balance, and the Admin says, "Just login to the site and check," saving the Admin time.

## MVP Features

### Must Have for Launch

#### 1. Member Directory & Migration
- **What:** Database of all 85+ members (ID, Last Name, First Name) with status.
- **User Story:** As an Admin, I want to import the "NAMES.csv" file so I don't have to re-type all 85 names manually.
- **Success Criteria:**
  - [ ] Successfully parse the uploaded CSV.
  - [ ] Display list of all members with search functionality.
- **Priority:** P0 (Critical)

#### 2. Monthly Transaction Ledger (The "Sheet" Replacement)
- **What:** Digital input form for "Lawas" (Attendance/Share), "Put-up" (Savings), "Hulam" (Loan), and "Penalty".
- **User Story:** As an Admin, I want to record that "Barinque, Mary Apple" made a transaction so that her record is updated for the month.
- **Success Criteria:**
  - [ ] Input fields for: Lawas, Put-up, Hulam Put-up, Payment.
  - [ ] CRUD (Create/Edit) capability for monthly records.
- **Priority:** P0 (Critical)

#### 3. Automated Calculator Engine
- **What:** Logic that auto-computes the columns currently manually calculated in Excel.
- **User Story:** As an Admin, when I enter a loan of 4,000, I want the system to automatically set the Interest to 400 (10%) and update the Total Hulam.
- **Success Criteria:**
  - [ ] `Interest = Hulam * 0.10` (Configurable percentage).
  - [ ] `Total Hulam = Previous Balance + New Loan - Payment`.
  - [ ] `Total Capital` aggregation at the bottom of the dashboard.
- **Priority:** P0 (Critical)

#### 4. Member View (Read-Only)
- **What:** A public or password-protected view where members can see their own history.
- **User Story:** As a Member (e.g., Jayson), I want to see my total "Hulam" on my phone so I know how much cash to bring to the meeting.
- **Success Criteria:**
  - [ ] Mobile-responsive table view for individual members.
- **Priority:** P1 (High)

### Nice to Have (If Time Allows)
- **Digital Audit Trail**: Replaces the "Signature" column. Records *who* made the edit and *when*.
- **SMS Reminders**: Automated text to members with outstanding balances before the meeting.

### NOT in MVP (Saving for Later)
- **Online Payment Integration (GCash/Maya)**: Will add after 6 months. For now, track cash payments manually.
- **Multiple Organizations**: Will add if we decide to sell this SaaS to other Kapunungans.

## How We'll Know It's Working

### Launch Success Metrics (First 30 Days)
| Metric | Target | Measure |
|--------|--------|---------|
| **Data Integrity** | 100% Match | Compare "Total Capital" on Web App vs. Treasurer's Cash on Hand. |
| **Adoption** | 100% of Active Members | All 85 members have a profile in the system. |
| **Efficiency** | < 30 mins | Time spent by Treasurer recording transactions after a meeting (down from hours). |

### Growth Metrics (Months 2-3)
| Metric | Target | Measure |
|--------|--------|---------|
| **Member Engagement** | 50% | Percentage of members checking their own dashboard before the meeting. |

## Look & Feel

**Design Vibe:** Trustworthy, Clear, High-Contrast (Easy to read for older members).

**Visual Principles:**
1. **Data Density:** Since this replaces Excel, use clear tables but add spacing for readability on mobile.
2. **Status Indication:** Use Green for "Paid/Put-up" and Red for "Unpaid/Hulam/Penalty".
3. **Visayan/Local Context:** Use the terms they know (Lawas, Hulam, Paskuhay) rather than generic English finance terms.

**Key Screens/Pages:**
1. **The Dashboard (Admin):** High-level view of "Total Money In," "Total Loans Out," and "Projected Interest."
2. **The Ledger (Transaction View):** Looks like the "JAN-FEB 2025" sheet but with search filters and specific edit buttons per row.
3. **Member Profile:** A card view showing one person's yearly history (Jan-Dec) to replicate the attendance tracking in the first file.

### Simple Wireframe
```text
+--------------------------------------------------+
|  PASKUHAY CONNECT                  [Admin User]  |
+--------------------------------------------------+
|  TOTAL FUNDS: ₱ 399,565   |   MEMBERS: 85        |
+--------------------------------------------------+
|  FILTER: [ Search Name... ]  [ Month: Feb '25 ]  |
+--------------------------------------------------+
|  NAME             |  LOAN (HULAM) |  INTEREST    |
|-------------------|---------------|--------------|
|  1. ALIA, ANNALYN |  ₱ 4,000      |  ₱ 400       |
|  2. ALIA, ARLENE  |  ₱ 2,000      |  ₱ 200       |
|  ...              |               |              |
+--------------------------------------------------+
|  [+] ADD TRANSACTION                             |
+--------------------------------------------------+