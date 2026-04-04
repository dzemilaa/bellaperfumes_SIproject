require("chromedriver");
jest.setTimeout(120000);
/**
 * Selenium testovi za Bella Perfumes - JavaScript
 *
 * Instalacija:
 *   npm install selenium-webdriver jest
 *   npm install --save-dev @types/selenium-webdriver
 *
 * Pokretanje:
 *   npx jest bella.test.js --testTimeout=30000
 *   npx jest -t "Admin Login"   <- samo određena grupa
 */

const { Builder, By, until, Select } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");

// ─── Konstante ────────────────────────────────────────────────────────────────

const CLIENT_URL = "https://bellaperfumes-s-iproject.vercel.app";
const ADMIN_URL = "https://bellaperfumes-s-iproject-dd56.vercel.app";

const TEST_EMAIL = "tarhanisdzemila@gmail.com";
const TEST_PASSWORD = "test";

const ADMIN_EMAIL = "admin@bella.com";
const ADMIN_PASSWORD = "admin123";

const WAIT = 60000; // ms

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildDriver() {
  const options = new chrome.Options();

  options.addArguments("--no-sandbox");
  options.addArguments("--disable-dev-shm-usage");
  options.addArguments("--window-size=1280,900");
  options.setPageLoadStrategy("eager");

  return new Builder()
    .forBrowser("chrome")
    .setChromeOptions(options)
    .build();
}

async function waitFor(driver, locator, timeout = WAIT) {
  return driver.wait(until.elementLocated(locator), timeout);
}

