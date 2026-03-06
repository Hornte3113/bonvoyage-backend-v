import { z } from 'zod'

const DateFormatRegex = /^\d{4}-\d{2}-\d{2}$/

export const CabinClassSchema = z.enum([
  'economy',
  'premium_economy',
  'business',
  'first',
])

export const FlightSortBySchema = z.enum([
  'best',
  'price_low',
  'price_high',
  'fastest',
  'outbound_take_off_time',
  'outbound_landing_time',
  'return_take_off_time',
  'return_landing_time',
])

export const FlightSearchQuerySchema = z.object({
  originSkyId: z.string().min(1, 'originSkyId es obligatorio'),
  destinationSkyId: z.string().min(1, 'destinationSkyId es obligatorio'),
  originEntityId: z.string().min(1, 'originEntityId es obligatorio'),
  destinationEntityId: z.string().min(1, 'destinationEntityId es obligatorio'),
  date: z.string().regex(DateFormatRegex, 'Formato de date inválido. Usa YYYY-MM-DD'),
  returnDate: z.string().regex(DateFormatRegex, 'Formato de returnDate inválido. Usa YYYY-MM-DD').optional(),
  cabinClass: CabinClassSchema.optional(),
  adults: z.coerce.number().int().positive().optional(),
  childrens: z.coerce.number().int().nonnegative().optional(),
  infants: z.coerce.number().int().nonnegative().optional(),
  sortBy: FlightSortBySchema.optional(),
  limit: z.coerce.number().int().positive().optional(),
  carriersIds: z.string().optional(),
  currency: z.string().length(3).optional(),
  market: z.string().min(2).optional(),
  countryCode: z.string().length(2).optional(),
})

export const FlightLocationQuerySchema = z.object({
  query: z.string().min(1, 'query es obligatorio'),
})

export const NormalizedFlightLegSchema = z.object({
  origen: z.string().nullable(),
  destino: z.string().nullable(),
  salida: z.string().nullable(),
  llegada: z.string().nullable(),
  duracionMin: z.number().nullable(),
  escalas: z.number().nullable(),
  aerolinea: z.string().nullable(),
})

export const NormalizedFlightSchema = z.object({
  id: z.string().nullable(),
  precio: z.number().nullable(),
  precioTexto: z.string().nullable(),
  origen: z.string().nullable(),
  destino: z.string().nullable(),
  salida: z.string().nullable(),
  llegada: z.string().nullable(),
  duracionMin: z.number().nullable(),
  escalas: z.number().nullable(),
  aerolinea: z.string().nullable(),
  tramos: z.array(NormalizedFlightLegSchema),
})

export const FlightSearchNormalizedDataSchema = z.object({
  sessionId: z.string().nullable(),
  estadoContexto: z.string().nullable(),
  totalResultados: z.number(),
  vuelos: z.array(NormalizedFlightSchema),
})

export type ProviderCarrier = {
  name?: string
}

export type ProviderLeg = {
  origin?: { name?: string }
  destination?: { name?: string }
  departure?: string
  arrival?: string
  durationInMinutes?: number
  stopCount?: number
  carriers?: {
    marketing?: ProviderCarrier[]
  }
}

export type ProviderItinerary = {
  id?: string
  price?: {
    raw?: number
    formatted?: string
  }
  legs?: ProviderLeg[]
}

export type ProviderFlightsResponse = {
  sessionId?: string
  data?: {
    context?: {
      status?: string
      totalResults?: number
    }
    itineraries?: ProviderItinerary[]
  }
}

export type FlightSearchQueryInput = z.infer<typeof FlightSearchQuerySchema>
export type FlightLocationQueryInput = z.infer<typeof FlightLocationQuerySchema>
export type NormalizedFlight = z.infer<typeof NormalizedFlightSchema>
export type FlightSearchNormalizedData = z.infer<typeof FlightSearchNormalizedDataSchema>
