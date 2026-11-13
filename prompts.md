# Registro de uso de IA (prompts)

Conforme os combinados da GS, a IA foi usada como **copiloto**. Abaixo estão os prompts enviados,
o que a IA produziu e o que a equipe precisa revisar e saber explicar.

- **Ferramenta:** Claude Code (Anthropic)
- **Data:** 12/11/2026

---

## Prompt 1

> Preciso fazer essa GS, minha matéria é a Mobile
> *(com o PDF do enunciado da GS CitizenTech anexado)*

**O que a IA fez:** leu o enunciado e levantou os requisitos da disciplina Mobile Development & IoT
(app em Expo com React Native + TypeScript + Expo Router, consumo de API ou mock, banco de dados,
acessibilidade, README com a Ficha, prints e vídeo de até 3 min).

## Prompt 2

> Especificação do Projeto: CitizenTech — SafeCity / Alerta Preventivo & Resposta Rápida
>
> Resumo da Proposta para a sua Equipe: Essa proposta resolve um problema real e cotidiano com o
> qual o cidadão convive nas grandes metrópoles [...] Ela foca no que a tecnologia mobile e de dados
> pode fazer pela segurança preventiva e pela mitigação rápida de prejuízos na "hora de ouro" do roubo.
>
> - O Cidadão Beneficiado: O trabalhador, estudante ou cidadão comum que transita a pé ou de
>   transporte público em grandes centros urbanos e precisa sacar o celular com frequência.
> - A Proposta em uma Frase: "Um aplicativo móvel inteligente que utiliza geolocalização em tempo
>   real e Machine Learning para emitir alertas preditivos de risco de furto de celulares, integrado
>   a um guia automatizado de resposta rápida para a 'hora de ouro'."

**O que a IA fez:**

- Criou o projeto Expo (SDK 58) com Expo Router e TypeScript.
- Modelou o domínio (`src/types`), o banco SQLite (`src/db/banco.ts`) e o cliente da API com
  fallback offline (`src/services/api.ts`).
- Implementou o cálculo de risco (`src/services/risco.ts`), as telas e os componentes acessíveis.
- Gerou os dados **simulados** do mock (`scripts/gerar-mock.js`).
- Conferiu na web os links e telefones do guia da Hora de Ouro (Celular Seguro, centrais das
  operadoras, Delegacia Eletrônica de SP). Removeu a Oi, que não opera mais telefonia móvel.
- Testou o app na versão web: modo demonstração, alerta preventivo, Hora de Ouro com progresso salvo,
  relato salvo offline e sincronizado com a API, modo offline com cache e validação de IMEI.

---

## O que a equipe deve revisar antes de entregar

- [x] Preencher integrantes no README.
- [x] Criar o repositório no GitHub e colocar o link no README.
- [ ] Gravar o vídeo (até 3 min) e colocar o link no README.
- [ ] Completar na Ficha o que cada disciplina faz (IA, SOA/C#, IoT, etc.).
- [ ] Rodar no celular com o Expo Go e trocar `docs/prints/04-mapa.jpg` por um print do mapa.
- [ ] Se o backend da equipe estiver pronto, apontar `EXPO_PUBLIC_API_URL` para ele.
- [ ] Se o modelo de ML já gerou previsões reais, substituir o `riscoPorHora` do mock por elas.
- [ ] Cada integrante saber explicar: o fluxo API → cache → mock, as tabelas do SQLite, a fórmula do
      risco e por que nenhum dado pessoal sai do celular.
