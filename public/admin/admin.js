let session=null,clients=[],articles=[];const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)],cfg=()=>window.SITE_CONFIG||{};
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
async function signin(email,password){const c=cfg(),r=await fetch(c.supabaseUrl+"/auth/v1/token?grant_type=password",{method:"POST",headers:{apikey:c.supabaseAnonKey,"Content-Type":"application/json"},body:JSON.stringify({email,password})}),j=await r.json();if(!r.ok)throw new Error(j.error_description||j.message||"Sign in failed");return j}
async function loadArticles(){try{articles=await fetch("../articles.json").then(r=>r.json());$("#ac").textContent=articles.length;renderArticles()}catch{}}
function renderArticles(){const q=$("#as").value.toLowerCase();$("#alist").innerHTML=articles.filter(a=>(a.title+" "+a.category+" "+a.subject).toLowerCase().includes(q)).map(a=>"<div><strong>"+esc(a.title)+"</strong><br><small>"+esc(a.date)+" · "+esc(a.category)+"</small></div>").join("")}
async function loadClients(){const c=cfg();$("#cstatus").textContent="Loading client database…";try{const r=await fetch(c.supabaseUrl+"/rest/v1/resource_access?select=*&order=submitted_at.desc",{headers:{apikey:c.supabaseAnonKey,Authorization:"Bearer "+session.access_token}});if(!r.ok)throw new Error();clients=await r.json();$("#cc").textContent=clients.length;$("#cstatus").textContent="";renderClients()}catch{$("#cstatus").textContent="Client access requires the one-time administrator account and database policy setup."}}
function renderClients(){const q=$("#cs").value.toLowerCase();$("#crows").innerHTML=clients.filter(x=>((x.visitor_name||"")+" "+(x.email||"")+" "+(x.resource_title||"")).toLowerCase().includes(q)).map(x=>"<tr><td>"+esc(x.visitor_name)+"</td><td>"+esc(x.email)+"</td><td>"+esc(x.resource_title)+"</td><td>"+esc(x.provider)+"</td><td>"+esc((x.submitted_at||"").slice(0,10))+"</td></tr>").join("")}

async function extractArticleFile(file){
 const status=$("#file-status"); if(!file)return;
 status.textContent="Reading and standardizing article…";
 try{
  const ext=(file.name.split(".").pop()||"").toLowerCase(); let text="";
  if(ext==="txt") text=await file.text();
  else if(ext==="docx"){
   if(!window.mammoth) throw new Error("Word document reader is still loading. Please try again.");
   const result=await window.mammoth.extractRawText({arrayBuffer:await file.arrayBuffer()}); text=result.value;
  } else if(ext==="pdf"){
   const pdfjs=await import("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs");
   pdfjs.GlobalWorkerOptions.workerSrc="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs";
   const pdf=await pdfjs.getDocument({data:new Uint8Array(await file.arrayBuffer())}).promise, pages=[];
   for(let n=1;n<=pdf.numPages;n++){const page=await pdf.getPage(n),content=await page.getTextContent();pages.push(content.items.map(x=>x.str).join(" "))}
   text=pages.join("\n\n");
  } else throw new Error("Please upload a DOCX, PDF or TXT file.");
  text=standardizeArticleText(text);
  if(!text)throw new Error("No readable text was found in this file.");
  $("#article-content").value=text;
  if(!$("#article-title").value.trim()){const first=text.split(/\n+/).find(x=>x.trim());if(first&&first.length<180){$("#article-title").value=first.trim();$("#article-content").value=text.slice(text.indexOf(first)+first.length).trim()}}
  status.textContent="Article extracted and standardized. Review the text, metadata and preview before publishing.";
  previewArticle();
 }catch(e){status.textContent=e.message||"The article could not be read."}
}
function standardizeArticleText(text){
 return String(text||"").replace(/\r/g,"").replace(/[\t ]+/g," ").replace(/ *\n */g,"\n").replace(/\n{3,}/g,"\n\n").split("\n").map(x=>x.trim()).join("\n").trim();
}

function openArticleEditor(){document.querySelector("#article-editor").classList.remove("hidden");document.querySelector("#article-title").focus();document.querySelector("#article-status").textContent=""}
function closeArticleEditor(){document.querySelector("#article-editor").classList.add("hidden");document.querySelector("#article-preview").classList.add("hidden")}
function articleData(){return{title:document.querySelector("#article-title").value.trim(),date:document.querySelector("#article-date").value,category:document.querySelector("#article-category").value.trim(),subject:document.querySelector("#article-subject").value.trim(),content:document.querySelector("#article-content").value.trim()}}
function previewArticle(){const a=articleData(),p=document.querySelector("#article-preview");p.innerHTML="<h1>"+esc(a.title||"Untitled Article")+"</h1><p><strong>"+esc(a.date)+"</strong> · "+esc(a.category)+" · "+esc(a.subject)+"</p><div class=\"preview-body\">"+esc(a.content)+"</div>";p.classList.remove("hidden")}
function saveArticleDraft(){const a=articleData();if(!a.title){document.querySelector("#article-status").textContent="Enter an article title before saving.";return}localStorage.setItem("johnughulu_article_draft",JSON.stringify(a));document.querySelector("#article-status").textContent="Draft saved in this browser."}
function publishArticle(){const f=document.querySelector("#article-form");if(!f.reportValidity())return;saveArticleDraft();document.querySelector("#article-status").textContent="Article is ready. Secure one-click publishing is the next connection step; this draft has not been made public yet."}
function restoreArticleDraft(){try{const a=JSON.parse(localStorage.getItem("johnughulu_article_draft"));if(!a)return;document.querySelector("#article-title").value=a.title||"";document.querySelector("#article-date").value=a.date||"";document.querySelector("#article-category").value=a.category||"";document.querySelector("#article-subject").value=a.subject||"";document.querySelector("#article-content").value=a.content||""}catch{}}


