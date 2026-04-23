'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setLoading(true)

    const result = await signIn('credentials', {
      email,
      senha,
      redirect: false,
    })

    setLoading(false)

    if (result?.error) {
      setErro('E-mail ou senha inválidos.')
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)', border: '1px solid var(--border)', width: '100%', maxWidth: '420px', padding: '40px' }}>

        <div style={{ marginBottom: '32px' }}>
          <div style={{ fontFamily: '"DM Serif Display", serif', fontSize: '26px', color: 'var(--accent)', letterSpacing: '-0.3px', marginBottom: '4px' }}>
            JurisFlow
          </div>
          <p style={{ fontSize: '14px', color: 'var(--text2)' }}>
            Acesse o sistema de gestão jurídica
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text2)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              E-mail
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: '13.5px', color: 'var(--text)', background: 'var(--surface)', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
              placeholder="seu@email.com"
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text2)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              Senha
            </label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: '13.5px', color: 'var(--text)', background: 'var(--surface)', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
              placeholder="••••••••"
              required
            />
          </div>

          {erro && (
            <div style={{ background: 'var(--red-light)', border: '1px solid #fbc9c4', color: 'var(--red)', fontSize: '13px', borderRadius: 'var(--radius)', padding: '10px 14px' }}>
              {erro}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', background: 'var(--accent2)', color: '#fff', fontWeight: 500, padding: '10px', borderRadius: 'var(--radius)', border: 'none', fontSize: '14px', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1, fontFamily: 'inherit', marginTop: '4px', transition: 'background 0.15s' }}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}