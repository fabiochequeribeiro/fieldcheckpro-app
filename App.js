import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Print from 'expo-print';
import * as MailComposer from 'expo-mail-composer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SignatureScreen from 'react-native-signature-canvas';

const LOGO_FIXO = require('./assets/brs-logo.jpeg');
const STORAGE_MODELOS = '@brs_modelos_checklist';
const STORAGE_VISITAS = '@brs_historico_visitas';

const MODELOS_INICIAIS = {
  'Elevador de Sementes': [
    'Estrutura fixada e nivelada',
    'Cabeçote superior conferido',
    'Pé inferior conferido',
    'Correia centralizada',
    'Canecas plásticas fixadas',
    'Motor fixado corretamente',
    'Sentido de rotação testado',
    'Proteções instaladas',
    'Teste sem carga realizado',
    'Teste com produto realizado',
  ],
  'Correia Transportadora': [
    'Estrutura alinhada',
    'Tambor motriz conferido',
    'Tambor de retorno conferido',
    'Correia tensionada corretamente',
    'Raspadores instalados',
    'Proteções instaladas',
    'Motor e redutor testados',
    'Teste operacional realizado',
  ],
  'Rosca Transportadora': [
    'Calha conferida',
    'Helicoide sem avarias',
    'Mancais lubrificados',
    'Proteções instaladas',
    'Motor testado',
    'Teste de rotação realizado',
  ],
  'Mesa Densimétrica': [
    'Estrutura nivelada',
    'Moto vibratórios testados',
    'Ventilação regulada',
    'Peneiras instaladas corretamente',
    'Painel elétrico conferido',
    'Teste com sementes realizado',
  ],
  'Peneira Classificadora': [
    'Estrutura conferida',
    'Peneiras instaladas',
    'Motores funcionando',
    'Correias tensionadas',
    'Proteções instaladas',
    'Teste operacional realizado',
  ],
  'Elevador Combinado': [
    'Estrutura alinhada',
    'Sistema combinado conferido',
    'Correias ajustadas',
    'Canecas fixadas',
    'Motores testados',
    'Teste de carga realizado',
  ],
  'Elevador de Corrente': [
    'Correntes alinhadas',
    'Tensionamento conferido',
    'Redutores testados',
    'Estrutura nivelada',
    'Proteções instaladas',
    'Teste operacional realizado',
  ],
  'Caixa': [
    'Estrutura conferida',
    'Fixações apertadas',
    'Vedação verificada',
    'Portas funcionando',
  ],
  'Torre': [
    'Estrutura alinhada',
    'Parafusos conferidos',
    'Plataformas instaladas',
    'Escadas e guarda-corpo instalados',
    'Nivelamento conferido',
  ],
  'Painel Elétrico': [
    'Disjuntores identificados',
    'Fiação organizada',
    'Botão de emergência funcionando',
    'Inversor parametrizado',
    'Teste elétrico realizado',
  ],
  'Moega': [
    'Estrutura nivelada',
    'Grade instalada',
    'Sistema de descarga conferido',
    'Fixações apertadas',
    'Teste operacional realizado',
  ],
};

function criarItem(texto) {
  return { texto, ativo: true, resposta: null, obs: '', foto: null };
}

function criarChecklist(modelos, tipo = 'Elevador de Sementes') {
  const lista = modelos[tipo] || modelos['Elevador de Sementes'] || [];
  return lista.map(criarItem);
}

function criarEquipamento(modelos, numero = 1, tipo = 'Elevador de Sementes') {
  return {
    tipo,
    nome: numero === 1 ? tipo : `Equipamento ${numero}`,
    descricao: '',
    modelo: '',
    serie: '',
    foto: null,
    itens: criarChecklist(modelos, tipo),
  };
}

