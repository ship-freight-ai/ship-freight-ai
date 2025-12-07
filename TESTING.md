# ShipAI Platform Testing Guide

Complete guide for testing all platform functionality before production deployment.

---

## 🚀 Quick Start

### 1. Initialize Test Environment

**Call the seed-test-data edge function:**
- Open your browser's DevTools Console
- Run:
```javascript
const response = await fetch('https://agpyypkwruidawoygsyo.supabase.co/functions/v1/seed-test-data', {
  method: 'POST',
});
const result = await response.json();
console.log(result);
```

**Or use the Backend interface:**
- Navigate to Backend → Edge Functions → seed-test-data
- Click "Invoke"

### 2. Test User Credentials

| Role | Email | Password |
|------|-------|----------|
| **Shipper** | test-shipper@shipai.com | TestShip123! |
| **Carrier 1** | test-carrier1@shipai.com | TestCarrier123! |
| **Carrier 2** | test-carrier2@shipai.com | TestCarrier123! |
| **Admin** | test-admin@shipai.com | TestAdmin123! |

### 3. Stripe Test Cards

| Purpose | Card Number | Expiry | CVC |
|---------|------------|--------|-----|
| **Success** | 4242 4242 4242 4242 | Any future date | Any 3 digits |
| **Declined** | 4000 0000 0000 0002 | Any future date | Any 3 digits |
| **Auth Required** | 4000 0027 6000 3184 | Any future date | Any 3 digits |

---

## 📋 Comprehensive Testing Checklist

### A. Shipper Workflow

#### ✅ Account & Onboarding
- [ ] Sign up as new shipper (use test-shipper-new@shipai.com)
- [ ] Complete email verification
- [ ] Select "Shipper" plan on pricing page
- [ ] Complete Stripe checkout (use test card: 4242 4242 4242 4242)
- [ ] Verify redirect to dashboard after successful payment
- [ ] Verify subscription status shows "active" or "trialing"
- [ ] Login with existing test-shipper@shipai.com

**Expected:** Seamless onboarding flow, no edge function errors, subscription created.

---

#### ✅ Dashboard View
- [ ] Navigate to Shipper Dashboard
- [ ] Verify "Active Loads" count is correct
- [ ] Verify "Pending Bookings" count is correct
- [ ] Verify "Total Spent" calculation
- [ ] Check "Recent Loads" section displays loads
- [ ] Verify chart data renders correctly

**Expected:** All statistics accurate, no loading errors, real-time updates.

---

#### ✅ Load Management
- [ ] Click "Post New Load"
- [ ] Fill in all required fields:
  - Origin: Los Angeles, CA
  - Destination: Phoenix, AZ
  - Pickup Date: [Select future date]
  - Delivery Date: [Select future date after pickup]
  - Equipment Type: Dry Van
  - Weight: 25000 lbs
  - Commodity: Test Freight
  - Posted Rate: $1500
- [ ] Click "Save as Draft" → verify load saved
- [ ] Edit the draft load → change rate to $1600
- [ ] Click "Post Load" → verify status changes to "posted"
- [ ] Verify load appears in "Available Loads" for carriers
- [ ] View load details page → verify all data displayed
- [ ] Upload a document (test PDF/image)
- [ ] Delete the test load → verify confirmation dialog
- [ ] Confirm deletion → verify load removed

**Expected:** Smooth CRUD operations, validation working, real-time sync.

---

#### ✅ Bid Management
- [ ] Navigate to "Loads" page
- [ ] Open a load in "bidding" status
- [ ] Verify bids are displayed (should see 2 bids from carriers)
- [ ] Click "Accept" on the highest bid
- [ ] Verify confirmation dialog appears
- [ ] Confirm acceptance
- [ ] Verify:
  - Accepted bid status → "accepted"
  - Other bids status → "rejected"
  - Load status → "booked"
  - Load assigned to carrier
