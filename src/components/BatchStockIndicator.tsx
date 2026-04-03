interface Props {
  remaining: number
  label: string
}

export default function BatchStockIndicator({ remaining, label }: Props) {
  return (
    <p className="text-sm text-parchment-400">
      {label} · {remaining} remaining
    </p>
  )
}
