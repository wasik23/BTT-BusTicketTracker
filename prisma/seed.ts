import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const db = new PrismaClient();

function generate2Plus2(rows: number) {
  const grid: (string | null)[][] = [];
  for (let r = 1; r <= rows; r++) grid.push([`${r}A`, `${r}B`, null, `${r}C`, `${r}D`]);
  return grid;
}

async function main() {
  const username = process.env.SEED_ADMIN_USERNAME ?? 'admin';
  const password = process.env.SEED_ADMIN_PASSWORD ?? 'admin123';

  const existing = await db.adminUser.findUnique({ where: { username } });
  if (!existing) {
    await db.adminUser.create({
      data: {
        username,
        passwordHash: await bcrypt.hash(password, 10),
        fullName: 'Owner',
        role: 'SUPER_ADMIN'
      }
    });
    console.log(`Created super admin: ${username} / ${password}`);
  } else {
    await db.adminUser.update({
      where: { username },
      data: {
        passwordHash: await bcrypt.hash(password, 10),
        role: 'SUPER_ADMIN',
        isActive: true
      }
    });
    console.log(`Updated super admin password: ${username} / ${password}`);
  }

  const defaults: Array<[string, string, boolean]> = [
    ['company.name', JSON.stringify('BTT - Bus Ticket Tracker'), false],
    ['company.address', JSON.stringify('Dhaka, Bangladesh'), false],
    ['company.ownerName', JSON.stringify('Wasik'), false],
    ['company.ownerPhone', JSON.stringify('+8801700000001'), false],
    ['company.supportPhone', JSON.stringify('+8801700000002'), false],
    ['company.complaintPhone', JSON.stringify('+8801700000003'), false],
    ['company.email', JSON.stringify('support@btt.example'), false],
    ['company.aboutText', JSON.stringify('BTT — book your bus tickets online and track your bus live across Bangladesh.'), false],
    ['company.termsText', JSON.stringify(''), false],
    ['payment.bkash.enabled', JSON.stringify(false), false],
    ['payment.bkash.sandbox', JSON.stringify(true), false],
    ['payment.nagad.enabled', JSON.stringify(false), false],
    ['payment.nagad.sandbox', JSON.stringify(true), false],
    ['payment.cashOnBoard.enabled', JSON.stringify(true), false],
    ['payment.cashOnBoard.holdMinutes', JSON.stringify(120), false],
    ['payment.serviceFeeBdt', JSON.stringify(0), false]
  ];
  for (const [key, value, isSecret] of defaults) {
    await db.setting.upsert({ where: { key }, update: {}, create: { key, value, isSecret } });
  }
  console.log(`Seeded ${defaults.length} settings.`);

  // ----- Mock buses -----
  const layout36 = generate2Plus2(9);
  const bus1 = await db.bus.upsert({
    where: { numberPlate: 'Dhaka Metro Ba 11-2345' },
    update: { name: 'সরকার এন্টারপ্রাইজ' },
    create: {
      name: 'সরকার এন্টারপ্রাইজ',
      numberPlate: 'Dhaka Metro Ba 11-2345',
      busType: 'AC',
      totalSeats: 36,
      layoutJson: JSON.stringify(layout36),
      driverName: 'Mr. Rahim',
      driverPhone: '+8801711111111',
      supervisorName: 'Mr. Karim',
      supervisorPhone: '+8801722222222',
      notes: 'Free WiFi onboard. Reclining seats. Bottled water provided.',
      photos: {
        create: [
          { url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800', order: 0 },
          { url: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=800', order: 1 }
        ]
      }
    }
  });
  const bus2 = await db.bus.upsert({
    where: { numberPlate: 'Dhaka Metro Ba 12-6789' },
    update: { name: 'পাঠান এক্সপ্রেস' },
    create: {
      name: 'পাঠান এক্সপ্রেস',
      numberPlate: 'Dhaka Metro Ba 12-6789',
      busType: 'Non-AC',
      totalSeats: 36,
      layoutJson: JSON.stringify(layout36),
      driverName: 'Mr. Hasan',
      driverPhone: '+8801733333333',
      supervisorName: 'Mr. Salam',
      supervisorPhone: '+8801744444444',
      notes: 'Comfortable seating. Refreshments available.',
      photos: {
        create: [
          { url: 'https://images.unsplash.com/photo-1597464041434-d0b3a7b8ef0d?w=800', order: 0 }
        ]
      }
    }
  });
  console.log(`Buses: ${bus1.name}, ${bus2.name}`);

  // ----- Routes -----
  const route1 = await db.route.upsert({
    where: { id: 'route-dhk-ctg' },
    update: {},
    create: { id: 'route-dhk-ctg', origin: 'Dhaka', destination: 'Chittagong', baseFareBdt: 800, distanceKm: 250 }
  });
  const route2 = await db.route.upsert({
    where: { id: 'route-dhk-cox' },
    update: {},
    create: { id: 'route-dhk-cox', origin: 'Dhaka', destination: "Cox's Bazar", baseFareBdt: 1500, distanceKm: 400 }
  });

  // ----- Trips: one tomorrow morning, one tomorrow night, one day-after -----
  const now = new Date();
  const tomorrow8am = new Date(now); tomorrow8am.setDate(now.getDate() + 1); tomorrow8am.setHours(8, 0, 0, 0);
  const tomorrow10pm = new Date(now); tomorrow10pm.setDate(now.getDate() + 1); tomorrow10pm.setHours(22, 0, 0, 0);
  const dayAfter9am = new Date(now); dayAfter9am.setDate(now.getDate() + 2); dayAfter9am.setHours(9, 0, 0, 0);

  const trips = await Promise.all([
    db.trip.upsert({ where: { id: 'trip-1' }, update: {}, create: { id: 'trip-1', busId: bus1.id, routeId: route1.id, departureAt: tomorrow8am, fareBdt: 800 } }),
    db.trip.upsert({ where: { id: 'trip-2' }, update: {}, create: { id: 'trip-2', busId: bus2.id, routeId: route2.id, departureAt: tomorrow10pm, fareBdt: 1500 } }),
    db.trip.upsert({ where: { id: 'trip-3' }, update: {}, create: { id: 'trip-3', busId: bus1.id, routeId: route2.id, departureAt: dayAfter9am, fareBdt: 1400 } })
  ]);
  console.log(`Trips: ${trips.length}`);

  // ----- Sample bookings on trip-1 (mark seats 1A, 1B as taken) -----
  await db.booking.upsert({
    where: { reference: 'BTT-DEMO1' },
    update: {},
    create: {
      reference: 'BTT-DEMO1',
      tripId: 'trip-1',
      passengerName: 'Sample Passenger',
      passengerPhone: '+8801799999999',
      totalBdt: 1600,
      paymentMethod: 'CASH_ON_BOARD',
      paymentStatus: 'PAID',
      seats: { create: [{ seatLabel: '1A', tripId: 'trip-1' }, { seatLabel: '1B', tripId: 'trip-1' }] }
    }
  });
  await db.booking.upsert({
    where: { reference: 'BTT-DEMO2' },
    update: {},
    create: {
      reference: 'BTT-DEMO2',
      tripId: 'trip-1',
      passengerName: 'Held Reservation',
      passengerPhone: '+8801788888888',
      totalBdt: 800,
      paymentMethod: 'CASH_ON_BOARD',
      paymentStatus: 'HELD',
      holdExpiresAt: new Date(Date.now() + 90 * 60_000),
      seats: { create: [{ seatLabel: '2C', tripId: 'trip-1' }] }
    }
  });
  console.log('Sample bookings created (refs: BTT-DEMO1, BTT-DEMO2).');

  // ----- Mock GPS pings — bus1 near Dhaka, bus2 mid-route to Cox's Bazar -----
  await db.gpsPing.create({
    data: { busId: bus1.id, lat: 23.8103, lng: 90.4125, speedKmh: 0, heading: 90, recordedAt: new Date() }
  });
  await db.gpsPing.create({
    data: { busId: bus2.id, lat: 22.3569, lng: 91.7832, speedKmh: 60, heading: 135, recordedAt: new Date() }
  });
  console.log('Mock GPS pings created.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await db.$disconnect(); });
