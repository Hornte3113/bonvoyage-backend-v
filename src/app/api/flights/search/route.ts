import { NextRequest, NextResponse } from "next/server";
import {
  AirscraperServiceError,
  searchFlights,
  type FlightSearchParams,
} from "@/lib/services/airscraper.service";
import {
  FlightSearchQuerySchema,
  type FlightSearchNormalizedData,
  type ProviderFlightsResponse,
} from "@/lib/schemas/flight.schema";

function normalizeFlightsResponse(payload: ProviderFlightsResponse): FlightSearchNormalizedData {
  const nestedData = payload?.data;
  const itineraries = Array.isArray(nestedData?.itineraries) ? nestedData.itineraries : [];

  const flights = itineraries.map((itinerary) => {
    const legs = Array.isArray(itinerary.legs) ? itinerary.legs : [];
    const firstLeg = legs[0];

    const normalizedLegs = legs.map((leg) => ({
      origen: leg.origin?.name ?? null,
      destino: leg.destination?.name ?? null,
      salida: leg.departure ?? null,
      llegada: leg.arrival ?? null,
      duracionMin: leg.durationInMinutes ?? null,
      escalas: leg.stopCount ?? null,
      aerolinea: leg.carriers?.marketing?.[0]?.name ?? null,
    }));

    return {
      id: itinerary.id ?? null,
      precio: itinerary.price?.raw ?? null,
      precioTexto: itinerary.price?.formatted ?? null,
      origen: firstLeg?.origin?.name ?? null,
      destino: firstLeg?.destination?.name ?? null,
      salida: firstLeg?.departure ?? null,
      llegada: firstLeg?.arrival ?? null,
      duracionMin: firstLeg?.durationInMinutes ?? null,
      escalas: firstLeg?.stopCount ?? null,
      aerolinea: firstLeg?.carriers?.marketing?.[0]?.name ?? null,
      tramos: normalizedLegs,
    };
  });

  return {
    sessionId: payload?.sessionId ?? null,
    estadoContexto: nestedData?.context?.status ?? null,
    totalResultados: nestedData?.context?.totalResults ?? flights.length,
    vuelos: flights,
  };
}

export async function GET(request: NextRequest) {
  const rawParams = Object.fromEntries(request.nextUrl.searchParams.entries());
  const parsedParams = FlightSearchQuerySchema.safeParse(rawParams);

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

  const flightParams: FlightSearchParams = parsedParams.data;

  try {
    const flights = await searchFlights(flightParams);
    const normalizedFlights = normalizeFlightsResponse(flights as ProviderFlightsResponse);

    return NextResponse.json({ success: true, data: normalizedFlights });
  } catch (error) {
    const detalle = error instanceof Error ? error.message : "Error desconocido";
    const sugerencia = detalle.includes("Something went wrong")
      ? "Verifica originSkyId, destinationSkyId, originEntityId y destinationEntityId con /api/flights/location?query=... y vuelve a intentar."
      : undefined;
    const status = error instanceof AirscraperServiceError ? error.statusCode : 500;

    return NextResponse.json(
      { error: "Error al buscar vuelos", detalle, sugerencia },
      { status }
    );
  }
}
