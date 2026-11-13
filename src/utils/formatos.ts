import { Alert, Platform } from 'react-native';

export function formatarDataHora(iso: string): string {
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return '';
  const dia = data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  const hora = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return `${dia} às ${hora}`;
}

export function formatarTempoRelativo(iso: string, agora = Date.now()): string {
  const minutos = Math.round((agora - Date.parse(iso)) / 60_000);
  if (!Number.isFinite(minutos)) return '';
  if (minutos < 1) return 'agora mesmo';
  if (minutos < 60) return `há ${minutos} min`;
  const horas = Math.round(minutos / 60);
  if (horas < 24) return `há ${horas} h`;
  const dias = Math.round(horas / 24);
  return dias === 1 ? 'ontem' : `há ${dias} dias`;
}

/** mm:ss ou hh:mm:ss */
export function formatarCronometro(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const dois = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${dois(m)}:${dois(s)}` : `${dois(m)}:${dois(s)}`;
}

/** Confirmação que funciona no celular e no navegador (Alert com botões não existe na web). */
export function confirmar(titulo: string, mensagem: string, rotuloConfirmar = 'Confirmar'): Promise<boolean> {
  if (Platform.OS === 'web') {
    return Promise.resolve(globalThis.confirm?.(`${titulo}\n\n${mensagem}`) ?? true);
  }
  return new Promise((resolver) => {
    Alert.alert(titulo, mensagem, [
      { text: 'Cancelar', style: 'cancel', onPress: () => resolver(false) },
      { text: rotuloConfirmar, style: 'destructive', onPress: () => resolver(true) },
    ]);
  });
}

export function avisar(titulo: string, mensagem: string): void {
  if (Platform.OS === 'web') globalThis.alert?.(`${titulo}\n\n${mensagem}`);
  else Alert.alert(titulo, mensagem);
}

/** IMEI: 15 dígitos com dígito verificador (algoritmo de Luhn). */
export function imeiValido(imei: string): boolean {
  if (!/^\d{15}$/.test(imei)) return false;
  let soma = 0;
  for (let i = 0; i < 15; i++) {
    let d = Number(imei[i]);
    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    soma += d;
  }
  return soma % 10 === 0;
}

export function apenasDigitos(texto: string): string {
  return texto.replace(/\D/g, '');
}
