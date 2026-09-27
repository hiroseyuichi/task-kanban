import { afterEach, describe, expect, test, vi } from "vitest";
import { getSupabaseEnv } from "@/lib/supabase/env";

describe("getSupabaseEnv", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test("URL とキーが両方設定されているとき、その値を返す", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test");

    expect(getSupabaseEnv()).toEqual({
      url: "https://example.supabase.co",
      publishableKey: "sb_publishable_test",
    });
  });

  test("URL が未設定のとき、設定方法を示すエラーを投げる", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", undefined);
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test");

    expect(() => getSupabaseEnv()).toThrow(/NEXT_PUBLIC_SUPABASE_URL/);
  });

  test("キーが未設定のとき、設定方法を示すエラーを投げる", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", undefined);

    expect(() => getSupabaseEnv()).toThrow(/NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/);
  });

  test("値が空文字（.env.local で = の右が空）のとき、エラーを投げる", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");

    expect(() => getSupabaseEnv()).toThrow(/\.env\.local/);
  });
});
