import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { checkSupabaseConnection } from "@/lib/supabase/check-connection";

describe("checkSupabaseConnection", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  test("ヘルスチェックが 200 を返すとき、接続成功と URL を返す", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(checkSupabaseConnection()).resolves.toEqual({
      ok: true,
      url: "https://example.supabase.co",
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://example.supabase.co/auth/v1/health",
      expect.objectContaining({ headers: { apikey: "sb_publishable_test" } }),
    );
  });

  test("ヘルスチェックが 401 を返すとき、ステータスコードを含む失敗を返す", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("", { status: 401 })));

    const result = await checkSupabaseConnection();

    expect(result.ok).toBe(false);
    expect(result).toMatchObject({ message: expect.stringMatching(/401/) });
  });

  test("通信エラーが起きたとき、例外を投げずにエラー内容を含む失敗を返す", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("fetch failed")));

    const result = await checkSupabaseConnection();

    expect(result).toMatchObject({ ok: false, message: expect.stringMatching(/fetch failed/) });
  });

  test("環境変数が未設定のとき、通信せずに設定方法を示す失敗を返す", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", undefined);
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const result = await checkSupabaseConnection();

    expect(result).toMatchObject({ ok: false, message: expect.stringMatching(/\.env\.local/) });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