- [ ] Navigate to another load with bids
- [ ] Click "Reject" on a bid
- [ ] Verify bid status → "rejected"

**Expected:** Bid acceptance triggers correct status updates, other bids rejected automatically.

---

#### ✅ Payment Flow
- [ ] Open a load in "booked" status
- [ ] Click "Initiate Payment"
- [ ] Verify Stripe payment form appears
- [ ] Enter test card: 4242 4242 4242 4242
- [ ] Submit payment
- [ ] Verify payment status → "escrow"
- [ ] Verify load payment indicator shows "In Escrow"
- [ ] Update load status to "delivered" (via status manager)
- [ ] Wait for 7 days (or manually trigger auto-release via edge function)
- [ ] Verify payment auto-released
- [ ] **OR** manually release payment:
  - Click "Release Payment"
  - Verify confirmation dialog
  - Confirm release
  - Verify payment status → "released"
  - Verify load status → "completed"

**Expected:** Payments held securely, released only after delivery + 7 days or manual approval.

---

#### ✅ Messaging
- [ ] Open a load with assigned carrier
- [ ] Click "Messages" tab
- [ ] Type a message: "When can you pick up?"
- [ ] Click "Send"
- [ ] Verify message appears in thread
- [ ] Open conversation list
- [ ] Verify unread count increments
- [ ] Mark messages as read
- [ ] Verify unread count decrements

**Expected:** Real-time message delivery, unread counts accurate.

---

### B. Carrier Workflow

#### ✅ Account & Onboarding
- [ ] Sign up as new carrier
- [ ] Complete carrier profile:
  - Company Name: Test Trucking LLC
  - DOT Number: 999999
  - MC Number: MC999999
  - Equipment Types: Dry Van, Reefer
  - Service Areas: CA, NV, AZ
  - Capacity: 5 trucks
  - Insurance Amount: $1,000,000
  - Insurance Expiry: [Future date]
- [ ] Complete Stripe checkout
- [ ] Login with test-carrier1@shipai.com

**Expected:** Profile created, subscription active, verification pending.

---

#### ✅ Dashboard View
- [ ] Navigate to Carrier Dashboard
- [ ] Verify "Available Loads" count
- [ ] Verify "Active Bids" count
- [ ] Verify "Total Earnings" calculation
- [ ] Check "Available Loads" preview section

**Expected:** Statistics accurate, loads matching service areas displayed.

---

#### ✅ Load Discovery
- [ ] Navigate to "Available Loads"
- [ ] Verify loads in "posted" status are visible
- [ ] Apply filter: Equipment Type = "Dry Van"
- [ ] Verify only dry van loads shown
- [ ] Apply filter: Origin State = "CA"
- [ ] Verify only CA origin loads shown
- [ ] Clear filters
- [ ] Click on a load → view details

**Expected:** Filters work correctly, only available loads shown.

---

#### ✅ Bidding
- [ ] Open a load in "posted" status
- [ ] Click "Submit Bid"
- [ ] Enter bid amount: $1400
- [ ] Enter notes: "Can deliver early"
- [ ] Submit bid
- [ ] Verify bid appears in "My Bids"
- [ ] Verify bid status: "pending"
- [ ] Verify bid expiration date (48 hours from now)
- [ ] Try to bid again on same load → verify error message
- [ ] Navigate to "My Bids"
- [ ] Edit a pending bid → change amount to $1350
- [ ] Update bid
- [ ] Verify updated amount shown

**Expected:** Bids submitted successfully, duplicate bid prevention works.

---

#### ✅ Payment Receipt
- [ ] Check "Payments" page
- [ ] Verify payments for completed loads show "released" status
- [ ] Verify total earnings calculation
- [ ] View payment details

**Expected:** Payment history accurate, earnings updated.

---

#### ✅ Documents
- [ ] Navigate to a booked load
- [ ] Upload BOL document
- [ ] Verify document appears in load documents
- [ ] Update load status to "delivered"
- [ ] Upload POD document
- [ ] Verify both documents visible

