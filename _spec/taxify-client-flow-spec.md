# Taxify Client-Led Ride Flow Implementation Spec

## 1. New Product Direction

Taxify should become a three-sided booking platform:

Client creates ride request → System assigns driver → Driver accepts/rejects → Client tracks status → Driver starts trip → Trip in progress → Driver ends trip → Fare shown → Client confirms → Driver confirms payment → Payment recorded → Completed → Driver active again

---

## 2. Current Codebase Status

Already implemented:
- Roles: Admin, Agent, Driver
- Booking + assignment system
- Trip lifecycle (start/end)
- Fare calculation
- Cash tracking
- Commission system
- Socket updates

Gap:
- No CLIENT role
- No client dashboard
- No client booking ownership
- No dual confirmation flow

---

## 3. Roles

Add:
- CLIENT

Permissions:
- Create booking
- View own booking
- Track trip
- Confirm completion

---

## 4. Booking Status Model

PENDING_ASSIGNMENT  
QUEUED  
DRIVER_ASSIGNED  
DRIVER_ACCEPTED  
TRIP_IN_PROGRESS  
TRIP_ENDED  
AWAITING_CLIENT_CONFIRMATION  
AWAITING_DRIVER_PAYMENT_CONFIRMATION  
PAID  
COMPLETED  
CANCELLED  

---

## 5. Driver Status

ACTIVE  
ASSIGNED  
ON_TRIP  
OFFLINE  
SUSPENDED  
DEACTIVATED  

---

## 6. Data Model Updates

Booking:
- clientId
- clientConfirmedAt
- driverPaymentConfirmedAt
- paymentRecordedAt
- status updates

Trip:
- clientConfirmedCompleteAt
- driverConfirmedPaymentAt
- paymentStatus

---

## 7. API Endpoints

Client:
POST /auth/register-client  
POST /client/bookings  
GET /client/bookings/current  
POST /client/bookings/:id/confirm-complete  

Driver:
POST /trips/:id/start  
POST /trips/:id/end  
POST /trips/:id/confirm-payment  

---

## 8. Socket Events

client.booking.created  
driver.accepted  
trip.started  
trip.ended  
client.confirmed_complete  
driver.confirmed_payment  
booking.completed  

---

## 9. Frontend

Routes:
- /client
- /client/bookings/new
- /client/bookings/current

Pages:
- Dashboard
- Create Booking
- Current Booking Tracker

---

## 10. Lifecycle Flow

CLIENT → BOOKING → ASSIGNMENT → ACCEPTED → TRIP → END → CLIENT CONFIRM → DRIVER CONFIRM → PAID → COMPLETED

---

## 11. Implementation Phases

1. Add CLIENT role + auth
2. Client booking creation
3. Client dashboard
4. Status refactor
5. Dual confirmation flow
6. Admin compatibility
7. Testing

---

## 12. Final Outcome

Taxify becomes a client-driven real-time ride system with:
- Live tracking
- Dual confirmation
- Payment integrity
- Driver lifecycle automation
