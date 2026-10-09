// Questionário do Grupo Econômico — texto das perguntas fornecido pelo cliente em
// 09/10/2026 (planilha "Nas perguntas utilizar o texto abaixo"). Fonte única da UI e da
// validação do servidor.
//
// As respostas moram em PerfilGrupoEconomico.respostas (JSON, { [chave]: texto }), não
// em uma coluna por pergunta: o cliente reescreve/acrescenta perguntas com frequência, e
// a chave estável desacopla o texto da pergunta (que muda) da resposta já salva. NUNCA
// renomeie uma `chave` já publicada — reescreva só o `texto`. Chave removida daqui deixa
// de ser aceita no save (descartada pelo servidor) mas não apaga resposta antiga do banco.
//
// A única pergunta numérica (taxa de desfrute) continua em coluna própria
// (`pecuariaTaxaDesfrutePercent`), marcada aqui com `tipo: 'percentual'`.

export interface PerguntaTexto {
  tipo: 'texto';
  chave: string;
  texto: string;
}

export interface PerguntaPercentual {
  tipo: 'percentual';
  coluna: 'pecuariaTaxaDesfrutePercent';
  texto: string;
}

export type PerguntaGrupo = PerguntaTexto | PerguntaPercentual;

export interface SecaoPerguntasGrupo {
  id: string;
  titulo: string;
  tom: 'verde' | 'azul' | 'laranja'; // cor de origem da planilha — só ênfase visual
  perguntas: PerguntaGrupo[];
}

const t = (chave: string, texto: string): PerguntaTexto => ({ tipo: 'texto', chave, texto });

export const SECOES_PERGUNTAS_GRUPO: SecaoPerguntasGrupo[] = [
  {
    id: 'historico',
    titulo: 'Histórico',
    tom: 'verde',
    perguntas: [
      t('historico_inicio', 'Quando e onde começou a atividade?'),
      t('historico_heranca', 'Como iniciou na atividade (herança dos pais ou outra forma)?'),
      t(
        'historico_evolucao',
        'Descrever a evolução da atividade (aumento de terras produtivas, aumento do rebanho, produtividade, tecnologia inserida com o passar do tempo, etc.)'
      ),
      t(
        'historico_crises',
        'Já enfrentou problemas climáticos relevantes que prejudicaram a atividade? Como enfrentou a crise (medidas tomadas para solucionar o problema)?'
      )
    ]
  },
  {
    id: 'gestao',
    titulo: 'Gestão - Sucessão',
    tom: 'verde',
    perguntas: [
      t('gestao_conducao', 'Quem conduz e administra a atividade?'),
      t('gestao_parceria', 'A atividade é realizada em sistema de parceria? Caso sim, explicar quem são os sócios.'),
      t('gestao_distribuicao', 'Como é a distribuição das atividades entre os sócios?'),
      t('gestao_custos_faturamento', 'Como cada sócio arca com os custos e participa do faturamento?'),
      t('gestao_sucessao', 'Há plano sucessório? Os herdeiros já atuam na atividade? Como é a participação?')
    ]
  },
  {
    id: 'agricultura',
    titulo: 'Modus Operandi - Sistema de Produção (AGRICULTURA)',
    tom: 'azul',
    perguntas: [
      t(
        'agricultura_custos',
        'De forma detalhada, explicar como é constituído os custos da atividade (compra de insumos, fertilizantes, abertura de área, mão de obra, novas tecnologias, mudança de atividade, etc.).'
      ),
      t('agricultura_cronograma', 'Qual o cronograma de plantio, colheita e comercialização das culturas?'),
      t('agricultura_insumos', 'Qual o cronograma de compra de insumos e defensivos?'),
      t('agricultura_armazenagem', 'Tem armazenagem própria? Qual a capacidade estática? Geralmente armazena quantos % da produção?'),
      t('agricultura_fornecedores_clientes', 'Quem são os fornecedores e clientes?'),
      t('agricultura_compras', 'Como realiza suas compras - Trocas %, trava preços, a vista, a prazo?'),
      t(
        'agricultura_prazos',
        'Quais os prazos de pagamento que recebe de seus fornecedores e quais os prazos que concede a seus clientes?'
      ),
      t('agricultura_exportacao', 'O cliente é exportador? Se sim, é exportador direto ou indireto?')
    ]
  },
  {
    id: 'pecuaria',
    titulo: 'Modus Operandi - Sistema de Produção (PECUÁRIA)',
    tom: 'laranja',
    perguntas: [
      t('pecuaria_ciclo', 'Qual o ciclo de produção (cria, recria e venda de boi magro, recria e engorda e ciclo completo.)'),
      t('pecuaria_confinamento', 'Possui confinamento próprio? Em qual propriedade está localizado esse confinamento?'),
      { tipo: 'percentual', coluna: 'pecuariaTaxaDesfrutePercent', texto: 'Qual a porcentagem do rebanho é comercializada (taxa de desfrute)?' },
      t('pecuaria_percentual_confinados', 'Que percentual dos animais abatidos são confinados?'),
      t(
        'pecuaria_custos',
        'De forma detalhada, explicar como é constituído os custos da atividade (compra de grãos para nutrição, ampliação das áreas de pastagens, reforma de pastagens, mão de obra, novas tecnologias, mudança de atividade, etc.).'
      ),
      t('pecuaria_cronograma', 'Qual o cronograma da atividade (época de compra de animais, compra de insumos, comercialização dos animais, etc.)'),
      t('pecuaria_fornecedores_clientes', 'Quem são os fornecedores e clientes? Em quais frigoríficos abate os animais? Quais os prazos?'),
      t('pecuaria_compras', 'Como realiza suas compras - Troca%, trava, preços, a vista, prazo?')
    ]
  },
  {
    id: 'financeiro',
    titulo: 'Gestão Financeira',
    tom: 'verde',
    perguntas: [
      t('financeiro_financiamento', 'Como financia seus custos (bancos, fornecedores e recursos próprios)?'),
      t(
        'financeiro_hedge',
        'Qual a política de Hedge? Como o cliente se protege das possíveis variações dos preços das commodities? Qual a posição para esta safra?'
      ),
      t('financeiro_cambio', 'Como o cliente se protege das possíveis variações cambiais?'),
      t('financeiro_posicao', 'Quanto da safra atual (ton/sac/@) já está negociada, a qual preço com qual Trading?')
    ]
  },
  {
    id: 'coligadas',
    titulo: 'Outras Atividades - Empresas Coligadas',
    tom: 'verde',
    perguntas: [
      t(
        'coligadas_participacoes',
        'Participação societária em outras empresas? Quais atividades exercidas por essas empresas? Qual a participação?'
      )
    ]
  }
];

export const CHAVES_RESPOSTAS_GRUPO: string[] = SECOES_PERGUNTAS_GRUPO.flatMap((s) =>
  s.perguntas.flatMap((p) => (p.tipo === 'texto' ? [p.chave] : []))
);
