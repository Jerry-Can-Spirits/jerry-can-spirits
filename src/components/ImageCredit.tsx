export default function ImageCredit({ credit }: { credit?: string | null }) {
  const text = credit?.trim()
  if (!text) return null
  return <figcaption className="mt-2 text-xs text-parchment-400">{text}</figcaption>
}
