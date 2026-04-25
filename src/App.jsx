import { useState, createContext, useContext, useEffect } from "react";
import { fetchClients, fetchRecipes, fetchBlogs, fetchGuidance, addClient, upsertGuidance, deleteGuidance, upsertRecipe, deleteRecipe, upsertBlog, deleteBlog } from "./supabase";

// ═══════════════════════════════════════════════════════
// SHARED DATA STORE (simulates a backend database)
// ═══════════════════════════════════════════════════════
const StoreContext = createContext(null);

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS_SHORT = ["M","T","W","T","F","S","S"];

function getDaysInMonth(y, m) { return new Date(y, m + 1, 0).getDate(); }
function getFirstDay(y, m) { let d = new Date(y, m, 1).getDay(); return d === 0 ? 6 : d - 1; }

const INITIAL_CLIENTS = [
  { id: 1, name: "田中 さくら", airline: "ANA", since: "2024.01", avatar: "🌸", color: "#F472B6", pass: "sakura" },
  { id: 2, name: "山本 ゆい",   airline: "JAL", since: "2024.03", avatar: "🌿", color: "#34D399", pass: "yui" },
];

const RECIPE_CATS = [
  { id: "all",    label: "すべて",           emoji: "🍽️" },
  { id: "before", label: "フライト前パワーご飯", emoji: "⚡" },
  { id: "after",  label: "フライト後回復ご飯",  emoji: "🔋" },
  { id: "gut",    label: "腸活ご飯",          emoji: "🦠" },
  { id: "snack",  label: "腸活おやつ",        emoji: "🫙" },
  { id: "bloat",  label: "むくみ予防/解消",    emoji: "💧" },
  { id: "sleep",  label: "時差ボケ対策",      emoji: "🌙" },
];

const INITIAL_RECIPES = [
  { id:1,  category:"before", name:"パワーオートミール",   emoji:"🥣", photo:"", desc:"持続エネルギー補給でフライトを乗り切る",   ingredients:["オートミール 60g","バナナ 1本","はちみつ 小1","くるみ 10g","牛乳 150ml"], steps:["牛乳でオートミールを3分煮る","バナナをスライスしてのせる","くるみとはちみつをトッピング"], protein:"12g", vitamins:"ビタミンB群, Mg" },
  { id:2,  category:"before", name:"チキン＆野菜ライス",   emoji:"🍚", photo:"", desc:"フライト2時間前の理想的な腹ごしらえ",    ingredients:["白米 180g","鶏むね肉 120g","ブロッコリー 50g","オリーブオイル","塩こしょう"], steps:["鶏むねを一口切りにしソテー","ブロッコリーを茹でる","ご飯の上に盛り付けて完成"], protein:"28g", vitamins:"ビタミンC, B6" },
  { id:3,  category:"after",  name:"サーモン丼",          emoji:"🍱", photo:"", desc:"オメガ3と良質なタンパク質で疲労回復",    ingredients:["白米 200g","スモークサーモン 80g","アボカド 1/2個","醤油・わさび"], steps:["ご飯を茶碗に盛る","アボカドをスライス","サーモン・アボカドをのせわさび醤油で完成"], protein:"24g", vitamins:"オメガ3, D" },
  { id:4,  category:"after",  name:"トリプトファン鶏むね", emoji:"🍗", photo:"", desc:"睡眠ホルモン誘導・疲労回復ダブル効果",   ingredients:["鶏むね肉 150g","バナナ 1本","ほうれん草","オリーブオイル"], steps:["鶏むねをソテー","ほうれん草を炒める","盛り付けてバナナを添える"], protein:"32g", vitamins:"トリプトファン, Mg" },
  { id:5,  category:"gut",    name:"キムチ豆腐スープ",    emoji:"🍲", photo:"", desc:"発酵食品で腸内フローラを整える",         ingredients:["絹豆腐 150g","キムチ 50g","鶏ガラスープ 300ml","ごま油"], steps:["スープを温める","豆腐を入れて3分煮る","キムチを加えてひと煮立ち","ごま油をたらして完成"], protein:"12g", vitamins:"プロバイオティクス" },
  { id:6,  category:"gut",    name:"発酵味噌定食",        emoji:"🍜", photo:"", desc:"発酵味噌で毎朝腸活スタート",             ingredients:["味噌 大1","豆腐 50g","わかめ","ねぎ","だし 200ml"], steps:["だしを温める","豆腐・わかめを加える","火を止めて味噌を溶かしねぎを散らす"], protein:"6g", vitamins:"プロバイオティクス, K" },
  { id:7,  category:"snack",  name:"ヨーグルトパルフェ",  emoji:"🫙", photo:"", desc:"グラノーラ＋ベリーでビタミンも同時補給", ingredients:["ギリシャヨーグルト 100g","グラノーラ 30g","ミックスベリー 50g","はちみつ 小1"], steps:["ヨーグルトをグラスに入れる","グラノーラをのせる","ベリー・はちみつをトッピング"], protein:"10g", vitamins:"プロバイオティクス, C" },
  { id:8,  category:"snack",  name:"バナナ×ピーナッツ",   emoji:"🍌", photo:"", desc:"腸活＆エネルギー補給の最強おやつ",       ingredients:["バナナ 1本","ピーナッツバター 大1","シナモン少々"], steps:["バナナをスライス","ピーナッツバターをディップ","シナモンをふって完成"], protein:"5g", vitamins:"B6, Mg" },
  { id:9,  category:"bloat",  name:"生姜きゅうりスープ",  emoji:"🥒", photo:"", desc:"利尿作用でむくみをすっきり解消",         ingredients:["きゅうり 1本","生姜 1かけ","鶏ガラスープ 300ml","ごま油","塩"], steps:["きゅうりを乱切り","生姜をすりおろす","スープで5分煮てごま油で仕上げ"], protein:"3g", vitamins:"カリウム, K" },
  { id:10, category:"bloat",  name:"アボカドサラダ",      emoji:"🥗", photo:"", desc:"カリウム豊富でナトリウムを排出",         ingredients:["アボカド 1個","トマト 1個","紫玉ねぎ 1/4個","レモン汁","オリーブオイル","塩こしょう"], steps:["野菜を食べやすくカット","オリーブオイル・レモン汁で和える","盛り付けて完成"], protein:"4g", vitamins:"カリウム, E, 葉酸" },
  { id:11, category:"sleep",  name:"腸活スムージー",      emoji:"🥤", photo:"", desc:"体内時計リセットに最適な朝ドリンク",     ingredients:["バナナ 1本","ヨーグルト 100g","はちみつ 小1","牛乳 100ml"], steps:["全材料をミキサーへ","30秒撹拌","グラスに注いで完成"], protein:"8g", vitamins:"ビタミンC, B群" },
  { id:12, category:"sleep",  name:"温かい豆乳ドリンク",  emoji:"🥛", photo:"", desc:"トリプトファンでメラトニン分泌を促進",   ingredients:["豆乳 200ml","はちみつ 小1","シナモン少々"], steps:["豆乳を60℃に温める","はちみつを溶かす","シナモンをふって完成"], protein:"7g", vitamins:"トリプトファン, B群" },
];

const INITIAL_BLOGS = [
  {
    id: 1,
    title: "客室乗務員の睡眠、終わってます。【CA歴〇年が本気で語る時差ボケ地獄とその脱出法】",
    date: "Apr 22 2026",
    emoji: "😴",
    readMin: 5,
    sections: [
      {
        type: "intro",
        text: "こんにちは。今日も何時間寝たか把握できていない、現役CAのウェルネスアドバイザーです。\n\nいきなりですが、聞いてください。\n\n昨日の夜ごはん、覚えてません。\n\nいや正確には、昨日の「夜」がいつだったかも、もはやよくわからない。フランクフルト発で東京着いて、そのまま折り返しでアブダビ行って、レイオーバー1泊して帰ってきたら、カーテン開けたら「あれ、朝？夜？」ってなってた。そういう生活です。\n\nこれが、客室乗務員のリアルです。キラキラしてなくてすみません。"
      },
      {
        type: "heading",
        text: "CAの睡眠事情、一般人には伝わらない説"
      },
      {
        type: "text",
        text: "「CAって大変だよね〜」って言われるたびに、「いや、ほんとに？わかってる？」ってなります。たとえばこういうことです。"
      },
      {
        type: "timeline",
        items: [
          { day: "月曜日", text: "ロンドン到着、現地時間AM2時。でも体内時計はAM10時のつもり。全然眠れない。" },
          { day: "火曜日", text: "ようやく寝たと思ったら、モーニングコールで起こされる。起き上がれない。でも仕事。" },
          { day: "水曜日", text: "日本に帰国。帰ったら夕方なのに、体は「深夜3時」と言い張る。眠れない。ごはん食べたい。でも寝なきゃ。でも眠れない。" },
          { day: "木曜日", text: "次のフライトへ。" },
        ]
      },
      {
        type: "text",
        text: "これ、笑えますか？私は笑えます。笑うしかないので。"
      },
      {
        type: "heading",
        text: "CAあるあるで共感してほしい5選"
      },
      {
        type: "list",
        items: [
          { label: "「今どこにいるの？」の答えに3秒かかる", text: "真剣に考えます。「あれ、昨日どこだっけ。ドバイ？いや違う、あれはおととい。今日は…羽田？成田？」みたいな。" },
          { label: "ホテルの部屋を真っ暗にするプロになる", text: "カーテンを完璧に閉める技術は、一流ホテルのコンシェルジュより上だと思ってます。光が1ミリでも入ってきたら、タオルで塞ぎます。本気です。" },
          { label: "「疲れてる？」に答えられない", text: "いつも疲れてるので、比較対象がなくなりました。「ふつう」が何かわからなくなってきた。" },
          { label: "空腹と満腹の感覚がバグる", text: "胃が「今は昼ごはんの時間だよ！」と言ってくるんですが、外は真夜中だったりします。体、もうほんとに自由にしてる。" },
          { label: "休みの日に「何もしない」ができない", text: "体が休もうとすると、謎の焦燥感が来る。「OFF日なのに動かないとまずい気がする」という謎のプレッシャー。いや、休んでいいんだよ自分。" },
        ]
      },
      {
        type: "heading",
        text: "でも、ちゃんと対策したら変わりました"
      },
      {
        type: "text",
        text: "笑えるあるあるを書いてきましたが、実はここが本題です。\n\nCAを続けながら、ちゃんと体を整える方法、あります。\n\n私自身、ひどい時差ボケと体調不良を繰り返して、「このままじゃまずい」と思って本気で勉強しました。栄養学、睡眠科学、フライトスケジュールに合わせた食事設計。\n\nそこで気づいたのが、「何を食べるか・いつ寝るか」をロスターに合わせて設計すると、体の回復スピードが全然違うということ。\n\nたとえばフライト前日の食事。実は「何を食べるか」より「いつ食べるか」が時差ボケに影響します。現地の朝に合わせて食事タイミングをずらすだけで、体内時計のリセットが早くなる。これ、知ってるCAと知らないCAで、レイオーバー明けのコンディションが明らかに違うんです。"
      },
      {
        type: "cta",
        text: "もし「自分のロスターに合わせた睡眠・食事アドバイスが欲しい」という方は、個別のクルーウェルネス指導もやっています。"
      },
      {
        type: "next",
        text: "次回予告：「フライト前日に食べてはいけないもの、CA目線で教えます」"
      }
    ]
  },
  { id: 2, title: "長距離フライト中の食事戦略", date: "Apr 10 2026", emoji: "✈️", readMin: 4,
    sections: [{ type: "text", text: "フライト中は気圧の変化で腸が膨張しやすいため、炭酸飲料・豆類・キャベツは避けましょう。水分は2時間ごとに200mlを目安に補給。機内食は塩分が高いため、持参したナッツやドライフルーツが◎。" }]
  },
  { id: 3, title: "レイオーバー先でも腸活！発酵食品の選び方", date: "Apr 3 2026", emoji: "🦠", readMin: 2,
    sections: [{ type: "text", text: "海外のスーパーではヨーグルト・ケフィア・コンブチャが手に入ります。ラベルに『Live cultures』や『Probiotics』と書かれているものを選びましょう。毎朝1品取り入れるだけで腸内環境が改善されます。" }]
  },
];

