import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import Layout from "../Layout";
import { LangProvider } from "@/context/LangContext";
import { hungarian } from "@/lib/hungarian";
jest.mock("@/context/CartContext", () => ({ useCart: () => ({ count: 0 }) }));
jest.mock("@/components/NewsletterForm", () => () => null);
let root, host, desktop;
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  localStorage.clear();
  desktop = Object.assign(new EventTarget(), { matches: false });
  window.matchMedia = () => desktop;
  host = document.createElement("div"); document.body.append(host); root = createRoot(host);
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); });
async function mount() { await act(async () => root.render(<MemoryRouter><LangProvider><Layout><h1>Tartalom</h1></Layout></LangProvider></MemoryRouter>)); }
async function click(selector) { await act(async () => document.querySelector(selector).dispatchEvent(new MouseEvent("click", { bubbles: true }))); }
test("mobile menu escapes the filtered header, navigates and restores its trigger", async () => {
  await mount();
  await click('[data-testid="mobile-menu-toggle"]');
  const menu = document.querySelector('[data-testid="mobile-menu"]');
  expect(menu).not.toBeNull();
  expect(menu.closest("header")).toBeNull();
  expect(menu.textContent).toContain("Egyedi gyertyák");
  expect(menu.textContent).not.toContain("Candles");
  await click('[data-testid="mobile-nav-shop"]');
  expect(document.querySelector('[data-testid="mobile-menu"]')).toBeNull();
  await click('[data-testid="mobile-menu-toggle"]');
  await act(async () => document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })));
  expect(document.querySelector('[data-testid="mobile-menu"]')).toBeNull();
});
test("switching to a desktop viewport closes the menu", async () => {
  await mount(); await click('[data-testid="mobile-menu-toggle"]');
  await act(async () => { desktop.matches = true; desktop.dispatchEvent(new Event("change")); });
  expect(document.querySelector('[data-testid="mobile-menu"]')).toBeNull();
});
test("known category, subcategory and tag values have Hungarian labels", () => {
  for (const value of ["Candles", "Fragrance Oils", "Pillar", "Herbal", "Pouring", "soy", "wood", "checkout"]) expect(hungarian(value)).not.toBe(value);
  expect(hungarian("Saját magyar kategória")).toBe("Saját magyar kategória");
});
