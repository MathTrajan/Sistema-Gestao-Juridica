'use client'

import Script from 'next/script'

interface VibeChatWidgetProps {
  nome: string
  email: string
  empresa: string
}

// Widget "Falar com o suporte" (VibeChat — produto interno, app projetochat no
// Fly.io). Roda em Shadow DOM: o CSS do Norma não vaza para dentro nem o
// contrário. A apiKey de widget não é segredo: fica exposta no HTML de
// qualquer visitante por design.
//
// A ordem importa: window.VibeChatConfig precisa existir ANTES do widget.js
// executar. Os dois Scripts usam afterInteractive e o Next preserva a ordem
// de inserção — o inline roda na hora, o externo (async) depois.
export function VibeChatWidget({ nome, email, empresa }: VibeChatWidgetProps) {
  // JSON.stringify + escape de "<" evita quebra/injeção no script inline
  // caso nome ou empresa contenham HTML.
  const config = JSON.stringify({
    apiKey: 'norma-b775f8',
    usuario: { nome, email, empresa },
  }).replace(/</g, '\\u003c')

  return (
    <>
      <Script id="vibechat-config" strategy="afterInteractive">
        {`window.VibeChatConfig = ${config};`}
      </Script>
      <Script src="https://projetochat.fly.dev/widget.js" strategy="afterInteractive" />
    </>
  )
}
