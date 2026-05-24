import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { generateBookingReference } from '@/lib/booking-ref';
import { getPaymentConfig } from '@/lib/settings';
import { Prisma } from '@prisma/client';

const BodySchema = z.object({
  tripId: z.string().min(1),
  seats: z.array(z.string().min(1)).min(1).max(6),
  passengerName: z.string().min(2).max(120),
  passengerPhone: z.string().min(6).max(30),
  passengerEmail: z.string().email().optional(),
  paymentMethod: z.enum(['BKASH', 'NAGAD', 'CASH_ON_BOARD'])
});

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 });
  }
  const body = parsed.data;

  const trip = await db.trip.findUnique({ where: { id: body.tripId } });
  if (!trip) return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
  if (trip.status !== 'SCHEDULED' && trip.status !== 'BOARDING') {
    return NextResponse.json({ error: 'Trip not open for booking' }, { status: 400 });
  }

  const payment = await getPaymentConfig();
  if (body.paymentMethod === 'BKASH' && !payment.bkashEnabled) {
    return NextResponse.json({ error: 'bKash is disabled' }, { status: 400 });
  }
  if (body.paymentMethod === 'NAGAD' && !payment.nagadEnabled) {
    return NextResponse.json({ error: 'Nagad is disabled' }, { status: 400 });
  }
  if (body.paymentMethod === 'CASH_ON_BOARD' && !payment.cashEnabled) {
    return NextResponse.json({ error: 'Cash on Board is disabled' }, { status: 400 });
  }

  const subtotal = body.seats.length * trip.fareBdt;
  const total = subtotal + payment.serviceFee;
  const reference = generateBookingReference();
  const holdExpiresAt =
    body.paymentMethod === 'CASH_ON_BOARD'
      ? new Date(Date.now() + payment.holdMinutes * 60_000)
      : null;
  const initialStatus =
    body.paymentMethod === 'CASH_ON_BOARD' ? 'HELD' : 'PENDING';

  try {
    const booking = await db.booking.create({
      data: {
        reference,
        tripId: trip.id,
        passengerName: body.passengerName,
        passengerPhone: body.passengerPhone,
        passengerEmail: body.passengerEmail,
        totalBdt: total,
        paymentMethod: body.paymentMethod,
        paymentStatus: initialStatus,
        holdExpiresAt,
        seats: {
          create: body.seats.map((label) => ({ seatLabel: label, tripId: trip.id }))
        }
      },
      include: { seats: true }
    });

    if (body.paymentMethod === 'CASH_ON_BOARD') {
      return NextResponse.json({ reference: booking.reference });
    }
    // For bKash/Nagad: in production this would call the gateway and return a redirect URL.
    // Until credentials are configured by the admin, we return the confirmation page directly
    // so the booking is still recorded; payment status remains PENDING.
    return NextResponse.json({
      reference: booking.reference,
      redirectUrl: `/bookings/${booking.reference}?pending=1`
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      return NextResponse.json({ error: 'One or more of those seats was just booked. Please pick different seats.' }, { status: 409 });
    }
    console.error('Booking create failed:', e);
    return NextResponse.json({ error: 'Booking failed' }, { status: 500 });
  }
}
