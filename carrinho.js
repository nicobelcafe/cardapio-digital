const CACHE_KEY = 'carrinho_cliente_local';
let carrinho = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');

function salvarCarrinho(onUpdate) {
    localStorage.setItem(CACHE_KEY, JSON.stringify(carrinho));
    if (typeof onUpdate === 'function') onUpdate();
}

window.alterarQuantidadeCarrinho = function(nome, delta, precoStr, imgStr) {
    if (!carrinho[nome]) {
        if (delta > 0) {
            carrinho[nome] = { quantidade: delta, preco: Number(precoStr), imagem: imgStr };
        }
    } else {
        carrinho[nome].quantidade += delta;
        if (carrinho[nome].quantidade <= 0) {
            delete carrinho[nome];
        }
    }
    salvarCarrinho(window.atualizarInterfaceTotal);
};

window.renderizarCarrinho = function(containerId, btnFlutuanteId) {
    const container = document.getElementById(containerId);
    const btnFlutuante = document.getElementById(btnFlutuanteId);
    const itens = Object.keys(carrinho);
    
    if (itens.length === 0) {
        container.innerHTML = `
            <div class="cart-title">Seu Carrinho</div>
            <div class="cart-empty">Vazio no momento.</div>
        `;
        if (btnFlutuante) btnFlutuante.style.display = 'none';
        return;
    }

    let total = 0;
    let qtdItens = 0;
    let html = `<div class="cart-title">🛒 Seu Carrinho</div>`;

    itens.forEach(nome => {
        const item = carrinho[nome];
        const subtotal = item.quantidade * item.preco;
        total += subtotal;
        qtdItens += item.quantidade;
        const img = item.imagem || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=150";
        const nomeEscapado = nome.replace(/'/g, "\\'");

        html += `
            <div class="cart-item">
                <img src="${img}" class="cart-item-img" alt="${nome}">
                <div class="cart-item-details">
                    <span class="cart-item-name">${nome}</span>
                    <span class="cart-item-price">R$ ${item.preco.toFixed(2)}</span>
                </div>
                <div class="cart-controls">
                    <button onclick="alterarQuantidadeCarrinho('${nomeEscapado}', -1)" class="btn-qtd">-</button>
                    <span class="cart-item-qtd">${item.quantidade}</span>
                    <button onclick="alterarQuantidadeCarrinho('${nomeEscapado}', 1)" class="btn-qtd">+</button>
                </div>
            </div>
        `;
    });

    html += `
        <div class="cart-total-container">
            <span class="cart-total-label">Total</span>
            <span class="cart-total-value">R$ ${total.toFixed(2)}</span>
        </div>

        <div class="checkout-section">
            <label class="checkout-label">Tipo de Atendimento</label>
            <select id="select-entrega" class="checkout-select" onchange="atualizarTipoEntrega()">
                <option value="Retirada">Retirada no Local</option>
                <option value="Comer no Local">Comer no Local</option>
                <option value="Delivery">Delivery</option>
            </select>

            <div id="container-endereco" style="display: none; flex-direction: column; gap: 8px;">
                <label class="checkout-label">Endereço de Entrega</label>
                <input type="text" id="input-endereco" class="checkout-input" autocomplete="street-address" placeholder="Rua, número, bairro, complemento...">
                <div class="delivery-notice">
                    ℹ️ O valor do frete é cotado após o pedido pelo Uber Entregas. Por conta disso, o tempo de entrega pode ficar em torno de 30 minutos após o pagamento exclusivamente pelo <b>PIX</b>.
                </div>
            </div>

            <label class="checkout-label">Forma de Pagamento</label>
            <select id="select-pagamento" class="checkout-select" onchange="atualizarCamposPagamento()">
                <option value="Pix">Pix</option>
                <option value="Crédito">Cartão de Crédito</option>
                <option value="Débito">Cartão de Débito</option>
                <option value="Dinheiro">Dinheiro</option>
            </select>

            <div id="container-troco" style="display: none; flex-direction: column; gap: 6px;">
                <label class="checkout-label">Troco para quanto?</label>
                <input type="text" id="input-troco" class="checkout-input" placeholder="Ex: R$ 50,00">
            </div>
        </div>

        <button onclick="enviarWhatsAppCarrinho()" class="btn-whatsapp">
            📲 Enviar Pedido via WhatsApp
        </button>
    `;
    
    container.innerHTML = html;
    if (btnFlutuante) {
        btnFlutuante.style.display = 'flex';
        btnFlutuante.innerHTML = `🛒 Ver Pedido (${qtdItens}) - R$ ${total.toFixed(2)}`;
    }
};

window.atualizarTipoEntrega = function() {
    const selectEntrega = document.getElementById('select-entrega');
    const selectPagamento = document.getElementById('select-pagamento');
    const containerEndereco = document.getElementById('container-endereco');
    const containerTroco = document.getElementById('container-troco');

    if (!selectEntrega) return;

    const isDelivery = selectEntrega.value === 'Delivery';
    if (containerEndereco) containerEndereco.style.display = isDelivery ? 'flex' : 'none';

    if (isDelivery) {
        selectPagamento.value = 'Pix';
        selectPagamento.disabled = true;
        if (containerTroco) containerTroco.style.display = 'none';
    } else {
        selectPagamento.disabled = false;
        atualizarCamposPagamento();
    }
};

window.atualizarCamposPagamento = function() {
    const selectPagamento = document.getElementById('select-pagamento');
    const containerTroco = document.getElementById('container-troco');
    if (!selectPagamento || !containerTroco) return;

    containerTroco.style.display = selectPagamento.value === 'Dinheiro' ? 'flex' : 'none';
};

window.enviarWhatsAppCarrinho = function() {
    const itens = Object.keys(carrinho);
    if (itens.length === 0) return;

    const selectEntrega = document.getElementById('select-entrega');
    const selectPagamento = document.getElementById('select-pagamento');
    const inputTroco = document.getElementById('input-troco');
    const inputEndereco = document.getElementById('input-endereco');

    const tipoEntrega = selectEntrega ? selectEntrega.value : 'Retirada';
    let pagamento = selectPagamento ? selectPagamento.value : 'Pix';
    const troco = inputTroco ? inputTroco.value.trim() : '';
    const endereco = inputEndereco ? inputEndereco.value.trim() : '';

    if (tipoEntrega === 'Delivery' && !endereco) {
        alert('Por favor, informe o endereço para entrega.');
        if (inputEndereco) inputEndereco.focus();
        return;
    }

    let totalGeral = 0;
    let mensagem = "Olá! Gostaria de fazer o seguinte pedido:\n\n";

    itens.forEach(nome => {
        const item = carrinho[nome];
        const subtotal = item.quantidade * item.preco;
        totalGeral += subtotal;
        mensagem += `${item.quantidade}x ${nome} - R$ ${subtotal.toFixed(2)}\n`;
    });

    mensagem += `\n*Total: R$ ${totalGeral.toFixed(2)}*`;
    mensagem += `\n\nTipo: ${tipoEntrega}`;
    
    if (tipoEntrega === 'Delivery') {
        mensagem += `\nEndereço: ${endereco}`;
        pagamento = 'Pix';
    }

    mensagem += `\nPagamento: ${pagamento}`;
    if (pagamento === 'Dinheiro' && troco) {
        mensagem += ` (Troco para: R$ ${troco})`;
    }

    const numeroWhatsApp = "5551993967417";
    const url = `https://api.whatsapp.com/send?phone=${numeroWhatsApp}&text=${encodeURIComponent(mensagem)}`;
    window.open(url, '_blank');
};