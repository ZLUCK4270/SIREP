// Registra, consulta o borra el webhook del bot de Telegram.
//
//   npm run telegram:webhook -- https://mi-dominio.com     (registra)
//   npm run telegram:webhook -- info                       (estado actual)
//   npm run telegram:webhook -- delete                     (lo quita)
//
// Lee TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET y PUBLIC_URL del .env (ver package.json: --env-file).
// Existe como script porque la regla del proyecto es que nada dependa de pasos hechos a mano.

const token = process.env.TELEGRAM_BOT_TOKEN;
const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
const accion = process.argv[2];

if (!token) {
    console.error('Falta TELEGRAM_BOT_TOKEN en el .env');
    process.exit(1);
}

const api = (metodo) => `https://api.telegram.org/bot${token}/${metodo}`;

async function llamar(metodo, cuerpo) {
    const res = await fetch(api(metodo), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cuerpo ?? {}),
    });
    const json = await res.json().catch(() => ({}));
    if (!json.ok) {
        console.error(`Telegram respondió con error en ${metodo}: ${json.description ?? res.status}`);
        process.exit(1);
    }
    return json.result;
}

function mostrarEstado(info) {
    console.log(`URL registrada:        ${info.url || '(ninguna)'}`);
    console.log(`Mensajes pendientes:   ${info.pending_update_count}`);
    if (info.last_error_message) {
        console.log(`Último error:          ${info.last_error_message}`);
    }
}

if (accion === 'info') {
    mostrarEstado(await llamar('getWebhookInfo'));
} else if (accion === 'delete') {
    await llamar('deleteWebhook', { drop_pending_updates: true });
    console.log('Webhook eliminado.');
} else {
    const base = (accion || process.env.PUBLIC_URL || '').replace(/\/+$/, '');
    if (!base.startsWith('https://')) {
        console.error('Telegram exige una URL pública con https. Pasa la URL como argumento o define PUBLIC_URL en el .env.');
        console.error('En local usa un túnel (ngrok http 3000, o cloudflared tunnel --url http://localhost:3000).');
        process.exit(1);
    }
    // Telegram solo acepta 1-256 caracteres entre A-Z a-z 0-9 _ -
    if (!secret || !/^[A-Za-z0-9_-]{1,256}$/.test(secret)) {
        console.error('TELEGRAM_WEBHOOK_SECRET debe existir y usar solo letras, números, "_" o "-" (máx. 256).');
        process.exit(1);
    }

    const url = `${base}/telegram/webhook`;
    await llamar('setWebhook', {
        url,
        secret_token: secret,
        allowed_updates: ['message'],
        drop_pending_updates: true,
    });
    console.log(`Webhook registrado en ${url}`);
    mostrarEstado(await llamar('getWebhookInfo'));
}
