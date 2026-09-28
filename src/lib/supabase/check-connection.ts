import { getSupabaseEnv } from "./env";

export type SupabaseConnectionResult =
  | { ok: true; url: string }
  | { ok: false; message: string };

const timeoutMs = 5000;

// テーブルの有無に依存しないよう、Auth のヘルスチェックエンドポイントで疎通を確認する
export async function checkSupabaseConnection(): Promise<SupabaseConnectionResult> {
  let env;
  try {
    env = getSupabaseEnv();
  } catch (error) {
    return { ok: false, message: toMessage(error) };
  }

  try {
    const response = await fetch(`${env.url}/auth/v1/health`, {
      headers: { apikey: env.publishableKey },
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!response.ok) {
      return {
        ok: false,
        message: `${env.url} が HTTP ${response.status} を返しました`,
      };
    }

    return { ok: true, url: env.url };
  } catch (error) {
    return { ok: false, message: `${env.url} に接続できません: ${toMessage(error)}` };
  }
}

function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
