import { NextRequest, NextResponse } from "next/server";
import  db  from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { 
      id, 
      name, 
      latitude, 
      longitude, 
      rating, 
      imageUrl, 
      price, 
      destination 
    } = body;

    if (!id || !name) {
      return NextResponse.json({ error: "Faltan datos obligatorios (id o name)" }, { status: 400 });
    }

    const extendedData = {
      imageUrl: imageUrl || null,
      currentPrice: price || "N/A",
      destinationName: destination || "Unknown",
      lastUpdated: new Date().toISOString()
    };


    const query = `
      INSERT INTO place_references (
        external_id, 
        category, 
        name, 
        latitude, 
        longitude, 
        rating, 
        api_source, 
        extended_data,
        cached_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      ON CONFLICT (external_id, category) 
      DO UPDATE SET 
        name = EXCLUDED.name,
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        rating = EXCLUDED.rating,
        extended_data = EXCLUDED.extended_data,
        cached_at = NOW()
      RETURNING *;
    `;

    const values = [
      id,                       
      'HOTEL',                 
      name,                     
      latitude || null,         
      longitude || null,        
      parseFloat(rating) || 0, 
      'sky-scrapper',           
      JSON.stringify(extendedData) 
    ];

    const result = await db.query(query, values);

    return NextResponse.json({
      success: true,
      message: "Hotel procesado exitosamente en base de datos",
      data: result.rows[0]
    });

  } catch (error: any) {
    console.error(" Error de SQL en Supabase:", error.message);
    
    return NextResponse.json(
      { 
        error: "Error interno al guardar el hotel", 
        details: error.message 
      }, 
      { status: 500 }
    );
  }
}