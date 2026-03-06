import { NextRequest, NextResponse } from "next/server";
import { searchLocation } from "@/lib/services/airscraper.service";
import { FlightLocationQuerySchema } from "@/lib/schemas/flight.schema";

export async function GET(request: NextRequest) {
  const rawParams = Object.fromEntries(request.nextUrl.searchParams.entries());
  const parsedParams = FlightLocationQuerySchema.safeParse(rawParams);

  if (!parsedParams.success) {
    return NextResponse.json(
      {
        error: "Parámetros inválidos",
        recibido: rawParams,
        detalles: parsedParams.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  try {
    const locationData = await searchLocation(parsedParams.data.query);

    return NextResponse.json({
      success: true,
      data: locationData,
    });
  } catch (error) {
    const detalle = error instanceof Error ? error.message : "Error desconocido";

    return NextResponse.json(
      { error: "Error al buscar ubicaciones", detalle },
      { status: 500 }
    );
  }
}