async function waitVisible(driver, locator, timeout = WAIT) {
  const el = await waitFor(driver, locator, timeout);
  await driver.wait(until.elementIsVisible(el), timeout);
  return el;
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function clientLogin(driver, email = TEST_EMAIL, password = TEST_PASSWORD) {
  await driver.get(CLIENT_URL);
  await sleep(2000);
  const signInBtn = await waitVisible(driver, By.xpath("//button[contains(text(),'Sign in')]"));
  await signInBtn.click();
  await (await waitFor(driver, By.xpath("//input[@placeholder='Email']"))).sendKeys(email);
  await (await waitFor(driver, By.xpath("//input[@placeholder='Password']"))).sendKeys(password);
  await (await waitFor(driver, By.xpath("//button[text()='Login']"))).click();
  await sleep(2000);
}

async function adminLogin(driver, email = ADMIN_EMAIL, password = ADMIN_PASSWORD) {
  await driver.get(ADMIN_URL);
  await sleep(2000);
  await (await waitFor(driver, By.xpath("//input[@type='email']"))).sendKeys(email);
  await (await waitFor(driver, By.xpath("//input[@type='password']"))).sendKeys(password);
  await (await waitFor(driver, By.xpath("//button[contains(text(),'Sign In')]"))).click();
  await sleep(2000);
}

async function acceptAlert(driver) {
  const alert = await driver.switchTo().alert();
  const text = await alert.getText();
  await alert.accept();
  return text;
}

// ══════════════════════════════════════════════════════════════════════════════
// CLIENT FRONTEND
// ══════════════════════════════════════════════════════════════════════════════

describe("Client - Homepage", () => {
  let driver;
  beforeEach(async () => { driver = buildDriver(); });
  afterEach(async () => { await driver.quit(); });

  test("Početna stranica se učitava", async () => {
    await driver.get(CLIENT_URL);
    await sleep(2000);
    const title = await driver.getTitle();
    expect(title.toLowerCase()).toContain("bella");
  });

  test("Hero sekcija je vidljiva", async () => {
    await driver.get(CLIENT_URL);
    const hero = await waitVisible(driver, By.xpath("//*[contains(text(),'Find Your Signature Scent')]"));
    expect(await hero.isDisplayed()).toBe(true);
  });

  test("Navigacioni linkovi su prisutni", async () => {
    await driver.get(CLIENT_URL);
    await sleep(2000);
    for (const link of ["Home", "Products", "Categories", "Contact"]) {
      const el = await waitFor(driver, By.xpath(`//*[contains(text(),'${link}')]`));
      expect(el).toBeTruthy();
    }
  });

  test("Most Popular slider se prikazuje", async () => {
    await driver.get(CLIENT_URL);
    const slider = await waitVisible(driver, By.xpath("//*[contains(text(),'Most Popular')]"));
    expect(await slider.isDisplayed()).toBe(true);
  });

  test("Footer prikazuje kontakt info", async () => {
    await driver.get(CLIENT_URL);
    await driver.executeScript("window.scrollTo(0, document.body.scrollHeight)");
    await sleep(1500);
    const footer = await waitFor(driver, By.xpath("//*[contains(text(),'GET IN TOUCH')]"));
    expect(footer).toBeTruthy();
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("Client - Search", () => {
  let driver;
  beforeEach(async () => { driver = buildDriver(); });
  afterEach(async () => { await driver.quit(); });

  test("Pretraga po imenu prikazuje dropdown", async () => {
    await driver.get(CLIENT_URL);
    await sleep(2000);
    const input = await waitFor(driver, By.xpath("//input[contains(@placeholder,'Search by')]"));
    await input.sendKeys("Dior");
    await sleep(1500);
    const dropdown = await waitVisible(driver, By.xpath("//ul[contains(@class,'overflow-y-auto')]"));
    expect(await dropdown.isDisplayed()).toBe(true);
  });

  test("Nepostojeći termin prikazuje 'No results found'", async () => {
    await driver.get(CLIENT_URL);
    await sleep(2000);
    const input = await waitFor(driver, By.xpath("//input[contains(@placeholder,'Search by')]"));
    await input.sendKeys("xyzabc999notexist");
    await sleep(1500);
    const noResults = await waitVisible(driver, By.xpath("//*[contains(text(),'No results found')]"));
    expect(await noResults.isDisplayed()).toBe(true);
  });

  test("Promjena filtera na Brand", async () => {
    await driver.get(CLIENT_URL);
    await sleep(2000);
    const selectEl = await waitFor(driver, By.xpath("//select"));
    const select = new Select(selectEl);
    await select.selectByValue("brand");
    const input = await waitFor(driver, By.xpath("//input[contains(@placeholder,'Search by')]"));
    await input.sendKeys("Chanel");
    await sleep(1000);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("Client - Autentifikacija", () => {
  let driver;
  beforeEach(async () => { driver = buildDriver(); });
  afterEach(async () => { await driver.quit(); });

  test("Sign in otvara login popup", async () => {
    await driver.get(CLIENT_URL);
    await sleep(2000);
    await (await waitVisible(driver, By.xpath("//button[contains(text(),'Sign in')]"))).click();
    const popup = await waitVisible(driver, By.xpath("//h2[text()='Login']"));
    expect(await popup.isDisplayed()).toBe(true);
  });

  test("X zatvara login popup", async () => {
    await driver.get(CLIENT_URL);
    await sleep(2000);
    await (await waitVisible(driver, By.xpath("//button[contains(text(),'Sign in')]"))).click();
    await waitFor(driver, By.xpath("//h2[text()='Login']"));
    await (await waitFor(driver, By.xpath("//button[text()='✕']"))).click();
    await sleep(1000);
    const popups = await driver.findElements(By.xpath("//h2[text()='Login']"));
    expect(popups.length).toBe(0);
  });

  test("Switch na Sign Up form", async () => {
    await driver.get(CLIENT_URL);
    await sleep(2000);
    await (await waitVisible(driver, By.xpath("//button[contains(text(),'Sign in')]"))).click();
    await waitFor(driver, By.xpath("//h2[text()='Login']"));
    await (await waitFor(driver, By.xpath("//span[contains(text(),'Sign up')]"))).click();
    const signupTitle = await waitVisible(driver, By.xpath("//h2[text()='Sign Up']"));
    expect(await signupTitle.isDisplayed()).toBe(true);
    const usernameInput = await waitFor(driver, By.xpath("//input[@placeholder='Username']"));
    expect(usernameInput).toBeTruthy();
  });

  test("Pogrešni kredencijali prikazuju grešku", async () => {
    await driver.get(CLIENT_URL);
    await sleep(2000);
    await (await waitVisible(driver, By.xpath("//button[contains(text(),'Sign in')]"))).click();
    await (await waitFor(driver, By.xpath("//input[@placeholder='Email']"))).sendKeys("wrong@email.com");
    await (await waitFor(driver, By.xpath("//input[@placeholder='Password']"))).sendKeys("wrongpassword");
    await (await waitFor(driver, By.xpath("//button[text()='Login']"))).click();
    await sleep(2000);
    const error = await waitVisible(driver, By.xpath("//p[contains(@class,'text-red')]"));
    expect(await error.isDisplayed()).toBe(true);
  });

  test("Uspješan login skriva Sign in dugme", async () => {
    await clientLogin(driver);
    await sleep(1000);
    const signInBtns = await driver.findElements(By.xpath("//button[contains(text(),'Sign in')]"));
    expect(signInBtns.length).toBe(0);
  });

  test("Logout vraća Sign in dugme", async () => {
    await clientLogin(driver);
    await sleep(1000);
    const userBtn = await waitFor(driver, By.xpath("//button[.//*[local-name()='svg']][last()]"));
    await userBtn.click();
    await (await waitFor(driver, By.xpath("//button[contains(text(),'Sign out')]"))).click();
    await sleep(2000);
    const signIn = await waitVisible(driver, By.xpath("//button[contains(text(),'Sign in')]"));
    expect(await signIn.isDisplayed()).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("Client - Proizvodi", () => {
  let driver;
  beforeEach(async () => { driver = buildDriver(); });
  afterEach(async () => { await driver.quit(); });

  test("Proizvodi se učitavaju na homepage", async () => {
    await driver.get(CLIENT_URL);
    await sleep(3000);
    const products = await driver.findElements(By.xpath("//div[contains(@class,'shadow-md') and .//img]"));
    expect(products.length).toBeGreaterThan(0);
  });

  test("Klik na product otvara product page", async () => {
    await driver.get(CLIENT_URL);
    await sleep(3000);
    const card = await waitFor(driver, By.xpath("(//div[contains(@class,'cursor-pointer') and .//img])[1]"));
    await card.click();
    await sleep(2000);
    expect(await driver.getCurrentUrl()).toContain("/page/");
  });

  test("Product page ima Add to cart dugme", async () => {
    await driver.get(CLIENT_URL);
    await sleep(3000);
    await (await waitFor(driver, By.xpath("(//div[contains(@class,'cursor-pointer') and .//img])[1]"))).click();
    await sleep(2000);
    const btn = await waitVisible(driver, By.xpath("//button[contains(text(),'Add to cart')]"));
    expect(await btn.isDisplayed()).toBe(true);
  });

  test("Product page prikazuje Customer Reviews sekciju", async () => {
    await driver.get(CLIENT_URL);
    await sleep(3000);
    await (await waitFor(driver, By.xpath("(//div[contains(@class,'cursor-pointer') and .//img])[1]"))).click();
    await sleep(2000);
    const reviews = await waitVisible(driver, By.xpath("//*[contains(text(),'Customer Reviews')]"));
    expect(await reviews.isDisplayed()).toBe(true);
  });

  test("Add to cart bez logina prikazuje alert", async () => {
    await driver.get(CLIENT_URL);
    await sleep(3000);
    await (await waitFor(driver, By.xpath("(//div[contains(@class,'cursor-pointer') and .//img])[1]"))).click();
    await sleep(2000);
    await (await waitFor(driver, By.xpath("//button[contains(text(),'Add to cart')]"))).click();
    await sleep(1000);
    const alertText = await acceptAlert(driver);
    expect(alertText.toLowerCase()).toContain("logged in");
  });

  test("Add to cart ulogovanog korisnika radi", async () => {
    await clientLogin(driver);
    await sleep(2000);
    await (await waitFor(driver, By.xpath("(//div[contains(@class,'cursor-pointer') and .//img])[1]"))).click();
    await sleep(2000);
    await (await waitFor(driver, By.xpath("//button[contains(text(),'Add to cart')]"))).click();
    await sleep(1000);
    await acceptAlert(driver);
  });

  test("Favorite bez logina prikazuje alert", async () => {
    await driver.get(CLIENT_URL);
    await sleep(3000);
    const favBtn = await waitFor(driver, By.xpath("(//button[contains(@class,'rounded-full') and contains(@class,'shadow')])[1]"));
    await favBtn.click();
    await sleep(1000);
    const alertText = await acceptAlert(driver);
    expect(alertText.toLowerCase()).toContain("logged in");
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("Client - Korpa", () => {
  let driver;
  beforeEach(async () => { driver = buildDriver(); });
  afterEach(async () => { await driver.quit(); });

  test("Korpa zahtijeva login", async () => {
    await driver.get(`${CLIENT_URL}/cart`);
    await sleep(2000);
    const src = await driver.getPageSource();
    expect(src.toLowerCase()).toContain("log in");
  });

  test("Korpa se učitava nakon logina", async () => {
    await clientLogin(driver);
    await driver.get(`${CLIENT_URL}/cart`);
    await sleep(2000);
    const title = await waitVisible(driver, By.xpath("//*[contains(text(),'Your Cart')]"));
    expect(await title.isDisplayed()).toBe(true);
  });

  test("Proceed to Checkout dugme je vidljivo", async () => {
    await clientLogin(driver);
    await driver.get(`${CLIENT_URL}/cart`);
    await sleep(2000);
    const btn = await waitVisible(driver, By.xpath("//button[contains(text(),'PROCEED TO CHECKOUT')]"));
    expect(await btn.isDisplayed()).toBe(true);
  });

  test("Checkout vodi na /order", async () => {
    await clientLogin(driver);
    await driver.get(`${CLIENT_URL}/cart`);
    await sleep(2000);
    await (await waitFor(driver, By.xpath("//button[contains(text(),'PROCEED TO CHECKOUT')]"))).click();
    await sleep(2000);
    expect(await driver.getCurrentUrl()).toContain("/order");
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("Client - Narudžba", () => {
  let driver;
  beforeEach(async () => { driver = buildDriver(); });
  afterEach(async () => { await driver.quit(); });

  test("Forma za dostavu ima sva polja", async () => {
    await clientLogin(driver);
    await driver.get(`${CLIENT_URL}/order`);
    await sleep(2000);
    for (const placeholder of ["First Name", "Last Name", "Email", "Phone", "Address - Street/City"]) {
      const el = await waitFor(driver, By.xpath(`//input[@placeholder='${placeholder}']`));
      expect(el).toBeTruthy();
    }
  });

  test("Nevažeći promo kod prikazuje grešku", async () => {
    await clientLogin(driver);
    await driver.get(`${CLIENT_URL}/order`);
    await sleep(2000);
    await (await waitFor(driver, By.xpath("//input[@placeholder='Promo Code']"))).sendKeys("INVALIDCODE");
    await (await waitFor(driver, By.xpath("//button[contains(text(),'Apply Code')]"))).click();
    await sleep(1000);
    const msg = await waitVisible(driver, By.xpath("//*[contains(text(),'Invalid promo code')]"));
    expect(await msg.isDisplayed()).toBe(true);
  });

  test("Važeći promo kod DISCOUNT10 prikazuje success", async () => {
    await clientLogin(driver);
    await driver.get(`${CLIENT_URL}/order`);
    await sleep(2000);
    await (await waitFor(driver, By.xpath("//input[@placeholder='Promo Code']"))).sendKeys("DISCOUNT10");
    await (await waitFor(driver, By.xpath("//button[contains(text(),'Apply Code')]"))).click();
    await sleep(1000);
    const msg = await waitVisible(driver, By.xpath("//*[contains(text(),'Promo code applied')]"));
    expect(await msg.isDisplayed()).toBe(true);
  });

  test("Order Summary sekcija je vidljiva", async () => {
    await clientLogin(driver);
    await driver.get(`${CLIENT_URL}/order`);
    await sleep(2000);
    const summary = await waitVisible(driver, By.xpath("//*[contains(text(),'Order Summary')]"));
    expect(await summary.isDisplayed()).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("Client - My Orders", () => {
  let driver;
  beforeEach(async () => { driver = buildDriver(); });
  afterEach(async () => { await driver.quit(); });

  test("Orders stranica zahtijeva login", async () => {
    await driver.get(`${CLIENT_URL}/orders`);
    await sleep(2000);
    const src = await driver.getPageSource();
    expect(src.toLowerCase()).toContain("logged in");
  });

  test("Orders stranica se učitava", async () => {
    await clientLogin(driver);
    await driver.get(`${CLIENT_URL}/orders`);
    await sleep(3000);
    const title = await waitVisible(driver, By.xpath("//*[contains(text(),'My Orders')]"));
    expect(await title.isDisplayed()).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("Client - Account", () => {
  let driver;
  beforeEach(async () => { driver = buildDriver(); });
  afterEach(async () => { await driver.quit(); });

  test("Account prikazuje korisničke podatke", async () => {
    await clientLogin(driver);
    await driver.get(`${CLIENT_URL}/account`);
    await sleep(2000);
    expect(await waitFor(driver, By.xpath("//*[contains(text(),'Username')]"))).toBeTruthy();
    expect(await waitFor(driver, By.xpath("//*[contains(text(),'Email')]"))).toBeTruthy();
  });

  test("Edit dugme otvara edit mode", async () => {
    await clientLogin(driver);
    await driver.get(`${CLIENT_URL}/account`);
    await sleep(2000);
    await (await waitFor(driver, By.xpath("//button[contains(text(),'Edit')]"))).click();
    await sleep(1000);
    const saveBtn = await waitVisible(driver, By.xpath("//button[contains(text(),'Save')]"));
    expect(await saveBtn.isDisplayed()).toBe(true);
  });

  test("Cancel zatvara edit mode", async () => {
    await clientLogin(driver);
    await driver.get(`${CLIENT_URL}/account`);
    await sleep(2000);
    await (await waitFor(driver, By.xpath("//button[contains(text(),'Edit')]"))).click();
    await sleep(1000);
    await (await waitFor(driver, By.xpath("//button[contains(text(),'Cancel')]"))).click();
    await sleep(1000);
    const editBtn = await waitVisible(driver, By.xpath("//button[contains(text(),'Edit')]"));
    expect(await editBtn.isDisplayed()).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// ADMIN PANEL
// ══════════════════════════════════════════════════════════════════════════════

describe("Admin - Login", () => {
  let driver;
  beforeEach(async () => { driver = buildDriver(); });
  afterEach(async () => { await driver.quit(); });

  test("Admin login stranica se učitava", async () => {
    await driver.get(ADMIN_URL);
    const emailInput = await waitVisible(driver, By.xpath("//input[@type='email']"));
    expect(await emailInput.isDisplayed()).toBe(true);
    const pageTitle = await driver.getTitle();
    expect(pageTitle.toLowerCase()).toContain("admin");
  });

  test("Pogrešni kredencijali prikazuju alert", async () => {
    await driver.get(ADMIN_URL);
    await (await waitFor(driver, By.xpath("//input[@type='email']"))).sendKeys("wrong@test.com");
    await (await waitFor(driver, By.xpath("//input[@type='password']"))).sendKeys("wrong");
    await (await waitFor(driver, By.xpath("//button[contains(text(),'Sign In')]"))).click();
    const alertText = await acceptAlert(driver);
    expect(alertText).toBeTruthy();
  });

  test("Uspješan login vodi na dashboard", async () => {
    await adminLogin(driver);
    const url = await driver.getCurrentUrl();
    const src = await driver.getPageSource();

    // Proveravamo da li je dashboard učitan (Add New Product)
    expect(url.includes("/add") || src.includes("Add New Product")).toBe(true);
  });

  test("Logout vraća na login stranicu", async () => {
    await adminLogin(driver);
    await (await waitFor(driver, By.xpath("//button[contains(text(),'Logout')]"))).click();

    const emailInput = await waitVisible(driver, By.xpath("//input[@type='email']"));
    expect(await emailInput.isDisplayed()).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("Admin - Sidebar navigacija", () => {
  let driver;
  beforeEach(async () => { driver = buildDriver(); await adminLogin(driver); });
  afterEach(async () => { await driver.quit(); });

  test("Sidebar ima sve stavke", async () => {
    for (const item of ["Add Product", "Products", "Orders", "Users", "Reviews"]) {
      const el = await waitFor(driver, By.xpath(`//*[contains(text(),'${item}')]`));
      expect(el).toBeTruthy();
    }
  });

  test("Navigacija na Products listu", async () => {
    await (await waitFor(driver, By.xpath("//a[contains(@href,'/list')]"))).click();
    await sleep(2000);
    const title = await waitVisible(driver, By.xpath("//*[contains(text(),'All Products')]"));
    expect(await title.isDisplayed()).toBe(true);
  });

  test("Navigacija na Orders", async () => {
    await (await waitFor(driver, By.xpath("//a[contains(@href,'/orders')]"))).click();
    await sleep(2000);
    const title = await waitVisible(driver, By.xpath("//*[contains(text(),'All Orders')]"));
    expect(await title.isDisplayed()).toBe(true);
  });

  test("Navigacija na Users", async () => {
    await (await waitFor(driver, By.xpath("//a[contains(@href,'/users')]"))).click();
    await sleep(2000);
    const title = await waitVisible(driver, By.xpath("//*[contains(text(),'All Users')]"));
    expect(await title.isDisplayed()).toBe(true);
  });

  test("Navigacija na Reviews", async () => {
    await (await waitFor(driver, By.xpath("//a[contains(@href,'/reviews')]"))).click();
    await sleep(2000);
    const title = await waitVisible(driver, By.xpath("//*[contains(text(),'All Reviews')]"));
    expect(await title.isDisplayed()).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("Admin - Add Product", () => {
  let driver;
  beforeEach(async () => { driver = buildDriver(); await adminLogin(driver); });
  afterEach(async () => { await driver.quit(); });

  test("Forma ima sva potrebna polja", async () => {
    for (const name of ["name", "price", "stock", "discount", "size"]) {
      const el = await waitFor(driver, By.xpath(`//input[@name='${name}']`));
      expect(el).toBeTruthy();
    }
    expect(await waitFor(driver, By.xpath("//textarea[@name='description']"))).toBeTruthy();
    expect(await waitFor(driver, By.xpath("//select[@name='brandId']"))).toBeTruthy();
    expect(await waitFor(driver, By.xpath("//select[@name='genderId']"))).toBeTruthy();
  });

  test("Submit prazne forme prikazuje validacijski alert", async () => {
    await (await waitFor(driver, By.xpath("//button[contains(text(),'Add Product')]"))).click();
    await sleep(1000);
    const alertText = await acceptAlert(driver);
    expect(alertText).toBeTruthy();
  });

  test("+ Add new brand toggle otvara input", async () => {
    await (await waitFor(driver, By.xpath("//*[contains(text(),'Add new brand')]"))).click();
    await sleep(500);
    const brandInput = await waitVisible(driver, By.xpath("//input[@placeholder='Brand name']"));
    expect(await brandInput.isDisplayed()).toBe(true);
  });

  test("Gender select ima Female, Male, Unisex", async () => {
    const selectEl = await waitFor(driver, By.xpath("//select[@name='genderId']"));
    const select = new Select(selectEl);
    const options = await select.getOptions();
    const texts = await Promise.all(options.map((o) => o.getText()));
    expect(texts).toContain("Female");
    expect(texts).toContain("Male");
    expect(texts).toContain("Unisex");
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("Admin - Products lista", () => {
  let driver;
  beforeEach(async () => {
    driver = buildDriver();
    await adminLogin(driver);
    await (await waitFor(driver, By.xpath("//a[contains(@href,'/list')]"))).click();
    await sleep(3000);
  });
  afterEach(async () => { await driver.quit(); });

  test("Lista se učitava", async () => {
    const title = await waitVisible(driver, By.xpath("//*[contains(text(),'All Products')]"));
    expect(await title.isDisplayed()).toBe(true);
  });

  test("Header kolone su vidljive", async () => {
    for (const col of ["Image", "Name", "Price", "Stock", "Discount"]) {
      expect(await waitFor(driver, By.xpath(`//*[contains(text(),'${col}')]`))).toBeTruthy();
    }
  });

  test("Search input je prisutan", async () => {
    const search = await waitFor(driver, By.xpath("//input[@placeholder='Search by name...']"));
    expect(search).toBeTruthy();
  });

  test("Edit dugme je prisutno", async () => {
    const editBtns = await driver.findElements(By.xpath("//button[contains(text(),'Edit')]"));
    expect(editBtns.length).toBeGreaterThan(0);
  });

  test("Klik na Edit otvara edit formu", async () => {
    await (await waitFor(driver, By.xpath("(//button[contains(text(),'Edit')])[1]"))).click();
    await sleep(1000);
    const editForm = await waitVisible(driver, By.xpath("//*[contains(text(),'Edit Product')]"));
    expect(await editForm.isDisplayed()).toBe(true);
  });

  test("Delete dugme je prisutno", async () => {
    const deleteBtns = await driver.findElements(By.xpath("//button[contains(text(),'Delete')]"));
    expect(deleteBtns.length).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("Admin - Orders", () => {
  let driver;
  beforeEach(async () => {
    driver = buildDriver();
    await adminLogin(driver);
    await (await waitFor(driver, By.xpath("//a[contains(@href,'/orders')]"))).click();
    await sleep(3000);
  });
  afterEach(async () => { await driver.quit(); });

  test("Orders stranica se učitava", async () => {
    const title = await waitVisible(driver, By.xpath("//*[contains(text(),'All Orders')]"));
    expect(await title.isDisplayed()).toBe(true);
  });

  test("Status dropdown ima sve opcije", async () => {
    const selects = await driver.findElements(By.xpath("//select"));
    if (selects.length > 0) {
      const select = new Select(selects[0]);
      const options = await select.getOptions();
      const texts = await Promise.all(options.map((o) => o.getText()));
      expect(texts).toContain("Pending");
      expect(texts).toContain("Out for delivery");
      expect(texts).toContain("Delivered");
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("Admin - Users", () => {
  let driver;
  beforeEach(async () => {
    driver = buildDriver();
    await adminLogin(driver);
    await (await waitFor(driver, By.xpath("//a[contains(@href,'/users')]"))).click();
    await sleep(3000);
  });
  afterEach(async () => { await driver.quit(); });

  test("Users stranica se učitava", async () => {
    const title = await waitVisible(driver, By.xpath("//*[contains(text(),'All Users')]"));
    expect(await title.isDisplayed()).toBe(true);
  });

  test("Tabela ima sve kolone", async () => {
    for (const col of ["Username", "Email", "Status", "Verified"]) {
      expect(await waitFor(driver, By.xpath(`//*[contains(text(),'${col}')]`))).toBeTruthy();
    }
  });

  test("Search input je prisutan", async () => {
    const search = await waitFor(driver, By.xpath("//input[@placeholder='Search by username...']"));
    expect(search).toBeTruthy();
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("Admin - Reviews", () => {
  let driver;
  beforeEach(async () => {
    driver = buildDriver();
    await adminLogin(driver);
    await (await waitFor(driver, By.xpath("//a[contains(@href,'/reviews')]"))).click();
    await sleep(3000);
  });
  afterEach(async () => { await driver.quit(); });

  test("Reviews stranica se učitava", async () => {
    const title = await waitVisible(driver, By.xpath("//*[contains(text(),'All Reviews')]"));
    expect(await title.isDisplayed()).toBe(true);
  });

  test("Tabela ima sve kolone", async () => {
    for (const col of ["Username", "Product Name", "Review Text"]) {
      expect(await waitFor(driver, By.xpath(`//*[contains(text(),'${col}')]`))).toBeTruthy();
    }
  });

  test("Search input je prisutan", async () => {
    const search = await waitFor(
      driver,
      By.xpath("//input[@placeholder='Search by username or review text...']")
    );
    expect(search).toBeTruthy();
  });
});
