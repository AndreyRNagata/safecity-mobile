/** Relatos do cidadão: lista do SQLite, com status de envio para a API. */
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Botao, Cartao, Icone, Tela, Texto } from '@/components/ui';
import { TIPOS_RELATO } from '@/constants/relatos';
import { Espaco } from '@/constants/tema';
import { useApp } from '@/context/app-context';
import { useTema } from '@/hooks/use-tema';
import { apiConfigurada } from '@/services/api';
import type { Relato } from '@/types';
import { confirmar, formatarDataHora } from '@/utils/formatos';

export default function Relatos() {
  const { relatos, removerRelato, recarregarDados, carregandoDados } = useApp();
  const pendentes = relatos.filter((r) => !r.sincronizado).length;

  const excluir = async (relato: Relato) => {
    const ok = await confirmar(
      'Excluir relato?',
      `${TIPOS_RELATO[relato.tipo].rotulo} de ${formatarDataHora(relato.ocorridoEm)} será apagado deste celular.`,
      'Excluir',
    );
    if (ok) await removerRelato(relato.id);
  };

  return (
    <Tela
      titulo="Relatos"
      subtitulo="Seus relatos mostram onde o risco está aumentando e ajudam outros cidadãos.">
      <Botao
        rotulo="Registrar relato"
        icone="add-circle"
        grande
        onPress={() => router.push('/relato/novo')}
        dica="Abre o formulário para contar onde e quando aconteceu"
      />

      {pendentes > 0 && (
        <Cartao accessibilityRole="alert">
          <View style={styles.linha}>
            <Icone nome="cloud-upload-outline" />
            <Texto variante="corpoForte" style={styles.flex}>
              {pendentes} {pendentes === 1 ? 'relato salvo' : 'relatos salvos'} só no celular
            </Texto>
          </View>
          <Texto secundario>
            {apiConfigurada
              ? 'Eles serão enviados automaticamente quando a conexão voltar.'
              : 'A API não está configurada; os relatos ficam guardados no celular.'}
          </Texto>
          {apiConfigurada && (
            <Botao
              rotulo="Tentar enviar agora"
              variante="secundario"
              icone="refresh"
              carregando={carregandoDados}
              onPress={recarregarDados}
            />
          )}
        </Cartao>
      )}

      {relatos.length === 0 ? (
        <Cartao>
          <Icone nome="megaphone-outline" tamanho={28} />
          <Texto variante="corpoForte">Nenhum relato ainda.</Texto>
          <Texto secundario>
            Passou por um furto, tentativa ou viu uma atitude suspeita? Registre em poucos toques. Não
            pedimos nome, CPF ou telefone.
          </Texto>
        </Cartao>
      ) : (
        relatos.map((relato) => <ItemRelato key={relato.id} relato={relato} aoExcluir={excluir} />)
      )}
    </Tela>
  );
}

function ItemRelato({ relato, aoExcluir }: { relato: Relato; aoExcluir: (r: Relato) => void }) {
  const tema = useTema();
  const tipo = TIPOS_RELATO[relato.tipo];
  const status = relato.sincronizado ? 'Enviado' : 'Salvo só no celular';

  return (
    <Cartao>
      <View
        style={styles.linha}
        accessible
        accessibilityLabel={`${tipo.rotulo}, ${formatarDataHora(relato.ocorridoEm)}. ${relato.referencia ?? ''}. ${status}.`}>
        <Ionicons name={tipo.icone} size={28} color={tema.texto} />
        <View style={styles.flex}>
          <Texto variante="corpoForte">{tipo.rotulo}</Texto>
          <Texto variante="pequeno" secundario>
            {formatarDataHora(relato.ocorridoEm)}
          </Texto>
        </View>
        <View style={styles.status}>
          <Ionicons
            name={relato.sincronizado ? 'cloud-done' : 'phone-portrait-outline'}
            size={16}
            color={relato.sincronizado ? tema.sucesso : tema.textoSecundario}
          />
          <Texto variante="legenda" secundario>
            {status}
          </Texto>
        </View>
      </View>
      {!!relato.referencia && <Texto>📍 {relato.referencia}</Texto>}
      {!!relato.descricao && <Texto secundario>{relato.descricao}</Texto>}
      <Botao
        rotulo="Excluir"
        variante="fantasma"
        icone="trash-outline"
        accessibilityLabel={`Excluir relato de ${tipo.rotulo} de ${formatarDataHora(relato.ocorridoEm)}`}
        onPress={() => aoExcluir(relato)}
      />
    </Cartao>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  linha: { flexDirection: 'row', alignItems: 'center', gap: Espaco.md },
  status: { alignItems: 'center', gap: 2, maxWidth: 96 },
});
