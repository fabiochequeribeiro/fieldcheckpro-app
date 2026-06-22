export async function comTempoLimite(promessa, tempoMs = 8000, mensagem = 'A conexão demorou mais que o esperado.') {
  let timer;
  try {
    return await Promise.race([
      Promise.resolve(promessa),
      new Promise((_, reject) => {
        timer = setTimeout(() => {
          const erro = new Error(mensagem);
          erro.codigo = 'TEMPO_LIMITE';
          reject(erro);
        }, tempoMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export function erroDeTempoLimite(erro) {
  return erro?.codigo === 'TEMPO_LIMITE';
}
