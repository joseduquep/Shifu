"use client"

import { createBrowserClient } from "@supabase/ssr"
import {
  type SupabaseClient,
  type GenericSchema,
  type GenericTable,
} from "@supabase/supabase-js"

type Db = GenericSchema
let supabaseClient: SupabaseClient<
  Db,
  GenericSchema["public"],
  GenericTable
> | null = null

export function createClient() {
  // Devuelve la instancia existente si ya existe
  if (supabaseClient) return supabaseClient

  // Crea una nueva instancia si no existe
  supabaseClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    }
  )

  return supabaseClient
}
