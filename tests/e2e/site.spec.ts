import { expect, test } from "@playwright/test";

test("landing page loads, has no sideways scroll, and links to sign-in", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Someone on the Hill");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  await page.getByRole("link", { name: "Sign in with your Tufts email" }).first().click();
  await expect(page).toHaveURL(/\/sign-in/);
});

test("app pages send signed-out visitors to sign-in and remember where they were going", async ({ page }) => {
  await page.goto("/messages");
  await expect(page).toHaveURL(/\/sign-in\?next=%2Fmessages/);
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
});

test("sign-in rejects non-Tufts emails and keeps what was typed", async ({ page }) => {
  await page.goto("/sign-in");
  const email = page.getByLabel("Tufts email");
  await email.fill("someone@gmail.com");
  await page.getByRole("button", { name: "Email me a sign-in link" }).click();
  await expect(page.locator("#sign-in-error")).toHaveText("Use your @tufts.edu email.");
  await expect(email).toHaveValue("someone@gmail.com");
  await expect(email).toBeFocused();
});

test("an expired link sends you back with an explanation", async ({ page }) => {
  await page.goto("/auth/callback?code=expired");
  await expect(page).toHaveURL(/\/sign-in\?error=link/);
  await expect(page.locator("#sign-in-error")).toContainText("expired");
});

test("Browse and project pages need sign-in and keep the filter in the return path", async ({ page }) => {
  await page.goto("/browse?skill=design&q=dewick");
  await expect(page).toHaveURL(/\/sign-in\?next=%2Fbrowse%3Fskill%3Ddesign%26q%3Ddewick/);

  await page.goto("/projects/5eed0000-0000-4000-8000-0000000000a1");
  await expect(page).toHaveURL(/\/sign-in\?next=%2Fprojects%2F5eed0000-0000-4000-8000-0000000000a1/);
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
});

test("Post a project needs sign-in", async ({ page }) => {
  await page.goto("/post");
  await expect(page).toHaveURL(/\/sign-in\?next=%2Fpost/);
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
});

test("a conversation needs sign-in and comes back to the same thread", async ({ page }) => {
  await page.goto("/messages/5eed0000-0000-4000-8000-0000000000d1");
  await expect(page).toHaveURL(/\/sign-in\?next=%2Fmessages%2F5eed0000-0000-4000-8000-0000000000d1/);
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
});

test("profiles need sign-in", async ({ page }) => {
  await page.goto("/profile?edit=1");
  await expect(page).toHaveURL(/\/sign-in\?next=%2Fprofile%3Fedit%3D1/);
  await page.goto("/people/5eed0000-0000-4000-8000-000000000001");
  await expect(page).toHaveURL(/\/sign-in\?next=%2Fpeople%2F5eed0000-0000-4000-8000-000000000001/);
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
});

test("account menu opens on hover and tap and offers sign-in when signed out", async ({ page, isMobile }) => {
  await page.goto("/");
  const trigger = page.getByRole("button", { name: "Account menu" });
  if (isMobile) await trigger.tap();
  else await trigger.hover();
  const signIn = page.locator(".menu-panel").getByRole("link", { name: "Sign in", exact: true });
  await expect(signIn).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(signIn).toBeHidden();
  // Hover then click (what people do with a mouse) must leave it open, not toggle it shut.
  if (!isMobile) await page.mouse.move(0, 400);
  if (!isMobile) await trigger.hover();
  await trigger.click();
  await expect(signIn).toBeVisible();
  await signIn.click();
  await expect(page).toHaveURL(/\/sign-in/);
});

test("the welcome step needs sign-in first", async ({ page }) => {
  await page.goto("/welcome");
  await expect(page).toHaveURL(/\/sign-in\?next=%2Fwelcome/);
});

test("the menu bar docks to the top after scrolling and floats back at the top", async ({ page }) => {
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Main" });
  await expect.poll(async () => (await nav.boundingBox())?.y).toBeGreaterThan(10);
  await page.mouse.wheel(0, 900);
  await expect.poll(async () => Math.round((await nav.boundingBox())?.y ?? -1)).toBe(0);
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect.poll(async () => (await nav.boundingBox())?.y).toBeGreaterThan(10);
});
