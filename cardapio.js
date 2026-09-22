let categoriasAbertas = {};

window.renderizarCardapio = function(pratosGlobais, categoriaSelecionada, termoBusca, containerId, containerChipsId) {
    const containerCategorias = document.getElementById(containerChipsId);
    if (!containerCategorias) return;

    // Extrai as categorias únicas e ordena alfabeticamente, mantendo 'TODOS' na frente
    const categoriasExtras = [...new Set(pratosGlobais.map(i => (i.categoria || "Geral").toUpperCase()))].sort();
    const categoriasUnicas = ['TODOS', ...categoriasExtras];

    let chipsHtml = '';
    categoriasUnicas.forEach(cat => {
        const ativo = categoriaSelecionada === cat ? 'active' : '';
        chipsHtml += `<button class="category-chip ${ativo}" onclick="mudarCategoriaPrincipal('${cat}')">${cat}</button>`;
    });
    containerCategorias.innerHTML = chipsHtml;

    let pratosFiltrados = pratosGlobais.filter(item => {
        const matchCategoria = categoriaSelecionada === 'TODOS' || (item.categoria || "Geral").toUpperCase() === categoriaSelecionada;
        const matchBusca = item.nome.toLowerCase().includes(termoBusca);
        return matchCategoria && matchBusca;
    });

    const container = document.getElementById(containerId);
    if (!container) return;

    if (pratosFiltrados.length === 0) {
        container.innerHTML = "<p class='msg-empty'>Nenhum prato encontrado.</p>";
        return;
    }

    const categorias = {};
    pratosFiltrados.forEach(item => {
        const cat = (item.categoria || "Geral").toUpperCase();
        if (!categorias[cat]) categorias[cat] = [];
        categorias[cat].push(item);
    });

    if (termoBusca.length > 0) {
        Object.keys(categorias).forEach(cat => categoriasAbertas[cat] = true);
    }

    let html = `<div class="categories-list-minimal">`;
    
    // Ordena as chaves das categorias em ordem alfabética na listagem minimalista
    const chavesCategorias = Object.keys(categorias).sort();

    chavesCategorias.forEach(cat => {
        const isOpen = categoriasAbertas[cat];
        const itemClass = isOpen ? 'category-list-item active' : 'category-list-item';

        html += `
            <div class="${itemClass}" onclick="toggleCategoria('${cat}')">
                <span class="category-list-name">${cat}</span>
                <span class="category-list-arrow">${isOpen ? '▲' : '▼'}</span>
            </div>
        `;
        
        if (isOpen) {
            const nomeSafe = cat.replace(/\s+/g, '-');
            html += `
                <div class="category-expanded-section" id="section-${nomeSafe}">
                    <div class="menu-grid">
            `;
            
            categorias[cat].forEach(item => {
                const img = (item.imagem && item.imagem.trim() !== "") ? item.imagem : "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400";
                const precoNum = Number(item.preco) || 0;
                const precoStr = precoNum.toFixed(2);
                const nomeEscapado = item.nome.replace(/'/g, "\\'");
                
                html += `
                    <div class="menu-card">
                        <img src="${img}" class="menu-card-img" alt="${item.nome}">
                        <div class="menu-card-body">
                            <div class="menu-card-header">
                                <span class="menu-card-name">${item.nome}</span>
                                <span class="menu-card-price">R$ ${precoStr}</span>
                            </div>
                            <button onclick="alterarQuantidadeCarrinho('${nomeEscapado}', 1, ${precoNum}, '${img}')" class="btn-add">Adicionar</button>
                        </div>
                    </div>
                `;
            });
            
            html += `</div></div>`;
        }
    });
    html += `</div>`;
    
    container.innerHTML = html;
};

window.toggleCategoria = function(cat) {
    categoriasAbertas[cat] = !categoriasAbertas[cat];
    if (typeof window.atualizarInterfaceTotal === 'function') {
        window.atualizarInterfaceTotal();
    }
};