import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { AdminBookingsPage } from '../src/pages/admin/AdminBookingsPage';

const actionMutate = vi.fn();
const mockBookingsQuery = vi.fn();

vi.mock('../src/hooks/queries/useBookingQueries', () => ({
  useBookingsQuery: () => mockBookingsQuery()
}));

vi.mock('../src/hooks/mutations/useBookingMutations', () => ({
  useBookingActionMutation: () => ({
    mutate: actionMutate,
    isPending: false,
    isError: false
  })
}));

describe('AdminBookingsPage', () => {
  beforeEach(() => {
    actionMutate.mockClear();
    mockBookingsQuery.mockReturnValue({
      data: {
        bookings: [
          {
            _id: 'booking-1',
            pickupAddress: '5 Lantern Lane',
            dropoffAddress: '20 Foundry Way',
            source: 'CLIENT_APP',
            status: 'DRIVER_ASSIGNED',
            assignedDriver: { user: { name: 'Leona Vale' } },
            fare: { total: 0 }
          },
          {
            _id: 'booking-2',
            pickupAddress: '9 Elm Yard',
            dropoffAddress: '44 Archive Road',
            source: 'AGENT',
            status: 'AWAITING_PAYMENT',
            assignedDriver: { user: { name: 'Mateo Rivas' } },
            fare: { total: 36.5 }
          }
        ]
      },
      isLoading: false,
      isError: false
    });
  });

  test('renders admin booking controls for pre-trip and completion states', async () => {
    const user = userEvent.setup();
    render(<AdminBookingsPage />);

    expect(screen.getByText(/5 Lantern Lane to 20 Foundry Way/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reassign/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /complete/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /complete/i }));
    expect(actionMutate).toHaveBeenCalledWith('booking-2');
  });

  test('renders an empty state when there are no bookings', () => {
    mockBookingsQuery.mockReturnValue({ data: { bookings: [] }, isLoading: false, isError: false });
    render(<AdminBookingsPage />);

    expect(screen.getByText(/No bookings/i)).toBeInTheDocument();
  });
});
