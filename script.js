document.addEventListener('DOMContentLoaded', () => {

    const corpoTabela = document.getElementById('corpo-tabela');
    const cabecalhoTabela = document.getElementById('cabecalho-tabela');
    const csvUrl = 'TVBOX - inventario - TVBOX.csv';

    // Função central que desenha a tabela a partir do texto bruto do CSV
    function processarCSV(dadosText) {
        // Separa as linhas considerando quebras de linha Windows/Linux (\r\n ou \n)
        const linhas = dadosText.split(/\r?\n/).map(l => l.trim()).filter(l => l !== '');
        
        let headerIndex = -1;
        // Procura a linha exata que dita os atributos da tabela para ser o nosso Header
        for (let i = 0; i < linhas.length; i++) {
            if (linhas[i].startsWith('PROCESSADOR')) {
                headerIndex = i;
                break;
            }
        }

        if (headerIndex === -1) {
            corpoTabela.innerHTML = '<tr><td colspan="15" style="text-align:center; color: var(--neon-pink)">Cabeçalho de dados ("PROCESSADOR") não encontrado no arquivo CSV.</td></tr>';
            return;
        }

        corpoTabela.innerHTML = '';
        cabecalhoTabela.innerHTML = '';

        // Processa as Colunas do Cabeçalho
        const arrayCabecalhoBruto = linhas[headerIndex].split(',');
        const colunasValidasIndex = []; 
        const trHead = document.createElement('tr');
        
        arrayCabecalhoBruto.forEach((celula, index) => {
            const celulaLimpa = celula.replace(/"/g, '').trim();
            // Evita colunas de formatação vazias do lado direito do CSV
            if (celulaLimpa !== '') {
                colunasValidasIndex.push(index); 
                const th = document.createElement('th');
                th.textContent = celulaLimpa;
                trHead.appendChild(th);
            }
        });
        cabecalhoTabela.appendChild(trHead);

        // Processa o Corpo da Tabela
        let temDados = false;
        for (let i = headerIndex + 1; i < linhas.length; i++) {
            const linhaAtual = linhas[i];
            
            // Ignora linhas formadas apenas por vírgulas soltas
            if (linhaAtual.replace(/,/g, '').trim() === '') continue;

            const colunasDados = linhaAtual.split(',');
            const trBody = document.createElement('tr');

            colunasValidasIndex.forEach(index => {
                const td = document.createElement('td');
                // Se a célula não existir no array, preenche vazio
                let textoCelula = (colunasDados[index] || '').replace(/"/g, '').trim();
                td.textContent = textoCelula || '-';
                
                // Formatação simples de status
                if (textoCelula.toLowerCase().includes('concluída')) td.style.color = 'var(--neon-blue)';
                if (textoCelula.toLowerCase().includes('defeito')) td.style.color = 'var(--neon-pink)';
                
                trBody.appendChild(td);
            });

            corpoTabela.appendChild(trBody);
            temDados = true;
        }

        if (!temDados) {
             corpoTabela.innerHTML = '<tr><td colspan="15" style="text-align:center;">Nenhum equipamento registrado abaixo do cabeçalho.</td></tr>';
        }
    }

    // Função para renderizar o botão de Fallback de Upload
    function exibirErroComFallback() {
        corpoTabela.innerHTML = `
        <tr>
            <td colspan="15" style="text-align:center; padding: 40px;">
                <p style="color: var(--neon-pink); margin-bottom: 20px;">
                    O navegador bloqueou o carregamento automático local (CORS). <br>
                    <strong>Escolha o arquivo CSV manualmente abaixo para exibir a tabela:</strong>
                </p>
                <label for="csv-upload" class="btn-primary" style="cursor:pointer; font-size: 0.9rem; padding: 10px 20px;">Carregar Arquivo CSV</label>
                <input type="file" id="csv-upload" accept=".csv" style="display:none;">
            </td>
        </tr>`;

        // Ativa o leitor manual caso o usuário clique no botão gerado
        document.getElementById('csv-upload').addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = function(evento) {
                const conteudo = evento.target.result;
                processarCSV(conteudo);
            };
            reader.readAsText(file);
        });
    }

    // Tentativa 1: Fetch Automático (Funciona em Live Servers ou Servidor Hospedado)
    async function carregarTabelaAutomatica() {
        try {
            const resposta = await fetch(csvUrl);
            if (!resposta.ok) throw new Error("Erro de resposta");
            const dadosText = await resposta.text();
            processarCSV(dadosText);
        } catch (error) {
            // Entra aqui se der erro de arquivo ausente ou bloqueio CORS do "file:///"
            exibirErroComFallback();
        }
    }

    carregarTabelaAutomatica();

    // --- 2. BOTÕES DE CÓPIA PARA OS TERMINAIS ---
    document.querySelectorAll('.terminal').forEach(terminal => {
        const btn = document.createElement('button');
        btn.innerText = 'Copiar';
        btn.className = 'copy-btn';
        
        btn.addEventListener('click', () => {
            const codigo = terminal.querySelector('code').innerText;
            navigator.clipboard.writeText(codigo).then(() => {
                btn.innerText = 'Copiado!';
                btn.classList.add('success');
                setTimeout(() => {
                    btn.innerText = 'Copiar';
                    btn.classList.remove('success');
                }, 2000);
            }).catch(() => {
                btn.innerText = 'Erro';
            });
        });
        terminal.appendChild(btn);
    });

    // --- 3. SCROLL SPY (SUMÁRIO ATIVO) ---
    const links = document.querySelectorAll('.sidebar-index a');
    const secoes = document.querySelectorAll('.tutorial-step');

    const observerOptions = {
        rootMargin: '-100px 0px -70% 0px',
        threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                links.forEach(l => l.classList.remove('active-link'));
                const id = entry.target.getAttribute('id');
                const linkAtivo = document.querySelector(`.sidebar-index a[href="#${id}"]`);
                if (linkAtivo) linkAtivo.classList.add('active-link');
            }
        });
    }, observerOptions);

    secoes.forEach(secao => observer.observe(secao));
});