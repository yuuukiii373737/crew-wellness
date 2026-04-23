import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// ── CLIENTS ──────────────────────────────────────────
export async function fetchClients() {
  const { data, error } = await supabase.from('clients').select('*').order('id')
  if (error) { console.error(error); return []; }
  return data;
}
export async function addClient(client) {
  const { data, error } = await supabase.from('clients').insert([client]).select().single()
  if (error) { console.error(error); return null; }
  return data;
}

// ── GUIDANCE ─────────────────────────────────────────
export async function fetchGuidance(clientId) {
  const { data, error } = await supabase.from('guidance').select('*').eq('client_id', clientId)
  if (error) { console.error(error); return []; }
  return data;
}
export async function upsertGuidance(clientId, dateKey, fields) {
  const { data: existing } = await supabase.from('guidance').select('id').eq('client_id', clientId).eq('date_key', dateKey).single()
  if (existing) {
    await supabase.from('guidance').update({ ...fields }).eq('id', existing.id)
  } else {
    await supabase.from('guidance').insert([{ client_id: clientId, date_key: dateKey, ...fields }])
  }
}
export async function deleteGuidance(clientId, dateKey) {
  await supabase.from('guidance').delete().eq('client_id', clientId).eq('date_key', dateKey)
}

// ── RECIPES ──────────────────────────────────────────
export async function fetchRecipes() {
  const { data, error } = await supabase.from('recipes').select('*').order('id')
  if (error) { console.error(error); return []; }
  return data.map(r => ({ ...r, desc: r.description }));
}
export async function upsertRecipe(recipe) {
  const payload = { ...recipe, description: recipe.desc }
  delete payload.desc
  if (recipe.id && typeof recipe.id === 'number' && recipe.id > 1000) {
    // new recipe (local temp id)
    delete payload.id
    const { data, error } = await supabase.from('recipes').insert([payload]).select().single()
    if (error) { console.error(error); return null; }
    return data;
  } else {
    const { data, error } = await supabase.from('recipes').update(payload).eq('id', recipe.id).select().single()
    if (error) { console.error(error); return null; }
    return data;
  }
}
export async function deleteRecipe(id) {
  await supabase.from('recipes').delete().eq('id', id)
}

// ── BLOGS ─────────────────────────────────────────────
export async function fetchBlogs() {
  const { data, error } = await supabase.from('blogs').select('*').order('id', { ascending: false })
  if (error) { console.error(error); return []; }
  return data.map(b => ({ ...b, readMin: b.read_min, sections: [{ type: 'text', text: b.body || '' }] }));
}
export async function upsertBlog(blog) {
  const payload = { title: blog.title, date: blog.date, emoji: blog.emoji, read_min: blog.readMin || blog.read_min || 3, body: blog.body || '' }
  if (blog.id && typeof blog.id === 'number' && blog.id > 100000) {
    const { data, error } = await supabase.from('blogs').insert([payload]).select().single()
    if (error) { console.error(error); return null; }
    return data;
  } else {
    const { data, error } = await supabase.from('blogs').update(payload).eq('id', blog.id).select().single()
    if (error) { console.error(error); return null; }
    return data;
  }
}
export async function deleteBlog(id) {
  await supabase.from('blogs').delete().eq('id', id)
}
