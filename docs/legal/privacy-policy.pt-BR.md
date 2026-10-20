# Política de Privacidade — Orbii

**Status:** Rascunho para revisão de produto. **Não constitui aconselhamento jurídico.** Trechos marcados **[ADVOGADO]** precisam de revisão jurídica antes de publicar como política oficial ou colar o link no App Store Connect.

**Data de vigência (rascunho):** 19 de outubro de 2026  
**Última atualização (rascunho):** 19 de outubro de 2026  
**App:** Orbii (`app.orbii.mobile`)  
**Operador (rascunho):** Pedro Ramos / Orbii — **[ADVOGADO: confirmar nome legal, tipo de entidade e jurisdição]**  
**Contato (rascunho):** **[ADVOGADO: confirmar e-mail monitorado de privacidade antes de publicar.]** Até lá, pedidos de privacidade e exclusão usam o e-mail público listado no perfil GitHub de [`pedrotmr`](https://github.com/pedrotmr).

Este rascunho descreve o tratamento de informações do Orbii com base na especificação V2 ([Spec V2](https://github.com/pedrotmr/orbii/issues/50)), no schema Convex e no acesso remoto MCP (PR #108). Serve de base para a Guideline **5.1.1(i)** da App Store (link da política no metadata do App Store Connect **e** de forma facilmente acessível no app) e para expectativas relacionadas em **5.1.1** / **5.1.2**. Publicar a URL e ligar o link no app são passos separados; veja [hosting.md](./hosting.md).

---

## 1. Quem somos

O Orbii é um app pessoal de hábitos. Você mantém muitos hábitos em uma **Órbita (Orbit)** e escolhe um conjunto pequeno de foco diário. O sucesso é completar a **Órbita de Hoje**, não cobrir todos os hábitos da Órbita.

O Orbii destina-se, neste momento, ao criador e a um conjunto pequeno de usuários de confiança (por exemplo via TestFlight ou build de desenvolvimento). O lançamento público na App Store permanece fora do escopo de produto da V2, mas os requisitos de privacidade da App Store aplicam-se sempre que houver distribuição pelo App Store Connect.

**[ADVOGADO]** Confirmar o controlador / identidade do negócio (pessoa física vs. empresa), endereço se exigido, e quais leis serão invocadas (LGPD no Brasil; GDPR se houver usuários no EEE; CCPA se houver residentes da Califórnia).

---

## 2. Resumo

| Tema                 | Prática atual (conforme implementado)                                                                           |
| -------------------- | --------------------------------------------------------------------------------------------------------------- |
| Conta                | Obrigatória. Entrada com **Google** ou **Apple** via **Clerk**.                                                 |
| Dados do app         | Armazenados no **Convex** (hábitos, sessões diárias, pontos, recompensas, conexões de agentes).                 |
| Analytics / anúncios | O Orbii **não** inclui SDK de analytics ou publicidade de terceiros no app móvel neste rascunho.                |
| Notificações         | Lembretes **locais** opcionais; sem push remoto para lembretes diários.                                         |
| Agentes conectados   | Opcional. Você autoriza clientes MCP com `orbii:read` e/ou `orbii:write`.                                       |
| Venda de dados       | **Não** vendemos suas informações pessoais. **[ADVOGADO: confirmar linguagem de “venda” / “compartilhamento”]** |

---

## 3. Informações que coletamos

### 3.1 Conta e autenticação (Clerk)

Ao entrar, o **Clerk** processa dados de autenticação em nosso nome, incluindo:

- Identificador de usuário Clerk (guardado como `clerkUserId` no Convex)
- Informações do provedor de identidade **Google** ou **Apple** (por exemplo e-mail e nome de exibição que o Clerk recebe do provedor, conforme o que você compartilha e a configuração do Clerk)

Na V2 não há login por e-mail/senha — apenas Google ou Apple.

A [Política de Privacidade do Clerk](https://clerk.com/legal/privacy) cobre os sites e serviços próprios do Clerk. Ela **não** governa os “Customer Data” que usuários finais do Orbii inserem no Clerk pelo Orbii; para esses dados, o **Orbii é o cliente / controlador** e o **Clerk atua como processador ou prestador de serviço** sob os termos do Clerk e (quando aplicável) um DPA com o Orbii. Perguntas de usuários finais sobre dados da conta Orbii devem vir a nós (veja §12). Ver também [subprocessadores do Clerk](https://clerk.com/legal/subprocessors).

**[ADVOGADO]** Confirmar quais campos a instância Clerk do Orbii retém (e-mail, nome, avatar, tokens OAuth).

### 3.2 Conteúdo e configurações do app (Convex)

Armazenamos no **Convex**, associados ao seu id Clerk:

- **Perfil / preferências:** capacidade diária padrão, fuso horário salvo, sequência (streak), dias concluídos, última data local concluída, saldo de pontos, visibilidade de recompensas
- **Hábitos (Órbita):** nome, glifo, categoria (`body`, `mind`, `learn`, `life`), ordem, valor em pontos
- **Sessões do dia:** data local, fase do ritual, ids oferecidos / selecionados / comprometidos / concluídos, pontos ganhos, snapshots dos valores de pontos e nomes dos hábitos no momento do compromisso
- **Transações de pontos:** valor, tipo de origem (premiação de hábito, bônus de conclusão, resgate de recompensa), snapshot do nome da origem, data local
- **Recompensas:** nome, custo, status ativo/resgatado, carimbos de resgate quando aplicável
- **Agentes conectados:** id e nome do cliente, id da aplicação OAuth, escopos concedidos, fingerprint do token, token de acesso criptografado, metadados de conexão / última atividade / revogação
- **Registros de idempotência MCP:** fingerprints de pedidos para certas ferramentas de escrita (deduplicação de adicionar hábito / reoferecer / comprometer); ver §6 sobre retenção

Privacidade e subprocessadores do **Convex**: [Privacy Policy](https://www.convex.dev/legal/privacy), [Subprocessors](https://www.convex.dev/legal/subprocessors), [DPA](https://www.convex.dev/legal/dpa).

**[ADVOGADO]** Nomes e categorias de hábitos podem descrever saúde, fitness ou temas sensíveis. Avaliar avisos extras e rótulos de privacidade da App Store.

### 3.3 Dados no dispositivo

Somente no seu aparelho (não sincronizados com o Convex neste rascunho):

- Preferência de tema (AsyncStorage)
- Preferências de lembretes diários (AsyncStorage, por usuário)
- Filas de notificações **locais** para lembretes de manhã/noite. Ao abrir o app ou voltar ao primeiro plano, o Orbii renova uma fila rolante de cerca de ~30 dias de agendamentos únicos enquanto os lembretes estiverem ativos. Avisos já agendados ainda podem disparar até serem entregues ou cancelados (por exemplo quando ambos os lembretes estão desligados e a fila é sincronizada, ou a permissão de notificação é negada). Deixar o app fechado não cancela, por si só, avisos já no dispositivo.
- Estado de **Live Activity** no iOS em dispositivos suportados (ActivityKit; atualizações locais; sem APNs). Após um compromisso bem-sucedido, o Orbii inicia a Live Activity automaticamente quando a plataforma permite. Você pode dispensá-la; a restauração está disponível em Orbit enquanto Hoje estiver ativo.
- Material de sessão gerido pelo Clerk / Expo Secure Store

Lembretes usam `expo-notifications` com **notificações remotas desativadas** na config do app. O texto dos lembretes não nomeia hábitos em aberto.

### 3.4 Agentes conectados (MCP remoto)

Se você conectar um cliente de agente compatível:

- A autorização usa **OAuth do Clerk**. O Orbii verifica tokens opacos com a API Backend do Clerk.
- No primeiro uso autenticado do MCP, o Orbii guarda nome e id do cliente, escopos concedidos e um token de acesso opaco **criptografado com AES-GCM** no Convex.
- A identidade das chamadas MCP vem só do sujeito do token verificado. Argumentos de ferramentas nunca aceitam um user id Orbii fornecido pelo cliente.
- Você pode revisar e revogar conexões em **Settings → Connected agents** (rótulo em inglês na UI atual do app). A revogação bloqueia o token no Orbii e pede ao Clerk a revogação dos tokens; as credenciais criptografadas são apagadas após confirmação do Clerk.

**Escopos**

| Escopo        | O que permite                                                                                                                                                         |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `orbii:read`  | Ler a lista de hábitos da Órbita e o estado do ritual de hoje (oferta, seleções, compromisso, conclusão).                                                             |
| `orbii:write` | Iniciar / reoferecer o dia; selecionar / desmarcar hábitos oferecidos; comprometer; concluir / desfazer hábitos comprometidos; adicionar / remover hábitos da Órbita. |

A concessão de escrita permite que o cliente autorizado execute essas ações **sem** nova confirmação no Orbii por ação. Fora do MCP: editar/reordenar hábitos (além de adicionar/remover), configurações de conta e outras ações não listadas.

**Importante:** Um agente conectado é um **terceiro escolhido por você**. Após a autorização, esse cliente (e os sistemas que ele usa) pode receber ou agir sobre dados da Órbita e de Hoje dentro dos escopos. O Orbii não controla como esse terceiro armazena ou processa os dados depois de recebê-los.

**[ADVOGADO]** Caracterizar clientes MCP (controladores independentes vs. operadores), linguagem de consentimento sob LGPD/GDPR e Apple 5.1.2 (incluindo divulgação antes de compartilhar com IA de terceiros).

### 3.5 Infraestrutura técnica

Conforme a forma de instalação e atualização, **Expo / EAS** (por exemplo updates OTA via `u.expo.dev`) e serviços Apple / Google podem processar telemetria de entrega sob seus próprios termos. Ver [Expo Privacy](https://expo.dev/privacy).

Não coletamos GPS preciso de forma intencional. O fuso horário é uma string IANA salva pelo usuário para limites de dia local.

---

## 4. Como usamos as informações

Usamos as informações acima para:

- Autenticar você e sincronizar a Órbita e o ritual de Hoje
- Calcular sequências, pontos, recompensas e histórico conforme as regras do produto
- Respeitar preferências de lembretes com notificações locais
- Exibir Live Activities no iOS após o compromisso em dispositivos suportados
- Operar Agentes conectados com os escopos que você conceder e revogá-los quando pedir
- Proteger o serviço (verificação de tokens, armazenamento criptografado, prevenção de abuso)
- Responder a pedidos de suporte ou privacidade

**Não** usamos o conteúdo da Órbita para publicidade. **Não** vendemos informações pessoais. **[ADVOGADO: confirmar]**

---

## 5. Como compartilhamos informações

Compartilhamos apenas o necessário para operar o Orbii:

| Destinatário            | Papel                            | Exemplos                                                               |
| ----------------------- | -------------------------------- | ---------------------------------------------------------------------- |
| **Clerk**               | Autenticação / OAuth             | Login Google ou Apple; emissão / verificação / revogação de tokens MCP |
| **Google / Apple**      | Provedores de identidade         | Login; políticas deles e suas configurações de conta                   |
| **Convex**              | Banco do app e endpoint HTTP MCP | Dados do app e metadados de agentes                                    |
| **Expo / EAS**          | Distribuição / updates           | Builds e updates OTA                                                   |
| **Clientes de agentes** | Terceiros autorizados por você   | Leitura/escrita da Órbita / Hoje nos escopos concedidos                |
| **Autoridades**         | Obrigação legal                  | Se exigido por lei **[ADVOGADO]**                                      |

Exigimos que prestadores que processem dados pessoais para o Orbii os protejam sob contratos e políticas. **[ADVOGADO: alinhar à redação Apple 5.1.1(i) de “same or equal protection” e aos DPAs]**

---

## 6. Retenção

| Dados                                         | Retenção (intenção atual do produto)                                                                                                                                                                                                                        |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Conta e dados da Órbita no Convex             | Enquanto a conta existir                                                                                                                                                                                                                                    |
| Transações de pontos e recompensas resgatadas | Enquanto a conta existir                                                                                                                                                                                                                                    |
| Conexões de agentes                           | Enquanto conectadas; após revogação bem-sucedida, tokens criptografados são apagados; metadados de histórico **[confirmar exclusão vs. marcação de revogado]**                                                                                              |
| Idempotência MCP                              | Janela de deduplicação de cerca de **24 horas**. Linhas expiradas são apagadas quando o mesmo cliente OAuth emite depois outro pedido desse tipo; clientes inativos podem deixar linhas até então ou até a exclusão da conta. **[PRODUTO: purge agendado]** |
| Agendamentos locais de lembretes              | Renovados ao abrir o app enquanto ativos; one-offs já agendados podem disparar até entrega ou cancelamento                                                                                                                                                  |
| Dados de conta no Clerk                       | Conforme retenção do Clerk e seu pedido de exclusão                                                                                                                                                                                                         |

**[ADVOGADO]** Fixar prazos firmes e prazos de exclusão em backups.

---

## 7. Suas escolhas e exclusão

### 7.1 Controles no produto

- Alterar fuso, capacidade, visibilidade de recompensas e lembretes em Configurações
- Revogar Agentes conectados em Settings → Connected agents
- Desativar permissão de notificação nas configurações do sistema
- Sair da sessão via controles do Clerk no app

### 7.2 Exclusão de conta e dados

**[ADVOGADO] [LACUNA DE PRODUTO]** A Guideline **5.1.1(v)** da Apple exige que, se o app permite criar conta, também ofereça **exclusão de conta dentro do app**. Advogado não pode dispensar esse requisito para uma submissão à App Store com contas. O Orbii ainda **não** tem fluxo “excluir conta” nem mutação Convex que apague o dataset completo. Até isso existir, a exclusão é **manual**: contate o contato de privacidade no topo desta política (veja também §12); apagaremos registros Convex ligados ao seu `clerkUserId` e pediremos a exclusão do usuário no Clerk, após verificação.

Compromisso de rascunho quando o produto estiver pronto:

1. Controle **Excluir conta** no app
2. Apagar dados Convex do usuário (`users`, `habits`, `daySessions`, `pointTransactions`, `rewards`, `agentConnections`, tabelas de pedidos MCP)
3. Revogar tokens OAuth de agentes via Clerk
4. Excluir o usuário no Clerk
5. Confirmar a conclusão

**[ADVOGADO]** Definir verificação de identidade, SLA (por exemplo 30 dias) e exceções (retenções legais).

### 7.3 Acesso / correção / portabilidade / oposição

**[ADVOGADO]** Incluir direitos da LGPD (e GDPR/CCPA se aplicável) e como exercê-los.

---

## 8. Crianças

O Orbii não é dirigido a crianças. **[ADVOGADO: definir idade mínima — p.ex. 13 / 16 / 18 — e regras LGPD/COPPA].** Não coletamos de forma consciente dados de menores abaixo dessa idade. Se souber de uso indevido, contate-nos para exclusão.

---

## 9. Transferências internacionais

Clerk, Convex, Expo, Google e Apple podem processar dados nos Estados Unidos e em outros países. **[ADVOGADO]** Documentar bases de transferência internacional (LGPD art. 33 etc.).

---

## 10. Segurança

Usamos medidas adequadas a um app pequeno, incluindo TLS em trânsito, controles de acesso Convex ligados a sujeitos Clerk autenticados, tokens OAuth opacos para MCP e criptografia AES-GCM dos tokens MCP armazenados. Nenhum método é 100% seguro.

---

## 11. Alterações

Podemos atualizar esta política. Em mudanças materiais, atualizaremos a data e, quando apropriado, avisaremos no app ou por outro meio razoável. **[ADVOGADO: regras de consentimento vs. aviso]**

---

## 12. Contato

Dúvidas de privacidade e pedidos de exclusão: o contato listado no topo desta política (e-mail público no perfil GitHub de [`pedrotmr`](https://github.com/pedrotmr) até confirmar um endereço dedicado).  
Projeto no GitHub: [https://github.com/pedrotmr/orbii](https://github.com/pedrotmr/orbii)

---

## 13. Rótulos de privacidade da App Store (checklist de engenharia)

Não faz parte do texto jurídico; uso interno para o questionário “App Privacy” do App Store Connect. Confirmar com advogado antes de enviar.

Tipos provavelmente **coletados** (rascunho):

- **Contact Info** — e-mail (via Clerk / provedor), eventualmente nome
- **Identifiers** — user id (Clerk)
- **User Content** — nomes de hábitos e recompensas, histórico do ritual
- **Usage Data** — sessões do dia / transações (sem SDK separado de analytics)
- **Diagnostics** — só se ferramentas de crash Expo/Apple forem ativadas depois

Provavelmente **não** coletados pelo Orbii hoje: Localização precisa, Tracking (ATT), dados de publicidade, HealthKit.

Vinculado ao usuário / usado para funcionalidade do app: sim, para conta e conteúdo. Tracking: não (rascunho). Publicidade de terceiros: não (rascunho).

---

_Este documento é um rascunho. Não publique nem envie ao App Store Connect antes da revisão jurídica e de uma URL HTTPS pública._
