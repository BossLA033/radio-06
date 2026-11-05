import { expect, test, type Page } from '@playwright/test';

const ROTAS = [
  '/',
  '/noticias/',
  '/programacao/',
  '/programas/',
  '/podcasts/',
  '/apresentadores/',
  '/eventos/',
  '/videos/',
  '/sobre/',
  '/contactos/',
  '/obrigado/',
];

function wavSilencioso(segundos = 3): Buffer {
  const taxa = 8000;
  const amostras = taxa * segundos;
  const dados = Buffer.alloc(amostras, 128);
  const cabecalho = Buffer.alloc(44);
  cabecalho.write('RIFF', 0);
  cabecalho.writeUInt32LE(36 + amostras, 4);
  cabecalho.write('WAVE', 8);
  cabecalho.write('fmt ', 12);
  cabecalho.writeUInt32LE(16, 16);
  cabecalho.writeUInt16LE(1, 20);
  cabecalho.writeUInt16LE(1, 22);
  cabecalho.writeUInt32LE(taxa, 24);
  cabecalho.writeUInt32LE(taxa, 28);
  cabecalho.writeUInt16LE(1, 32);
  cabecalho.writeUInt16LE(8, 34);
  cabecalho.write('data', 36);
  cabecalho.writeUInt32LE(amostras, 40);
  return Buffer.concat([cabecalho, dados]);
}

async function simularStream(page: Page): Promise<void> {
  const wav = wavSilencioso();
  await page.route('**/*', async (rota) => {
    const pedido = rota.request();
    const caminho = new URL(pedido.url()).pathname;
    if (caminho === '/stream-simulado.wav') {
      await rota.fulfill({ status: 200, contentType: 'audio/wav', body: wav });
      return;
    }
    if (pedido.resourceType() !== 'document') {
      await rota.continue();
      return;
    }
    const resposta = await rota.fetch({
      headers: { ...pedido.headers(), 'accept-encoding': 'identity' },
    });
    const html = (await resposta.text())
      .replace(/data-stream(="[^"]*")?/, 'data-stream="/stream-simulado.wav"')
      .replace(/(<button[^>]*id="player-botao"[^>]*) disabled>/, '$1>');
    const cabecalhos = { ...resposta.headers() };
    delete cabecalhos['content-length'];
    delete cabecalhos['content-encoding'];
    await rota.fulfill({ status: resposta.status(), headers: cabecalhos, body: html });
  });
}

test.describe('rotas públicas', () => {
  for (const rota of ROTAS) {
    test(`${rota} responde 200 com barra do player`, async ({ page }) => {
      const resposta = await page.goto(rota);
      expect(resposta?.status()).toBe(200);
      await expect(page.locator('#barra-player')).toBeVisible();
    });
  }
});

test('/admin/ carrega o painel Decap', async ({ page }) => {
  const resposta = await page.goto('/admin/');
  expect(resposta?.status()).toBe(200);
  await expect(page).toHaveTitle(/Painel de conteúdo/);
  await expect(page.locator('script[src*="decap-cms"]')).toHaveCount(1);
});

test('formulário de contactos renderiza', async ({ page }) => {
  await page.goto('/contactos/');
  const form = page.locator('form[name="contacto"]');
  await expect(form).toHaveAttribute('data-netlify', 'true');
  await expect(form.locator('input[name="nome"]')).toBeVisible();
  await expect(form.locator('input[name="email"]')).toHaveAttribute('type', 'email');
  await expect(form.locator('textarea[name="mensagem"]')).toBeVisible();
  await expect(form.getByRole('button', { name: 'Enviar mensagem' })).toBeVisible();
});

test('rota desconhecida devolve 404', async ({ page }) => {
  const resposta = await page.goto('/rota-inexistente/');
  expect(resposta?.status()).toBe(404);
  await expect(page.getByRole('heading', { name: 'Página não encontrada' })).toBeVisible();
});

test.describe('player', () => {
  test('com stream configurado, o botão fica activo', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#player-botao')).toBeEnabled();
    await expect(page.locator('#player-titulo')).toHaveText('Rádio X — 90.3 FM');
  });

  test('faz play com stream simulada e sobrevive à navegação', async ({ page }) => {
    await simularStream(page);
    await page.goto('/');
    const botao = page.locator('#player-botao');
    await expect(botao).toBeEnabled();
    await botao.click();
    await expect(page.locator('#player-icone')).toHaveText('❚❚');
    await expect(botao).toHaveAttribute('aria-label', 'Pausar a emissão');

    await page.getByRole('link', { name: 'Programação', exact: true }).first().click();
    await expect(page).toHaveURL(/\/programacao\//);
    await expect(page.locator('#player-icone')).toHaveText('❚❚');
  });
});
