import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    // Obtener datos del profesor
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const response = await fetch(`${baseUrl}/api/profesores/${id}`, {
      cache: 'no-store',
    })

    if (!response.ok) {
      return new Response('Profesor no encontrado', { status: 404 })
    }

    const profesor = await response.json()

    // Generar imagen Open Graph
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0b0d12',
            backgroundImage: 'linear-gradient(45deg, #0b0d12 0%, #121621 100%)',
            color: '#ffffff',
            padding: '40px',
          }}
        >
          {/* Logo/Header */}
          <div
            style={{
              position: 'absolute',
              top: '40px',
              left: '40px',
              fontSize: '32px',
              fontWeight: 'bold',
              color: '#00d4aa',
            }}
          >
            Shifu
          </div>

          {/* Contenido principal */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              maxWidth: '800px',
            }}
          >
            {/* Avatar */}
            <div
              style={{
                width: '120px',
                height: '120px',
                borderRadius: '24px',
                backgroundColor: '#121621',
                border: '3px solid #00d4aa',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '48px',
                fontWeight: 'bold',
                color: '#ffffff',
                marginBottom: '32px',
              }}
            >
              {profesor.nombreCompleto
                .split(' ')
                .filter(Boolean)
                .slice(0, 2)
                .map((p: string) => p[0]?.toUpperCase())
                .join('')}
            </div>

            {/* Nombre del profesor */}
            <h1
              style={{
                fontSize: '48px',
                fontWeight: 'bold',
                color: '#ffffff',
                margin: '0 0 16px 0',
                lineHeight: 1.2,
              }}
            >
              {profesor.nombreCompleto}
            </h1>

            {/* Departamento y universidad */}
            <p
              style={{
                fontSize: '24px',
                color: '#a0a0a0',
                margin: '0 0 32px 0',
                lineHeight: 1.4,
              }}
            >
              {profesor.departamento} · {profesor.universidad}
            </p>

            {/* Calificación */}
            {profesor.calificacionPromedio && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  backgroundColor: '#00d4aa20',
                  padding: '16px 24px',
                  borderRadius: '16px',
                  border: '2px solid #00d4aa',
                }}
              >
                <span
                  style={{
                    fontSize: '28px',
                    fontWeight: 'bold',
                    color: '#00d4aa',
                  }}
                >
                  {profesor.calificacionPromedio.toFixed(1)}
                </span>
                <span
                  style={{
                    fontSize: '20px',
                    color: '#a0a0a0',
                  }}
                >
                  ({profesor.cantidadResenas} reseñas)
                </span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              position: 'absolute',
              bottom: '40px',
              right: '40px',
              fontSize: '20px',
              color: '#a0a0a0',
            }}
          >
            Conoce más profesores en Shifu
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    )
  } catch (error) {
    console.error('Error generating OG image:', error)
    
    // Fallback image
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0b0d12',
            color: '#ffffff',
          }}
        >
          <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#00d4aa', marginBottom: '16px' }}>
            Shifu
          </div>
          <div style={{ fontSize: '24px', color: '#a0a0a0' }}>
            Perfil de profesor
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    )
  }
}