export default function App() {
  const assinaturaRef = useRef(null);
  const [tela, setTela] = useState('visita');
  const [equipamentoAtual, setEquipamentoAtual] = useState(0);
  const [assinaturaAberta, setAssinaturaAberta] = useState(false);

  const [modelos, setModelos] = useState(MODELOS_INICIAIS);
  const [historico, setHistorico] = useState([]);
  const [tipoBanco, setTipoBanco] = useState('Elevador de Sementes');
  const [novoTipo, setNovoTipo] = useState('');
  const [novoItemBanco, setNovoItemBanco] = useState('');
  const [editandoBancoIndex, setEditandoBancoIndex] = useState(null);
  const [textoEditandoBanco, setTextoEditandoBanco] = useState('');

  const [novoItemVisita, setNovoItemVisita] = useState('');
  const [editandoItemVisita, setEditandoItemVisita] = useState(null);
  const [textoEditandoVisita, setTextoEditandoVisita] = useState('');

  const [dados, setDados] = useState({
    empresa: 'BRS Equipamentos Agrícolas',
    cliente: '',
    emailCliente: '',
    propriedade: '',
    cidade: '',
    tecnico: '',
    data: new Date().toLocaleDateString('pt-BR'),
    observacoes: '',
  });

  const [equipamentos, setEquipamentos] = useState([criarEquipamento(MODELOS_INICIAIS, 1)]);
  const [assinatura, setAssinatura] = useState(null);

  useEffect(() => {
    carregarBanco();
    carregarHistorico();
  }, []);

  async function carregarBanco() {
    try {
      const salvo = await AsyncStorage.getItem(STORAGE_MODELOS);
      if (salvo) {
        const banco = JSON.parse(salvo);
        setModelos(banco);
        const primeiroTipo = Object.keys(banco)[0] || 'Elevador de Sementes';
        setTipoBanco(primeiroTipo);
        setEquipamentos([criarEquipamento(banco, 1, primeiroTipo)]);
      }
    } catch (erro) {
      Alert.alert('Erro', 'Não foi possível carregar o Banco de Checklists BRS.');
    }
  }

  async function carregarHistorico() {
    try {
      const salvo = await AsyncStorage.getItem(STORAGE_VISITAS);
      setHistorico(salvo ? JSON.parse(salvo) : []);
    } catch (erro) {
      Alert.alert('Erro', 'Não foi possível carregar o histórico de visitas.');
    }
  }

  async function salvarModelos(novosModelos) {
    try {
      setModelos(novosModelos);
      await AsyncStorage.setItem(STORAGE_MODELOS, JSON.stringify(novosModelos));
    } catch (erro) {
      Alert.alert('Erro ao salvar', 'Não foi possível salvar o banco de checklists.');
    }
  }

  const equipamento = equipamentos[equipamentoAtual] || equipamentos[0];

  const resumo = useMemo(() => {
    const todos = equipamentos.flatMap((eq) => eq.itens.filter((i) => i.ativo));
    return {
      total: todos.length,
      ok: todos.filter((i) => i.resposta === 'OK').length,
      nao: todos.filter((i) => i.resposta === 'NAO').length,
      pendentes: todos.filter((i) => !i.resposta).length,
    };
  }, [equipamentos]);

  function atualizarCampo(campo, valor) {
    setDados((atual) => ({ ...atual, [campo]: valor }));
  }

  function atualizarEquipamento(campo, valor) {
    setEquipamentos((atual) => {
      const novo = [...atual];
      novo[equipamentoAtual] = { ...novo[equipamentoAtual], [campo]: valor };
      return novo;
    });
  }

  function trocarTipoEquipamento(tipo) {
    Alert.alert('Carregar checklist', `Deseja carregar o checklist padrão de ${tipo}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Carregar',
        onPress: () => {
          setEquipamentos((atual) => {
            const novo = [...atual];
            novo[equipamentoAtual] = {
              ...novo[equipamentoAtual],
              tipo,
              nome: tipo,
              itens: criarChecklist(modelos, tipo),
            };
            return novo;
          });
        },
      },
    ]);
  }

  function adicionarEquipamento() {
    const primeiroTipo = Object.keys(modelos)[0] || 'Elevador de Sementes';
    setEquipamentos((atual) => [...atual, criarEquipamento(modelos, atual.length + 1, primeiroTipo)]);
    setEquipamentoAtual(equipamentos.length);
  }

  function removerEquipamento() {
    if (equipamentos.length === 1) {
      Alert.alert('Atenção', 'É necessário manter pelo menos um equipamento.');
      return;
    }
    setEquipamentos((atual) => atual.filter((_, i) => i !== equipamentoAtual));
    setEquipamentoAtual(0);
  }

  function alterarItemVisita(index, alteracao) {
    setEquipamentos((atual) => {
      const novo = [...atual];
      const itens = [...novo[equipamentoAtual].itens];
      itens[index] = { ...itens[index], ...alteracao };
      novo[equipamentoAtual] = { ...novo[equipamentoAtual], itens };
      return novo;
    });
  }

  function adicionarItemVisita() {
    const texto = novoItemVisita.trim();
    if (!texto) return;
    setEquipamentos((atual) => {
      const novo = [...atual];
      novo[equipamentoAtual] = {
        ...novo[equipamentoAtual],
        itens: [...novo[equipamentoAtual].itens, criarItem(texto)],
      };
      return novo;
    });
    setNovoItemVisita('');
  }

  function removerItemVisita(index) {
    setEquipamentos((atual) => {
      const novo = [...atual];
      novo[equipamentoAtual] = {
        ...novo[equipamentoAtual],
        itens: novo[equipamentoAtual].itens.filter((_, i) => i !== index),
      };
      return novo;
    });
  }

  function salvarEdicaoItemVisita() {
    const texto = textoEditandoVisita.trim();
    if (!texto) return;
    alterarItemVisita(editandoItemVisita, { texto });
    setEditandoItemVisita(null);
    setTextoEditandoVisita('');
  }

  async function escolherFotoEquipamento() {
    const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissao.granted) {
      Alert.alert('Permissão necessária', 'Autorize o acesso à câmera ou galeria.');
      return;
    }

    Alert.alert('Foto do equipamento', 'Escolha uma opção', [
      {
        text: 'Câmera',
        onPress: async () => {
          const resultado = await ImagePicker.launchCameraAsync({ quality: 0.7 });
          if (!resultado.canceled) atualizarEquipamento('foto', resultado.assets[0].uri);
        },
      },
      {
        text: 'Galeria',
        onPress: async () => {
          const resultado = await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });
          if (!resultado.canceled) atualizarEquipamento('foto', resultado.assets[0].uri);
        },
      },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  }

  async function adicionarFotoItem(index) {
    const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissao.granted) {
      Alert.alert('Permissão necessária', 'Autorize o acesso às fotos.');
      return;
    }

    Alert.alert('Foto do item', 'Escolha uma opção', [
      {
        text: 'Câmera',
        onPress: async () => {
          const resultado = await ImagePicker.launchCameraAsync({ quality: 0.7 });
          if (!resultado.canceled) alterarItemVisita(index, { foto: resultado.assets[0].uri });
        },
      },
      {
        text: 'Galeria',
        onPress: async () => {
          const resultado = await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });
          if (!resultado.canceled) alterarItemVisita(index, { foto: resultado.assets[0].uri });
        },
      },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  }

  function salvarAssinatura(signature) {
    setAssinatura(signature);
    setAssinaturaAberta(false);
    Alert.alert('Assinatura salva', 'A assinatura foi registrada com sucesso.');
  }

  function confirmarAssinatura() {
    assinaturaRef.current?.readSignature();
  }

  function limparAssinatura() {
    setAssinatura(null);
    assinaturaRef.current?.clearSignature();
  }

  function adicionarTipoBanco() {
    const nome = novoTipo.trim();
    if (!nome) return;
    if (modelos[nome]) {
      Alert.alert('Atenção', 'Esse tipo de equipamento já existe no banco.');
      return;
    }
    const novoBanco = { ...modelos, [nome]: [] };
    salvarModelos(novoBanco);
    setTipoBanco(nome);
    setNovoTipo('');
  }

  function adicionarItemBanco() {
    const texto = novoItemBanco.trim();
    if (!texto) return;
    const novoBanco = {
      ...modelos,
      [tipoBanco]: [...(modelos[tipoBanco] || []), texto],
    };
    salvarModelos(novoBanco);
    setNovoItemBanco('');
  }

  function removerItemBanco(index) {
    const novoBanco = {
      ...modelos,
      [tipoBanco]: modelos[tipoBanco].filter((_, i) => i !== index),
    };
    salvarModelos(novoBanco);
  }

  function salvarEdicaoBanco() {
    const texto = textoEditandoBanco.trim();
    if (!texto) return;
    const lista = [...modelos[tipoBanco]];
    lista[editandoBancoIndex] = texto;
    salvarModelos({ ...modelos, [tipoBanco]: lista });
    setEditandoBancoIndex(null);
    setTextoEditandoBanco('');
  }

  function removerTipoBanco() {
    if (Object.keys(modelos).length === 1) {
      Alert.alert('Atenção', 'É necessário manter pelo menos um tipo de equipamento.');
      return;
    }
    Alert.alert('Remover tipo', `Deseja remover ${tipoBanco} do Banco de Checklists BRS?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: () => {
          const novoBanco = { ...modelos };
          delete novoBanco[tipoBanco];
          const novoTipoSelecionado = Object.keys(novoBanco)[0];
          salvarModelos(novoBanco);
          setTipoBanco(novoTipoSelecionado);
        },
      },
    ]);
  }

  function restaurarBancoInicial() {
    Alert.alert('Restaurar banco inicial', 'Isso vai voltar os modelos para o padrão inicial da BRS. Deseja continuar?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Restaurar',
        onPress: () => {
          salvarModelos(MODELOS_INICIAIS);
          setTipoBanco('Elevador de Sementes');
        },
      },
    ]);
  }

  async function salvarHistorico() {
    const registro = {
      id: Date.now(),
      cliente: dados.cliente,
      emailCliente: dados.emailCliente,
      propriedade: dados.propriedade,
      cidade: dados.cidade,
      tecnico: dados.tecnico,
      data: dados.data,
      equipamentos: equipamentos.map((eq) => ({
        nome: eq.nome,
        tipo: eq.tipo,
        modelo: eq.modelo,
        serie: eq.serie,
      })),
      resumo,
    };

    const salvo = await AsyncStorage.getItem(STORAGE_VISITAS);
    const listaAtual = salvo ? JSON.parse(salvo) : [];
    const novaLista = [registro, ...listaAtual];
    await AsyncStorage.setItem(STORAGE_VISITAS, JSON.stringify(novaLista));
    setHistorico(novaLista);
  }

  async function limparHistorico() {
    Alert.alert('Limpar histórico', 'Deseja apagar todo o histórico salvo neste celular?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Apagar',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem(STORAGE_VISITAS);
          setHistorico([]);
        },
      },
    ]);
  }

  function montarHtmlPdf() {
    const equipamentosHtml = equipamentos.map((eq, eqIndex) => {
      const itensHtml = eq.itens
        .filter((item) => item.ativo)
        .map((item) => `
          <tr>
            <td>${item.texto}</td>
            <td class="centro ok">${item.resposta === 'OK' ? 'OK' : ''}</td>
            <td class="centro nao">${item.resposta === 'NAO' ? 'NÃO' : ''}</td>
            <td>${item.obs || ''}</td>
          </tr>
        `).join('');

      const fotoEquipamento = eq.foto ? `<img class="foto" src="${eq.foto}" />` : '<p class="semFoto">Sem foto do equipamento.</p>';

      const fotosItens = eq.itens
        .filter((item) => item.ativo && item.foto)
        .map((item) => `
          <div class="fotoItemBox">
            <p><strong>${item.texto}</strong></p>
            <img class="foto" src="${item.foto}" />
          </div>
        `).join('');

      return `
        <section class="equipamento">
          <h2>Equipamento ${eqIndex + 1}: ${eq.nome}</h2>
          <p><strong>Tipo:</strong> ${eq.tipo}</p>
          <p><strong>Descrição:</strong> ${eq.descricao || ''}</p>
          <p><strong>Modelo:</strong> ${eq.modelo || ''}</p>
          <p><strong>Série:</strong> ${eq.serie || ''}</p>
          ${fotoEquipamento}
          <table>
            <thead>
              <tr>
                <th>Item verificado</th>
                <th>OK</th>
                <th>Não</th>
                <th>Observação</th>
              </tr>
            </thead>
            <tbody>${itensHtml}</tbody>
          </table>
          ${fotosItens ? `<h3>Fotos dos itens verificados</h3>${fotosItens}` : ''}
        </section>
      `;
    }).join('');

    const assinaturaHtml = assinatura ? `<img class="assinatura" src="${assinatura}" />` : '<p>Sem assinatura registrada.</p>';

    return `
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #111827; }
            .cabecalho { border-bottom: 4px solid #166534; padding-bottom: 16px; margin-bottom: 18px; text-align: center; }
            .titulo { font-size: 26px; font-weight: bold; color: #14532d; margin: 0; }
            .subtitulo { font-size: 16px; color: #334155; margin-top: 6px; }
            .dados { background: #f1f5f9; border-radius: 10px; padding: 14px; margin-bottom: 18px; }
            .resumo { display: flex; gap: 10px; margin: 14px 0; }
            .box { flex: 1; border: 1px solid #d1d5db; border-radius: 10px; padding: 10px; text-align: center; }
            .numero { font-size: 22px; font-weight: bold; color: #123c69; }
            h2 { color: #123c69; border-bottom: 1px solid #d1d5db; padding-bottom: 6px; }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; }
            th { background: #123c69; color: white; padding: 8px; font-size: 12px; }
            td { border: 1px solid #d1d5db; padding: 8px; font-size: 12px; vertical-align: top; }
            .centro { text-align: center; font-weight: bold; }
            .ok { color: #12805c; }
            .nao { color: #b42318; }
            .foto { width: 100%; max-height: 260px; object-fit: contain; border: 1px solid #d1d5db; border-radius: 10px; margin: 10px 0; }
            .semFoto { color: #64748b; font-style: italic; }
            .equipamento { page-break-inside: avoid; margin-bottom: 28px; }
            .assinatura { width: 320px; height: 120px; object-fit: contain; border: 1px solid #d1d5db; margin-top: 8px; }
            .rodape { margin-top: 26px; font-size: 11px; color: #64748b; text-align: center; }
          </style>
        </head>
        <body>
          <div class="cabecalho">
            <p class="titulo">${dados.empresa || 'BRS Equipamentos Agrícolas'}</p>
            <p class="subtitulo">Relatório de Entrega Técnica / Checklist de Equipamentos</p>
          </div>
          <div class="dados">
            <p><strong>Cliente:</strong> ${dados.cliente || ''}</p>
            <p><strong>E-mail:</strong> ${dados.emailCliente || ''}</p>
            <p><strong>Propriedade / Fazenda:</strong> ${dados.propriedade || ''}</p>
            <p><strong>Cidade / UF:</strong> ${dados.cidade || ''}</p>
            <p><strong>Técnico:</strong> ${dados.tecnico || ''}</p>
            <p><strong>Data:</strong> ${dados.data || ''}</p>
          </div>
          <div class="resumo">
            <div class="box"><div class="numero">${resumo.ok}</div><div>OK</div></div>
            <div class="box"><div class="numero">${resumo.nao}</div><div>Não</div></div>
            <div class="box"><div class="numero">${resumo.pendentes}</div><div>Pendentes</div></div>
          </div>
          ${equipamentosHtml}
          <h2>Observações gerais</h2>
          <p>${dados.observacoes || 'Sem observações.'}</p>
          <h2>Assinatura do cliente / responsável</h2>
          ${assinaturaHtml}
          <div class="rodape">Documento gerado pelo aplicativo de checklist técnico da BRS Equipamentos Agrícolas.</div>
        </body>
      </html>
    `;
  }

  async function gerarPdf(enviarEmail = false) {
    if (!dados.cliente) {
      Alert.alert('Atenção', 'Preencha o nome do cliente antes de gerar o PDF.');
      return;
    }

    try {
      const arquivo = await Print.printToFileAsync({ html: montarHtmlPdf() });
      await salvarHistorico();

      if (enviarEmail) {
        const disponivel = await MailComposer.isAvailableAsync();
        if (!disponivel) {
          Alert.alert('E-mail indisponível', 'Configure um aplicativo de e-mail no celular.');
          return;
        }
        await MailComposer.composeAsync({
          recipients: dados.emailCliente ? [dados.emailCliente] : [],
          subject: `Entrega técnica - ${dados.cliente}`,
          body: `Olá, segue em anexo o relatório de entrega técnica da visita realizada em ${dados.data}.

Atenciosamente,
${dados.empresa || 'BRS Equipamentos Agrícolas'}`,
          attachments: [arquivo.uri],
        });
      } else {
        await Print.printAsync({ uri: arquivo.uri });
      }
    } catch (erro) {
      Alert.alert('Erro ao gerar PDF', String(erro));
    }
  }

  function BotoesEquipamentos() {
    return (
      <View style={styles.abasEquipamentos}>
        {equipamentos.map((eq, index) => (
          <TouchableOpacity
            key={`${eq.nome}-${index}`}
            style={[styles.abaEquipamento, equipamentoAtual === index ? styles.abaAtiva : null]}
            onPress={() => setEquipamentoAtual(index)}
          >
            <Text style={[styles.abaTexto, equipamentoAtual === index ? styles.abaTextoAtivo : null]}>
              {index + 1}. {eq.nome || 'Equipamento'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  if (tela === 'historico') {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.header}>
            <Image source={LOGO_FIXO} style={styles.logo} />
            <Text style={styles.titulo}>Histórico de Visitas</Text>
            <Text style={styles.subtitulo}>Entregas técnicas salvas no celular</Text>
          </View>

          <TouchableOpacity style={styles.botaoConfig} onPress={() => setTela('visita')}>
            <Text style={styles.botaoConfigTexto}>Voltar para a visita</Text>
          </TouchableOpacity>

          <Secao titulo="Visitas salvas">
            {historico.length === 0 ? (
              <Text style={styles.semFoto}>Nenhuma visita salva ainda. Gere um PDF para salvar uma visita no histórico.</Text>
            ) : (
              historico.map((visita) => (
                <View key={visita.id} style={styles.historicoCard}>
                  <Text style={styles.historicoTitulo}>{visita.cliente || 'Cliente não informado'}</Text>
                  <Text style={styles.infoTexto}>Data: {visita.data || '-'}</Text>
                  <Text style={styles.infoTexto}>Cidade: {visita.cidade || '-'}</Text>
                  <Text style={styles.infoTexto}>Técnico: {visita.tecnico || '-'}</Text>
                  <Text style={styles.infoTexto}>Equipamentos: {visita.equipamentos?.length || 0}</Text>
                  <Text style={styles.infoTexto}>OK: {visita.resumo?.ok || 0} | Não: {visita.resumo?.nao || 0} | Pendentes: {visita.resumo?.pendentes || 0}</Text>

                  {visita.equipamentos?.map((eq, index) => (
                    <Text key={`${eq.nome}-${index}`} style={styles.historicoEquipamento}>
                      • {eq.tipo} - {eq.nome} {eq.modelo ? `(${eq.modelo})` : ''}
                    </Text>
                  ))}
                </View>
              ))
            )}
          </Secao>

          <TouchableOpacity style={styles.botaoRemoverGrande} onPress={limparHistorico}>
            <Text style={styles.botaoRemoverTexto}>Limpar histórico deste celular</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (tela === 'banco') {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.header}>
            <Image source={LOGO_FIXO} style={styles.logo} />
            <Text style={styles.titulo}>Banco de Checklists BRS</Text>
            <Text style={styles.subtitulo}>Modelos inteligentes por tipo de equipamento</Text>
          </View>

          <TouchableOpacity style={styles.botaoConfig} onPress={() => setTela('visita')}>
            <Text style={styles.botaoConfigTexto}>Voltar para a visita</Text>
          </TouchableOpacity>

          <Secao titulo="Tipos de equipamentos cadastrados">
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.tiposContainer}>
                {Object.keys(modelos).map((tipo) => (
                  <TouchableOpacity
                    key={tipo}
                    style={[styles.tipoBotao, tipoBanco === tipo ? styles.tipoBotaoAtivo : null]}
                    onPress={() => setTipoBanco(tipo)}
                  >
                    <Text style={[styles.tipoBotaoTexto, tipoBanco === tipo ? styles.tipoBotaoTextoAtivo : null]}>{tipo}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <Campo label="Criar novo tipo de equipamento" value={novoTipo} onChangeText={setNovoTipo} />
            <TouchableOpacity style={styles.botaoPrincipal} onPress={adicionarTipoBanco}>
              <Text style={styles.botaoPrincipalTexto}>Adicionar tipo ao banco</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.botaoRemoverGrande} onPress={removerTipoBanco}>
              <Text style={styles.botaoRemoverTexto}>Remover tipo selecionado</Text>
            </TouchableOpacity>
          </Secao>

          <Secao titulo={`Itens padrão: ${tipoBanco}`}>
            <Campo label="Novo item padrão" value={novoItemBanco} onChangeText={setNovoItemBanco} />
            <TouchableOpacity style={styles.botaoPrincipal} onPress={adicionarItemBanco}>
              <Text style={styles.botaoPrincipalTexto}>Adicionar item padrão</Text>
            </TouchableOpacity>

            {(modelos[tipoBanco] || []).map((item, index) => (
              <View key={`${item}-${index}`} style={styles.configItem}>
                {editandoBancoIndex === index ? (
                  <>
                    <TextInput style={styles.input} value={textoEditandoBanco} onChangeText={setTextoEditandoBanco} />
                    <TouchableOpacity style={styles.botaoOkPequeno} onPress={salvarEdicaoBanco}>
                      <Text style={styles.botaoPequenoTexto}>Salvar alteração</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <Text style={styles.itemTexto}>{item}</Text>
                    <View style={styles.botoesLinha}>
                      <TouchableOpacity style={styles.botaoEditar} onPress={() => { setEditandoBancoIndex(index); setTextoEditandoBanco(item); }}>
                        <Text style={styles.botaoEditarTexto}>Editar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.botaoRemover} onPress={() => removerItemBanco(index)}>
                        <Text style={styles.botaoRemoverTexto}>Remover</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>
            ))}
          </Secao>

          <TouchableOpacity style={styles.botaoSecundario} onPress={restaurarBancoInicial}>
            <Text style={styles.botaoSecundarioTexto}>Restaurar banco inicial da BRS</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.header}>
            <Image source={LOGO_FIXO} style={styles.logo} />
            <Text style={styles.titulo}>{dados.empresa}</Text>
            <Text style={styles.subtitulo}>Entrega técnica / Checklist de campo</Text>
            <Text style={styles.equipamento}>{equipamentos.length} equipamento(s) nesta visita</Text>
          </View>

          <TouchableOpacity style={styles.botaoConfig} onPress={() => setTela('banco')}>
            <Text style={styles.botaoConfigTexto}>Abrir Banco de Checklists BRS</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.botaoHistorico} onPress={() => setTela('historico')}>
            <Text style={styles.botaoFinalizarTexto}>Abrir Histórico de Visitas</Text>
          </TouchableOpacity>

          <View style={styles.cardResumo}>
            <View style={styles.resumoBox}><Text style={styles.resumoNumero}>{resumo.ok}</Text><Text style={styles.resumoTexto}>OK</Text></View>
            <View style={styles.resumoBox}><Text style={styles.resumoNumero}>{resumo.nao}</Text><Text style={styles.resumoTexto}>Não</Text></View>
            <View style={styles.resumoBox}><Text style={styles.resumoNumero}>{resumo.pendentes}</Text><Text style={styles.resumoTexto}>Pendentes</Text></View>
          </View>

          <Secao titulo="Dados do cliente e da visita">
            <Campo label="Nome da empresa" value={dados.empresa} onChangeText={(v) => atualizarCampo('empresa', v)} />
            <Campo label="Cliente" value={dados.cliente} onChangeText={(v) => atualizarCampo('cliente', v)} />
            <Campo label="E-mail do cliente" value={dados.emailCliente} onChangeText={(v) => atualizarCampo('emailCliente', v)} />
            <Campo label="Propriedade / Fazenda" value={dados.propriedade} onChangeText={(v) => atualizarCampo('propriedade', v)} />
            <Campo label="Cidade / UF" value={dados.cidade} onChangeText={(v) => atualizarCampo('cidade', v)} />
            <Campo label="Técnico responsável" value={dados.tecnico} onChangeText={(v) => atualizarCampo('tecnico', v)} />
            <Campo label="Data" value={dados.data} onChangeText={(v) => atualizarCampo('data', v)} />
          </Secao>

          <Secao titulo="Equipamentos desta visita">
            <BotoesEquipamentos />
            <TouchableOpacity style={styles.botaoPrincipal} onPress={adicionarEquipamento}>
              <Text style={styles.botaoPrincipalTexto}>Adicionar outro equipamento</Text>
            </TouchableOpacity>
          </Secao>

          <Secao titulo="Dados do equipamento selecionado">
            <Text style={styles.label}>Tipo de equipamento</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              <View style={styles.tiposContainer}>
                {Object.keys(modelos).map((tipo) => (
                  <TouchableOpacity
                    key={tipo}
                    style={[styles.tipoBotao, equipamento.tipo === tipo ? styles.tipoBotaoAtivo : null]}
                    onPress={() => trocarTipoEquipamento(tipo)}
                  >
                    <Text style={[styles.tipoBotaoTexto, equipamento.tipo === tipo ? styles.tipoBotaoTextoAtivo : null]}>{tipo}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <Campo label="Nome do equipamento" value={equipamento.nome} onChangeText={(v) => atualizarEquipamento('nome', v)} />
            <Campo label="Descrição" value={equipamento.descricao} onChangeText={(v) => atualizarEquipamento('descricao', v)} />
            <Campo label="Modelo" value={equipamento.modelo} onChangeText={(v) => atualizarEquipamento('modelo', v)} />
            <Campo label="Número de série" value={equipamento.serie} onChangeText={(v) => atualizarEquipamento('serie', v)} />

            <TouchableOpacity style={styles.botaoFoto} onPress={escolherFotoEquipamento}>
              <Text style={styles.botaoFotoTexto}>{equipamento.foto ? 'Trocar foto do equipamento' : 'Adicionar foto do equipamento'}</Text>
            </TouchableOpacity>
            {equipamento.foto ? <Image source={{ uri: equipamento.foto }} style={styles.fotoPreview} /> : <Text style={styles.semFoto}>Sem foto deste equipamento</Text>}

            <TouchableOpacity style={styles.botaoRemoverGrande} onPress={removerEquipamento}>
              <Text style={styles.botaoRemoverTexto}>Remover este equipamento</Text>
            </TouchableOpacity>
          </Secao>

          <Secao titulo="Adicionar item somente nesta visita">
            <Campo label="Novo item da visita" value={novoItemVisita} onChangeText={setNovoItemVisita} />
            <TouchableOpacity style={styles.botaoPrincipal} onPress={adicionarItemVisita}>
              <Text style={styles.botaoPrincipalTexto}>Adicionar item ao equipamento</Text>
            </TouchableOpacity>
          </Secao>

          <Secao titulo="Checklist do equipamento selecionado">
            {equipamento.itens.map((item, index) => {
              if (!item.ativo) return null;
              return (
                <View key={`${item.texto}-${index}`} style={styles.itemBox}>
                  {editandoItemVisita === index ? (
                    <>
                      <TextInput style={styles.input} value={textoEditandoVisita} onChangeText={setTextoEditandoVisita} />
                      <TouchableOpacity style={styles.botaoOkPequeno} onPress={salvarEdicaoItemVisita}>
                        <Text style={styles.botaoPequenoTexto}>Salvar alteração</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <>
                      <Text style={styles.itemTexto}>{item.texto}</Text>
                      <View style={styles.botoesLinha}>
                        <BotaoOpcao texto="OK" ativo={item.resposta === 'OK'} tipo="ok" onPress={() => alterarItemVisita(index, { resposta: 'OK' })} />
                        <BotaoOpcao texto="Não" ativo={item.resposta === 'NAO'} tipo="nao" onPress={() => alterarItemVisita(index, { resposta: 'NAO' })} />
                      </View>
                      <TextInput style={styles.obsItem} placeholder="Observação deste item" value={item.obs} onChangeText={(v) => alterarItemVisita(index, { obs: v })} />
                      <TouchableOpacity style={styles.botaoFotoItem} onPress={() => adicionarFotoItem(index)}>
                        <Text style={styles.botaoFotoItemTexto}>{item.foto ? 'Trocar foto deste item' : 'Adicionar foto deste item'}</Text>
                      </TouchableOpacity>
                      {item.foto ? <Image source={{ uri: item.foto }} style={styles.fotoItem} /> : null}
                      <View style={styles.botoesLinhaInferior}>
                        <TouchableOpacity style={styles.botaoEditar} onPress={() => { setEditandoItemVisita(index); setTextoEditandoVisita(item.texto); }}>
                          <Text style={styles.botaoEditarTexto}>Editar item</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.botaoRemover} onPress={() => removerItemVisita(index)}>
                          <Text style={styles.botaoRemoverTexto}>Remover item</Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  )}
                </View>
              );
            })}
          </Secao>

          <Secao titulo="Observações gerais da visita">
            <TextInput style={styles.textArea} placeholder="Digite observações gerais da visita." value={dados.observacoes} onChangeText={(v) => atualizarCampo('observacoes', v)} multiline />
          </Secao>

          <Secao titulo="Assinatura do cliente / responsável">
            {assinatura ? <Image source={{ uri: assinatura }} style={styles.assinaturaPreview} /> : <Text style={styles.semFoto}>Nenhuma assinatura registrada</Text>}
            <TouchableOpacity style={styles.botaoFinalizar} onPress={() => setAssinaturaAberta(true)}>
              <Text style={styles.botaoFinalizarTexto}>{assinatura ? 'Refazer assinatura' : 'Abrir tela de assinatura'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.botaoSecundario} onPress={limparAssinatura}>
              <Text style={styles.botaoSecundarioTexto}>Limpar assinatura</Text>
            </TouchableOpacity>
          </Secao>

          <TouchableOpacity style={styles.botaoFinalizar} onPress={() => Alert.alert('Checklist finalizado', `Cliente: ${dados.cliente}
Equipamentos: ${equipamentos.length}
OK: ${resumo.ok}
Não: ${resumo.nao}
Pendentes: ${resumo.pendentes}`)}>
            <Text style={styles.botaoFinalizarTexto}>Finalizar checklist</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.botaoPdf} onPress={() => gerarPdf(false)}>
            <Text style={styles.botaoFinalizarTexto}>Gerar PDF</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.botaoEmail} onPress={() => gerarPdf(true)}>
            <Text style={styles.botaoFinalizarTexto}>Enviar PDF por e-mail</Text>
          </TouchableOpacity>
        </ScrollView>

        <Modal visible={assinaturaAberta} animationType="slide">
          <SafeAreaView style={styles.modalAssinatura}>
            <View style={styles.modalTopo}>
              <Text style={styles.modalTitulo}>Assinatura do cliente</Text>
              <TouchableOpacity style={styles.botaoFechar} onPress={() => setAssinaturaAberta(false)}>
                <Text style={styles.botaoFecharTexto}>Fechar</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.assinaturaTelaCheia}>
              <SignatureScreen
                ref={assinaturaRef}
                onOK={salvarAssinatura}
                onEmpty={() => Alert.alert('Assinatura vazia', 'Assine antes de salvar.')}
                descriptionText="Assine dentro do quadro"
                clearText=""
                confirmText=""
                webStyle={`.m-signature-pad { box-shadow: none; border: none; height: 100%; } .m-signature-pad--body { border: 2px solid #123c69; border-radius: 12px; top: 0; bottom: 0; } .m-signature-pad--footer { display: none; } body,html { background-color: #fff; width: 100%; height: 100%; }`}
              />
            </View>

            <View style={styles.botoesAssinaturaModal}>
              <TouchableOpacity style={styles.botaoLimparAssinatura} onPress={() => assinaturaRef.current?.clearSignature()}>
                <Text style={styles.botaoFinalizarTexto}>Limpar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.botaoSalvarAssinatura} onPress={confirmarAssinatura}>
                <Text style={styles.botaoFinalizarTexto}>Salvar assinatura</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Secao({ titulo, children }) {
  return <View style={styles.card}><Text style={styles.secaoTitulo}>{titulo}</Text>{children}</View>;
}

function Campo({ label, value, onChangeText }) {
  return (
    <View style={styles.campoBox}>
      <Text style={styles.label}>{label}</Text>
      <TextInput style={styles.input} value={value} onChangeText={onChangeText} placeholder={label} />
    </View>
  );
}

function BotaoOpcao({ texto, ativo, tipo, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.botaoOpcao, ativo && tipo === 'ok' ? styles.botaoOkAtivo : null, ativo && tipo === 'nao' ? styles.botaoNaoAtivo : null]}>
      <Text style={[styles.botaoOpcaoTexto, ativo ? styles.botaoOpcaoTextoAtivo : null]}>{texto}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safe: { flex: 1, backgroundColor: '#eef2f7' },
  container: { padding: 16, paddingBottom: 40 },
  header: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    paddingVertical: 24,
    paddingHorizontal: 18,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dbe4ea',
    elevation: 4,
  },
  logo: { width: 220, height: 140, resizeMode: 'contain', marginBottom: 10 },
  titulo: { fontSize: 25, color: '#14532d', fontWeight: '900', textAlign: 'center' },
  subtitulo: { fontSize: 16, color: '#334155', marginTop: 6, textAlign: 'center', fontWeight: '700' },
  equipamento: { fontSize: 14, color: '#475569', marginTop: 8, textAlign: 'center', fontWeight: '600' },
  botaoConfig: { backgroundColor: '#f59e0b', borderRadius: 14, padding: 13, alignItems: 'center', marginBottom: 14 },
  botaoConfigTexto: { color: '#111827', fontWeight: '900' },
  botaoHistorico: { backgroundColor: '#334155', borderRadius: 14, padding: 13, alignItems: 'center', marginBottom: 14 },
  cardResumo: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, padding: 12, marginBottom: 14, elevation: 2 },
  resumoBox: { flex: 1, alignItems: 'center' },
  resumoNumero: { fontSize: 24, fontWeight: '900', color: '#123c69' },
  resumoTexto: { fontSize: 12, color: '#586273', marginTop: 3 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 14, elevation: 2 },
  secaoTitulo: { fontSize: 18, fontWeight: '900', color: '#123c69', marginBottom: 12 },
  campoBox: { marginBottom: 10 },
  label: { fontSize: 13, color: '#4b5563', marginBottom: 5, fontWeight: '800' },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, padding: 11, fontSize: 15, backgroundColor: '#f9fafb' },
  abasEquipamentos: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  abaEquipamento: { backgroundColor: '#e5e7eb', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12 },
  abaAtiva: { backgroundColor: '#123c69' },
  abaTexto: { color: '#111827', fontWeight: '800' },
  abaTextoAtivo: { color: '#fff' },
  tiposContainer: { flexDirection: 'row', gap: 8, paddingBottom: 4 },
  tipoBotao: { backgroundColor: '#e2e8f0', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, marginRight: 8 },
  tipoBotaoAtivo: { backgroundColor: '#14532d' },
  tipoBotaoTexto: { color: '#1e293b', fontWeight: '800' },
  tipoBotaoTextoAtivo: { color: '#fff' },
  botaoPrincipal: { backgroundColor: '#123c69', borderRadius: 12, padding: 13, alignItems: 'center', marginTop: 10 },
  botaoPrincipalTexto: { color: '#fff', fontWeight: '900' },
  configItem: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 12, marginBottom: 10, backgroundColor: '#fbfdff' },
  itemBox: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 12, marginBottom: 10, backgroundColor: '#fbfdff' },
  itemTexto: { fontSize: 15, color: '#111827', fontWeight: '800', marginBottom: 10 },
  historicoCard: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 14, padding: 12, marginBottom: 12, backgroundColor: '#f8fafc' },
  historicoTitulo: { fontSize: 17, fontWeight: '900', color: '#14532d', marginBottom: 8 },
  historicoEquipamento: { color: '#334155', fontWeight: '700', marginTop: 4 },
  botoesLinha: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  botoesLinhaInferior: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 10 },
  botaoOpcao: { flex: 1, minWidth: 90, borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, paddingVertical: 11, alignItems: 'center', backgroundColor: '#fff' },
  botaoOkAtivo: { backgroundColor: '#12805c', borderColor: '#12805c' },
  botaoNaoAtivo: { backgroundColor: '#b42318', borderColor: '#b42318' },
  botaoOpcaoTexto: { fontWeight: '900', color: '#334155' },
  botaoOpcaoTextoAtivo: { color: '#fff' },
  botaoEditar: { backgroundColor: '#2563eb', borderRadius: 10, paddingVertical: 11, paddingHorizontal: 14, alignItems: 'center' },
  botaoEditarTexto: { color: '#fff', fontWeight: '900' },
  botaoRemover: { backgroundColor: '#b42318', borderRadius: 10, paddingVertical: 11, paddingHorizontal: 14, alignItems: 'center' },
  botaoRemoverGrande: { backgroundColor: '#b42318', borderRadius: 12, padding: 13, alignItems: 'center', marginTop: 12 },
  botaoRemoverTexto: { color: '#fff', fontWeight: '900' },
  botaoOkPequeno: { backgroundColor: '#12805c', borderRadius: 10, padding: 12, marginTop: 8, alignItems: 'center' },
  botaoPequenoTexto: { color: '#fff', fontWeight: '900' },
  obsItem: { marginTop: 10, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 9, backgroundColor: '#fff' },
  botaoFoto: { backgroundColor: '#123c69', paddingHorizontal: 12, paddingVertical: 11, borderRadius: 10, alignItems: 'center' },
  botaoFotoTexto: { color: '#fff', fontWeight: '900' },
  botaoFotoItem: { backgroundColor: '#0f766e', borderRadius: 10, padding: 11, alignItems: 'center', marginTop: 10 },
  botaoFotoItemTexto: { color: '#fff', fontWeight: '900' },
  fotoPreview: { width: '100%', height: 190, borderRadius: 12, marginTop: 12, backgroundColor: '#e5e7eb' },
  fotoItem: { width: '100%', height: 180, borderRadius: 12, marginTop: 10, backgroundColor: '#e5e7eb' },
  semFoto: { marginTop: 10, color: '#6b7280', fontStyle: 'italic' },
  textArea: { minHeight: 120, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, padding: 11, fontSize: 15, backgroundColor: '#f9fafb', textAlignVertical: 'top' },
  assinaturaPreview: { width: '100%', height: 150, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 12, backgroundColor: '#fff', resizeMode: 'contain' },
  modalAssinatura: { flex: 1, backgroundColor: '#eef2f7', padding: 14 },
  modalTopo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalTitulo: { fontSize: 22, fontWeight: '900', color: '#123c69' },
  botaoFechar: { backgroundColor: '#b42318', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10 },
  botaoFecharTexto: { color: '#fff', fontWeight: '900' },
  assinaturaTelaCheia: { flex: 1, minHeight: 430, backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: '#d1d5db' },
  botoesAssinaturaModal: { flexDirection: 'row', gap: 10, marginTop: 12, marginBottom: 8 },
  botaoLimparAssinatura: { flex: 1, backgroundColor: '#64748b', borderRadius: 14, padding: 16, alignItems: 'center' },
  botaoSalvarAssinatura: { flex: 2, backgroundColor: '#12805c', borderRadius: 14, padding: 16, alignItems: 'center' },
  botaoSecundario: { marginTop: 10, borderWidth: 1, borderColor: '#123c69', borderRadius: 10, padding: 12, alignItems: 'center' },
  botaoSecundarioTexto: { color: '#123c69', fontWeight: '900' },
  botaoFinalizar: { backgroundColor: '#123c69', borderRadius: 16, padding: 16, alignItems: 'center', marginTop: 4 },
  botaoPdf: { backgroundColor: '#14532d', borderRadius: 16, padding: 16, alignItems: 'center', marginTop: 10 },
  botaoEmail: { backgroundColor: '#2563eb', borderRadius: 16, padding: 16, alignItems: 'center', marginTop: 10 },
  botaoFinalizarTexto: { color: '#fff', fontSize: 17, fontWeight: '900' },
});
