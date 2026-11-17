# UniSync 1.4 · Notas técnicas e funcionalidades

**Lançamento:** novembro de 2026. **Principal:** /social-v12/. **Empresas beta:** /empresas/.

## Comunidade universitária
- **Publicações:** imediatas, com bloqueio básico de duplicidade e intervalo mínimo de 20 segundos no próprio navegador. Denúncias aparecem em painel exclusivo para moderadores, que podem ocultar publicações inadequadas.
- **Festas:** criação aberta, confirmação de presença ("Vou participar" ou "Talvez"), cancelamento e escolha de exibir o nome. O Firebase permite consultar confirmações privadas apenas pelo próprio autor; a listagem pública inclui as pessoas que aceitaram compartilhar a presença.
- **Vagas:** categoria ampla e aberta, sem filtros obrigatórios por curso, bolsa ou modalidade.
- **Academias de Santo André:** catálogo de seis unidades, nota de 1 a 5 e comentários públicos sincronizados entre membros autenticados. Um perfil só pode ter uma avaliação por academia, editável ou removível. A marcação "Eu treino aqui" permanece local ao navegador.
- **Modo Foco:** foco/descanso/ciclos configuráveis, modo automático opcional, continuidade manual, histórico e meta diária guardados neste navegador; bloqueio visual com possibilidade de encerrar a qualquer momento. Notificações dependem da permissão do navegador. Não bloqueia outras abas, dispositivos ou programas.
- **Saúde feminina:** preferência de gênero alterável no perfil, conteúdos informativos e diário opcional de ciclo protegido localmente com criptografia AES-GCM, senha derivada via PBKDF2, sem envio de registros médicos ao Firebase. Senhas não são recuperáveis. O controle por gênero é apenas de interface, não prova de identidade.
- **Segurança:** o modelo de denúncias permite revisão posterior, não análise antecipada. O intervalo entre posts é uma proteção básica no cliente, não um antispam completo de servidor. A moderação depende do perfil moderador existente.

## Modo Empresas (beta)
**BASF e Scania:** duas experiências independentes em /empresas/?empresa=basf e /empresas/?empresa=scania. A tela inicial permite escolher uma das empresas sem login. Existem painéis ilustrativos, sprints com Kanban editável, tarefas com prazo e prioridade, cronograma, mural, comentários, chats em grupo e perfis profissionais personalizáveis.
- Dados inteiramente fictícios e independentes entre empresas, persistidos somente no navegador.
- As interfaces são protótipos não oficiais, sem afiliação, patrocínio ou integração com sistemas internos de BASF ou Scania.
- Cores, tipografia e logotipos de referência são usados exclusivamente para demonstrar como seria uma experiência corporativa adaptada.

## Estrutura de arquivos
- /index.html — redireciona para a comunidade.
- /social-v12/app.js — navegação, feed, perfis, moderação.
- /social-v12/data.js — Firebase e adaptador demo.
- /social-v12/features14.js e features14.css — recursos da comunidade atualizados.
- /social-v12/features.js — módulo anterior mantido como backup técnico.
- /empresas/index.html, app.js, styles.css, assets/*.svg — interface empresarial beta.
- /versao-antiga/index.html — versão original preservada.
- Tag GitHub v1.3.0 mantém o código completo da versão anterior.

## Migração e privacidade
Coleções criadas no Firestore: v14_gym_reviews, v14_event_rsvps, v14_reports. Antes da publicação, é necessário instalar as regras Firestore correspondentes; caso contrário, leituras e escritas das novas coleções falharão. Não apagar coleções v12 nem conteúdos existentes. Preferências e registros do diário, perfis corporativos, histórico do foco e academia usada não são sincronizados entre dispositivos.

## Testes
- Suite local test-company14.js: seleção, navegação, sprints, Kanban, cronograma, mural, chat, equipes, perfil, isolamento BASF/Scania e responsividade.
- Suite local test-social14.js: academias entre perfis, festas, presença, saúde feminina, criptografia, foco, pausa, denúncias, ocultação e navegação móvel.
- Testes locais sem gravação no Firebase real. Executar teste de produção autenticado após aplicar as novas regras.