const adminPages=[
 ["Home","/"],["About","/about/"],["Books","/books/"],["Articles & Papers","/articles/"],
 ["Speaking & Leadership","/speaking/"],["Ministry","/ministry/"],["Organizations & Media","/organizations/"],
 ["Contact","/contact/"],["Privacy Policy","/privacy/"]
];
function renderPages(){const el=$("#page-list");if(!el)return;el.innerHTML=adminPages.map((p,i)=>'<article class="page-admin-card"><div><strong>'+esc(p[0])+'</strong><small>'+esc(p[1])+'</small></div><div class="page-actions"><a class="btn btn-outline" href="'+p[1]+'" target="_blank" rel="noopener">View Page</a><button class="btn btn-primary edit-page" type="button" data-page="'+i+'">Edit Page</button></div></article>').join("");el.querySelectorAll(".edit-page").forEach(b=>b.addEventListener("click",()=>openPageEditor(Number(b.dataset.page))))}
function openPageEditor(i){const p=adminPages[i];if(!p)return;$("#page-editor").dataset.index=i;$("#page-editor-title").textContent="Edit "+p[0];$("#page-title").value=p[0];$("#page-path").value=p[1];const saved=JSON.parse(localStorage.getItem("johnughulu_page_draft_"+p[1])||"null");$("#page-notes").value=saved?.notes||"";$("#page-status").textContent="";$("#page-editor").classList.remove("hidden");$("#page-editor").scrollIntoView({behavior:"smooth",block:"start"})}
function closePageEditor(){$("#page-editor").classList.add("hidden")}
function savePageDraft(){const path=$("#page-path").value,title=$("#page-title").value.trim(),notes=$("#page-notes").value.trim();localStorage.setItem("johnughulu_page_draft_"+path,JSON.stringify({title,path,notes,saved_at:new Date().toISOString()}));$("#page-status").textContent="Page editing draft saved in this browser."}
function viewEditingPage(){const path=$("#page-path").value;if(path)window.open(path,"_blank","noopener,noreferrer")}

const adminBooks=[
{id:"morale-booster",title:"The Morale Booster",cover:"../assets/books/B09CKQBXWJ.jpg",url:"https://www.amazon.com/Morale-Booster-Handbook-Intentional-Your-ebook/dp/B09CKQBXWJ"},
{id:"seven-ps",title:"The 7-Ps of an Entrepreneur",cover:"../assets/books/B0B14G1KRX.jpg",url:"https://www.amazon.com/7-Ps-Entrepreneur-Aspiring-Start-Up-Entrepreneurs/dp/B0B14G1KRX"},
{id:"shyness-speaking",title:"From Shyness to Public Speaking",cover:"../assets/books/B0CJXDSNXW.jpg",url:"https://www.amazon.com/Shyness-Public-Speaking-Handbook-Overcome/dp/B0CJXDSNXW"},
{id:"leadership-principles",title:"Leadership Principles Unleashed",cover:"../assets/books/B0D3HQM41G.jpg",url:"https://www.amazon.com/Leadership-Principles-Unleashed-Maximizing-Potential/dp/B0D3HQM41G"},
{id:"time-management",title:"Time Management for Leaders",cover:"../assets/books/B0DTPVKX6Z.jpg",url:"https://www.amazon.com/TIME-MANAGEMENT-LEADERS-strategies-productivity/dp/B0DTPVKX6Z"},
{id:"workplace-burnout",title:"Workplace Burnout",cover:"../assets/books/B0FF5D2FSZ.jpg",url:"https://www.amazon.com/Workplace-Burnout-Corrective-Preventive-Measures-ebook/dp/B0FF5D2FSZ"},
{id:"ascending-influence",title:"Ascending Influence",cover:"../assets/books/B0F7GLSKP1.jpg",url:"https://www.amazon.com/Ascending-Influence-Leadership-Styles-Summit/dp/B0F7GLSKP1"},
{id:"leadership-transient",title:"Leadership Is Transient",cover:"../assets/books/B0GZJXY7Q4.jpg",url:"https://www.amazon.com/Leadership-Transient-Understanding-Leader-Forever-ebook/dp/B0GZJXY7Q4"}
];

