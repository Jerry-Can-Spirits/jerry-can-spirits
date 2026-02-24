import { NextRequest, NextResponse } from 'next/server'
import { getCartRecommendations } from '@/lib/shopify'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  const handlesParam = request.nextUrl.searchParams.get('handles')

  if (!handlesParam) {
    return NextResponse.json({ products: [] })
  }

  const handles = handlesParam.split(',').filter(Boolean)

  if (handles.length === 0) {
    return NextResponse.json({ products: [] })
  }

  try {
    const products = await getCartRecommendations(handles, 4)

    return NextResponse.json(
      { products },
      {
        headers: {
          'Cache-Control': 'public, max-age=300',
        },
      }
    )
  } catch (error) {
    console.error('Error fetching cart recommendations:', error)
    return NextResponse.json({ products: [] }, { status: 500 })
  }
}
