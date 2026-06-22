import { Asset } from 'expo-asset';
import { File } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as MailComposer from 'expo-mail-composer';
import * as Print from 'expo-print';
import { Alert } from 'react-native';

function obterOrigemMidia(referencia) {
  if (!referencia) return '';
  if (typeof referencia === 'string') return referencia;
  return referencia.dataUri || referencia.uri || referencia.uriOriginal || referencia.fotoBase64 || referencia.base64 || '';
}

async function lerMidiaBase64(referencia) {
  const origem = obterOrigemMidia(referencia);
  if (!origem) return null;

  const texto = String(origem).trim();
  if (texto.startsWith('data:')) return texto.split(',')[1] || null;
  if (/^[A-Za-z0-9+/=\r\n]+$/.test(texto) && texto.length > 500) {
    return texto.replace(/\s/g, '');
  }

  let uri = texto;
  if (uri.startsWith('/')) uri = `file://${uri}`;
  if (!/^(file|content):\/\//i.test(uri)) return null;

  try {
    return await new File(uri).base64();
  } catch (erro) {
    console.log('Nao foi possivel converter uma imagem para o PDF:', erro?.message || erro);
    return null;
  }
}

export async function montarHtmlPdfVisita({ logoBase64, equipamentosPdf = [], dados = {}, numeroPedido = '', usuario = null, assinatura = null, gerarNumeroEntrega }) {
  const safe = (valor) =>
    String(valor ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

  const listaEquipamentos = Array.isArray(equipamentosPdf)
    ? equipamentosPdf
    : [];

  const resumoPdf = {
    ok: 0,
    nao: 0,
    pendentes: 0,
  };

  listaEquipamentos.forEach((eq) => {
    (eq.itens || [])
      .filter((item) => item.ativo !== false)
      .forEach((item) => {
        if (item.resposta === 'OK' || item.ok === true) resumoPdf.ok += 1;
        else if (item.resposta === 'NAO' || item.nao === true) resumoPdf.nao += 1;
        else resumoPdf.pendentes += 1;
      });
  });

  const equipamentosHtml = listaEquipamentos.length > 0
    ? listaEquipamentos.map((eq, eqIndex) => {
        const fotoEquipamentoSrc = eq.fotoBase64
          ? `data:image/jpeg;base64,${eq.fotoBase64}`
          : null;

        const fotoEquipamentoHtml = fotoEquipamentoSrc
          ? `
            <div class="fotoEquipamentoBox">
              <h3>Foto do equipamento</h3>
              <img class="fotoEquipamentoPdf" src="${fotoEquipamentoSrc}" />
            </div>
          `
          : '';

        const itensAtivos = (eq.itens || []).filter((item) => item.ativo !== false);

        const itemsHtml = itensAtivos.length > 0
          ? itensAtivos.map((item) => `
              <tr>
                <td>${safe(item.texto || item.item || '')}</td>
                <td class="centro ok">${item.resposta === 'OK' || item.ok === true ? 'OK' : ''}</td>
                <td class="centro nao">${item.resposta === 'NAO' || item.nao === true ? 'NÒO' : ''}</td>
                <td>${safe(item.obs || item.observacao || '')}</td>
              </tr>
            `).join('')
          : `
              <tr>
                <td colspan="4" class="vazio">Nenhum item de checklist encontrado para este equipamento.</td>
              </tr>
            `;

        const fotosItens = itensAtivos
          .filter((item) => item.fotoBase64 && String(item.fotoBase64).trim() !== '')
          .map((item) => `
            <div class="foto-item">
              <p><strong>${safe(item.texto || item.item || '')}</strong></p>
              <img class="foto" src="data:image/jpeg;base64,${item.fotoBase64}" />
            </div>
          `)
          .join('');

        return `
          <section class="equipamento">
            <div class="equipamentoTopo">
              <h2>Equipamento ${eqIndex + 1}: ${safe(eq.nome || eq.tipo || eq.tag || 'Equipamento')}</h2>
              <div class="tagEquipamento">${safe(eq.tag || eq.codigo || '')}</div>
            </div>

            <div class="dadosEquipamento">
              <p><strong>Tipo:</strong> ${safe(eq.tipo || '')}</p>
              <p><strong>Descrição:</strong> ${safe(eq.descritivo || eq.descricao || '')}</p>
              <p><strong>Modelo:</strong> ${safe(eq.modelo || '')}</p>
              <p><strong>Série:</strong> ${safe(eq.serie || '')}</p>
              <p><strong>Quantidade:</strong> ${safe(eq.quantidade || 1)}</p>
            </div>

            ${fotoEquipamentoHtml}

            <h3>Checklist deste equipamento</h3>
            <table>
              <thead>
                <tr>
                  <th>Item verificado</th>
                  <th>OK</th>
                  <th>Não</th>
                  <th>Observação</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            ${fotosItens ? `<h3>Fotos dos itens</h3><div class="fotos-container">${fotosItens}</div>` : ''}
          </section>
        `;
      }).join('')
    : `
        <div class="alertaPdf">
          Nenhum equipamento foi encontrado para gerar este relatório.
          Verifique se o checklist foi carregado antes de gerar o PDF.
        </div>
      `;

  const assinaturaHtml = assinatura
    ? `<img class="assinatura" src="${assinatura}" />`
    : '<p class="vazio">Sem assinatura registrada.</p>';

  const numeroEntrega = await gerarNumeroEntrega();
  const linkEntrega = `https://fieldcheckpro.app/entrega/${numeroEntrega}`;
  const qrCodeBase64 = `https://quickchart.io/qr?text=${encodeURIComponent(linkEntrega)}&size=140`;

  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          * { box-sizing: border-box; }
          body {
            font-family: Arial, Helvetica, sans-serif;
            margin: 0;
            color: #111827;
            background: #ffffff;
            font-size: 13px;
          }
          .cabecalhoPremium {
            text-align: center;
            padding: 12px 24px 10px;
            border-bottom: 1px solid #dbe4ea;
          }
          .logoPremium {
            width: 250px;
            height: 120px;
            object-fit: contain;
            display: block;
            margin: 0 auto 4px;
          }
          .slogan {
            font-size: 14px;
            font-weight: 700;
            color: #17325c;
            margin-bottom: 10px;
          }
          .contatosFieldCheck {
            display: flex;
            justify-content: center;
            gap: 18px;
            flex-wrap: wrap;
            color: #334155;
            font-size: 11px;
            line-height: 1.35;
          }
          .faixaTitulo {
            background: linear-gradient(135deg, #052554 0%, #0b3d7a 100%);
            color: white;
            text-align: center;
            padding: 22px 20px;
            border-bottom: 5px solid #38b44a;
          }
          .tituloPremium {
            font-size: 26px;
            font-weight: 900;
            margin-bottom: 12px;
          }
          .numeroEntregaPremium {
            display: inline-block;
            border: 1.5px solid rgba(255,255,255,0.55);
            border-radius: 12px;
            padding: 9px 24px;
            font-size: 20px;
            font-weight: 800;
            margin-bottom: 10px;
          }
          .subtituloPremium { font-size: 15px; }
          .validacaoBox {
            margin-top: 8px;
            font-size: 12px;
            color: #dbeafe;
          }
          .linkValidacao {
            margin-top: 4px;
            font-size: 10px;
            color: #bfdbfe;
            word-break: break-all;
          }
          .qrValidacao {
            margin-top: 10px;
            width: 90px;
            height: 90px;
            border-radius: 8px;
            background: #fff;
            padding: 4px;
          }
          .conteudo {
            padding: 26px;
          }
          .infoCliente {
            background: #f5f7fa;
            border: 1px solid #dbe3ea;
            border-left: 6px solid #123c69;
            border-radius: 12px;
            padding: 18px;
            margin-bottom: 22px;
          }
          .infoCliente h2,
          .equipamento h2,
          h2 {
            color: #123c69;
            margin: 0 0 12px;
          }
          .gridCliente {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px 18px;
          }
          .gridCliente p,
          .dadosEquipamento p {
            margin: 4px 0;
            line-height: 1.35;
          }
          .resumo {
            display: flex;
            justify-content: space-between;
            gap: 12px;
            margin: 14px 0 22px;
          }
          .box {
            flex: 1;
            background: linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%);
            border: 1px solid #d1d5db;
            border-radius: 12px;
            padding: 14px;
            text-align: center;
          }
          .numero {
            font-size: 24px;
            font-weight: 900;
            color: #123c69;
            margin-bottom: 5px;
          }
          .equipamento {
            margin: 0 0 28px;
            padding: 18px;
            border: 1px solid #dbe4ea;
            border-radius: 14px;
            page-break-inside: avoid;
          }
          .equipamentoTopo {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 10px;
            margin-bottom: 12px;
          }
          .equipamentoTopo h2 {
            margin: 0;
            font-size: 19px;
          }
          .tagEquipamento {
            background: #e8f1f8;
            color: #123c69;
            padding: 6px 10px;
            border-radius: 999px;
            font-weight: 800;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
          }
          th {
            background: #123c69;
            color: white;
            padding: 9px;
            font-size: 12px;
            text-align: left;
          }
          td {
            border: 1px solid #d1d5db;
            padding: 8px;
            font-size: 11px;
            vertical-align: top;
          }
          tr:nth-child(even) { background: #f8fafc; }
          .centro {
            text-align: center;
            font-weight: 900;
            width: 55px;
          }
          .ok { color: #15803d; }
          .nao { color: #b42318; }
          .fotoEquipamentoPdf {
            width: auto;
            max-width: 100%;
            max-height: 390px;
            height: auto;
            object-fit: contain;
            border-radius: 10px;
            border: 1px solid #dbe4ea;
            display: block;
            margin: 12px auto;
          }
          .fotos-container {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-top: 10px;
          }
          .foto-item {
            width: 180px;
            border: 1px solid #d1d5db;
            border-radius: 10px;
            padding: 8px;
            background: #f8fafc;
          }
          .foto {
            width: 164px;
            height: 124px;
            object-fit: cover;
            border: 1px solid #d1d5db;
            border-radius: 8px;
          }
          .assinatura {
            width: 320px;
            height: 120px;
            object-fit: contain;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            margin-top: 8px;
          }
          .observacoes {
            margin-top: 18px;
            padding: 14px;
            border-radius: 10px;
            background: #f8fafc;
            border: 1px solid #d1d5db;
            white-space: pre-wrap;
          }
          .alertaPdf {
            background: #fff7ed;
            border: 1px solid #fed7aa;
            color: #9a3412;
            border-radius: 12px;
            padding: 16px;
            font-weight: 700;
            margin-bottom: 18px;
          }
          .vazio {
            color: #64748b;
            font-style: italic;
            text-align: center;
          }
          .rodape {
            margin-top: 28px;
            padding-top: 12px;
            border-top: 1px solid #d1d5db;
            font-size: 10px;
            color: #64748b;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="cabecalhoPremium">
          <img class="logoPremium" src="data:image/jpeg;base64,${logoBase64}" />
          <div class="slogan">Soluções que geram produtividade no campo.</div>
          <div class="contatosFieldCheck">
            <div>�x� Rua Ronald Tkotz, 3808 � Jardim Tarobá, Cambé - PR</div>
            <div>��} (43) 3316-6045</div>
            <div>�S0 suporte@fieldcheckpro.app</div>
          </div>
        </div>

        <div class="faixaTitulo">
          <div class="tituloPremium">FieldCheck Pro</div>
          <div class="numeroEntregaPremium">Serviço de Campo Nº ${numeroEntrega}</div>
          <div class="subtituloPremium">Relatório de Serviço de Campo / Checklist de Equipamentos</div>
          <div class="validacaoBox">Código de validação: <strong>${numeroEntrega}</strong></div>
          <div class="linkValidacao">${linkEntrega}</div>
          <img class="qrValidacao" src="${qrCodeBase64}" />
        </div>

        <div class="conteudo">
          <div class="infoCliente">
            <h2>Dados do pedido e cliente</h2>
            <div class="gridCliente">
              <p><strong>Número do pedido:</strong> ${safe(dados.numeroPedido || numeroPedido || '')}</p>
              <p><strong>Cliente:</strong> ${safe(dados.cliente || '')}</p>
              <p><strong>Endereço:</strong> ${safe(dados.endereco || '')}</p>
              <p><strong>Cidade / Estado:</strong> ${safe(dados.cidade || '')} / ${safe(dados.estado || '')}</p>
              <p><strong>Telefone:</strong> ${safe(dados.telefone || dados.contato || '')}</p>
              <p><strong>E-mail:</strong> ${safe(dados.emailCliente || '')}</p>
              <p><strong>Responsável:</strong> ${safe(dados.responsavel || '')}</p>
              <p><strong>Técnico responsável:</strong> ${safe(dados.tecnico || usuario?.tecnico?.nome || usuario?.email || '')}</p>
              <p><strong>Data:</strong> ${safe(dados.data || '')}</p>
            </div>
          </div>

          <h2>Resumo final da inspeção</h2>
          <div class="resumo">
            <div class="box"><div class="numero">${resumoPdf.ok}</div><div>OK</div></div>
            <div class="box"><div class="numero">${resumoPdf.nao}</div><div>Não</div></div>
            <div class="box"><div class="numero">${resumoPdf.pendentes}</div><div>Pendentes</div></div>
          </div>

          <h2>Equipamentos verificados</h2>
          ${equipamentosHtml}

          <h2>Observações gerais</h2>
          <div class="observacoes">${safe(dados.observacoes || 'Sem observações.')}</div>

          <h2>Assinatura do cliente / responsável</h2>
          ${assinaturaHtml}

          <div class="rodape">
            Documento gerado pelo aplicativo de checklist técnico da FieldCheck Pro.
          </div>
        </div>
      </body>
    </html>
  `;
}

export async function gerarPdfVisita({ enviarEmail = false, equipamentos = [], dados = {}, pedidoEncontrado = null, logoModule, numeroPedido = '', usuario = null, assinatura = null, gerarNumeroEntrega }) {
  const equipamentosFonte = Array.isArray(equipamentos)
    ? equipamentos
    : [];

  if (!dados.cliente && !pedidoEncontrado?.cliente) {
    Alert.alert('Atenção', 'Preencha ou carregue o cliente antes de gerar o PDF.');
    return;
  }

  try {
    const asset = Asset.fromModule(logoModule);
    await asset.downloadAsync();

    const logoUri = asset.localUri || asset.uri;
    const logoBase64 = await lerMidiaBase64(logoUri) || '';

    const equipamentosComFotosBase64 = await Promise.all(
      equipamentosFonte.map(async (eq) => {
        const fotoBase64 = await lerMidiaBase64(eq.fotoBase64 || eq.foto || eq.foto_path);

        const itens = await Promise.all(
          (eq.itens || []).map(async (item) => ({
            ...item,
            fotoBase64: await lerMidiaBase64(item.fotoBase64 || item.foto || item.foto_path),
          }))
        );

        return {
          ...eq,
          fotoBase64,
          itens,
        };
      })
    );

    if (equipamentosComFotosBase64.length === 0) {
      Alert.alert(
        'Atenção',
        'Nenhum equipamento foi encontrado para montar o PDF. Volte para a visita e confira se os equipamentos foram carregados.'
      );
    }

    const htmlPdf = await montarHtmlPdfVisita({ logoBase64, equipamentosPdf: equipamentosComFotosBase64, dados, numeroPedido, usuario, assinatura, gerarNumeroEntrega });

    if (!htmlPdf || htmlPdf.trim().length < 500) {
      Alert.alert('Erro', 'O relatório ficou vazio antes de gerar o PDF.');
      return;
    }

    const arquivo = await Print.printToFileAsync({
      html: htmlPdf,
    });

    if (enviarEmail) {
      const disponivel = await MailComposer.isAvailableAsync();

      if (!disponivel) {
        Alert.alert('E-mail indisponível', 'Configure um aplicativo de e-mail no celular.');
        return;
      }

      await MailComposer.composeAsync({
        recipients: dados.emailCliente ? [dados.emailCliente] : [],
        subject: `Serviço de campo - ${dados.cliente || pedidoEncontrado?.cliente || ''}`,
        body: `Olá, segue em anexo o Relatório de Serviço Técnico da visita realizada em ${dados.data}.

Atenciosamente,
${dados.empresa || 'FieldCheck Pro'}`,
        attachments: [arquivo.uri],
      });
    } else {
      await Sharing.shareAsync(arquivo.uri);
    }
  } catch (error) {
    console.log('ERRO AO GERAR PDF:', error);
    Alert.alert('Erro', 'Não foi possível gerar o PDF. Veja o console para mais detalhes.');
  }
}