const ROUTE_COLORS = { OFF: "#F59E0B", SL: "#8B5CF6" };
function routeColor(code) {
  if (!code) return null;
  return ROUTE_COLORS[code] || "#3B82F6";
}

// ═══════════════════════════════════════════════════════
// ROOT
// ═══════════════════════════════════════════════════════
export default function App() {
  const today = new Date();
  const [clients, setClients] = useState([]);
  const [guidance, setGuidance] = useState({});
  const [recipes, setRecipes] = useState(INITIAL_RECIPES);
  const [blogs, setBlogs] = useState(INITIAL_BLOGS);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load base data from Supabase on mount
  useEffect(() => {
    async function loadAll() {
      try {
        const [cls, recs, bls] = await Promise.all([fetchClients(), fetchRecipes(), fetchBlogs()]);
        if (cls.length > 0) setClients(cls);
        else setClients(INITIAL_CLIENTS);
        if (recs.length > 0) setRecipes(recs.map(r => ({ ...r, desc: r.description || r.desc || "" })));
        if (bls.length > 0) setBlogs(bls);
      } catch(e) { console.error(e); setClients(INITIAL_CLIENTS); }
      setLoading(false);
    }
    loadAll();
  }, []);

  // Load guidance when user logs in
  useEffect(() => {
    if (!user) return;
    if (user.role === "client") {
      // Load this client's guidance
      loadClientGuidance(user.client.id);
    } else if (user.role === "admin") {
      // Load ALL clients' guidance for admin
      loadAllGuidance();
    }
  }, [user]);

  // Poll for updates every 10 seconds when logged in
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      if (user.role === "client") loadClientGuidance(user.client.id);
      else if (user.role === "admin") loadAllGuidance();
    }, 10000);
    return () => clearInterval(interval);
  }, [user]);

  const loadClientGuidance = async (clientId) => {
    const rows = await fetchGuidance(clientId);
    const map = {};
    rows.forEach(r => { map[r.date_key] = r; });
    setGuidance(g => ({ ...g, [clientId]: map }));
  };

  const loadAllGuidance = async () => {
    const cls = await fetchClients();
    if (cls.length > 0) setClients(cls);
    for (const c of cls) {
      const rows = await fetchGuidance(c.id);
      const map = {};
      rows.forEach(r => { map[r.date_key] = r; });
      setGuidance(g => ({ ...g, [c.id]: map }));
    }
  };

  if (loading) return (
    <div style={{ fontFamily:"'Helvetica Neue',Arial,sans-serif", background:"#0F172A", minHeight:"100vh", color:"#F1F5F9", maxWidth:430, margin:"0 auto", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:16 }}>
      <div style={{ fontSize:48 }}>🌿</div>
      <div style={{ fontSize:16, color:"#64748B" }}>読み込み中...</div>
    </div>
  );

  const store = { today, clients, setClients, guidance, setGuidance, recipes, setRecipes, blogs, setBlogs, user, setUser,
    // Supabase actions
    sbAddClient: async (c) => { const r = await addClient(c); if(r) setClients(prev => [...prev, r]); return r; },
    sbSaveGuidance: async (clientId, dateKey, fields) => {
      await upsertGuidance(clientId, dateKey, fields);
      // Immediately update local state
      setGuidance(g => ({ ...g, [clientId]: { ...(g[clientId]||{}), [dateKey]: { ...fields, client_id: clientId, date_key: dateKey } } }));
      // Also reload from DB to ensure consistency
      const rows = await fetchGuidance(clientId);
      const map = {};
      rows.forEach(r => { map[r.date_key] = r; });
      setGuidance(g => ({ ...g, [clientId]: map }));
    },
    sbDeleteGuidance: async (clientId, dateKey) => {
      await deleteGuidance(clientId, dateKey);
      setGuidance(g => { const c={...g,[clientId]:{...(g[clientId]||{})}}; delete c[clientId][dateKey]; return c; });
    },
    sbSaveRecipe: async (recipe) => { const r = await upsertRecipe(recipe); if(r) { setRecipes(prev => prev.some(x=>x.id===r.id) ? prev.map(x=>x.id===r.id?{...r,desc:r.description||""}:x) : [...prev,{...r,desc:r.description||""}]); } return r; },
    sbDeleteRecipe: async (id) => { await deleteRecipe(id); setRecipes(prev=>prev.filter(r=>r.id!==id)); },
    sbSaveBlog: async (blog) => { const r = await upsertBlog(blog); if(r) { setBlogs(prev => prev.some(x=>x.id===r.id) ? prev.map(x=>x.id===r.id?{...r,readMin:r.read_min,sections:[{type:"text",text:r.body||""}]}:x) : [{...r,readMin:r.read_min,sections:[{type:"text",text:r.body||""}]},...prev]); } return r; },
    sbDeleteBlog: async (id) => { await deleteBlog(id); setBlogs(prev=>prev.filter(b=>b.id!==id)); },
    // Manual refresh
    refreshGuidance: (clientId) => loadClientGuidance(clientId),
  };

  return (
    <StoreContext.Provider value={store}>
      <div style={{ fontFamily:"'Helvetica Neue',Arial,sans-serif", background:"#0F172A", minHeight:"100vh", color:"#F1F5F9", maxWidth:430, margin:"0 auto" }}>
        {!user ? <LoginScreen /> : user.role === "admin" ? <AdminApp /> : <ClientApp />}
      </div>
    </StoreContext.Provider>
  );
}

// ═══════════════════════════════════════════════════════
// LOGIN
// ═══════════════════════════════════════════════════════
function LoginScreen() {
  const { clients, setUser } = useContext(StoreContext);
  const [mode, setMode] = useState("choose"); // choose | admin | client
  const [adminPass, setAdminPass] = useState("");
  const [clientId, setClientId] = useState("");
  const [clientPass, setClientPass] = useState("");
  const [err, setErr] = useState("");

  const loginAdmin = () => {
    if (adminPass === "wellness2026") { setUser({ role: "admin" }); setErr(""); }
    else setErr("パスワードが違います");
  };
  const loginClient = () => {
    const c = clients.find(c => String(c.id) === clientId && c.pass === clientPass);
    if (c) { setUser({ role: "client", client: c }); setErr(""); }
    else setErr("IDまたはパスワードが違います");
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"100vh", padding:32 }}>
      <div style={{ fontSize:48, marginBottom:12 }}>🌿</div>
      <div style={{ fontSize:22, fontWeight:900, marginBottom:4 }}>Crew Wellness</div>
      <div style={{ fontSize:13, color:"#64748B", marginBottom:40 }}>クルーウェルネスアドバイザー</div>

      {mode === "choose" && (
        <div style={{ width:"100%", display:"flex", flexDirection:"column", gap:14 }}>
          <button onClick={() => setMode("admin")} style={{ ...btn("#3B82F6"), fontSize:16, padding:18 }}>管理者としてログイン</button>
          <button onClick={() => setMode("client")} style={{ ...btn("#1E293B"), fontSize:16, padding:18, border:"1px solid #334155" }}>クライアントとしてログイン</button>
          <div style={{ fontSize:11, color:"#334155", textAlign:"center", marginTop:8 }}>
            管理者PW: wellness2026 / クライアントID: 1 PW: sakura
          </div>
        </div>
      )}

      {mode === "admin" && (
        <div style={{ width:"100%" }}>
          <div style={{ fontSize:14, color:"#94A3B8", marginBottom:16 }}>管理者パスワード</div>
          <input type="password" value={adminPass} onChange={e => setAdminPass(e.target.value)}
            onKeyDown={e => e.key==="Enter" && loginAdmin()}
            placeholder="パスワードを入力" style={inputStyle} />
          {err && <div style={{ color:"#EF4444", fontSize:13, marginTop:8 }}>{err}</div>}
          <button onClick={loginAdmin} style={{ ...btn("#3B82F6"), width:"100%", marginTop:16, padding:14 }}>ログイン</button>
          <button onClick={() => { setMode("choose"); setErr(""); }} style={{ ...btn("transparent"), width:"100%", marginTop:8, color:"#64748B" }}>戻る</button>
        </div>
      )}

      {mode === "client" && (
        <div style={{ width:"100%" }}>
          <div style={{ fontSize:14, color:"#94A3B8", marginBottom:10 }}>クライアントID</div>
          <select value={clientId} onChange={e => setClientId(e.target.value)} style={{ ...inputStyle, marginBottom:12 }}>
            <option value="">選択してください</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.avatar} {c.name}</option>)}
          </select>
          <div style={{ fontSize:14, color:"#94A3B8", marginBottom:10 }}>パスワード</div>
          <input type="password" value={clientPass} onChange={e => setClientPass(e.target.value)}
            onKeyDown={e => e.key==="Enter" && loginClient()}
            placeholder="パスワード" style={inputStyle} />
          {err && <div style={{ color:"#EF4444", fontSize:13, marginTop:8 }}>{err}</div>}
          <button onClick={loginClient} style={{ ...btn("#34D399","#0F172A"), width:"100%", marginTop:16, padding:14 }}>ログイン</button>
          <button onClick={() => { setMode("choose"); setErr(""); }} style={{ ...btn("transparent"), width:"100%", marginTop:8, color:"#64748B" }}>戻る</button>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// ADMIN APP
