# UniSync · versão 1.3 (novembro de 2026)

## Estrutura
- A URL principal abre automaticamente /social-v12/.
- /versao-antiga/index.html conserva integralmente a antiga interface HTML (backup).
- /social-v12/app.js concentra feed, perfis, chat, autenticação e integração com dados.
- /social-v12/data.js controla modo demo e Firebase.
- /social-v12/features.js concentra Eventos, Estágios, Modo Foco, Academias e Saúde Feminina.
- /social-v12/styles.css inclui o visual responsivo.
- A publicação de novos posts tem status "aprovado" imediatamente. Os posts antigos não foram excluídos nem migrados.

## Funcionalidades
1. **Eventos e vagas**: anúncios publicados no Feed com tags de categoria; o exemplo principal de cada categoria é fictício e não constitui oferta real.
2. **Modo Foco**: 25/5 min inicialmente, personalização de 1–180 min de foco e 0–60 min de pausa, ciclos, bloqueio visual local, contagem e liberação automática ou manual. Não controla outras abas, sistema ou notificações do aparelho.
3. **Academias**: seis locais reais de Santo André, com endereço e link de mapa. "Eu treino aqui", nota e comentário são armazenados por perfil e navegador via localStorage, **ainda não compartilhados entre usuários**.
4. **Saúde Feminina**: seção informativa inicial visível somente quando a preferência local de gênero está em "Feminino". Não coleta dados médicos ou do ciclo. A seleção é editável no perfil e armazenada localmente para não expor informações adicionais no perfil público. **Não constitui controle de autorização de dados sensíveis.**

## Atenção ao ambiente Firebase
- A interface de demonstração foi testada em servidor local com Firebase desabilitado para impedir publicações reais de teste.
- Testar operações de publicação **com duas contas institucionais reais**, verificando se as regras efetivamente publicadas permitem criar posts com status "aprovado". As regras históricas documentadas em pacotes locais não são necessariamente iguais às de produção.
- Se regras reais obrigarem status "pendente", será preciso ajustar as regras e realizar testes de segurança no Firebase antes de considerar a publicação sem moderação totalmente operacional.
- Para anunciar vagas/eventos, são usados os mesmos posts já existentes; não é necessário criar novas coleções.
- Antes de adicionar sincronização de reviews de academias ou armazenamento de dados de saúde, criar regras específicas de propriedade, consentimento e privacidade.
- A exclusão de conta e dados v12 precisa de validação adicional antes do lançamento amplo.

## Fonte dos endereços do catálogo inicial
- https://www.smartfit.com.br/academias/sp/santo-andre/
- https://gym3.app/pt/academias/santo-andre-br
- Catálogo local verificado em 17/11/2026; endereços e horários podem mudar.

## Testes
A suíte local test-features.js (fora do repositório público) verificou redirecionamento, backup, anúncios, academias, foco, pausa, encerramento, perfil feminino/masculino, menu responsivo e erros JS. A suíte roda em modo demo, sem gravar no Firebase real.
