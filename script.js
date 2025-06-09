const APP_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxx8OOTbVVgsjBj3Cvv6jW9lYfE2i0Hdlx9ggdpA8WlYF0czlf37TY9MSz6bdmWLFb6/exec'; // 🔁 Troque pelo seu

document.addEventListener("DOMContentLoaded", () => {
    const estados = [
        "AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO", "MA",
        "MG", "MS", "MT", "PA", "PB", "PE", "PI", "PR", "RJ", "RN",
        "RO", "RR", "RS", "SC", "SE", "SP", "TO"
    ];
    popularEstados(estados);
    });

    function popularEstados(estados) {
    const estadoSelect = document.getElementById("estado");
    estados.forEach(sigla => {
        const option = document.createElement("option");
        option.value = sigla;
        option.textContent = sigla;
        estadoSelect.appendChild(option);
    });
    }

    document.getElementById("estado").addEventListener("change", () => {
    const sigla = document.getElementById("estado").value;

    const tribunalSelect = document.getElementById("tribunal");
    tribunalSelect.classList.remove("hidden");
    tribunalSelect.innerHTML = '<option selected disabled>Carregando tribunais...</option>';

    fetch(`${APP_SCRIPT_URL}?estado=${sigla}`)
        .then(response => response.json())
        .then(data => {
        tribunalSelect.innerHTML = '<option selected disabled>Selecione um tribunal</option>';
        data.forEach(trb => {
            const option = document.createElement("option");
            option.value = trb;
            option.textContent = trb;
            tribunalSelect.appendChild(option);
        });
        })
        .catch(error => {
        tribunalSelect.innerHTML = '<option selected disabled>Erro ao carregar tribunais</option>';
        console.error(error);
        });

    popularMunicipiosAPI(sigla);
    });

    function popularMunicipiosAPI(sigla) {
    const municipioSelect = document.getElementById("municipio");
    municipioSelect.classList.remove("hidden");
    municipioSelect.innerHTML = '<option selected disabled>Carregando municípios...</option>';

    fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${sigla}/municipios`)
        .then(response => response.json())
        .then(data => {
        municipioSelect.innerHTML = '<option selected disabled>Selecione um município</option>';
        data.forEach(m => {
            const option = document.createElement("option");
            option.value = m.nome;
            option.textContent = m.nome;
            municipioSelect.appendChild(option);
        });
        })
        .catch(err => {
        municipioSelect.innerHTML = '<option selected disabled>Erro ao carregar municípios</option>';
        console.error(err);
        });
    }

    document.getElementById("calcular").addEventListener("click", async () => {
    const dataInicialInput = document.getElementById("data-inicial").value;
    const prazoDias = parseInt(document.getElementById("prazo").value);
    const tipoContagem = document.getElementById("tipo-contagem").value;
    const estado = document.getElementById("estado").value;
    const municipio = document.getElementById("municipio").value;

    if (!dataInicialInput || isNaN(prazoDias)) {
        document.getElementById("resultado").textContent = "Preencha todos os campos corretamente.";
        return;
    }

    const dataInicial = new Date(dataInicialInput);

    if (tipoContagem === "corridos") {
        const dataFinal = new Date(dataInicial);
        dataFinal.setDate(dataInicial.getDate() + prazoDias);
        gerarTabelaDias(dataInicial, dataFinal);
    } else {
        const resultado = await calcularDiasUteis(dataInicial, prazoDias, estado, municipio);
        gerarTabelaDetalhada(resultado.dias);
    }
    });

    async function calcularDiasUteis(dataInicial, prazo, estado, municipio) {
    let data = new Date(dataInicial);
    let diasAdicionados = 0;
    const ano = data.getFullYear();
    const feriadosDetalhados = await carregarFeriadosDetalhados(ano, estado, municipio);

    const feriadosMap = new Map(feriadosDetalhados.map(f => [f.date, f.name]));
    const diasDetalhados = [];

    while (diasAdicionados < prazo) {
        data.setDate(data.getDate() + 1);
        const diaSemana = data.getDay(); // 0 = domingo, 6 = sábado
        const dataStr = data.toISOString().split('T')[0];

        let tipo = '';
        let descricao = '';

        if (feriadosMap.has(dataStr)) {
        tipo = 'Feriado';
        descricao = feriadosMap.get(dataStr);
        } else if (diaSemana === 0 || diaSemana === 6) {
        tipo = 'Final de Semana';
        } else {
        tipo = 'Dia Útil';
        }

        if (tipo === 'Dia Útil') {
        diasAdicionados++;
        }

        diasDetalhados.push({
        data: new Date(data),
        tipo: tipo,
        descricao: descricao
        });
    }

    return {
        dataFinal: data,
        dias: diasDetalhados
    };
    }

    async function carregarFeriadosDetalhados(ano, estado, municipio) {
    const estadoLower = estado.toLowerCase();
    const municipioLower = municipio
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/\s+/g, '-');

    const urls = [
        `https://brasilapi.com.br/api/feriados/v1/${ano}`,
        `https://brasilapi.com.br/api/feriados/v1/${ano}/${estadoLower}`,
        `https://brasilapi.com.br/api/feriados/v1/${ano}/${estadoLower}/${municipioLower}`
    ];

    const todos = [];

    for (let url of urls) {
        try {
        const res = await fetch(url);
        const json = await res.json();
        if (Array.isArray(json)) {
            todos.push(...json);
        }
        } catch (err) {
        console.warn(`Erro ao buscar feriados em ${url}`, err);
        }
    }

    return todos;
    }

    function gerarTabelaDias(dataInicial, dataFinal) {
    const dias = [];
    let data = new Date(dataInicial);

    while (data <= dataFinal) {
        const diaSemana = data.getDay();
        let tipo = (diaSemana === 0 || diaSemana === 6) ? 'Final de Semana' : 'Dia Útil';

        dias.push({
        data: new Date(data),
        tipo: tipo,
        descricao: ''
        });

        data.setDate(data.getDate() + 1);
    }

    gerarTabelaDetalhada(dias);
    }

    function gerarTabelaDetalhada(dias) {
    let html = `<table class="table table-bordered mt-3">
        <thead>
        <tr>
            <th>Data</th>
            <th>Tipo</th>
            <th>Descrição</th>
        </tr>
        </thead>
        <tbody>`;

    dias.forEach(item => {
        html += `
        <tr>
            <td>${item.data.toLocaleDateString()}</td>
            <td>${item.tipo}</td>
            <td>${item.descricao || '-'}</td>
        </tr>`;
    });

    html += `</tbody></table>`;
    document.getElementById("resultado").innerHTML = html;
}