// ═══════════════════════════════════════════════════════
function AdminApp() {
  const { setUser } = useContext(StoreContext);
  const [tab, setTab] = useState("clients"); // clients | recipes | blog

  return (
    <div style={{ display:"flex", flexDirection:"column", minHeight:"100vh" }}>
      {/* Header */}
      <div style={{ padding:"20px 20px 12px", borderBottom:"1px solid #1E293B", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div>
          <div style={{ fontSize:11, color:"#64748B", letterSpacing:2 }}>ADMIN</div>
          <div style={{ fontSize:20, fontWeight:900 }}>🌿 管理者ダッシュボード</div>
        </div>
        <button onClick={() => setUser(null)} style={{ background:"#1E293B", border:"none", color:"#64748B", borderRadius:20, padding:"6px 14px", cursor:"pointer", fontSize:12 }}>ログアウト</button>
      </div>

      {/* Tab content */}
      <div style={{ flex:1, overflowY:"auto", paddingBottom:80 }}>
        {tab === "clients" && <AdminClients />}
        {tab === "recipes" && <AdminRecipes />}
        {tab === "blog" && <AdminBlog />}
      </div>

      {/* Bottom tabs */}
      <div style={{ position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:430, background:"#1E293B", borderTop:"1px solid #334155", display:"flex", paddingBottom:16, paddingTop:10 }}>
        {[{ id:"clients", icon:"👥", label:"クライアント" }, { id:"recipes", icon:"🍽️", label:"レシピ管理" }, { id:"blog", icon:"📝", label:"ブログ管理" }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ flex:1, background:"none", border:"none", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:3 }}>
            <span style={{ fontSize:20 }}>{t.icon}</span>
            <span style={{ fontSize:10, color: tab===t.id ? "#3B82F6" : "#475569", fontWeight: tab===t.id ? 700 : 400 }}>{t.label}</span>
            {tab===t.id && <div style={{ width:20, height:3, background:"#3B82F6", borderRadius:2 }} />}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Admin: Clients & Guidance ─────────────────────────
function AdminClients() {
  const { today, clients, guidance, recipes, sbAddClient, sbSaveGuidance, sbDeleteGuidance } = useContext(StoreContext);
  const [screen, setScreen] = useState("list");
  const [sel, setSel] = useState(null);
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selDay, setSelDay] = useState(null);
  const [editData, setEditData] = useState({});
  const [showAdd, setShowAdd] = useState(false);
  const [newC, setNewC] = useState({ name:"", airline:"", pass:"" });
  const [saving, setSaving] = useState(false);

  const dk = d => `${year}-${month}-${d}`;
  const cG = sel ? (guidance[sel.id] || {}) : {};

  const openEdit = d => {
    setSelDay(d);
    setEditData({ roster:"", sleep:"", meal:"", meal2:"", supplement:"", notes:"", ...(cG[dk(d)] || {}) });
    setScreen("edit");
  };
  const save = async () => {
    setSaving(true);
    await sbSaveGuidance(sel.id, dk(selDay), { roster:editData.roster, sleep:editData.sleep, meal:editData.meal, meal2:editData.meal2, supplement:editData.supplement, notes:editData.notes });
    setSaving(false);
    setScreen("calendar");
  };  const del = async d => {
    await sbDeleteGuidance(sel.id, dk(d));
  };
  const addClient = async () => {
    if (!newC.name.trim()) return;
    const avatars=["🌺","🦋","🌙","🔥","💫","🍀"]; const colors=["#60A5FA","#A78BFA","#FB7185","#2DD4BF","#F97316","#E879F9"];
    const idx=clients.length%avatars.length;
    const payload = { name:newC.name, airline:newC.airline, since:`${today.getFullYear()}.${String(today.getMonth()+1).padStart(2,"0")}`, avatar:avatars[idx], color:colors[idx], pass:newC.pass||"1234" };
    await sbAddClient(payload);
    setNewC({ name:"", airline:"", pass:"" }); setShowAdd(false);
  };

  if (screen === "list") return (
    <div style={{ padding:"16px 20px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <span style={{ fontSize:13, fontWeight:700, color:"#94A3B8", letterSpacing:1 }}>CLIENTS ({clients.length})</span>
        <button onClick={() => setShowAdd(true)} style={{ ...btn("#3B82F6"), padding:"6px 14px", fontSize:12 }}>+ 追加</button>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {clients.map(c => (
          <div key={c.id} onClick={() => { setSel(c); setScreen("calendar"); }}
            style={{ background:"#1E293B", borderRadius:16, padding:"16px 18px", display:"flex", alignItems:"center", gap:14, cursor:"pointer", borderLeft:`4px solid ${c.color}` }}>
            <div style={{ fontSize:28 }}>{c.avatar}</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:16, fontWeight:700 }}>{c.name}</div>
              <div style={{ fontSize:12, color:"#64748B" }}>{c.airline} · {c.since}〜 · ID:{c.id}</div>
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:18, fontWeight:800, color:c.color }}>{Object.keys(guidance[c.id]||{}).length}</div>
              <div style={{ fontSize:10, color:"#475569" }}>指導日</div>
            </div>
            <span style={{ color:"#334155", fontSize:20 }}>›</span>
          </div>
        ))}
      </div>

      {showAdd && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <h3 style={{ marginBottom:16, fontSize:18, fontWeight:800 }}>新しいクライアント</h3>
            <input value={newC.name} onChange={e=>setNewC(n=>({...n,name:e.target.value}))} placeholder="氏名" style={{ ...inputStyle, marginBottom:10 }} />
            <input value={newC.airline} onChange={e=>setNewC(n=>({...n,airline:e.target.value}))} placeholder="航空会社（ANA, JAL...）" style={{ ...inputStyle, marginBottom:10 }} />
            <input value={newC.pass} onChange={e=>setNewC(n=>({...n,pass:e.target.value}))} placeholder="ログインパスワード" style={{ ...inputStyle }} />
            <div style={{ display:"flex", gap:10, marginTop:16 }}>
              <button onClick={()=>setShowAdd(false)} style={{ ...btn("#334155"), flex:1, padding:12 }}>キャンセル</button>
              <button onClick={addClient} style={{ ...btn("#3B82F6"), flex:1, padding:12 }}>追加</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (screen === "calendar") {
    const daysInMonth=getDaysInMonth(year,month); const firstDay=getFirstDay(year,month);
    return (
      <div style={{ padding:"16px 20px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
          <button onClick={()=>setScreen("list")} style={backBtnStyle}>‹</button>
          <div>
            <div style={{ fontSize:11, color:"#64748B" }}>指導カレンダー</div>
            <div style={{ fontSize:17, fontWeight:800 }}>{sel.avatar} {sel.name}</div>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
          <button onClick={()=>{ if(month===0){setMonth(11);setYear(y=>y-1);}else setMonth(m=>m-1); }} style={navBtnStyle}>‹</button>
          <span style={{ fontWeight:800 }}>{MONTHS[month]} {year}</span>
          <button onClick={()=>{ if(month===11){setMonth(0);setYear(y=>y+1);}else setMonth(m=>m+1); }} style={navBtnStyle}>›</button>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", marginBottom:6 }}>
          {DAYS_SHORT.map((d,i)=><div key={i} style={{ textAlign:"center", fontSize:11, color:"#475569", fontWeight:600 }}>{d}</div>)}
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:3, marginBottom:20 }}>
          {Array.from({length:firstDay}).map((_,i)=><div key={`e${i}`}/>)}
          {Array.from({length:daysInMonth}).map((_,i)=>{
            const d=i+1; const g=cG[dk(d)]; const color=g?.roster?routeColor(g.roster):null;
            const isToday=d===today.getDate()&&month===today.getMonth()&&year===today.getFullYear();
            return (
              <div key={d} onClick={()=>openEdit(d)}
                style={{ borderRadius:10, padding:"6px 2px", textAlign:"center", cursor:"pointer", background:color?`${color}20`:"#1E293B", border:isToday?"2px solid #3B82F6":"2px solid transparent" }}>
                <div style={{ fontSize:11, fontWeight:700, color:isToday?"#60A5FA":"#94A3B8" }}>{d}</div>
                {g?.arr && g.arr!=="OFF" && g.arr!=="SL" && <div style={{ fontSize:8, fontWeight:800, color, lineHeight:1.2 }}>{g.arr}</div>}
                {g?.roster==="OFF" && <div style={{ fontSize:8, fontWeight:800, color:"#F59E0B" }}>OFF</div>}
                {g?.roster==="SL" && <div style={{ fontSize:8, fontWeight:800, color:"#8B5CF6" }}>SL</div>}
                {g&&!g.arr&&!g.roster && <div style={{ width:5, height:5, borderRadius:"50%", background:"#34D399", margin:"2px auto 0" }}/>}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (screen === "edit") {
    const recipeNames = recipes.map(r=>r.name);
    const clientFlight = cG[dk(selDay)];
    return (
      <div style={{ padding:"0 20px 140px" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"16px 0" }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <button onClick={()=>setScreen("calendar")} style={backBtnStyle}>‹</button>
            <div>
              <div style={{ fontSize:11, color:"#64748B" }}>{sel.name}</div>
              <div style={{ fontSize:17, fontWeight:800 }}>{MONTHS[month]} {selDay}日</div>
            </div>
          </div>
          <button onClick={()=>{ del(selDay); setScreen("calendar"); }} style={{ background:"none", border:"none", color:"#EF4444", fontSize:13, cursor:"pointer" }}>削除</button>
        </div>

        {/* Client's flight info (read only for admin) */}
        {clientFlight?.arr && (
          <div style={{ background:"#0F172A", borderRadius:14, padding:14, marginBottom:16 }}>
            <div style={{ fontSize:11, color:"#60A5FA", fontWeight:700, marginBottom:8 }}>✈️ クライアントのフライト情報</div>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
              <span style={{ fontSize:18, fontWeight:900 }}>{clientFlight.dep||"?"}</span>
              <span style={{ color:"#334155" }}>→</span>
              <span style={{ fontSize:18, fontWeight:900 }}>{clientFlight.arr}</span>
            </div>
            <div style={{ display:"flex", gap:16 }}>
              {clientFlight.reporting && <div style={{ fontSize:12, color:"#94A3B8" }}>レポ: <span style={{ color:"#F1F5F9" }}>{clientFlight.reporting}</span></div>}
              {clientFlight.debriefing && <div style={{ fontSize:12, color:"#94A3B8" }}>デブリ: <span style={{ color:"#F1F5F9" }}>{clientFlight.debriefing}</span></div>}
            </div>
            {clientFlight.dep2 && (
              <div style={{ marginTop:8, paddingTop:8, borderTop:"1px solid #1E293B" }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ fontSize:11, color:"#8B5CF6" }}>折り返し:</span>
                  <span style={{ fontSize:16, fontWeight:900 }}>{clientFlight.dep2}</span>
                  <span style={{ color:"#334155" }}>→</span>
                  <span style={{ fontSize:16, fontWeight:900 }}>{clientFlight.arr2}</span>
                </div>
              </div>
            )}
          </div>
        )}
        {clientFlight?.roster==="OFF" && (
          <div style={{ background:"#F59E0B22", border:"1px solid #F59E0B", borderRadius:14, padding:14, marginBottom:16 }}>
            <div style={{ color:"#F59E0B", fontWeight:800 }}>😴 この日はOFF DAY</div>
          </div>
        )}
        {clientFlight?.roster==="SL" && (
          <div style={{ background:"#8B5CF622", border:"1px solid #8B5CF6", borderRadius:14, padding:14, marginBottom:16 }}>
            <div style={{ color:"#8B5CF6", fontWeight:800 }}>🏥 この日はSICK LEAVE</div>
          </div>
        )}

        <FieldSection label="🌙 睡眠指導" color="#818CF8">
          <textarea value={editData.sleep||""} onChange={e=>setEditData(d=>({...d,sleep:e.target.value}))}
            placeholder="例: 22時就寝。遮光カーテン使用。" style={{ ...inputStyle, height:72, resize:"none" }} />
        </FieldSection>

        <FieldSection label="🍽️ 食事指導" color="#34D399">
          <div style={{ marginBottom:10 }}>
            <div style={{ fontSize:12, color:"#64748B", marginBottom:6 }}>朝食</div>
            <select value={editData.meal||""} onChange={e=>setEditData(d=>({...d,meal:e.target.value}))} style={{ ...inputStyle, appearance:"none" }}>
              <option value="">選択</option>
              {recipeNames.map(r=><option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize:12, color:"#64748B", marginBottom:6 }}>昼食 / 夕食</div>
            <select value={editData.meal2||""} onChange={e=>setEditData(d=>({...d,meal2:e.target.value}))} style={{ ...inputStyle, appearance:"none" }}>
              <option value="">選択</option>
              {recipeNames.map(r=><option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </FieldSection>

        <FieldSection label="💊 サプリ・NuSkin" color="#FBBF24">
          <textarea value={editData.supplement||""} onChange={e=>setEditData(d=>({...d,supplement:e.target.value}))}
            placeholder="例: Pharmanex G3 朝1本" style={{ ...inputStyle, height:64, resize:"none" }} />
        </FieldSection>

        <FieldSection label="📌 メモ" color="#94A3B8">
          <textarea value={editData.notes||""} onChange={e=>setEditData(d=>({...d,notes:e.target.value}))}
            placeholder="クライアントへのメッセージ" style={{ ...inputStyle, height:72, resize:"none" }} />
        </FieldSection>

        <div style={{ position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:430, padding:"16px 20px 32px", background:"linear-gradient(to top,#0F172A 70%,transparent)", boxSizing:"border-box" }}>
          <button onClick={save} disabled={saving} style={{ width:"100%", background:"linear-gradient(135deg,#3B82F6,#8B5CF6)", border:"none", borderRadius:16, padding:16, color:"#fff", fontSize:16, fontWeight:800, cursor:"pointer", opacity:saving?0.7:1 }}>{saving ? "保存中..." : "保存する ✓"}</button>
        </div>
      </div>
    );
  }
  return null;
}

// ── Admin: Recipes ────────────────────────────────────
function AdminRecipes() {
  const { recipes, sbSaveRecipe, sbDeleteRecipe } = useContext(StoreContext);
  const [editing, setEditing] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const CATS = RECIPE_CATS.filter(c=>c.id!=="all").map(c=>({ id:c.id, label:`${c.emoji} ${c.label}` }));
  const blank = { name:"", category:"before", emoji:"🍽️", photo:"", desc:"", ingredients:[""], steps:[""], protein:"", vitamins:"" };
  const [form, setForm] = useState(blank);

  const openEdit = r => { setForm({...r, ingredients:[...r.ingredients], steps:[...r.steps]}); setEditing(r.id); setShowNew(true); };
  const openNew = () => { setForm(blank); setEditing(null); setShowNew(true); };
  const save = async () => {
    setSaving(true);
    await sbSaveRecipe(editing ? { ...form, id: editing } : { ...form, id: Date.now() });
    setSaving(false);
    setShowNew(false);
  };
  const del = async id => { await sbDeleteRecipe(id); };
  const setArr = (field, idx, val) => setForm(f=>({ ...f, [field]: f[field].map((v,i)=>i===idx?val:v) }));
  const addRow = field => setForm(f=>({ ...f, [field]: [...f[field], ""] }));

  if (showNew) return (
    <div style={{ padding:"16px 20px 140px" }}>
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
        <button onClick={()=>setShowNew(false)} style={backBtnStyle}>‹</button>
        <div style={{ fontSize:17, fontWeight:800 }}>{editing ? "レシピを編集" : "新しいレシピ"}</div>
      </div>
      {[
        { label:"レシピ名", field:"name", placeholder:"例: 腸活スムージー" },
        { label:"絵文字", field:"emoji", placeholder:"🥤" },
        { label:"写真URL", field:"photo", placeholder:"https://... (任意)" },
        { label:"説明", field:"desc", placeholder:"短い説明文" },
        { label:"タンパク質", field:"protein", placeholder:"例: 12g" },
        { label:"ビタミン", field:"vitamins", placeholder:"例: ビタミンC, B群" },
      ].map(f=>(
        <div key={f.field} style={{ marginBottom:12 }}>
          <div style={{ fontSize:12, color:"#64748B", marginBottom:6 }}>{f.label}</div>
          <input value={form[f.field]} onChange={e=>setForm(d=>({...d,[f.field]:e.target.value}))} placeholder={f.placeholder} style={inputStyle} />
        </div>
      ))}
      <div style={{ marginBottom:12 }}>
        <div style={{ fontSize:12, color:"#64748B", marginBottom:6 }}>カテゴリー</div>
        <select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))} style={{ ...inputStyle, appearance:"none" }}>
          {CATS.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
      </div>
      <div style={{ marginBottom:12 }}>
        <div style={{ fontSize:12, color:"#64748B", marginBottom:6 }}>材料</div>
        {form.ingredients.map((v,i)=>(
          <input key={i} value={v} onChange={e=>setArr("ingredients",i,e.target.value)} placeholder={`材料 ${i+1}`} style={{ ...inputStyle, marginBottom:6 }} />
        ))}
        <button onClick={()=>addRow("ingredients")} style={{ fontSize:12, color:"#3B82F6", background:"none", border:"none", cursor:"pointer" }}>+ 材料を追加</button>
      </div>
      <div style={{ marginBottom:12 }}>
        <div style={{ fontSize:12, color:"#64748B", marginBottom:6 }}>作り方</div>
        {form.steps.map((v,i)=>(
          <input key={i} value={v} onChange={e=>setArr("steps",i,e.target.value)} placeholder={`手順 ${i+1}`} style={{ ...inputStyle, marginBottom:6 }} />
        ))}
        <button onClick={()=>addRow("steps")} style={{ fontSize:12, color:"#3B82F6", background:"none", border:"none", cursor:"pointer" }}>+ 手順を追加</button>
      </div>
      <div style={{ position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:430, padding:"16px 20px 32px", background:"linear-gradient(to top,#0F172A 70%,transparent)", boxSizing:"border-box" }}>
        <button onClick={save} disabled={saving} style={{ width:"100%", background:"linear-gradient(135deg,#34D399,#3B82F6)", border:"none", borderRadius:16, padding:16, color:"#fff", fontSize:16, fontWeight:800, cursor:"pointer", opacity:saving?0.7:1 }}>{saving?"保存中...":"保存して反映 ✓"}</button>
      </div>
    </div>
  );

  return (
    <div style={{ padding:"16px 20px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <span style={{ fontSize:13, fontWeight:700, color:"#94A3B8", letterSpacing:1 }}>RECIPES ({recipes.length})</span>
        <button onClick={openNew} style={{ ...btn("#34D399","#0F172A"), padding:"6px 14px", fontSize:12 }}>+ 追加</button>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {recipes.map(r=>(
          <div key={r.id} style={{ background:"#1E293B", borderRadius:16, padding:16 }}>
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:6 }}>
              <span style={{ fontSize:28 }}>{r.emoji}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:15, fontWeight:700 }}>{r.name}</div>
                <div style={{ fontSize:11, color:"#64748B" }}>{r.category}</div>
              </div>
              <button onClick={()=>openEdit(r)} style={{ background:"#334155", border:"none", color:"#94A3B8", borderRadius:8, padding:"4px 10px", cursor:"pointer", fontSize:12 }}>編集</button>
              <button onClick={()=>del(r.id)} style={{ background:"none", border:"none", color:"#EF4444", cursor:"pointer", fontSize:18 }}>×</button>
            </div>
            <div style={{ fontSize:12, color:"#94A3B8" }}>{r.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Admin: Blog ───────────────────────────────────────
function AdminBlog() {
  const { blogs, sbSaveBlog, sbDeleteBlog } = useContext(StoreContext);
  const [showNew, setShowNew] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const today = new Date();
  const blank = { title:"", emoji:"📝", readMin:3, body:"" };
  const [form, setForm] = useState(blank);

  const openEdit = b => { setForm({...b, body: b.body || (b.sections?.[0]?.text||"")}); setEditing(b.id); setShowNew(true); };
  const openNew = () => { setForm(blank); setEditing(null); setShowNew(true); };
  const save = async () => {
    setSaving(true);
    const dateStr = `${MONTHS[today.getMonth()].slice(0,3)} ${today.getDate()} ${today.getFullYear()}`;
    await sbSaveBlog(editing ? { ...form, id: editing, date: dateStr } : { ...form, id: Date.now(), date: dateStr });
    setSaving(false);
    setShowNew(false);
  };
  const del = async id => { await sbDeleteBlog(id); };

  if (showNew) return (
    <div style={{ padding:"16px 20px 140px" }}>
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
        <button onClick={()=>setShowNew(false)} style={backBtnStyle}>‹</button>
        <div style={{ fontSize:17, fontWeight:800 }}>{editing?"記事を編集":"新しい記事"}</div>
      </div>
      {[
        { label:"タイトル", field:"title", placeholder:"記事タイトル" },
        { label:"絵文字", field:"emoji", placeholder:"😴" },
        { label:"読了時間（分）", field:"readMin", placeholder:"3", type:"number" },
      ].map(f=>(
        <div key={f.field} style={{ marginBottom:12 }}>
          <div style={{ fontSize:12, color:"#64748B", marginBottom:6 }}>{f.label}</div>
          <input type={f.type||"text"} value={form[f.field]} onChange={e=>setForm(d=>({...d,[f.field]:e.target.value}))} placeholder={f.placeholder} style={inputStyle} />
        </div>
      ))}
      <div style={{ marginBottom:12 }}>
        <div style={{ fontSize:12, color:"#64748B", marginBottom:6 }}>本文</div>
        <textarea value={form.body} onChange={e=>setForm(f=>({...f,body:e.target.value}))}
          placeholder="記事の内容を入力してください..." style={{ ...inputStyle, height:180, resize:"none" }} />
      </div>
      <div style={{ position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:430, padding:"16px 20px 32px", background:"linear-gradient(to top,#0F172A 70%,transparent)", boxSizing:"border-box" }}>
        <button onClick={save} disabled={saving} style={{ width:"100%", background:"linear-gradient(135deg,#F59E0B,#EF4444)", border:"none", borderRadius:16, padding:16, color:"#fff", fontSize:16, fontWeight:800, cursor:"pointer", opacity:saving?0.7:1 }}>{saving?"保存中...":"公開する ✓"}</button>
      </div>
    </div>
  );

  return (
    <div style={{ padding:"16px 20px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <span style={{ fontSize:13, fontWeight:700, color:"#94A3B8", letterSpacing:1 }}>BLOG ({blogs.length})</span>
        <button onClick={openNew} style={{ ...btn("#F59E0B","#0F172A"), padding:"6px 14px", fontSize:12 }}>+ 投稿</button>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {blogs.map(b=>(
          <div key={b.id} style={{ background:"#1E293B", borderRadius:16, padding:16 }}>
            <div style={{ display:"flex", alignItems:"flex-start", gap:12, marginBottom:6 }}>
              <span style={{ fontSize:28, flexShrink:0 }}>{b.emoji}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:700, marginBottom:2 }}>{b.title}</div>
                <div style={{ fontSize:11, color:"#64748B" }}>{b.date} · {b.readMin || b.read_min || 3} min</div>
              </div>
              <button onClick={()=>openEdit(b)} style={{ background:"#334155", border:"none", color:"#94A3B8", borderRadius:8, padding:"4px 10px", cursor:"pointer", fontSize:12, flexShrink:0 }}>編集</button>
              <button onClick={()=>del(b.id)} style={{ background:"none", border:"none", color:"#EF4444", cursor:"pointer", fontSize:18 }}>×</button>
            </div>
            <div style={{ fontSize:12, color:"#475569", lineHeight:1.5 }}>{(b.body||b.sections?.[0]?.text||"").slice(0,60)}...</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// CLIENT APP
// ═══════════════════════════════════════════════════════
function ClientApp() {
  const { user, setUser } = useContext(StoreContext);
  const [tab, setTab] = useState("calendar");
  const client = user.client;

  return (
    <div style={{ display:"flex", flexDirection:"column", minHeight:"100vh" }}>
      <div style={{ padding:"16px 20px 12px", borderBottom:"1px solid #1E293B", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontSize:24 }}>{client.avatar}</span>
          <div>
            <div style={{ fontSize:11, color:"#64748B" }}>CREW WELLNESS</div>
            <div style={{ fontSize:16, fontWeight:800 }}>{client.name}</div>
          </div>
        </div>
        <button onClick={()=>setUser(null)} style={{ background:"#1E293B", border:"none", color:"#64748B", borderRadius:20, padding:"6px 14px", cursor:"pointer", fontSize:12 }}>ログアウト</button>
      </div>

      <div style={{ flex:1, overflowY:"auto", paddingBottom:80 }}>
        {tab==="calendar" && <ClientCalendar client={client} />}
        {tab==="recipes"  && <ClientRecipes />}
        {tab==="blog"     && <ClientBlog />}
        {tab==="products" && <ClientProducts />}
        {tab==="settings" && <ClientSettings />}
      </div>

      <div style={{ position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:430, background:"#1E293B", borderTop:"1px solid #334155", display:"flex", paddingBottom:16, paddingTop:10 }}>
        {[
          { id:"calendar", icon:"📅", label:"カレンダー" },
          { id:"recipes",  icon:"🍽️", label:"レシピ" },
          { id:"blog",     icon:"📝", label:"ブログ" },
          { id:"products", icon:"💊", label:"商品" },
          { id:"settings", icon:"⚙️", label:"設定" },
        ].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{ flex:1, background:"none", border:"none", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:3 }}>
            <span style={{ fontSize:20 }}>{t.icon}</span>
            <span style={{ fontSize:10, color:tab===t.id?client.color:"#475569", fontWeight:tab===t.id?700:400 }}>{t.label}</span>
            {tab===t.id && <div style={{ width:20, height:3, background:client.color, borderRadius:2 }}/>}
          </button>
        ))}
      </div>
    </div>
  );
}

function ClientCalendar({ client }) {
  const { today, guidance, recipes, sbSaveGuidance } = useContext(StoreContext);
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selDay, setSelDay] = useState(null);
  const [selRecipe, setSelRecipe] = useState(null);
  const [showFlightInput, setShowFlightInput] = useState(false);
  const [saving, setSaving] = useState(false);
  const [flightData, setFlightData] = useState({
    roster: "", dep: "", arr: "", arr_date: "", reporting: "", debriefing: "",
    dep2: "", arr2: "", dep_date2: "", arr_date2: "", reporting2: "", debriefing2: "", isReturn: false
  });

  const dk = d => `${year}-${month}-${d}`;
  const cG = guidance[client.id] || {};
  const daysInMonth=getDaysInMonth(year,month); const firstDay=getFirstDay(year,month);
  const dayG = selDay ? cG[dk(selDay)] : null;
  const recipeObj = name => recipes.find(r=>r.name===name);

  // Generate date options for arrival (selDay to selDay+5)
  const getDateOptions = (baseDay) => {
    const options = [];
    for (let i = 0; i <= 5; i++) {
      const d = new Date(year, month, (baseDay||1) + i);
      options.push({
        value: `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`,
        label: `${MONTHS[d.getMonth()].slice(0,3)} ${d.getDate()}日`
      });
    }
    return options;
  };

  const openFlightInput = () => {
    const g = dayG || {};
    setFlightData({
      roster: g.roster||"", dep: g.dep||"", arr: g.arr||"",
      arr_date: g.arr_date||"",
      reporting: g.reporting||"", debriefing: g.debriefing||"",
      dep2: g.dep2||"", arr2: g.arr2||"",
      dep_date2: g.dep_date2||"", arr_date2: g.arr_date2||"",
      reporting2: g.reporting2||"", debriefing2: g.debriefing2||"",
      isReturn: !!(g.dep2||g.arr2)
    });
    setShowFlightInput(true);
  };

  const saveFlight = async () => {
    if (!selDay) return;
    setSaving(true);
    const existing = cG[dk(selDay)] || {};
    const roster = flightData.arr || flightData.roster || "FLT";
    await sbSaveGuidance(client.id, dk(selDay), {
      ...existing,
      roster,
      dep: flightData.dep.toUpperCase(),
      arr: flightData.arr.toUpperCase(),
      arr_date: flightData.arr_date,
      reporting: flightData.reporting,
      debriefing: flightData.debriefing,
      dep2: flightData.isReturn ? flightData.dep2.toUpperCase() : "",
      arr2: flightData.isReturn ? flightData.arr2.toUpperCase() : "",
      dep_date2: flightData.isReturn ? flightData.dep_date2 : "",
      arr_date2: flightData.isReturn ? flightData.arr_date2 : "",
      reporting2: flightData.isReturn ? flightData.reporting2 : "",
      debriefing2: flightData.isReturn ? flightData.debriefing2 : "",
    });
    setSaving(false);
    setShowFlightInput(false);
  };

  const POPULAR_AIRPORTS = ["AUH","DXB","TYO","NRT","HND","CDG","LHR","ISB","MAD","SIN","BKK","SYD"];

  // Format date string for display
  const fmtDate = (dateStr) => {
    if (!dateStr) return "";
    const [y,m,d] = dateStr.split("-");
    return `${MONTHS[parseInt(m)-1]?.slice(0,3)} ${d}日`;
  };

  return (
    <div style={{ padding:"16px 20px" }}>
      {/* Flight input modal */}
      {showFlightInput && (
        <div style={{ ...overlayStyle, alignItems:"flex-end" }}>
          <div style={{ ...modalStyle, borderRadius:"24px 24px 0 0", maxHeight:"90vh", overflowY:"auto", paddingBottom:32 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
              <div>
                <div style={{ fontSize:11, color:"#64748B" }}>{MONTHS[month]} {selDay}日</div>
                <div style={{ fontSize:18, fontWeight:800 }}>フライト情報を入力</div>
              </div>
              <button onClick={()=>setShowFlightInput(false)} style={{ background:"#334155", border:"none", color:"#94A3B8", borderRadius:"50%", width:32, height:32, cursor:"pointer", fontSize:16 }}>×</button>
            </div>

            {/* Flight 1 */}
            <div style={{ background:"#0F172A", borderRadius:16, padding:16, marginBottom:14 }}>
              <div style={{ fontSize:12, color:"#60A5FA", fontWeight:700, marginBottom:12 }}>✈️ フライト 1</div>

              {/* Route */}
              <div style={{ display:"flex", gap:10, alignItems:"center", marginBottom:12 }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:11, color:"#64748B", marginBottom:4 }}>出発地</div>
                  <input value={flightData.dep} onChange={e=>setFlightData(d=>({...d,dep:e.target.value.toUpperCase()}))}
                    placeholder="AUH" maxLength={3}
                    style={{ ...inputStyle, textAlign:"center", fontSize:18, fontWeight:800, letterSpacing:2 }} />
                </div>
                <div style={{ fontSize:20, color:"#334155", paddingTop:20 }}>→</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:11, color:"#64748B", marginBottom:4 }}>到着地</div>
                  <input value={flightData.arr} onChange={e=>setFlightData(d=>({...d,arr:e.target.value.toUpperCase()}))}
                    placeholder="NRT" maxLength={3}
                    style={{ ...inputStyle, textAlign:"center", fontSize:18, fontWeight:800, letterSpacing:2 }} />
                </div>
              </div>

              {/* Quick airport select */}
              <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:12 }}>
                {POPULAR_AIRPORTS.map(code=>(
                  <button key={code} onClick={()=>{ if(!flightData.dep) setFlightData(d=>({...d,dep:code})); else setFlightData(d=>({...d,arr:code})); }}
                    style={{ background:"#1E293B", border:"1px solid #334155", color:"#94A3B8", borderRadius:20, padding:"3px 10px", fontSize:11, cursor:"pointer" }}>
                    {code}
                  </button>
                ))}
              </div>

              {/* Dates */}
              <div style={{ display:"flex", gap:10, marginBottom:12 }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:11, color:"#64748B", marginBottom:4 }}>📅 出発日</div>
                  <div style={{ ...inputStyle, color:"#F1F5F9", fontSize:14 }}>{MONTHS[month].slice(0,3)} {selDay}日</div>
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:11, color:"#64748B", marginBottom:4 }}>📅 到着日</div>
                  <select value={flightData.arr_date} onChange={e=>setFlightData(d=>({...d,arr_date:e.target.value}))}
                    style={{ ...inputStyle, appearance:"none" }}>
                    <option value="">同日</option>
                    {getDateOptions(selDay).map(opt=>(
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Times */}
              <div style={{ display:"flex", gap:10 }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:11, color:"#64748B", marginBottom:4 }}>🕐 レポーティング（現地）</div>
                  <input type="time" value={flightData.reporting} onChange={e=>setFlightData(d=>({...d,reporting:e.target.value}))}
                    style={{ ...inputStyle, colorScheme:"dark" }} />
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:11, color:"#64748B", marginBottom:4 }}>🕐 デブリーフィング（現地）</div>
                  <input type="time" value={flightData.debriefing} onChange={e=>setFlightData(d=>({...d,debriefing:e.target.value}))}
                    style={{ ...inputStyle, colorScheme:"dark" }} />
                </div>
              </div>
            </div>

            {/* Return flight toggle */}
            <button onClick={()=>setFlightData(d=>({...d,isReturn:!d.isReturn}))}
              style={{ width:"100%", background:flightData.isReturn?"#1E3A5F":"#1E293B", border:`1px solid ${flightData.isReturn?"#3B82F6":"#334155"}`, borderRadius:12, padding:"10px", color:flightData.isReturn?"#60A5FA":"#64748B", fontSize:13, cursor:"pointer", marginBottom:14, fontWeight:flightData.isReturn?700:400 }}>
              {flightData.isReturn ? "✓ 折り返しフライトあり" : "+ 折り返しフライトを追加"}
            </button>

            {/* Flight 2 */}
            {flightData.isReturn && (
              <div style={{ background:"#0F172A", borderRadius:16, padding:16, marginBottom:14 }}>
                <div style={{ fontSize:12, color:"#8B5CF6", fontWeight:700, marginBottom:12 }}>✈️ フライト 2（折り返し）</div>
                <div style={{ display:"flex", gap:10, alignItems:"center", marginBottom:12 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:11, color:"#64748B", marginBottom:4 }}>出発地</div>
                    <input value={flightData.dep2} onChange={e=>setFlightData(d=>({...d,dep2:e.target.value.toUpperCase()}))}
                      placeholder="NRT" maxLength={3}
                      style={{ ...inputStyle, textAlign:"center", fontSize:18, fontWeight:800, letterSpacing:2 }} />
                  </div>
                  <div style={{ fontSize:20, color:"#334155", paddingTop:20 }}>→</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:11, color:"#64748B", marginBottom:4 }}>到着地</div>
                    <input value={flightData.arr2} onChange={e=>setFlightData(d=>({...d,arr2:e.target.value.toUpperCase()}))}
                      placeholder="AUH" maxLength={3}
                      style={{ ...inputStyle, textAlign:"center", fontSize:18, fontWeight:800, letterSpacing:2 }} />
                  </div>
                </div>

                {/* Quick airport select for flight 2 */}
                <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:12 }}>
                  {POPULAR_AIRPORTS.map(code=>(
                    <button key={code} onClick={()=>{ if(!flightData.dep2) setFlightData(d=>({...d,dep2:code})); else setFlightData(d=>({...d,arr2:code})); }}
                      style={{ background:"#1E293B", border:"1px solid #334155", color:"#94A3B8", borderRadius:20, padding:"3px 10px", fontSize:11, cursor:"pointer" }}>
                      {code}
                    </button>
                  ))}
                </div>

                {/* Dates for flight 2 */}
                <div style={{ display:"flex", gap:10, marginBottom:12 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:11, color:"#64748B", marginBottom:4 }}>📅 出発日</div>
                    <select value={flightData.dep_date2} onChange={e=>setFlightData(d=>({...d,dep_date2:e.target.value}))}
                      style={{ ...inputStyle, appearance:"none" }}>
                      <option value="">選択</option>
                      {getDateOptions(selDay).map(opt=>(
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:11, color:"#64748B", marginBottom:4 }}>📅 到着日</div>
                    <select value={flightData.arr_date2} onChange={e=>setFlightData(d=>({...d,arr_date2:e.target.value}))}
                      style={{ ...inputStyle, appearance:"none" }}>
                      <option value="">選択</option>
                      {getDateOptions(selDay).map(opt=>(
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display:"flex", gap:10 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:11, color:"#64748B", marginBottom:4 }}>🕐 レポーティング（現地）</div>
                    <input type="time" value={flightData.reporting2} onChange={e=>setFlightData(d=>({...d,reporting2:e.target.value}))}
                      style={{ ...inputStyle, colorScheme:"dark" }} />
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:11, color:"#64748B", marginBottom:4 }}>🕐 デブリーフィング（現地）</div>
                    <input type="time" value={flightData.debriefing2} onChange={e=>setFlightData(d=>({...d,debriefing2:e.target.value}))}
                      style={{ ...inputStyle, colorScheme:"dark" }} />
                  </div>
                </div>
              </div>
            )}

            {/* OFF / SL */}
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:11, color:"#64748B", marginBottom:8 }}>フライトなしの日</div>
              <div style={{ display:"flex", gap:10 }}>
                {["OFF","SL"].map(code=>(
                  <button key={code} onClick={async()=>{
                    setSaving(true);
                    const existing = cG[dk(selDay)] || {};
                    await sbSaveGuidance(client.id, dk(selDay), { ...existing, roster:code, dep:"", arr:"", arr_date:"", reporting:"", debriefing:"", dep2:"", arr2:"", dep_date2:"", arr_date2:"", reporting2:"", debriefing2:"" });
                    setSaving(false); setShowFlightInput(false);
                  }} style={{ flex:1, background:code==="OFF"?"#F59E0B22":"#8B5CF622", border:`1px solid ${code==="OFF"?"#F59E0B":"#8B5CF6"}`, color:code==="OFF"?"#F59E0B":"#8B5CF6", borderRadius:12, padding:12, fontSize:14, fontWeight:700, cursor:"pointer" }}>
                    {code==="OFF"?"😴 OFF":"🏥 SL（病欠）"}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={saveFlight} disabled={saving}
              style={{ width:"100%", background:"linear-gradient(135deg,#3B82F6,#8B5CF6)", border:"none", borderRadius:16, padding:16, color:"#fff", fontSize:16, fontWeight:800, cursor:"pointer", opacity:saving?0.7:1 }}>
              {saving ? "保存中..." : "保存する ✓"}
            </button>
          </div>
        </div>
      )}
      {selRecipe && (
        <div style={overlayStyle}>
          <div style={{ ...modalStyle, maxHeight:"80vh", overflowY:"auto" }}>
            <div style={{ fontSize:48, textAlign:"center", marginBottom:8 }}>{selRecipe.emoji}</div>
            <h2 style={{ textAlign:"center", fontSize:18, fontWeight:800, marginBottom:12 }}>{selRecipe.name}</h2>
            <div style={{ display:"flex", gap:8, justifyContent:"center", marginBottom:16 }}>
              <span style={{ background:"#0F172A", borderRadius:20, padding:"4px 12px", fontSize:12, color:"#34D399" }}>P: {selRecipe.protein}</span>
              <span style={{ background:"#0F172A", borderRadius:20, padding:"4px 12px", fontSize:12, color:"#60A5FA" }}>{selRecipe.vitamins}</span>
            </div>
            <div style={{ marginBottom:14 }}>
              <div style={{ fontSize:11, color:"#64748B", fontWeight:700, letterSpacing:1, marginBottom:8 }}>INGREDIENTS</div>
              {selRecipe.ingredients.map((v,i)=><div key={i} style={{ fontSize:13, color:"#CBD5E1", paddingBottom:6, borderBottom:"1px solid #1E293B" }}>• {v}</div>)}
            </div>
            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:11, color:"#64748B", fontWeight:700, letterSpacing:1, marginBottom:8 }}>HOW TO</div>
              {selRecipe.steps.map((v,i)=>(
                <div key={i} style={{ display:"flex", gap:10, marginBottom:8 }}>
                  <span style={{ background:"#3B82F6", color:"#fff", borderRadius:"50%", width:22, height:22, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, flexShrink:0 }}>{i+1}</span>
                  <span style={{ fontSize:13, color:"#CBD5E1" }}>{v}</span>
                </div>
              ))}
            </div>
            <button onClick={()=>setSelRecipe(null)} style={{ width:"100%", ...btn("#3B82F6"), padding:14, fontSize:15 }}>閉じる</button>
          </div>
        </div>
      )}

      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
        <button onClick={()=>{ if(month===0){setMonth(11);setYear(y=>y-1);}else setMonth(m=>m-1); }} style={navBtnStyle}>‹</button>
        <span style={{ fontWeight:800, fontSize:16 }}>{MONTHS[month]} {year}</span>
        <button onClick={()=>{ if(month===11){setMonth(0);setYear(y=>y+1);}else setMonth(m=>m+1); }} style={navBtnStyle}>›</button>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", marginBottom:6 }}>
        {DAYS_SHORT.map((d,i)=><div key={i} style={{ textAlign:"center", fontSize:11, color:"#475569", fontWeight:600 }}>{d}</div>)}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:3, marginBottom:20 }}>
        {Array.from({length:firstDay}).map((_,i)=><div key={`e${i}`}/>)}
        {Array.from({length:daysInMonth}).map((_,i)=>{
          const d=i+1; const g=cG[dk(d)]; const color=g?.roster?routeColor(g.roster):null;
          const isToday=d===today.getDate()&&month===today.getMonth()&&year===today.getFullYear();
          const isSel=selDay===d;
          return (
            <div key={d} onClick={()=>setSelDay(d===selDay?null:d)}
              style={{ borderRadius:10, padding:"6px 2px", textAlign:"center", cursor:"pointer", background:isSel?"#1E40AF":color?`${color}20`:"#1E293B", border:isToday?"2px solid #3B82F6":"2px solid transparent" }}>
              <div style={{ fontSize:11, fontWeight:700, color:isToday?"#60A5FA":isSel?"#fff":"#94A3B8" }}>{d}</div>
              {g?.arr && g.arr!=="OFF" && g.arr!=="SL" && <div style={{ fontSize:8, fontWeight:800, color:isSel?"#fff":color, lineHeight:1.2 }}>{g.arr}</div>}
              {g?.roster==="OFF" && <div style={{ fontSize:8, fontWeight:800, color:"#F59E0B" }}>OFF</div>}
              {g?.roster==="SL" && <div style={{ fontSize:8, fontWeight:800, color:"#8B5CF6" }}>SL</div>}
              {g && !g.roster && !g.arr && <div style={{ width:5, height:5, borderRadius:"50%", background:client.color, margin:"2px auto 0" }}/>}
            </div>
          );
        })}
      </div>

      {/* Day detail */}
      {selDay && (
        <div style={{ background:"#1E293B", borderRadius:20, padding:20 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
            <div style={{ fontSize:16, fontWeight:800 }}>{MONTHS[month]} {selDay}日</div>
            <button onClick={openFlightInput}
              style={{ background:"#334155", border:"none", borderRadius:20, padding:"5px 14px", color:"#94A3B8", fontSize:12, cursor:"pointer" }}>
              {dayG?.arr||dayG?.roster ? "✏️ 編集" : "+ フライト入力"}
            </button>
          </div>

          {/* Flight info display */}
          {(dayG?.dep||dayG?.arr||dayG?.roster) && (
            <div style={{ background:"#0F172A", borderRadius:14, padding:14, marginBottom:14 }}>
              {dayG?.roster === "OFF" && <div style={{ color:"#F59E0B", fontWeight:800, fontSize:16 }}>😴 OFF DAY</div>}
              {dayG?.roster === "SL" && <div style={{ color:"#8B5CF6", fontWeight:800, fontSize:16 }}>🏥 SICK LEAVE</div>}
              {dayG?.arr && dayG?.arr !== "OFF" && dayG?.arr !== "SL" && (
                <>
                  <div style={{ fontSize:11, color:"#60A5FA", fontWeight:700, marginBottom:8 }}>✈️ フライト 1</div>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                    <span style={{ fontSize:20, fontWeight:900, color:"#F1F5F9" }}>{dayG.dep||"?"}</span>
                    <span style={{ color:"#334155" }}>→</span>
                    <span style={{ fontSize:20, fontWeight:900, color:"#F1F5F9" }}>{dayG.arr}</span>
                  </div>
                  {dayG.arr_date && <div style={{ fontSize:12, color:"#60A5FA", marginBottom:6 }}>📅 到着日: {fmtDate(dayG.arr_date)}</div>}
                  <div style={{ display:"flex", gap:16 }}>
                    {dayG.reporting && <div style={{ fontSize:12, color:"#94A3B8" }}>🕐 レポ: <span style={{ color:"#F1F5F9", fontWeight:600 }}>{dayG.reporting}</span></div>}
                    {dayG.debriefing && <div style={{ fontSize:12, color:"#94A3B8" }}>🕐 デブリ: <span style={{ color:"#F1F5F9", fontWeight:600 }}>{dayG.debriefing}</span></div>}
                  </div>
                  {dayG.dep2 && (
                    <>
                      <div style={{ borderTop:"1px solid #1E293B", margin:"10px 0" }} />
                      <div style={{ fontSize:11, color:"#8B5CF6", fontWeight:700, marginBottom:8 }}>✈️ フライト 2（折り返し）</div>
                      {dayG.dep_date2 && <div style={{ fontSize:12, color:"#8B5CF6", marginBottom:6 }}>📅 出発日: {fmtDate(dayG.dep_date2)}</div>}
                      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                        <span style={{ fontSize:20, fontWeight:900, color:"#F1F5F9" }}>{dayG.dep2}</span>
                        <span style={{ color:"#334155" }}>→</span>
                        <span style={{ fontSize:20, fontWeight:900, color:"#F1F5F9" }}>{dayG.arr2}</span>
                      </div>
                      {dayG.arr_date2 && <div style={{ fontSize:12, color:"#8B5CF6", marginBottom:6 }}>📅 到着日: {fmtDate(dayG.arr_date2)}</div>}
                      <div style={{ display:"flex", gap:16 }}>
                        {dayG.reporting2 && <div style={{ fontSize:12, color:"#94A3B8" }}>🕐 レポ: <span style={{ color:"#F1F5F9", fontWeight:600 }}>{dayG.reporting2}</span></div>}
                        {dayG.debriefing2 && <div style={{ fontSize:12, color:"#94A3B8" }}>🕐 デブリ: <span style={{ color:"#F1F5F9", fontWeight:600 }}>{dayG.debriefing2}</span></div>}
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          )}

          {!dayG?.sleep && !dayG?.meal ? (
            <div style={{ color:"#475569", fontSize:14, textAlign:"center", padding:"12px 0" }}>
              {dayG?.roster ? "指導内容はまだ追加されていません" : "フライト情報を入力すると指導内容が表示されます"}
            </div>
          ) : (
            <>
              {dayG.sleep && (
                <div style={{ marginBottom:14 }}>
                  <div style={{ fontSize:11, color:"#818CF8", fontWeight:700, letterSpacing:1, marginBottom:6 }}>🌙 睡眠指導</div>
                  <div style={{ fontSize:14, color:"#CBD5E1", lineHeight:1.6 }}>{dayG.sleep}</div>
                </div>
              )}
              {(dayG.meal||dayG.meal2) && (
                <div style={{ marginBottom:14 }}>
                  <div style={{ fontSize:11, color:"#34D399", fontWeight:700, letterSpacing:1, marginBottom:8 }}>🍽️ 食事指導</div>
                  {dayG.meal && (
                    <div onClick={()=>{ const r=recipeObj(dayG.meal); if(r) setSelRecipe(r); }}
                      style={{ background:"#0F172A", borderRadius:12, padding:"10px 14px", marginBottom:8, cursor:recipeObj(dayG.meal)?"pointer":"default", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <div>
                        <div style={{ fontSize:11, color:"#64748B", marginBottom:2 }}>朝食</div>
                        <div style={{ fontSize:14, fontWeight:600 }}>{dayG.meal}</div>
                      </div>
                      {recipeObj(dayG.meal) && <span style={{ color:"#3B82F6", fontSize:12 }}>レシピ →</span>}
                    </div>
                  )}
                  {dayG.meal2 && (
                    <div onClick={()=>{ const r=recipeObj(dayG.meal2); if(r) setSelRecipe(r); }}
                      style={{ background:"#0F172A", borderRadius:12, padding:"10px 14px", cursor:recipeObj(dayG.meal2)?"pointer":"default", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <div>
                        <div style={{ fontSize:11, color:"#64748B", marginBottom:2 }}>昼食 / 夕食</div>
                        <div style={{ fontSize:14, fontWeight:600 }}>{dayG.meal2}</div>
                      </div>
                      {recipeObj(dayG.meal2) && <span style={{ color:"#3B82F6", fontSize:12 }}>レシピ →</span>}
                    </div>
                  )}
                </div>
              )}
              {dayG.supplement && (
                <div style={{ marginBottom:14 }}>
                  <div style={{ fontSize:11, color:"#FBBF24", fontWeight:700, letterSpacing:1, marginBottom:6 }}>💊 サプリ</div>
                  <div style={{ fontSize:14, color:"#CBD5E1" }}>{dayG.supplement}</div>
                </div>
              )}
              {dayG.notes && (
                <div style={{ borderTop:"1px solid #334155", paddingTop:12 }}>
                  <div style={{ fontSize:11, color:"#64748B", fontWeight:700, letterSpacing:1, marginBottom:6 }}>📌 メモ</div>
                  <div style={{ fontSize:13, color:"#94A3B8", lineHeight:1.6 }}>{dayG.notes}</div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function ClientRecipes() {
  const { recipes } = useContext(StoreContext);
  const [sel, setSel] = useState(null);
  const [activeCat, setActiveCat] = useState("all");
  const [query, setQuery] = useState("");

  const filtered = recipes.filter(r => {
    const catMatch = activeCat === "all" || r.category === activeCat;
    const q = query.toLowerCase();
    const textMatch = !q || r.name.toLowerCase().includes(q) || r.desc.toLowerCase().includes(q) || (r.ingredients||[]).some(i=>i.toLowerCase().includes(q));
    return catMatch && textMatch;
  });

  if (sel) return (
    <div style={{ paddingBottom:40 }}>
      <button onClick={()=>setSel(null)} style={{ ...backBtnStyle, margin:"16px 20px" }}>‹</button>
      {sel.photo ? (
        <div style={{ width:"100%", height:220, overflow:"hidden" }}>
          <img src={sel.photo} alt={sel.name} style={{ width:"100%", height:"100%", objectFit:"cover" }} onError={e=>{ e.target.style.display="none"; }} />
        </div>
      ) : (
        <div style={{ fontSize:72, textAlign:"center", padding:"20px 0", background:"#1E293B" }}>{sel.emoji}</div>
      )}
      <div style={{ padding:"20px 20px 0" }}>
        <div style={{ marginBottom:8 }}>
          <span style={{ background:"#1E3A5F", color:"#60A5FA", borderRadius:20, padding:"4px 12px", fontSize:11, fontWeight:700 }}>
            {RECIPE_CATS.find(c=>c.id===sel.category)?.emoji} {RECIPE_CATS.find(c=>c.id===sel.category)?.label}
          </span>
        </div>
        <h2 style={{ fontSize:22, fontWeight:900, marginBottom:12, lineHeight:1.3 }}>{sel.name}</h2>
        <div style={{ display:"flex", gap:8, marginBottom:20, flexWrap:"wrap" }}>
          <span style={{ background:"#0F172A", borderRadius:20, padding:"5px 14px", fontSize:12, color:"#34D399", fontWeight:600 }}>💪 {sel.protein}</span>
          <span style={{ background:"#0F172A", borderRadius:20, padding:"5px 14px", fontSize:12, color:"#60A5FA", fontWeight:600 }}>✨ {sel.vitamins}</span>
        </div>
        <p style={{ fontSize:14, color:"#94A3B8", lineHeight:1.6, marginBottom:24 }}>{sel.desc}</p>
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:11, color:"#64748B", fontWeight:700, letterSpacing:1, marginBottom:10 }}>🧺 INGREDIENTS</div>
          {sel.ingredients.map((v,i)=>(
            <div key={i} style={{ fontSize:14, color:"#CBD5E1", padding:"10px 0", borderBottom:"1px solid #1E293B", display:"flex", gap:8 }}>
              <span style={{ color:"#3B82F6" }}>•</span>{v}
            </div>
          ))}
        </div>
        <div>
          <div style={{ fontSize:11, color:"#64748B", fontWeight:700, letterSpacing:1, marginBottom:12 }}>👩‍🍳 HOW TO</div>
          {sel.steps.map((v,i)=>(
            <div key={i} style={{ display:"flex", gap:14, marginBottom:14 }}>
              <span style={{ background:"linear-gradient(135deg,#3B82F6,#8B5CF6)", color:"#fff", borderRadius:"50%", width:28, height:28, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, flexShrink:0, fontWeight:800 }}>{i+1}</span>
              <span style={{ fontSize:14, color:"#CBD5E1", lineHeight:1.7, paddingTop:4 }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <div style={{ padding:"16px 20px 0" }}>
        <div style={{ position:"relative", marginBottom:14 }}>
          <span style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", fontSize:16 }}>🔍</span>
          <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="レシピ・食材で検索..."
            style={{ ...inputStyle, paddingLeft:40 }} />
          {query && <button onClick={()=>setQuery("")} style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:"#64748B", cursor:"pointer", fontSize:18 }}>×</button>}
        </div>
      </div>
      <div style={{ display:"flex", gap:8, overflowX:"auto", padding:"0 20px 14px", scrollbarWidth:"none" }}>
        {RECIPE_CATS.map(c=>(
          <button key={c.id} onClick={()=>setActiveCat(c.id)}
            style={{ flexShrink:0, background:activeCat===c.id?"#3B82F6":"#1E293B", border:"none", borderRadius:20, padding:"7px 14px", color:activeCat===c.id?"#fff":"#94A3B8", fontSize:12, fontWeight:activeCat===c.id?700:400, cursor:"pointer", whiteSpace:"nowrap" }}>
            {c.emoji} {c.label}
          </button>
        ))}
      </div>
      <div style={{ padding:"0 20px 20px" }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign:"center", color:"#475569", fontSize:14, padding:40 }}>該当するレシピが見つかりませんでした</div>
        ) : (
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            {filtered.map(r=>(
              <div key={r.id} onClick={()=>setSel(r)} style={{ background:"#1E293B", borderRadius:16, overflow:"hidden", cursor:"pointer" }}>
                {r.photo ? (
                  <div style={{ height:110, overflow:"hidden" }}>
                    <img src={r.photo} alt={r.name} style={{ width:"100%", height:"100%", objectFit:"cover" }} onError={e=>{ e.target.style.display="none"; }} />
                  </div>
                ) : (
                  <div style={{ height:80, background:"#0F172A", display:"flex", alignItems:"center", justifyContent:"center", fontSize:40 }}>{r.emoji}</div>
                )}
                <div style={{ padding:"10px 12px 14px" }}>
                  <div style={{ fontSize:11, color:"#3B82F6", fontWeight:700, marginBottom:4 }}>
                    {RECIPE_CATS.find(c=>c.id===r.category)?.emoji}
                  </div>
                  <div style={{ fontSize:13, fontWeight:700, marginBottom:4, lineHeight:1.3 }}>{r.name}</div>
                  <div style={{ fontSize:11, color:"#64748B", lineHeight:1.4 }}>{r.desc}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function BlogSection({ section }) {
  if (section.type === "intro") return (
    <div style={{ marginBottom:24 }}>
      {section.text.split("\n\n").map((p, i) => (
        <p key={i} style={{ fontSize:15, color:"#CBD5E1", lineHeight:1.85, marginBottom:12 }}>{p}</p>
      ))}
    </div>
  );
  if (section.type === "heading") return (
    <div style={{ marginBottom:14, marginTop:28 }}>
      <div style={{ width:32, height:3, background:"linear-gradient(90deg,#3B82F6,#8B5CF6)", borderRadius:2, marginBottom:8 }}/>
      <h3 style={{ fontSize:17, fontWeight:800, color:"#F1F5F9", lineHeight:1.4 }}>{section.text}</h3>
    </div>
  );
  if (section.type === "text") return (
    <div style={{ marginBottom:20 }}>
      {section.text.split("\n\n").map((p, i) => (
        <p key={i} style={{ fontSize:15, color:"#CBD5E1", lineHeight:1.85, marginBottom:12 }}>{p}</p>
      ))}
    </div>
  );
  if (section.type === "timeline") return (
    <div style={{ marginBottom:20, borderLeft:"2px solid #334155", paddingLeft:16 }}>
      {section.items.map((item, i) => (
        <div key={i} style={{ marginBottom:14, position:"relative" }}>
          <div style={{ position:"absolute", left:-21, top:4, width:10, height:10, borderRadius:"50%", background:"#3B82F6", border:"2px solid #0F172A" }}/>
          <div style={{ fontSize:12, fontWeight:800, color:"#3B82F6", marginBottom:4 }}>{item.day}</div>
          <div style={{ fontSize:14, color:"#94A3B8", lineHeight:1.6 }}>{item.text}</div>
        </div>
      ))}
    </div>
  );
  if (section.type === "list") return (
    <div style={{ marginBottom:20, display:"flex", flexDirection:"column", gap:12 }}>
      {section.items.map((item, i) => (
        <div key={i} style={{ background:"#0F172A", borderRadius:14, padding:"14px 16px", borderLeft:"3px solid #8B5CF6" }}>
          <div style={{ fontSize:14, fontWeight:700, color:"#F1F5F9", marginBottom:6 }}>
            <span style={{ color:"#8B5CF6", marginRight:8 }}>#{i+1}</span>{item.label}
          </div>
          <div style={{ fontSize:13, color:"#94A3B8", lineHeight:1.6 }}>{item.text}</div>
        </div>
      ))}
    </div>
  );
  if (section.type === "cta") return (
    <div style={{ background:"linear-gradient(135deg,#1E3A5F,#2D1B69)", borderRadius:16, padding:20, marginBottom:16, marginTop:8 }}>
      <div style={{ fontSize:13, color:"#CBD5E1", lineHeight:1.7, marginBottom:14 }}>{section.text}</div>
      <div style={{ background:"linear-gradient(135deg,#3B82F6,#8B5CF6)", borderRadius:12, padding:"12px 16px", textAlign:"center", fontSize:14, fontWeight:800, color:"#fff" }}>
        👉 個別指導について詳しく見る
      </div>
    </div>
  );
  if (section.type === "next") return (
    <div style={{ borderTop:"1px solid #334155", paddingTop:16, marginTop:8 }}>
      <div style={{ fontSize:12, color:"#64748B", marginBottom:4 }}>次回予告 📖</div>
      <div style={{ fontSize:13, color:"#94A3B8", fontStyle:"italic" }}>{section.text}</div>
    </div>
  );
  return null;
}

function ClientBlog() {
  const { blogs } = useContext(StoreContext);
  const [sel, setSel] = useState(null);

  if (sel) {
    const sections = sel.sections || [{ type:"text", text: sel.body || "" }];
    return (
      <div style={{ padding:"16px 20px 48px" }}>
        <button onClick={()=>setSel(null)} style={{ ...backBtnStyle, marginBottom:20 }}>‹</button>
        <div style={{ fontSize:52, textAlign:"center", marginBottom:12 }}>{sel.emoji}</div>
        <div style={{ fontSize:11, color:"#64748B", textAlign:"center", marginBottom:8 }}>{sel.date} · {sel.readMin || sel.read_min || 3} min read</div>
        <h2 style={{ fontSize:18, fontWeight:900, lineHeight:1.4, marginBottom:24, textAlign:"center" }}>{sel.title}</h2>
        <div style={{ borderTop:"1px solid #1E293B", paddingTop:20 }}>
          {sections.map((s, i) => <BlogSection key={i} section={s} />)}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding:"16px 20px", display:"flex", flexDirection:"column", gap:14 }}>
      {blogs.map((b, idx) => (
        <div key={b.id} onClick={()=>setSel(b)}
          style={{ background:"#1E293B", borderRadius:16, overflow:"hidden", cursor:"pointer" }}>
          {idx === 0 && (
            <div style={{ background:"linear-gradient(135deg,#1E3A5F,#2D1B69)", padding:"20px 18px 14px" }}>
              <div style={{ fontSize:11, color:"#60A5FA", fontWeight:700, letterSpacing:1, marginBottom:8 }}>✨ 最新記事</div>
              <div style={{ fontSize:36, marginBottom:8 }}>{b.emoji}</div>
              <div style={{ fontSize:15, fontWeight:800, lineHeight:1.4, marginBottom:6 }}>{b.title}</div>
              <div style={{ fontSize:12, color:"#64748B" }}>{b.date} · {b.readMin || b.read_min || 3} min read</div>
            </div>
          )}
          {idx !== 0 && (
            <div style={{ padding:"16px 18px", display:"flex", gap:14, alignItems:"center" }}>
              <div style={{ fontSize:32 }}>{b.emoji}</div>
              <div>
                <div style={{ fontSize:14, fontWeight:700, marginBottom:4, lineHeight:1.4 }}>{b.title}</div>
                <div style={{ fontSize:12, color:"#64748B" }}>{b.date} · {b.readMin || b.read_min || 3} min</div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function ClientProducts() {
  const PRODUCTS=[
    { id:1, name:"Pharmanex® G3", price:"¥8,800", emoji:"🍹", desc:"抗酸化力を高めるゴジベリードリンク。フライト疲れに◎" },
    { id:2, name:"Epoch® Yin & Yang", price:"¥6,200", emoji:"🌿", desc:"機内乾燥から肌を守るフェイスマスク" },
    { id:3, name:"LifePak® Nano", price:"¥12,500", emoji:"💊", desc:"クルーに必要なビタミン・ミネラルを網羅" },
  ];
  return (
    <div style={{ padding:"16px 20px", display:"flex", flexDirection:"column", gap:14 }}>
      {PRODUCTS.map(p=>(
        <div key={p.id} style={{ background:"#1E293B", borderRadius:16, padding:18 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
            <span style={{ fontSize:36 }}>{p.emoji}</span>
            <span style={{ background:"#0F172A", borderRadius:20, padding:"4px 12px", fontSize:13, color:"#F59E0B", fontWeight:700 }}>{p.price}</span>
          </div>
          <div style={{ fontSize:16, fontWeight:700, marginBottom:4 }}>{p.name}</div>
          <div style={{ fontSize:13, color:"#94A3B8" }}>{p.desc}</div>
        </div>
      ))}
    </div>
  );
}

function ClientSettings() {
  const { user } = useContext(StoreContext);
  const client = user.client;
  return (
    <div style={{ padding:"16px 20px" }}>
      <div style={{ background:"#1E293B", borderRadius:20, padding:20, marginBottom:16, display:"flex", alignItems:"center", gap:16 }}>
        <div style={{ fontSize:48 }}>{client.avatar}</div>
        <div>
          <div style={{ fontSize:18, fontWeight:800 }}>{client.name}</div>
          <div style={{ fontSize:13, color:"#64748B" }}>{client.airline} · {client.since}〜</div>
        </div>
      </div>
      {["通知設定","プライバシーポリシー","お問い合わせ"].map(item=>(
        <div key={item} style={{ background:"#1E293B", padding:"16px 18px", borderRadius:12, display:"flex", justifyContent:"space-between", color:"#CBD5E1", fontSize:15, marginBottom:8 }}>
          {item} <span style={{ color:"#475569" }}>›</span>
        </div>
      ))}
    </div>
  );
}

// ── Shared components ─────────────────────────────────
function FieldSection({ label, color, children }) {
  return (
    <div style={{ marginBottom:20 }}>
      <div style={{ fontSize:13, fontWeight:700, color, marginBottom:10, display:"flex", alignItems:"center", gap:6 }}>
        <div style={{ width:3, height:14, background:color, borderRadius:2 }}/>
        {label}
      </div>
      {children}
    </div>
  );
}

// ── Style helpers ─────────────────────────────────────
const inputStyle = { width:"100%", background:"#0F172A", border:"1px solid #334155", borderRadius:12, padding:"12px 14px", color:"#F1F5F9", fontSize:14, boxSizing:"border-box", outline:"none" };
const overlayStyle = { position:"fixed", inset:0, background:"rgba(0,0,0,0.8)", zIndex:100, display:"flex", alignItems:"center", justifyContent:"center", padding:24 };
const modalStyle = { background:"#1E293B", borderRadius:20, padding:24, width:"100%", maxWidth:380 };
const backBtnStyle = { background:"#1E293B", border:"none", color:"#94A3B8", borderRadius:"50%", width:36, height:36, fontSize:20, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" };
const navBtnStyle = { background:"#1E293B", border:"none", color:"#94A3B8", borderRadius:10, width:36, height:36, fontSize:20, cursor:"pointer" };
const btn = (bg, color="#fff") => ({ background:bg, color, border:"none", borderRadius:12, cursor:"pointer", fontWeight:700, fontSize:14 });
