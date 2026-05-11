# Decision: REST-first Taxify platform with lifecycle services

## Date

2026-05-13

## Decision

Implement Taxify's first full MERN scaffold as a REST-only platform with JWT role protection and backend lifecycle services for assignment, fare calculation, commission creation, and review aggregate updates.

## Context

The updated project brief calls for real-time booking visibility, but the user explicitly requested REST endpoints for this phase and no Socket.IO. The implementation still needs clean boundaries so push updates can be added later without rewriting booking and trip logic.

## Options Considered

1. Add Socket.IO immediately.
   - Pros: closer to the eventual real-time product.
   - Cons: conflicts with the requested phase and increases setup surface.

2. Implement REST controllers with domain services.
   - Pros: matches current request, keeps tests straightforward, and lets future real-time events be emitted from service/controller transition points.
   - Cons: users must refresh or use query refetching until push updates are added.

## Selected Option

Option 2: REST controllers with concentrated lifecycle services.

## Consequences

- Frontend uses TanStack Query against REST services.
- Backend trip and assignment transitions are centralized enough to add later event emission.
- No Socket.IO packages or runtime files are included in this phase.

## Affected Files

- `server/controllers/*`
- `server/services/assignmentService.js`
- `server/services/fareService.js`
- `server/services/commissionService.js`
- `server/services/driverReviewService.js`
- `client/src/services/*`
- `client/src/hooks/queries/*`
- `client/src/hooks/mutations/*`

## Follow-up Tasks

- Add real-time event publishing from booking/trip transition points when Socket.IO or another push transport is approved.
