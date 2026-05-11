import { redirect } from 'next/navigation'
import { checkPourIqAccess } from '@/lib/pouriq/access'
import { LicenceGate } from '@/components/pouriq/LicenceGate'
import { CreateMenuForm } from '@/components/pouriq/CreateMenuForm'

export const dynamic = 'force-dynamic'

export default async function NewMenuPage() {
  const access = await checkPourIqAccess()
  if (access.kind === 'no-session') redirect('/trade/pouriq/login')
  if (access.kind === 'no-licence') return <LicenceGate />

  return (
    <main className="min-h-screen">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24">
        <div className="inline-block px-4 py-2 bg-jerry-green-800/60 backdrop-blur-sm rounded-full border border-gold-500/30 mb-6">
          <span className="text-gold-300 text-sm font-semibold uppercase tracking-widest">Pour IQ</span>
        </div>
        <h1 className="text-3xl font-serif font-bold text-white mb-3">Create a new menu</h1>
        <p className="text-parchment-400 text-sm mb-10">Start with the basics. You can add cocktails on the next screen.</p>
        <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
          <CreateMenuForm />
        </div>
      </div>
    </main>
  )
}
