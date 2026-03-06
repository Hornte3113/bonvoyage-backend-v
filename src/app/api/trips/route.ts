import { NextRequest, NextResponse } from "next/server";
import  db  from "@/lib/db";
import { auth, currentUser } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    let userQuery = await db.query(
      'SELECT user_id FROM user_identities WHERE provider_id = $1',
      [userId]
    );

    let internalUserId;

    if (userQuery.rows.length === 0) {
      const email = user.emailAddresses[0].emailAddress;
      const firstName = user.firstName || "Viajero";
      const lastName = user.lastName || "Bonvoyage";

      const newUser = await db.query(`
        INSERT INTO users (email, first_name, last_name)
        VALUES ($1, $2, $3)
        RETURNING user_id;
      `, [email, firstName, lastName]);

      internalUserId = newUser.rows[0].user_id;

      await db.query(`
        INSERT INTO user_identities (user_id, provider, provider_id)
        VALUES ($1, 'GOOGLE', $2);
      `, [internalUserId, userId]);
      
      console.log("✅ Usuario sincronizado con éxito");
    } else {
      internalUserId = userQuery.rows[0].user_id;
    }

    const body = await req.json();
    const { trip_name, destination_id, start_date, end_date, currency, total_budget } = body;

    if (!trip_name || !destination_id || !start_date || !end_date) {
      return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
    }

    const tripQuery = `
      INSERT INTO trips (user_id, destination_id, trip_name, start_date, end_date, currency, total_budget, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'DRAFT')
      RETURNING trip_id;
    `;

    const tripValues = [
      internalUserId, 
      destination_id, 
      trip_name, 
      start_date, 
      end_date, 
      currency || 'USD', 
      total_budget || 0
    ];

    const tripResult = await db.query(tripQuery, tripValues);
    const tripId = tripResult.rows[0].trip_id;

    const start = new Date(start_date);
    const end = new Date(end_date);
    
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const totalDays = Math.min(diffDays, 30);
    const createdDays = [];

    for (let i = 0; i < totalDays; i++) {
      const currentDayDate = new Date(start);
      currentDayDate.setDate(start.getDate() + i);
      
      const dayDateString = currentDayDate.toISOString().split('T')[0];

      const dayResult = await db.query(`
        INSERT INTO itinerary_days (trip_id, day_date, day_number)
        VALUES ($1, $2, $3)
        ON CONFLICT (trip_id, day_number) DO NOTHING
        RETURNING day_id;
      `, [tripId, dayDateString, i + 1]);

      createdDays.push(dayResult.rows[0]?.day_id);
    }

    return NextResponse.json({
      success: true,
      message: "Viaje e itinerario creados exitosamente",
      data: {
        tripId,
        totalDays: totalDays,
        days: createdDays
      }
    });

  } catch (error: any) {
    console.error("❌ Error en la creación del viaje:", error.message);
    return NextResponse.json(
      { error: "Error interno del servidor", details: error.message },
      { status: 500 }
    );
  }
}