function openBookEditor(){$("#book-editor").classList.remove("hidden");$("#book-title").focus();$("#book-status").textContent=""}
function closeBookEditor(){$("#book-editor").classList.add("hidden");$("#book-preview").classList.add("hidden")}
function bookData(){return{title:$("#book-title").value.trim(),year:$("#book-year").value.trim(),category:$("#book-category").value.trim(),subject:$("#book-subject").value.trim(),keywords:$("#book-keywords").value.trim(),url:$("#book-url").value.trim()}}
function previewBook(){const b=bookData(),p=$("#book-preview"),f=$("#book-cover").files[0];const show=src=>{p.innerHTML='<div class="book-preview-card">'+(src?'<img src="'+src+'" alt="">':'')+'<div><h3>'+esc(b.title||"Untitled Book")+'</h3><p>'+esc(b.year)+(b.year?" · ":"")+esc(b.category)+' · '+esc(b.subject)+'</p><p>'+esc(b.keywords)+'</p></div></div>';p.classList.remove("hidden")};if(f){const r=new FileReader();r.onload=e=>show(e.target.result);r.readAsDataURL(f)}else show("")}
function saveBookDraft(){const b=bookData();if(!b.title){$("#book-status").textContent="Enter a book title before saving.";return}localStorage.setItem("johnughulu_book_draft",JSON.stringify(b));$("#book-status").textContent="Book draft saved in this browser."}
function publishBook(){const f=$("#book-form");if(!f.reportValidity())return;saveBookDraft();$("#book-status").textContent="Book is ready. Secure one-click publishing must be connected before this book can be made public."}
function restoreBookDraft(){try{const b=JSON.parse(localStorage.getItem("johnughulu_book_draft"));if(!b)return;$("#book-title").value=b.title||"";$("#book-year").value=b.year||"";$("#book-category").value=b.category||"";$("#book-subject").value=b.subject||"";$("#book-keywords").value=b.keywords||"";$("#book-url").value=b.url||""}catch{}}

function renderBooks(){const el=$("#book-list");if(!el)return;el.innerHTML=adminBooks.map(b=>'<article class="admin-book"><img src="'+b.cover+'" alt=""><div><strong>'+esc(b.title)+'</strong><p><a href="'+b.url+'" target="_blank" rel="noopener">View Amazon listing</a></p></div></article>').join("")}
function renderMedia(){const el=$("#media-list");if(!el)return;const media=[{title:"Dr. John Ughulu Headshot",src:"../assets/dr-john-ughulu-headshot.png"},...adminBooks.map(b=>({title:b.title+" cover",src:b.cover}))];el.innerHTML=media.map(m=>'<figure class="media-item"><img src="'+m.src+'" alt="'+esc(m.title)+'"><figcaption>'+esc(m.title)+'</figcaption></figure>').join("")}

function dashboard(){ $("#login").classList.add("hidden");$("#dash").classList.remove("hidden");loadArticles();loadClients();renderBooks();renderMedia();renderPages()}
function panel(id){$$(".panel").forEach(x=>x.classList.add("hidden"));$("#"+id).classList.remove("hidden")}
function exportCsv(){if(!clients.length)return;const cols=["visitor_name","email","resource_title","provider","privacy_consent","marketing_consent","submitted_at"],q=v=>'"'+String(v??"").replaceAll('"','""')+'"',csv=[cols.join(","),...clients.map(r=>cols.map(c=>q(r[c])).join(","))].join("\n"),a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));a.download="johnughulu-clients.csv";a.click()}
document.addEventListener("DOMContentLoaded",()=>{$("#show-password").onchange=e=>{$("#password").type=e.target.checked?"text":"password"};$("#login-form").addEventListener("submit",async e=>{e.preventDefault();$("#status").textContent="Signing in…";try{session=await signin($("#email").value,$("#password").value);sessionStorage.setItem("ju_session",JSON.stringify(session));dashboard()}catch(err){$("#status").textContent=err.message}});try{session=JSON.parse(sessionStorage.getItem("ju_session"));if(session?.access_token)dashboard()}catch{}$$("nav [data-p]").forEach(b=>b.onclick=()=>panel(b.dataset.p));$("#logout").onclick=()=>{sessionStorage.removeItem("ju_session");location.reload()};$("#as").oninput=renderArticles;$("#cs").oninput=renderClients;$("#export").onclick=exportCsv;$("#new-article").onclick=openArticleEditor;$("#close-editor").onclick=closeArticleEditor;$("#preview-article").onclick=previewArticle;$("#save-article-draft").onclick=saveArticleDraft;$("#publish-article").onclick=publishArticle;$("#article-file").onchange=e=>extractArticleFile(e.target.files[0]);restoreArticleDraft();$("#new-book").onclick=openBookEditor;$("#close-book-editor").onclick=closeBookEditor;$("#preview-book").onclick=previewBook;$("#save-book-draft").onclick=saveBookDraft;$("#publish-book").onclick=publishBook;restoreBookDraft();$("#close-page-editor").onclick=closePageEditor;$("#save-page-draft").onclick=savePageDraft;$("#view-editing-page").onclick=viewEditingPage});