# Taxify – Taxi Dispatch & Ride Management Platform (Updated Project Brief)

## Overview

Taxify is a web-based, real-time taxi booking and dispatch platform that enables clients to request rides directly, while providing seamless coordination between clients, drivers, and administrators.

The system replaces manual workflows with a centralized, event-driven platform that supports live booking, automatic driver assignment, trip tracking, and verified payment completion.

---

## Core Features

- Multi-role system: Admin, Agent, Driver, Client  
- Client self-service booking (register, login, create rides)  
- Automatic driver assignment  
- Queue system for unassigned bookings  
- Real-time booking & trip status tracking  
- Driver accept/reject workflow  
- Trip lifecycle management (start → end → fare calculation)  
- Dual confirmation system (Client + Driver)  
- Cash payment tracking with validation  
- Commission system (10%)  
- Driver onboarding + approval system  
- Complaint & dispute management  
- Admin dashboard with analytics and controls  

---

## Updated Booking & Trip Flow

1. Client registers/logs in  
2. Client creates booking  
3. System auto-assigns available driver  
4. If no driver is available, booking enters queue  
5. Client sees assigned driver  
6. Driver accepts/rejects booking  
7. Client sees booking accepted  
8. Driver starts trip  
9. Client screen updates to "Trip in progress"  
10. Driver ends trip  
11. Fare is calculated and displayed on both screens  
12. Client confirms trip completion  
13. Driver confirms payment received  
14. Payment is recorded  
15. Booking becomes PAID → COMPLETED  
16. Driver returns to ACTIVE/available state  

---

## Booking Status Lifecycle

- PENDING_ASSIGNMENT  
- QUEUED  
- DRIVER_ASSIGNED  
- DRIVER_ACCEPTED  
- TRIP_IN_PROGRESS  
- TRIP_ENDED  
- AWAITING_CLIENT_CONFIRMATION  
- AWAITING_DRIVER_PAYMENT_CONFIRMATION  
- PAID  
- COMPLETED  
- CANCELLED  
- DISPUTED  

---

## Driver Lifecycle

- ACTIVE → available to receive bookings  
- ASSIGNED → booking assigned, awaiting action  
- ON_TRIP → trip in progress  
- OFFLINE → manually unavailable  
- SUSPENDED → blocked due to unpaid commission or violations  
- DEACTIVATED → permanently removed  

---

## Payment Flow

- Fare is calculated automatically at trip end  
- Client confirms trip completion  
- Driver confirms payment received (cash)  
- System records payment  
- Booking marked as PAID → COMPLETED  

---

## Commission System

- 10% commission per completed trip  
- Automatically calculated from trip fare  
- Tracked per driver monthly  
- Drivers upload payment receipts  
- Admin reviews and approves commission payments  

---

## Admin & Agent Capabilities

### Admin:
- Full system visibility  
- View all bookings (client + agent created)  
- Monitor driver performance  
- Approve driver onboarding  
- Manage disputes & complaints  
- Override booking states (cancel/complete/reassign)  
- Track commissions and payments  
- Access analytics dashboard  

### Agent:
- Create bookings for offline/walk-in customers  
- Monitor booking queue  
- Retry driver assignment  
- Cancel bookings (pre-trip)  
- Log customer complaints  

---

## Client Capabilities

- Register and manage account  
- Create ride bookings  
- View assigned driver details  
- Track trip status in real-time  
- View fare after trip completion  
- Confirm trip completion  
- View booking history  
- Submit complaints  

---

## System Goals

- Enable client-driven ride booking  
- Provide real-time visibility for all stakeholders  
- Ensure accurate fare and payment tracking  
- Maintain driver accountability and availability  
- Support scalable dispatch operations  
- Deliver a clean, reliable trip lifecycle system  

---

## End of Document
