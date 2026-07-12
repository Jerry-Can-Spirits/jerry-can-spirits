// The trade portal masthead: JCS house branding (serif wordmark, gold
// label), replacing the Pour IQ wordmark that headed these surfaces when
// Pour IQ lived inside this repo. Pour IQ is now a linked-out service.
export function TradePortalHeader() {
  return (
    <div>
      <p className="font-serif text-2xl font-bold text-white leading-tight">Jerry Can Spirits</p>
      <p className="text-gold-400 text-xs font-semibold uppercase tracking-widest mt-1">
        Trade Portal
      </p>
    </div>
  )
}
