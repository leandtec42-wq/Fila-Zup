import { test, expect } from '@playwright/test';

/**
 * Teste E2E do fluxo principal do sistema: cadastro -> login automático ->
 * criação de evento ativo -> entrada na fila pública -> visualização da
 * posição na fila. Roda contra um build local com banco SQLite descartável
 * (e2e-test.db), nunca contra produção.
 */

function randomEmail() {
  return `teste.e2e.${Date.now()}.${Math.floor(Math.random() * 1e6)}@example.com`;
}

test('cadastro, criação de evento e entrada na fila pública', async ({ page }) => {
  const email = randomEmail();
  const password = 'SenhaForte123';
  const eventName = `Evento E2E ${Date.now()}`;

  await test.step('cadastro cria a conta e loga automaticamente', async () => {
    await page.goto('/cadastro');
    await page.getByLabel('Nome', { exact: true }).fill('Usuário Teste');
    await page.getByLabel('Nome da empresa').fill('Empresa Teste');
    await page.getByLabel('E-mail').fill(email);
    await page.getByLabel('Senha', { exact: true }).fill(password);
    await page.getByLabel('Confirmar senha').fill(password);
    await page.getByRole('button', { name: 'Criar conta', exact: true }).click();

    await expect(page).toHaveURL(/\/dashboard\/eventos\/novo/, { timeout: 15000 });
  });

  let publicUrl = '';

  await test.step('criar um evento ativo', async () => {
    await page.getByLabel('Nome do evento').fill(eventName);
    await page.getByLabel('Descrição').fill('Evento criado pelo teste automatizado.');
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    await page.getByLabel('Data').fill(tomorrow);
    await page.getByLabel('Local').fill('Local de Teste');
    await page.getByLabel('Status inicial').selectOption('ACTIVE');
    await page.getByRole('button', { name: 'Criar evento' }).click();

    await expect(page.getByText('Seu evento está pronto.')).toBeVisible({ timeout: 15000 });
    publicUrl = await page.locator('p.font-mono').innerText();
  });

  await test.step('entrar na fila pública com o link gerado', async () => {
    expect(publicUrl).toMatch(/\/fila\//);
    const path = new URL(publicUrl).pathname;

    await page.goto(path);
    await expect(page.getByRole('heading', { name: eventName })).toBeVisible({ timeout: 15000 });

    await page.getByLabel('Nome completo').fill('Participante Teste');
    await page.getByLabel('E-mail').fill(randomEmail());
    await page.getByLabel('WhatsApp', { exact: true }).fill('11999999999');
    await page.getByLabel(/atualizações sobre minha posição/).check();
    await page.getByRole('button', { name: 'ENTRAR NA FILA' }).click();

    await expect(page.getByText('Você está na fila!')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/lugar/)).toBeVisible();
  });
});

test('login recusa senha incorreta com mensagem genérica', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('E-mail').fill(randomEmail());
  await page.getByLabel('Senha').fill('senha-qualquer-errada');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();

  await expect(page.getByText('E-mail ou senha incorretos.')).toBeVisible({ timeout: 10000 });
});

test('página de login mostra as duas opções de entrada', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByLabel('E-mail')).toBeVisible();
  await expect(page.getByLabel('Senha')).toBeVisible();
  await expect(page.getByRole('button', { name: /Google/ })).toBeVisible();
});
