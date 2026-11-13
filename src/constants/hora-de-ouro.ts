/**
 * Guia da "Hora de Ouro": os primeiros 60 minutos depois de um furto ou roubo,
 * quando os criminosos tentam acessar bancos, Pix e contas.
 *
 * Fontes conferidas em nov/2026:
 *  - Celular Seguro (Governo Federal / Ministério da Justiça): https://celularseguro.mj.gov.br
 *  - Centrais das operadoras para bloqueio de chip/IMEI: Vivo 1058, Claro 1052, TIM 1056
 *  - Delegacia Eletrônica da Polícia Civil de SP: https://www.delegaciaeletronica.policiacivil.sp.gov.br
 */
import type { Operadora } from '@/types';

export const DURACAO_HORA_DE_OURO_MIN = 60;

export const OPERADORAS: Record<Exclude<Operadora, '' | 'outra'>, { nome: string; numero: string }> = {
  vivo: { nome: 'Vivo', numero: '1058' },
  claro: { nome: 'Claro', numero: '1052' },
  tim: { nome: 'TIM', numero: '1056' },
};

export type AcaoPasso =
  | { tipo: 'ligar'; rotulo: string; numero: string }
  | { tipo: 'link'; rotulo: string; url: string }
  | { tipo: 'ligar_operadora' }
  | { tipo: 'ligar_contato' }
  | { tipo: 'copiar_imei' };

export interface PassoHoraDeOuro {
  id: string;
  titulo: string;
  descricao: string;
  /** Janela de tempo recomendada, contada a partir do início. */
  janela: string;
  /** Passos críticos impedem o acesso a dinheiro e contas: entram no indicador de impacto. */
  critico: boolean;
  acoes: AcaoPasso[];
}

export const PASSOS_HORA_DE_OURO: PassoHoraDeOuro[] = [
  {
    id: 'seguranca',
    titulo: 'Fique em segurança',
    descricao:
      'Não reaja e não persiga ninguém. Vá para um lugar movimentado, como uma loja ou estação, e peça ajuda. Se houve violência ou alguém se feriu, ligue 190.',
    janela: 'Agora',
    critico: false,
    acoes: [{ tipo: 'ligar', rotulo: 'Ligar 190 (Polícia Militar)', numero: '190' }],
  },
  {
    id: 'celular-seguro',
    titulo: 'Acione o Celular Seguro',
    descricao:
      'Programa gratuito do Governo Federal. Pelo site ou app, com login gov.br, você ou uma pessoa de confiança cadastrada envia um único alerta para bancos, operadoras e apps parceiros.',
    janela: 'Até 10 min',
    critico: true,
    acoes: [
      { tipo: 'link', rotulo: 'Abrir o Celular Seguro', url: 'https://celularseguro.mj.gov.br' },
      { tipo: 'ligar_contato' },
    ],
  },
  {
    id: 'bancos',
    titulo: 'Bloqueie bancos, Pix e cartões',
    descricao:
      'De outro aparelho, ligue para a central do seu banco (o número está no verso do cartão ou no site) e peça o bloqueio do app, do Pix e dos cartões.',
    janela: 'Até 15 min',
    critico: true,
    acoes: [],
  },
  {
    id: 'chip',
    titulo: 'Bloqueie a linha (chip)',
    descricao:
      'Peça à operadora o bloqueio do chip. Assim ninguém recebe os códigos por SMS que liberam suas contas. Ligue de outro telefone.',
    janela: 'Até 15 min',
    critico: true,
    acoes: [{ tipo: 'ligar_operadora' }],
  },
  {
    id: 'aparelho',
    titulo: 'Bloqueie o aparelho à distância',
    descricao:
      'Em outro dispositivo, entre na sua conta Google ou Apple e bloqueie a tela. Se não houver chance de recuperar o celular, apague os dados.',
    janela: '15 a 30 min',
    critico: false,
    acoes: [
      { tipo: 'link', rotulo: 'Android: Encontre meu dispositivo', url: 'https://www.google.com/android/find' },
      { tipo: 'link', rotulo: 'iPhone: Buscar (iCloud)', url: 'https://www.icloud.com/find' },
    ],
  },
  {
    id: 'senhas',
    titulo: 'Troque senhas e proteja o WhatsApp',
    descricao:
      'Troque primeiro a senha do e-mail principal, que recupera todas as outras contas. No WhatsApp, envie um e-mail pedindo a desativação da conta, com seu número no formato +55.',
    janela: '15 a 30 min',
    critico: false,
    acoes: [
      {
        tipo: 'link',
        rotulo: 'Escrever para o suporte do WhatsApp',
        url: 'mailto:support@whatsapp.com?subject=Perdido%2FRoubado%3A%20Por%20favor%2C%20desative%20minha%20conta',
      },
    ],
  },
  {
    id: 'bo',
    titulo: 'Registre o Boletim de Ocorrência',
    descricao:
      'Em São Paulo, o BO pode ser feito pela internet na Delegacia Eletrônica ou em qualquer delegacia. Tenha o IMEI em mãos: ele fica salvo no seu Perfil.',
    janela: '30 a 60 min',
    critico: false,
    acoes: [
      {
        tipo: 'link',
        rotulo: 'Abrir a Delegacia Eletrônica (SP)',
        url: 'https://www.delegaciaeletronica.policiacivil.sp.gov.br',
      },
      { tipo: 'copiar_imei' },
    ],
  },
  {
    id: 'imei',
    titulo: 'Peça o bloqueio do IMEI',
    descricao:
      'Com o número do BO, peça à operadora o bloqueio do IMEI. O aparelho deixa de funcionar em qualquer operadora do país, o que desestimula o roubo.',
    janela: '30 a 60 min',
    critico: false,
    acoes: [{ tipo: 'ligar_operadora' }, { tipo: 'copiar_imei' }],
  },
  {
    id: 'contatos',
    titulo: 'Avise seus contatos',
    descricao:
      'Golpistas usam o celular roubado para pedir dinheiro em seu nome. Avise família e amigos por outro canal para não caírem no golpe.',
    janela: 'Até 60 min',
    critico: false,
    acoes: [{ tipo: 'ligar_contato' }],
  },
];

export const PASSOS_CRITICOS = PASSOS_HORA_DE_OURO.filter((p) => p.critico).map((p) => p.id);
