export default function PoliticaPrivacidade() {
  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '3rem 1.5rem', fontFamily: 'Georgia, serif', color: '#f0ede8', background: '#0a0c0f', minHeight: '100vh' }}>
      <a href="https://garfado.com.br" style={{ color: '#4ade80', fontSize: '0.875rem', textDecoration: 'none', display: 'inline-block', marginBottom: '2rem' }}>← Voltar ao Garfado</a>
      <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '2rem', fontWeight: 900, marginBottom: '0.5rem' }}>Política de Privacidade</h1>
      <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '2.5rem' }}>Última atualização: 14 de maio de 2026</p>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.75rem', color: '#4ade80' }}>1. Informações que coletamos</h2>
        <p style={{ lineHeight: 1.8, color: '#d1d5db' }}>Ao usar o Garfado, coletamos as seguintes informações: nome, endereço de e-mail e foto de perfil fornecidos pelo Google OAuth; restaurantes que você registra, avaliações e reviews que você escreve; fotos que você envia voluntariamente; e dados de uso do aplicativo.</p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.75rem', color: '#4ade80' }}>2. Como usamos suas informações</h2>
        <p style={{ lineHeight: 1.8, color: '#d1d5db' }}>Usamos suas informações para: fornecer e melhorar o serviço do Garfado; exibir seu perfil e atividades para seus amigos no app; e enviar notificações relacionadas ao uso do app. Não vendemos suas informações a terceiros.</p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.75rem', color: '#4ade80' }}>3. Armazenamento de dados</h2>
        <p style={{ lineHeight: 1.8, color: '#d1d5db' }}>Seus dados são armazenados de forma segura no Supabase, com servidores localizados no Brasil (sa-east-1). Fotos enviadas são armazenadas no Supabase Storage com acesso controlado por políticas de segurança.</p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.75rem', color: '#4ade80' }}>4. Fotos e conteúdo enviado</h2>
        <p style={{ lineHeight: 1.8, color: '#d1d5db' }}>Ao enviar uma foto no Garfado, você declara ser o autor ou ter os direitos de uso da imagem, e concede ao Garfado uma licença gratuita, irrevogável e não exclusiva para exibi-la no aplicativo. Fotos de usuários comuns são privadas e visíveis apenas para o próprio usuário.</p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.75rem', color: '#4ade80' }}>5. Serviços de terceiros</h2>
        <p style={{ lineHeight: 1.8, color: '#d1d5db' }}>O Garfado utiliza os seguintes serviços de terceiros: Google OAuth para autenticação; Google Places API para busca de restaurantes; Supabase para banco de dados e armazenamento; e Resend para envio de e-mails transacionais. Cada serviço possui sua própria política de privacidade.</p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.75rem', color: '#4ade80' }}>6. Seus direitos (LGPD)</h2>
        <p style={{ lineHeight: 1.8, color: '#d1d5db' }}>Em conformidade com a Lei Geral de Proteção de Dados (LGPD), você tem direito a: acessar seus dados pessoais; corrigir dados incompletos ou desatualizados; solicitar a exclusão dos seus dados; e revogar o consentimento a qualquer momento. Para exercer esses direitos, entre em contato pelo e-mail abaixo.</p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.75rem', color: '#4ade80' }}>7. Exclusão de conta</h2>
        <p style={{ lineHeight: 1.8, color: '#d1d5db' }}>Você pode solicitar a exclusão completa da sua conta e de todos os seus dados a qualquer momento entrando em contato com nossa equipe. A exclusão é processada em até 30 dias.</p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.75rem', color: '#4ade80' }}>8. Contato</h2>
        <p style={{ lineHeight: 1.8, color: '#d1d5db' }}>Para dúvidas sobre esta política ou sobre seus dados pessoais, entre em contato:</p>
        <p style={{ marginTop: '0.5rem' }}><a href="mailto:contato@garfado.com.br" style={{ color: '#4ade80' }}>contato@garfado.com.br</a></p>
      </section>

      <p style={{ color: '#6b7280', fontSize: '0.8rem', borderTop: '1px solid #1f2937', paddingTop: '1.5rem', marginTop: '2rem' }}>© 2026 Garfado. Todos os direitos reservados.</p>
    </main>
  )
}
