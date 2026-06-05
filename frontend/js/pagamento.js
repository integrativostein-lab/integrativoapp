// Configuração do Stripe (modo teste)
const STRIPE_PUBLIC_KEY = 'pk_test_1234567890abcdefghijklmn';

// Cartões de teste do Stripe
const CARTOES_TESTE = [
    { numero: '4242 4242 4242 4242', bandeira: 'Visa', cvv: '123', validade: '12/28' },
    { numero: '5555 5555 5555 4444', bandeira: 'Mastercard', cvv: '123', validade: '12/28' },
    { numero: '3782 822463 10005', bandeira: 'Amex', cvv: '1234', validade: '12/28' }
];

// Função para processar pagamento (modo teste)
async function processarPagamento(dados) {
    const { produto, valor, profissionalId } = dados;
    const email = localStorage.getItem('user_email') || 'teste@demo.com';

    const response = await fetch('/api/pagamento/criar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            produto,
            valor,
            email,
            profissionalId
        })
    });

    const resultado = await response.json();

    if (resultado.modo_teste) {
        alert('🔵 MODO TESTE: Pagamento simulado! Nenhum valor foi cobrado.');
        console.log('NF Simulada:', resultado.nota_fiscal);
    }

    return resultado;
}

// Função para exibir alerta de certificado (NF simulada)
function alertaCertificado() {
    const modoTeste = localStorage.getItem('modo_teste') === 'true';
    
    if (modoTeste) {
        return '🔵 MODO TESTE: As notas fiscais são SIMULADAS. Nenhum certificado digital é necessário.';
    }
    
    return '⚠️ Você não possui certificado digital. A emissão de NF será simulada até a ativação do certificado A1.';
}

// Exportar (se usando módulos)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { processarPagamento, alertaCertificado, CARTOES_TESTE };
}