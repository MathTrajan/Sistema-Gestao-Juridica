'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Cinzel, Inter } from 'next/font/google'
import {
  Mail,
  Lock,
  LogIn,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react'

const cinzel = Cinzel({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
})

const inter = Inter({
  subsets: ['latin'],
})

export default function LoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)

  const [emailFocused, setEmailFocused] = useState(false)
  const [senhaFocused, setSenhaFocused] = useState(false)

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

  const inputStyle = (focused: boolean) => ({
    width: '100%',
    padding: '13px 14px 13px 44px',
    backgroundColor: focused ? '#1A1A1A' : '#121212',
    border: `1px solid ${
      focused ? '#B8962A' : 'rgba(255,255,255,0.08)'
    }`,
    borderRadius: 12,
    outline: 'none',
    color: '#ffffff',
    fontSize: 14,
    fontFamily: 'inherit',
    transition: 'all 0.2s ease',
    boxShadow: focused
      ? '0 0 0 4px rgba(184,150,42,0.10)'
      : 'none',
    WebkitTextFillColor: '#ffffff',
  })

  return (
    <div
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-4"
      style={{
        background:
          'radial-gradient(circle at top, #1A1A1A 0%, #0D0D0D 45%)',
      }}
    >
      {/* Fundo pontilhado */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(rgba(184,150,42,0.08) 1px, transparent 1px)',
          backgroundSize: '26px 26px',
        }}
      />

      {/* Glow central */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[120px]"
        style={{
          background:
            'radial-gradient(circle, rgba(184,150,42,0.08), transparent 70%)',
        }}
      />

      {/* Card */}
      <motion.div
        className="relative z-10 w-full max-w-[430px]"
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.5,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        <div
          style={{
            background: 'rgba(20,20,20,0.92)',
            backdropFilter: 'blur(18px)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 28,
            overflow: 'hidden',
            boxShadow:
              '0 25px 80px rgba(0,0,0,0.65)',
          }}
        >
          {/* Linha dourada */}
          <div
            style={{
              height: 3,
              background:
                'linear-gradient(90deg, transparent 0%, #B8962A 30%, #E4C874 60%, transparent 100%)',
            }}
          />

          <div style={{ padding: '48px 38px 38px' }}>
            {/* Branding */}
            <motion.div
              className="mb-10 flex flex-col items-center text-center"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.12,
                duration: 0.45,
              }}
            >
              {/* Logo */}
              <div className="relative mb-6">
                <div
                  className="absolute inset-0 blur-3xl opacity-30"
                  style={{
                    background:
                      'radial-gradient(circle, rgba(184,150,42,0.45) 0%, transparent 70%)',
                  }}
                />

                <Image
                  src="/logo-norma-icon.png"
                  alt="Norma"
                  width={96}
                  height={96}
                  className="relative z-10 drop-shadow-[0_0_25px_rgba(184,150,42,0.35)]"
                />
              </div>

              {/* Nome */}
              <h1
                className={cinzel.className}
                style={{
                  fontSize: 42,
                  fontWeight: 700,
                  color: '#D4B86F',
                  letterSpacing: '10px',
                  textTransform: 'uppercase',
                  margin: 0,
                  lineHeight: 1,
                  textShadow:
                    '0 0 18px rgba(212,184,111,0.18)',
                }}
              >
                NORMA
              </h1>

              {/* Subtitulo */}
              <p
                className={inter.className}
                style={{
                  marginTop: 12,
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'rgba(212,184,111,0.78)',
                  letterSpacing: '5px',
                  textTransform: 'uppercase',
                  lineHeight: 1.4,
                }}
              >
                Sistema Jurídico
              </p>

              {/* Divider */}
              <div
                style={{
                  width: 70,
                  height: 1,
                  background:
                    'linear-gradient(90deg, transparent, rgba(212,184,111,0.6), transparent)',
                  marginTop: 24,
                }}
              />
            </motion.div>

            {/* Formulário */}
            <motion.form
              onSubmit={handleSubmit}
              className="space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{
                delay: 0.22,
                duration: 0.4,
              }}
            >
              {/* Email */}
              <div>
                <label
                  className={inter.className}
                  style={{
                    display: 'block',
                    marginBottom: 8,
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'rgba(255,255,255,0.45)',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                  }}
                >
                  E-mail
                </label>

                <div style={{ position: 'relative' }}>
                  <Mail
                    size={16}
                    style={{
                      position: 'absolute',
                      left: 15,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: emailFocused
                        ? '#B8962A'
                        : 'rgba(255,255,255,0.3)',
                      transition: '0.2s ease',
                    }}
                  />

                  <input
                    type="email"
                    value={email}
                    onChange={(e) =>
                      setEmail(e.target.value)
                    }
                    onFocus={() =>
                      setEmailFocused(true)
                    }
                    onBlur={() =>
                      setEmailFocused(false)
                    }
                    placeholder="seu@email.com"
                    required
                    style={inputStyle(emailFocused)}
                  />
                </div>
              </div>

              {/* Senha */}
              <div>
                <label
                  className={inter.className}
                  style={{
                    display: 'block',
                    marginBottom: 8,
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'rgba(255,255,255,0.45)',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                  }}
                >
                  Senha
                </label>

                <div style={{ position: 'relative' }}>
                  <Lock
                    size={16}
                    style={{
                      position: 'absolute',
                      left: 15,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: senhaFocused
                        ? '#B8962A'
                        : 'rgba(255,255,255,0.3)',
                      transition: '0.2s ease',
                    }}
                  />

                  <input
                    type={
                      mostrarSenha
                        ? 'text'
                        : 'password'
                    }
                    value={senha}
                    onChange={(e) =>
                      setSenha(e.target.value)
                    }
                    onFocus={() =>
                      setSenhaFocused(true)
                    }
                    onBlur={() =>
                      setSenhaFocused(false)
                    }
                    placeholder="••••••••"
                    required
                    style={{
                      ...inputStyle(senhaFocused),
                      paddingRight: 44,
                    }}
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setMostrarSenha((v) => !v)
                    }
                    style={{
                      position: 'absolute',
                      right: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      color:
                        'rgba(255,255,255,0.35)',
                      display: 'flex',
                      padding: 4,
                    }}
                  >
                    {mostrarSenha ? (
                      <EyeOff size={16} />
                    ) : (
                      <Eye size={16} />
                    )}
                  </button>
                </div>
              </div>

              {/* Erro */}
              <AnimatePresence>
                {erro && (
                  <motion.div
                    initial={{
                      opacity: 0,
                      height: 0,
                    }}
                    animate={{
                      opacity: 1,
                      height: 'auto',
                    }}
                    exit={{
                      opacity: 0,
                      height: 0,
                    }}
                    className="flex items-center gap-2 rounded-[12px] px-4 py-3 text-[13px]"
                    style={{
                      background:
                        'rgba(239,68,68,0.10)',
                      border:
                        '1px solid rgba(239,68,68,0.20)',
                      color: '#f87171',
                    }}
                  >
                    <AlertCircle
                      size={15}
                      style={{ flexShrink: 0 }}
                    />

                    {erro}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Botão */}
              <motion.button
                type="submit"
                disabled={loading}
                className={`${inter.className} flex w-full items-center justify-center gap-2 rounded-[12px] py-3.5 text-[14px] font-semibold`}
                style={{
                  background: loading
                    ? 'rgba(184,150,42,0.45)'
                    : 'linear-gradient(135deg, #B8962A 0%, #E4C874 100%)',
                  color: '#111111',
                  border: 'none',
                  cursor: loading
                    ? 'not-allowed'
                    : 'pointer',
                  marginTop: 8,
                  boxShadow: loading
                    ? 'none'
                    : '0 10px 30px rgba(184,150,42,0.25)',
                }}
                whileHover={
                  loading
                    ? {}
                    : {
                        scale: 1.015,
                        y: -1,
                      }
                }
                whileTap={
                  loading
                    ? {}
                    : {
                        scale: 0.985,
                      }
                }
                transition={{
                  type: 'spring',
                  stiffness: 400,
                  damping: 20,
                }}
              >
                {loading ? (
                  <motion.div
                    className="h-4 w-4 rounded-full border-2 border-black/30 border-t-black"
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                  />
                ) : (
                  <LogIn size={16} />
                )}

                {loading
                  ? 'Entrando...'
                  : 'Entrar no sistema'}
              </motion.button>
            </motion.form>

            {/* Footer */}
            <motion.p
              className={`${inter.className} mt-7 text-center text-[11px]`}
              style={{
                color: 'rgba(255,255,255,0.22)',
                letterSpacing: '0.4px',
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              Sistema Jurídico Profissional
            </motion.p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}