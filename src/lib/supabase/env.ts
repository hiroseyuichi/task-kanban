type SupabaseEnv = {
  url: string;
  publishableKey: string;
};

// NEXT_PUBLIC_ 変数はビルド時に文字列置換されるため、process.env.XXX と直接書く必要がある
export function getSupabaseEnv(): SupabaseEnv {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error(
      "Supabase の環境変数が未設定です。.env.local に NEXT_PUBLIC_SUPABASE_URL と NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY を設定してください。",
    );
  }

  return { url, publishableKey };
}