**Expected:** Documents uploaded successfully, visible to shipper.

---

### C. System-Wide Testing

#### ✅ Authentication
- [ ] Logout
- [ ] Try to access /app/loads → verify redirect to /auth
- [ ] Login with test-shipper@shipai.com
- [ ] Verify redirect to dashboard
- [ ] Refresh page → verify session persists
- [ ] Logout again
- [ ] Click "Forgot Password" → test flow
- [ ] Verify email sent (check Supabase dashboard)

**Expected:** Protected routes secured, session persistence works.

---

#### ✅ Real-time Updates
- [ ] Open load details in TWO browser windows (or incognito + normal)
- [ ] Window 1: Login as shipper
- [ ] Window 2: Login as carrier
- [ ] Window 2: Submit a bid on the load
- [ ] Window 1: Verify bid appears instantly (no refresh)
- [ ] Window 1: Send a message
- [ ] Window 2: Verify message appears instantly
- [ ] Window 1: Update load status
- [ ] Window 2: Verify status updates instantly

**Expected:** Real-time sync works across sessions.

---

#### ✅ Error Handling
- [ ] Open LoadDetails page with invalid load ID
- [ ] Verify ErrorBoundary displays "Something went wrong"
- [ ] Click "Retry" button
- [ ] Verify error recovered or redirected
- [ ] Simulate network offline (DevTools → Network → Offline)
- [ ] Try to load a page
- [ ] Verify graceful error message
- [ ] Re-enable network

**Expected:** Errors caught gracefully, user-friendly messages.

---

#### ✅ Edge Function Jobs
- [ ] Manually trigger bid expiration cleanup:
  ```javascript
  await fetch('https://agpyypkwruidawoygsyo.supabase.co/functions/v1/expire-bids', {
    method: 'POST',
  });
  ```
- [ ] Verify expired bids status changed to "rejected"
- [ ] Manually trigger payment auto-release:
  ```javascript
  await fetch('https://agpyypkwruidawoygsyo.supabase.co/functions/v1/auto-release-payments', {
    method: 'POST',
  });
  ```
- [ ] Verify payments older than 7 days released

**Expected:** Automated jobs execute correctly, data updated.

---

#### ✅ Performance
- [ ] Load "Loads" page with 10+ loads
- [ ] Verify page loads < 2 seconds
- [ ] Scroll through list → verify smooth rendering
- [ ] Open message thread with 20+ messages
- [ ] Verify scroll performance smooth
- [ ] Monitor DevTools Performance tab for red flags

**Expected:** No performance bottlenecks, smooth UX.

---

## 🧪 Detailed Test Scenarios

### Scenario 1: Complete Load Lifecycle

**Goal:** Test full journey from posting load to payment release.

1. **Shipper:** Login as test-shipper@shipai.com
2. **Shipper:** Post new load (LA → Phoenix, Dry Van, $1500)
3. **Carrier 1:** Login as test-carrier1@shipai.com
4. **Carrier 1:** Submit bid ($1400) on the load
5. **Carrier 2:** Login as test-carrier2@shipai.com
6. **Carrier 2:** Submit bid ($1450) on the load
7. **Shipper:** Review bids → Accept Carrier 1's bid ($1400)
8. **Shipper:** Verify load status → "booked"
9. **Shipper:** Initiate payment (Stripe test card)
10. **Shipper:** Verify payment status → "escrow"
11. **Carrier 1:** Update load status → "in_transit"
12. **Carrier 1:** Upload BOL document
13. **Carrier 1:** Update load status → "delivered"
14. **Carrier 1:** Upload POD document
15. **Shipper:** Verify documents received
16. **Shipper:** Release payment
17. **Shipper:** Verify load status → "completed"
18. **Carrier 1:** Verify payment received, earnings updated

**Expected Result:** Entire flow completes without errors, data synced correctly.

