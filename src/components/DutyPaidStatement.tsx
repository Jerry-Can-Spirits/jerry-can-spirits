interface DutyPaidStatementProps {
  statement: string
}

export default function DutyPaidStatement({ statement }: DutyPaidStatementProps) {
  return (
    <div className="mt-8 pt-6 border-t border-gold-500/20">
      <div className="bg-parchment-200/5 backdrop-blur-sm rounded-lg p-4 border border-gold-500/10">
        <p className="text-sm text-parchment-300 leading-relaxed">
          {statement}
        </p>
      </div>
    </div>
  )
}
