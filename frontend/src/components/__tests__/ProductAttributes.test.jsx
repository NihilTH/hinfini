import React, { act } from "react";
import { createRoot } from "react-dom/client";
import ProductAttributes, { initialAttributes } from "../ProductAttributes";
jest.mock("@/context/LangContext", () => ({ useLang: () => ({ lang: "hu" }) }));
test("only enabled nonempty attributes appear; emoji and unsafe markup remain plain text", async () => {
 global.IS_REACT_ACT_ENVIRONMENT = true;
 const host = document.createElement("div"); const root = createRoot(host);
 const product = { attributes: [
 {key: "wax", label: "Viasz", value: "Szója 🕯️ <img src=x onerror=alert(1)>", enabled: true},
 {key: "color", label: "Szín", value: "Rejtett", enabled: false},
 {key: "weight", label: "Tömeg", value: "  ", enabled: true}], usage_instructions: "Hagyd kihűlni 🔥" };
 await act(async () => root.render(<ProductAttributes product={product} />));
 expect(host.textContent).toContain("Szója 🕯️"); expect(host.textContent).toContain("Hagyd kihűlni 🔥");
 expect(host.textContent).not.toContain("Rejtett"); expect(host.textContent).not.toContain("Tömeg");
 expect(host.querySelector("img")).toBeNull();
 expect(initialAttributes(product.attributes).find(a=>a.key === "color").value).toBe("Rejtett");
 await act(async () => root.unmount());
});
