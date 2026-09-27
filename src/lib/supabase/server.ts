import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseEnv } from "./env";

// Server Component / Server Function / Route Handler 用の Supabase クライアント
// リクエストごとに新しく作ること（リクエスト間で共有しない）
export async function createClient() {
  const { url, publishableKey } = getSupabaseEnv();
  const cookieStore = await cookies();

  return createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Server Component の描画中は cookie を書き込めないため無視する
          // （セッション更新は Server Function / Route Handler 側で行われる）
        }
      },
    },
  });
}