---

### Scenario 2: Bidding War

**Goal:** Test multiple carriers competing on same load.

1. **Shipper:** Post load (San Diego → Las Vegas, Reefer, $1800)
2. **Carrier 1:** Bid $1700
3. **Carrier 2:** Bid $1650 (lower)
4. **Carrier 1:** Update bid to $1600 (beat Carrier 2)
5. **Carrier 2:** Update bid to $1550 (beat Carrier 1)
6. **Shipper:** Accept Carrier 2's bid
7. **Verify:** Carrier 1's bid rejected, Carrier 2's bid accepted

**Expected Result:** Bid updates work, lowest bid wins.

---

### Scenario 3: Payment Dispute (Manual Test)

**Goal:** Test dispute flow if implemented.

1. **Shipper:** Book load, initiate payment
2. **Carrier:** Deliver load, upload POD
3. **Shipper:** File dispute (e.g., "Damaged goods")
4. **Admin:** Review dispute in admin dashboard
5. **Admin:** Resolve dispute (release or refund)
6. **Verify:** Payment status updated correctly

**Expected Result:** Dispute handled, funds distributed per resolution.

---

## 🔄 Reset & Re-test

### Reset Test Environment

**Call the reset-test-data edge function:**
```javascript
const response = await fetch('https://agpyypkwruidawoygsyo.supabase.co/functions/v1/reset-test-data', {
  method: 'POST',
});
const result = await response.json();
console.log(result);
```

**Then re-seed:**
```javascript
const response = await fetch('https://agpyypkwruidawoygsyo.supabase.co/functions/v1/seed-test-data', {
  method: 'POST',
});
const result = await response.json();
console.log(result);
```

---

## 🛠️ Browser DevTools Monitoring

### Console Tab
**What to Check:**
- ❌ No red errors during normal operations
- ⚠️ No unhandled promise rejections
- ⚠️ No React warnings (key props, etc.)
- ✅ Only expected logs (bid submitted, message sent, etc.)

### Network Tab
**What to Check:**
- ✅ All API calls return 200/201 status
- ✅ Edge functions respond < 2 seconds
- ❌ No 500 errors from edge functions
- ❌ No repeated/redundant requests (indicates inefficient queries)

### Application Tab
**What to Check:**
- ✅ localStorage contains `sb-agpyypkwruidawoygsyo-auth-token`
- ✅ Session persists across page refreshes

### Performance Tab
**What to Monitor:**
- Page load time < 3 seconds
- First Contentful Paint < 1.5 seconds
- Largest Contentful Paint < 2.5 seconds
- No long tasks blocking main thread

---

## 📊 Success Criteria

### ✅ Platform Ready for Production When:

- [ ] All test scenarios pass without errors
- [ ] Real-time updates work consistently
- [ ] Payment flow completes successfully (test mode)
- [ ] No console errors during normal usage
- [ ] Error boundaries catch and display errors gracefully
- [ ] Performance metrics within acceptable ranges
- [ ] Subscription flow completes without issues
- [ ] Edge functions execute reliably
- [ ] RLS policies prevent unauthorized access
- [ ] Mobile responsive design works on small screens

---

## 📞 Need Help?

If any test fails or unexpected behavior occurs:

1. **Check Console Logs:** Look for specific error messages
2. **Check Network Tab:** Verify API calls succeeded
3. **Check Edge Function Logs:** Navigate to Backend → Edge Functions → Logs
4. **Document the Issue:** Screenshot + steps to reproduce
5. **Reset Test Data:** Start fresh to isolate the issue

---

## 🎯 Next Steps After Testing

1. **Fix Any Critical Bugs** found during testing
2. **Optimize Performance** bottlenecks identified
3. **Update Documentation** based on test findings
4. **Configure Production Stripe** (replace test keys)
5. **Deploy to Production** 🚀

---

**Happy Testing! 🧪**
