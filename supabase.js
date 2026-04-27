import { createClient } from "@supabase/supabase-js";

// Hardcoded credentials to bypass environment variable issues
const SUPABASE_URL = "https://xxcvzqqiifamltivkzvy.supabase.co";
const SUPABASE_KEY = "sb_publishable_eB97VhnIgWG4VYq0x9gZsQ_xtdbu97N";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export async function fetchClients() {
  try {
    const { data, error } = await supabase.from("clients").select("*");
    if (error) throw error;
    return data || [];
  } catch (e) {
    console.error("fetchClients error:", e);
    return [];
  }
}

export async function fetchRecipes() {
  try {
    const { data, error } = await supabase.from("recipes").select("*");
    if (error) throw error;
    return data || [];
  } catch (e) {
    console.error("fetchRecipes error:", e);
    return [];
  }
}

export async function fetchBlogs() {
  try {
    const { data, error } = await supabase.from("blogs").select("*");
    if (error) throw error;
    return data || [];
  } catch (e) {
    console.error("fetchBlogs error:", e);
    return [];
  }
}

export async function fetchGuidance(clientId) {
  try {
    const { data, error } = await supabase
      .from("guidance")
      .select("*")
      .eq("client_id", clientId);
    if (error) throw error;
    return data || [];
  } catch (e) {
    console.error("fetchGuidance error:", e);
    return [];
  }
}

export async function addClient(client) {
  try {
    const { data, error } = await supabase
      .from("clients")
      .insert([client])
      .select();
    if (error) throw error;
    return data?.[0] || null;
  } catch (e) {
    console.error("addClient error:", e);
    return null;
  }
}

export async function upsertGuidance(clientId, dateKey, fields) {
  try {
    const { data, error } = await supabase
      .from("guidance")
      .upsert(
        [{ client_id: clientId, date_key: dateKey, ...fields }],
        { onConflict: "client_id,date_key" }
      )
      .select();
    if (error) throw error;
    return data?.[0] || null;
  } catch (e) {
    console.error("upsertGuidance error:", e);
    return null;
  }
}

export async function deleteGuidance(clientId, dateKey) {
  try {
    const { error } = await supabase
      .from("guidance")
      .delete()
      .eq("client_id", clientId)
      .eq("date_key", dateKey);
    if (error) throw error;
    return true;
  } catch (e) {
    console.error("deleteGuidance error:", e);
    return false;
  }
}

export async function upsertRecipe(recipe) {
  try {
    const { data, error } = await supabase
      .from("recipes")
      .upsert([recipe], { onConflict: "id" })
      .select();
    if (error) throw error;
    return data?.[0] || null;
  } catch (e) {
    console.error("upsertRecipe error:", e);
    return null;
  }
}

export async function deleteRecipe(id) {
  try {
    const { error } = await supabase.from("recipes").delete().eq("id", id);
    if (error) throw error;
    return true;
  } catch (e) {
    console.error("deleteRecipe error:", e);
    return false;
  }
}

export async function upsertBlog(blog) {
  try {
    const { data, error } = await supabase
      .from("blogs")
      .upsert([blog], { onConflict: "id" })
      .select();
    if (error) throw error;
    return data?.[0] || null;
  } catch (e) {
    console.error("upsertBlog error:", e);
    return null;
  }
}

export async function deleteBlog(id) {
  try {
    const { error } = await supabase.from("blogs").delete().eq("id", id);
    if (error) throw error;
    return true;
  } catch (e) {
    console.error("deleteBlog error:", e);
    return false;
  }
}
