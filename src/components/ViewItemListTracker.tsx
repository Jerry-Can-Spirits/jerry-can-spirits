'use client'

import { useEffect } from 'react'

export interface ViewItemListItem {
  item_id: string
  item_name: string
  index: number
  price?: number
}

interface ViewItemListTrackerProps {
  listId: string
  listName: string
  currency: string
  items: ViewItemListItem[]
}

export default function ViewItemListTracker({ listId, listName, currency, items }: ViewItemListTrackerProps) {
  useEffect(() => {
    if (typeof window.gtag !== 'function' || !window.Cookiebot?.consent?.statistics) return

    window.gtag('event', 'view_item_list', {
      item_list_id: listId,
      item_list_name: listName,
      items: items.map(item => ({
        item_id: item.item_id,
        item_name: item.item_name,
        index: item.index,
        item_list_id: listId,
        item_list_name: listName,
        ...(item.price !== undefined ? { price: item.price, currency } : {}),
      })),
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}
