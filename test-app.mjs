import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  console.log('Navegando para localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 15000 });
  
  // Tirar screenshot da página de login
  await page.screenshot({ path: 'login-page.png' });
  console.log('✅ Screenshot da página de login capturado: login-page.png');
  
  await browser.close();
})();
