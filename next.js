export default async function handler(req, res) {
    const { ano, estado, municipio } = req.query;

    let url = `https://brasilapi.com.br/api/feriados/v1/${ano}`;
    if (estado) url += `/${estado.toLowerCase()}`;
    if (municipio) {
        const munSlug = municipio.normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/\s+/g, '-');
        url += `/${munSlug}`;
    }

    try {
        const response = await fetch(url);
        const json = await response.json();
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.status(200).json(json);
    } catch (err) {
        res.status(500).json({ error: 'Erro ao buscar feriados', detalhe: err.toString() });
    }
}