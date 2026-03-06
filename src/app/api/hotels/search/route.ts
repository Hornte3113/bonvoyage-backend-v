import { NextRequest, NextResponse } from "next/server";
import { searchHotels } from "@/lib/services/airscraper.service"; 

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  const destination = searchParams.get("destination");
  const checkIn = searchParams.get("checkin") || searchParams.get("checkIn"); 
  const checkOut = searchParams.get("checkout") || searchParams.get("checkOut");
  const adults = searchParams.get("adults") || "1";
  const rooms = searchParams.get("rooms") || "1";
  const currency = searchParams.get("currency") || "USD";

  if (!destination || !checkIn || !checkOut) {
    return NextResponse.json(
      { error: "Faltan parámetros obligatorios" },
      { status: 400 }
    );
  }

  try {
const rawHotelData: any = await searchHotels({      destination,
      checkIn,
      checkOut,
      adults,
      rooms,
      currency
    });
    const hotelList = rawHotelData?.data?.hotels || [];

    if (!Array.isArray(hotelList)) {
      return NextResponse.json({ 
        success: true, 
        count: 0, 
        data: [],
        debug: "No se encontró un arreglo de hoteles en la respuesta" 
      });
    }
const cleanHotels = hotelList.map((hotel: Record<string, any>) => {
      const lng = hotel?.coordinates?.[0] || null;
      const lat = hotel?.coordinates?.[1] || null;

      return {
        id: hotel?.hotelId || null, 
        name: hotel?.name || "Hotel sin nombre",
        price: hotel?.price || "Precio no disponible",
        rating: hotel?.rating?.value || hotel?.stars || "N/A",
        imageUrl: hotel?.heroImage || null,
        latitude: lat,
        longitude: lng,
      };
    });

    return NextResponse.json({
      success: true,
      count: cleanHotels.length,
      data: cleanHotels
    });

  } catch (error) {
    console.error("Error procesando hoteles:", error);
    return NextResponse.json(
      { error: "Error al buscar hoteles" },
      { status: 500 }
    );
  }

}