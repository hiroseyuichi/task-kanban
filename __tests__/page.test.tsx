import { afterEach, expect, test } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import Page from "@/app/page";

afterEach(() => {
  cleanup();
});

test("トップページに見出しが表示される", () => {
  render(<Page />);
  expect(
    screen.getByRole("heading", { level: 1, name: /To get started/ }),
  ).toBeDefined();
});
