import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const base = process.argv[2] ?? "http://127.0.0.1:3456";
const shots = "/tmp/snh-ui";
await mkdir(shots, { recursive: true });

const browser = await chromium.launch({ channel: "chrome", headless: true });
const failures = [];

function check(name, condition, detail = "") {
  if (!condition) failures.push(`${name}${detail ? `: ${detail}` : ""}`);
}

async function noHorizontalScroll(page, label) {
  const overflow = await page.evaluate(() => {
    const root = document.querySelector("[data-testid=funnel]") ?? document.documentElement;
    return {
      root: root.scrollWidth - root.clientWidth,
      doc: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  });
  check(`${label} horizontal scroll`, overflow.root <= 1 && overflow.doc <= 1, JSON.stringify(overflow));
}

async function ctaVisible(page, label) {
  const box = await page.getByTestId("cta").boundingBox();
  const viewport = page.viewportSize();
  check(`${label} cta`, !!box && !!viewport && box.y >= 0 && box.y + box.height <= viewport.height + 1, JSON.stringify(box));
}

const viewports = [
  [375, 667],
  [390, 844],
  [393, 852],
  [402, 874],
  [430, 932],
  [360, 800],
  [768, 1024],
  [1280, 800],
  [1440, 900],
];

{
  const page = await browser.newPage();
  for (const [width, height] of viewports) {
    await page.setViewportSize({ width, height });
    await page.goto(base, { waitUntil: "networkidle" });
    await page.getByTestId("screen-welcome").waitFor();
    await noHorizontalScroll(page, `${width}x${height} welcome`);
    await ctaVisible(page, `${width}x${height}`);
    if (width === 390 || width === 1280 || width === 375) {
      await page.screenshot({ path: `${shots}/welcome-${width}.png` });
    }
  }
  await page.close();
}

{
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const leadRequests = [];
  page.on("request", (request) => {
    if (request.url().includes("/api/leads")) leadRequests.push(request.method());
  });
  await page.goto(`${base}/?utm_source=instagram&utm_medium=story&utm_campaign=ui`, { waitUntil: "networkidle" });
  await page.getByTestId("cta").click();
  await page.getByTestId("screen-journey").waitFor();
  const journeyProgress = await page.getByTestId("progress-bar").evaluate((node) => node.style.width);
  check("progress leaves zero", journeyProgress !== "0%" && journeyProgress !== "0");
  await page.screenshot({ path: `${shots}/journey-390.png` });
  await page.getByTestId("option-ready").click();
  await page.getByTestId("screen-first-name").waitFor();
  await page.getByTestId("screen-first-name").getByTestId("text-input").fill("Alex");
  await page.getByTestId("cta").click();
  await page.getByTestId("screen-last-name").waitFor();
  await page.getByTestId("screen-last-name").getByTestId("text-input").fill("Nguyen");
  await page.keyboard.press("Enter");
  await page.getByTestId("screen-area").waitFor();
  await page.getByTestId("option-san-bernardino").click();
  await page.getByTestId("cta").click();
  await page.getByTestId("screen-phone").waitFor();
  const phone = page.getByTestId("screen-phone").getByTestId("text-input");
  await phone.fill("123");
  await page.getByTestId("cta").click();
  await page.getByTestId("screen-phone").getByTestId("error").waitFor();
  await phone.fill("9095550148");
  const formatted = await phone.inputValue();
  check("phone format", formatted === "(909) 555-0148", formatted);
  await page.getByTestId("cta").click();
  await page.getByTestId("screen-price").waitFor();
  await page.getByTestId("option-under-650").click();
  await page.getByTestId("screen-preferences").waitFor();
  await page.screenshot({ path: `${shots}/preferences-390.png` });
  await noHorizontalScroll(page, "preferences");
  await page.getByTestId("option-beds-3").click();
  await page.getByTestId("option-quick-move-in").click();
  await page.getByTestId("cta").click();
  await page.getByTestId("screen-financing").waitFor();
  await page.getByTestId("option-preapproved").click();
  await page.getByTestId("screen-timeline").waitFor();
  await page.getByTestId("option-asap").click();
  await page.getByTestId("screen-confirm").waitFor();
  await page.getByTestId("cta").click();
  await page.getByTestId("screen-confirm").getByTestId("error").waitFor();
  check("consent unchecked", (await page.getByTestId("consent").isChecked()) === false);
  await page.getByTestId("consent").check();
  await page.waitForTimeout(3000);
  await page.getByTestId("cta").click();
  await page.getByTestId("screen-success").waitFor();
  const success = await page.getByTestId("screen-success").innerText();
  check("success copy", success.includes("Thank you, Alex.") && success.includes("(909) 406-6560"));
  check("one lead post", leadRequests.length === 1, String(leadRequests.length));
  await page.screenshot({ path: `${shots}/success-390.png` });
  await page.reload({ waitUntil: "networkidle" });
  await page.getByTestId("screen-welcome").waitFor();
  await page.close();
}

{
  const page = await browser.newPage({ viewport: { width: 375, height: 667 } });
  const leadRequests = [];
  page.on("request", (request) => {
    if (request.url().includes("/api/leads")) leadRequests.push(1);
  });
  await page.goto(base, { waitUntil: "networkidle" });
  await page.getByTestId("cta").click();
  await page.getByTestId("option-ready").click();
  await page.getByTestId("screen-first-name").waitFor();
  await page.getByTestId("back").click();
  await page.getByTestId("screen-journey").waitFor();
  await page.getByTestId("option-browsing").click();
  await page.getByTestId("screen-browsing").waitFor();
  await page.getByTestId("screen-first-name").waitFor({ state: "detached", timeout: 3000 });
  check("back branch", (await page.getByTestId("screen-phone").count()) === 0);
  await page.screenshot({ path: `${shots}/browsing-375.png` });
  await page.getByTestId("back").click();
  await page.getByTestId("screen-journey").waitFor();
  await page.getByTestId("option-browsing").click();
  await page.getByTestId("screen-browsing").waitFor();
  await page.getByTestId("cta").click();
  await page.getByTestId("screen-browsing-done").waitFor();
  check("browsing created no lead", leadRequests.length === 0);
  await page.close();
}

{
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto(base, { waitUntil: "networkidle" });
  await page.getByTestId("cta").click();
  await page.keyboard.press("b");
  await page.getByTestId("screen-first-name").waitFor();
  await page.keyboard.type("Sam");
  await page.keyboard.press("Enter");
  await page.getByTestId("screen-last-name").waitFor();
  await page.keyboard.type("Lee");
  await page.reload({ waitUntil: "networkidle" });
  await page.getByTestId("text-input").waitFor();
  const restored = await page.getByTestId("text-input").inputValue();
  check("refresh keeps last name", restored === "Lee", restored);
  await page.screenshot({ path: `${shots}/desktop-restored.png` });
  await page.close();
}

{
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(base, { waitUntil: "networkidle" });
  await page.getByTestId("cta").click();
  await page.getByTestId("option-researching").click();
  await page.getByTestId("screen-first-name").waitFor();
  await noHorizontalScroll(page, "reduced motion");
  await page.close();
}

await browser.close();
if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log("ui ok");
