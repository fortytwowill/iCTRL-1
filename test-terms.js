import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://katrzxlydbvuabyhuliq.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthdHJ6eGx5ZGJ2dWFieWh1bGlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzMDI5MDEsImV4cCI6MjA4Njg3ODkwMX0.94gcAeUPdBH42QKzlLmyE7rf6TxWJ67IUbR9tXYRFaU";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const adminClient = supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;

async function run() {
  const email = "jiyil84849@exespay.com";
  const newPassword = "NewSecretPassword123!!";
  const userId = "ccfec54d-724a-4c13-9aaa-ae3729c5ace0";

  console.log("Signing in...");
  const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password: newPassword
  });

  if (signInError) {
    console.error("Sign in error:", signInError);
    return;
  }

  const token = authData.session?.access_token;
  if (!token) {
    console.error("No session token after sign in!");
    return;
  }

  console.log("Invoking accept-platform-terms with token");
  const { data, error } = await supabase.functions.invoke("accept-platform-terms", {
    body: { documentKey: "platform_terms", acceptanceSource: "test_script" }
  });

  console.log("Result data:", data);
  console.log("Result error:", error?.message || error);
  if (error && error.context) {
    console.log("Error context:", await error.context.json().catch(() => "no json"));
  }
}

run();
