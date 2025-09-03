
import React, { useMemo, useRef, useState } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const ROLES = ['admin','supervisor','viewer'];

const ROLE_PERMS = {
  admin: { createProject:true, deleteProject:true, uploadFiles:true, deleteFiles:true, addEditPunch:true, deletePunch:true, toggleStatus:true, exportReports:true, annotateDrawings:true },
  supervisor: { createProject:false, deleteProject:false, uploadFiles:true, deleteFiles:true, addEditPunch:true, deletePunch:true, toggleStatus:true, exportReports:true, annotateDrawings:true },
  viewer: { createProject:false, deleteProject:false, uploadFiles:false, deleteFiles:false, addEditPunch:false, deletePunch:false, toggleStatus:false, exportReports:true, annotateDrawings:false },
};

const seedProjects = [
  { id:'p1', name:'Project GSD BEE 2025', code:'GSD-BEE-25', category:'Mechanical', site:'Refinery U31', start:'2025-07-01', description:'Piping & Bolted Joints – Control Bolting & Punch List.'},
  { id:'p2', name:'Substation Rehab', code:'ELX-04', category:'Electrical', site:'Yard 12A', start:'2025-05-10'}
];

const seedPunch = [
  { id:'pi1', tag:'50" Flange 8UN', system:'U31 Heater', location:'Nozzle N4', jointType:'B16.47B', lineNo:'L-501A', discipline:'Mechanical', priority:'High', description:'Hydrotest leak @ SW gasket, requires reassembly per PCC-1.', assignee:'Team A', due:'2025-09-05', status:'Open' },
  { id:'pi2', tag:'PRV-203', system:'PSV Rack', discipline:'Mechanical', priority:'Medium', description:'Calibration overdue.', assignee:'Metrology', due:'2025-09-10', status:'In Progress' },
  { id:'pi3', tag:'LT-45', system:'Level Transmitter', discipline:'Electrical', priority:'Low', description:'Cable gland IP rating check.', assignee:'E&I', due:'2025-09-08', status:'Open' },
];

function formatBytes(bytes){
  if(bytes===0) return '0 B';
  const sizes=['B','KB','MB','GB']; const i=Math.floor(Math.log(bytes)/Math.log(1024));
  return `${(bytes/Math.pow(1024,i)).toFixed(1)} ${sizes[i]}`;
}

export default function App(){
  const [role,setRole]=useState('admin');
  const perms = ROLE_PERMS[role];

  const [projects,setProjects]=useState(seedProjects);
  const [activeProjectId,setActiveProjectId]=useState(seedProjects[0].id);
  const activeProject = useMemo(()=>projects.find(p=>p.id===activeProjectId),[projects,activeProjectId]);

  const [files,setFiles]=useState({p1:[],p2:[]});
  const fileInputRef = useRef(null);

  const [punch,setPunch]=useState({p1:seedPunch,p2:[]});

  // Files
  const onUpload=(e)=>{
    if(!perms.uploadFiles) return;
    const fls=e.target.files; if(!fls) return;
    const arr=files[activeProjectId]?[...files[activeProjectId]]:[];
    for(let i=0;i<fls.length;i++){
      const f=fls[i];
      arr.push({ id:`${Date.now()}-${i}`, name:f.name, size:f.size, type:f.type||'file', uploadedAt:new Date().toISOString() });
    }
    setFiles({...files,[activeProjectId]:arr});
    if(fileInputRef.current) fileInputRef.current.value='';
  };
  const removeFile=(id)=>{
    if(!perms.deleteFiles) return;
    setFiles({...files,[activeProjectId]:(files[activeProjectId]||[]).filter(f=>f.id!==id)});
  };

  // Punch
  const [newPunch,setNewPunch]=useState({ priority:'Low', status:'Open', discipline:'Mechanical' });
  const addPunch=()=>{
    if(!perms.addEditPunch) return;
    if(!newPunch.description || !newPunch.tag) return;
    const item={
      id:`pi-${Date.now()}`,
      tag:newPunch.tag, system:newPunch.system||'', location:newPunch.location||'',
      lineNo:newPunch.lineNo||'', jointType:newPunch.jointType||'',
      discipline:newPunch.discipline, priority:newPunch.priority, description:newPunch.description||'',
      assignee:newPunch.assignee||'', due:newPunch.due||'', status:newPunch.status||'Open'
    };
    setPunch({...punch,[activeProjectId]:[...(punch[activeProjectId]||[]), item]});
    setNewPunch({ priority:'Low', status:'Open', discipline:'Mechanical' });
  };
  const toggleStatus=(id)=>{
    if(!perms.toggleStatus) return;
    setPunch({
      ...punch,
      [activeProjectId]:(punch[activeProjectId]||[]).map(it=>it.id===id?{...it,status:it.status==='Done'?'Open':'Done'}:it)
    });
  };
  const removePunch=(id)=>{
    if(!perms.deletePunch) return;
    setPunch({...punch,[activeProjectId]:(punch[activeProjectId]||[]).filter(it=>it.id!==id)});
  };

  // Filters
  const [fltDiscipline,setFltDiscipline]=useState('All');
  const [fltPriority,setFltPriority]=useState('All');
  const [fltStatus,setFltStatus]=useState('All');
  const [sortBy,setSortBy]=useState('due');

  const shownPunch=useMemo(()=>{
    let rows=[...(punch[activeProjectId]||[])];
    if(fltDiscipline!=='All') rows=rows.filter(r=>r.discipline===fltDiscipline);
    if(fltPriority!=='All') rows=rows.filter(r=>r.priority===fltPriority);
    if(fltStatus!=='All') rows=rows.filter(r=>r.status===fltStatus);
    rows.sort((a,b)=>{
      switch(sortBy){
        case 'priority': return (a.priority>b.priority?-1:1);
        case 'status': return (a.status>b.status?1:-1);
        case 'tag': return a.tag.localeCompare(b.tag);
        default: {
          const av=a.due||'9999-12-31', bv=b.due||'9999-12-31'; return av.localeCompare(bv);
        }
      }
    });
    return rows;
  },[punch,activeProjectId,fltDiscipline,fltPriority,fltStatus,sortBy]);

  // Drawings annotations
  const [drawingURL,setDrawingURL]=useState('');
  const [calloutsByProject,setCalloutsByProject]=useState({});
  const activeCallouts = calloutsByProject[activeProjectId]||[];
  const onDrawingUpload=(e)=>{
    if(!perms.annotateDrawings) return;
    const file=e.target.files?.[0]; if(!file) return;
    const url=URL.createObjectURL(file); setDrawingURL(url);
  };
  const onCanvasClick=(e)=>{
    if(!perms.annotateDrawings || !drawingURL) return;
    const rect=e.currentTarget.getBoundingClientRect();
    const x=((e.clientX-rect.left)/rect.width)*100;
    const y=((e.clientY-rect.top)/rect.height)*100;
    const text=prompt('Callout text'); if(!text) return;
    const item={ id:`c-${Date.now()}`, x, y, text };
    setCalloutsByProject({...calloutsByProject, [activeProjectId]:[...activeCallouts,item]});
  };
  const removeCallout=(id)=>{
    setCalloutsByProject({...calloutsByProject, [activeProjectId]:activeCallouts.filter(c=>c.id!==id)});
  };

  // Reports
  const exportPDF = async () => {
  const pr = activeProject;
  const doc = new jsPDF({ unit: "pt" });

  let logoData = null;
  try {
    const res = await fetch("/logo.png");
    if (res.ok) {
      const blob = await res.blob();
      logoData = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
    }
  } catch (e) {}

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  const header = () => {
    if (logoData) doc.addImage(logoData, "PNG", 40, 24, 110, 40);
    doc.setFontSize(14);
    doc.text("PROJECT REPORT", 160, 44);
    doc.setFontSize(10);
    doc.text(`Project: ${pr.name} (${pr.code})`, 160, 60);
    doc.text(`Category: ${pr.category}    Site: ${pr.site}`, 160, 74);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 160, 88);
    doc.setLineWidth(0.5);
    doc.line(40, 100, pageW - 40, 100);
  };

  const footer = (pageNumber) => {
    doc.setLineWidth(0.5);
    doc.line(40, pageH - 50, pageW - 40, pageH - 50);
    doc.setFontSize(9);
    doc.text("Company: Mallionda Engineering • info@mallionda.gr", 40, pageH - 36);
    doc.text(`Page ${pageNumber}`, pageW - 80, pageH - 36);
  };

  const rows = shownPunch.map((r, i) => [
    i + 1, r.tag, r.system, r.location || "-",
    r.lineNo || "-", r.jointType || "-", r.discipline,
    r.priority, r.status, r.assignee || "-", r.due || "-", r.description
  ]);

  doc.autoTable({
    startY: 120,
    head: [[
      "#","Tag","System","Loc","Line","Joint","Disc",
      "Prio","Status","Assignee","Due","Description"
    ]],
    body: rows,
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [230,230,230] },
    columnStyles: { 11: { cellWidth: 180 } },
    margin: { left: 40, right: 40, top: 100, bottom: 70 },
    didDrawPage: () => {
      header();
      const pageNumber = doc.internal.getNumberOfPages();
      footer(pageNumber);
    },
  });

  doc.save(`${pr.code}-report.pdf`);
};
    });
    const y = doc.lastAutoTable?.finalY || 120;
    doc.setFontSize(11);
    doc.text('Prepared by: ______________________    Reviewed by: ______________________',40,y+40);
    doc.text('Date: _____________',40,y+60);
    doc.save(`${pr.code}-report.pdf`);
  };

  const exportCSV=()=>{
    if(!perms.exportReports) return;
    const pr=activeProject; const rows=shownPunch;
    const header=['Tag','System','Location','Line','Joint','Discipline','Priority','Status','Assignee','Due','Description'].join(',');
    const body=rows.map(r=>[r.tag,r.system,r.location||'',r.lineNo||'',r.jointType||'',r.discipline,r.priority,r.status,r.assignee||'',r.due||'',(r.description||'').replace(/\n/g,' ')].map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
    const csv=header+'\n'+body;
    const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a'); a.href=url; a.download=`${pr.code}-punchlist.csv`;
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  };

  return (
    <div style={{fontFamily:'system-ui, Arial, sans-serif', padding:16, maxWidth:1200, margin:'0 auto'}}>
      <header style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <div>
          <h1 style={{margin:'8px 0'}}>Project Tracker MLND</h1>
          <div style={{color:'#666'}}>Projects • Files • Punch (filters/sort) • Drawings annotations • PDF/CSV • Role-based permissions</div>
        </div>
        <div>
          <label style={{marginRight:8}}>View as:</label>
          <select value={role} onChange={e=>setRole(e.target.value)}>
            {ROLES.map(r=><option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      </header>

      <div style={{display:'grid', gridTemplateColumns:'1fr 3fr', gap:16, marginTop:16}}>
        <section style={{border:'1px solid #eee', borderRadius:12, padding:12}}>
          <h3>Projects</h3>
          {projects.map(p=> (
            <div key={p.id} style={{display:'flex', alignItems:'center', gap:8, margin:'8px 0'}}>
              <button onClick={()=>setActiveProjectId(p.id)} style={{flex:1, textAlign:'left', padding:8, borderRadius:10, border:'1px solid #eee', background:p.id===activeProjectId?'#f7f7f7':'white'}}>
                <div style={{fontWeight:600}}>{p.name}</div>
                <div style={{fontSize:12, color:'#666'}}>{p.code} • {p.category}</div>
                <div style={{fontSize:12, color:'#666'}}>{p.site}</div>
              </button>
              {ROLE_PERMS[role].deleteProject && <button title="Delete" onClick={()=>setProjects(ps=>ps.filter(x=>x.id!==p.id))}>🗑️</button>}
            </div>
          ))}
          {ROLE_PERMS[role].createProject && (
            <button onClick={()=>{
              const id=`p${Date.now()}`;
              setProjects([...projects,{id, name:'New Project', code:`NEW-${projects.length+1}`, category:'Mechanical', site:''}]);
              setFiles({...files,[id]:[]}); setPunch({...punch,[id]:[]}); setActiveProjectId(id);
            }} style={{width:'100%', padding:8, borderRadius:8, border:'1px solid #ddd'}}>➕ New Project</button>
          )}
        </section>

        <section style={{border:'1px solid #eee', borderRadius:12, padding:12}}>
          <h3>{activeProject.name} <span style={{color:'#666'}}>({activeProject.code})</span></h3>
          <div style={{display:'flex', gap:8, marginTop:8, flexWrap:'wrap'}}>
            <a href="#files">Files</a>
            <a href="#punch">Punch</a>
            <a href="#drawings">Drawings</a>
            <a href="#reports">Reports</a>
            <a href="#admin">Admin</a>
          </div>

          {/* Files */}
          <div id="files" style={{marginTop:16}}>
            <h4>Files</h4>
            <div style={{display:'flex', gap:8, alignItems:'center'}}>
              <input ref={fileInputRef} disabled={!perms.uploadFiles} type="file" multiple onChange={onUpload}/>
              <button disabled={!perms.uploadFiles}>Upload</button>
            </div>
            <table style={{width:'100%', marginTop:8, borderCollapse:'collapse'}}>
              <thead><tr><th align="left">Name</th><th align="left">Type</th><th>Size</th><th>Uploaded</th><th align="right">Actions</th></tr></thead>
              <tbody>
                {(files[activeProjectId]||[]).map(f=>(
                  <tr key={f.id} style={{borderTop:'1px solid #eee'}}>
                    <td>{f.name}</td>
                    <td>{f.type}</td>
                    <td align="center">{formatBytes(f.size)}</td>
                    <td>{new Date(f.uploadedAt).toLocaleString()}</td>
                    <td align="right">{perms.deleteFiles && <button onClick={()=>removeFile(f.id)}>Delete</button>}</td>
                  </tr>
                ))}
                {(files[activeProjectId]||[]).length===0 && <tr><td colSpan="5" style={{color:'#777'}}>No files uploaded yet.</td></tr>}
              </tbody>
            </table>
          </div>

          {/* Punch */}
          <div id="punch" style={{marginTop:24}}>
            <h4>Punch List</h4>
            <div style={{display:'flex', gap:8, flexWrap:'wrap', alignItems:'center', padding:8, border:'1px solid #eee', borderRadius:10}}>
              <span>Filters:</span>
              <select value={fltDiscipline} onChange={e=>setFltDiscipline(e.target.value)}>
                {['All','Mechanical','Electrical','Hull','Insulation','Painting','NDT'].map(d=><option key={d} value={d}>{d}</option>)}
              </select>
              <select value={fltPriority} onChange={e=>setFltPriority(e.target.value)}>
                {['All','Low','Medium','High'].map(d=><option key={d} value={d}>{d}</option>)}
              </select>
              <select value={fltStatus} onChange={e=>setFltStatus(e.target.value)}>
                {['All','Open','In Progress','Done'].map(d=><option key={d} value={d}>{d}</option>)}
              </select>
              <span>Sort by:</span>
              <select value={sortBy} onChange={e=>setSortBy(e.target.value)}>
                {['due','priority','status','tag'].map(d=><option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            {perms.addEditPunch && (
              <div style={{display:'grid', gridTemplateColumns:'repeat(3, minmax(0,1fr))', gap:8, padding:8, border:'1px solid #eee', borderRadius:10, marginTop:8}}>
                <input placeholder='Tag' value={newPunch.tag||''} onChange={e=>setNewPunch(s=>({...s,tag:e.target.value}))}/>
                <input placeholder='System' value={newPunch.system||''} onChange={e=>setNewPunch(s=>({...s,system:e.target.value}))}/>
                <input placeholder='Location' value={newPunch.location||''} onChange={e=>setNewPunch(s=>({...s,location:e.target.value}))}/>
                <input placeholder='Line No.' value={newPunch.lineNo||''} onChange={e=>setNewPunch(s=>({...s,lineNo:e.target.value}))}/>
                <input placeholder='Joint Type' value={newPunch.jointType||''} onChange={e=>setNewPunch(s=>({...s,jointType:e.target.value}))}/>
                <select value={newPunch.discipline} onChange={e=>setNewPunch(s=>({...s,discipline:e.target.value}))}>
                  {['Mechanical','Electrical','Hull','Insulation','Painting','NDT'].map(d=><option key={d} value={d}>{d}</option>)}
                </select>
                <select value={newPunch.priority} onChange={e=>setNewPunch(s=>({...s,priority:e.target.value}))}>
                  {['Low','Medium','High'].map(d=><option key={d} value={d}>{d}</option>)}
                </select>
                <input placeholder='Assignee' value={newPunch.assignee||''} onChange={e=>setNewPunch(s=>({...s,assignee:e.target.value}))}/>
                <input type='date' value={newPunch.due||''} onChange={e=>setNewPunch(s=>({...s,due:e.target.value}))}/>
                <textarea placeholder='Description' style={{gridColumn:'span 2'}} value={newPunch.description||''} onChange={e=>setNewPunch(s=>({...s,description:e.target.value}))}/>
                <div style={{display:'flex', justifyContent:'end'}}><button onClick={addPunch}>Add</button></div>
              </div>
            )}

            <table style={{width:'100%', marginTop:8, borderCollapse:'collapse'}}>
              <thead><tr>
                <th>Done</th><th>Tag</th><th>System</th><th>Loc</th><th>Line</th><th>Joint</th><th>Disc</th><th>Priority</th><th>Due</th><th>Status</th><th>Assignee</th><th>Actions</th>
              </tr></thead>
              <tbody>
                {shownPunch.map(item=> (
                  <tr key={item.id} style={{borderTop:'1px solid #eee', opacity:item.status==='Done'?0.6:1}}>
                    <td align="center"><input type="checkbox" checked={item.status==='Done'} onChange={()=>toggleStatus(item.id)} disabled={!perms.toggleStatus}/></td>
                    <td>{item.tag}</td><td>{item.system}</td><td>{item.location||'-'}</td><td>{item.lineNo||'-'}</td><td>{item.jointType||'-'}</td>
                    <td>{item.discipline}</td><td>{item.priority}</td><td>{item.due||'-'}</td><td>{item.status}</td><td>{item.assignee||'-'}</td>
                    <td align="right">{perms.deletePunch && <button onClick={()=>removePunch(item.id)}>Delete</button>}</td>
                  </tr>
                ))}
                {shownPunch.length===0 && <tr><td colSpan="12" style={{color:'#777'}}>No punch items match filters.</td></tr>}
              </tbody>
            </table>
          </div>

          {/* Drawings */}
          <div id="drawings" style={{marginTop:24}}>
            <h4>Drawings</h4>
            <div style={{display:'flex', gap:8, alignItems:'center'}}>
              <input type="file" accept="image/*" onChange={onDrawingUpload} disabled={!perms.annotateDrawings}/>
              <span style={{fontSize:12, color:'#666'}}>{drawingURL ? 'Image loaded' : 'No image'}</span>
            </div>
            <div onClick={onCanvasClick} style={{position:'relative', width:'100%', minHeight:360, border:'1px solid #eee', borderRadius:10, marginTop:8, cursor: (perms.annotateDrawings && drawingURL)?'crosshair':'default', display:'flex', alignItems:'center', justifyContent:'center'}}>
              {drawingURL ? (
                <>
                  <img src={drawingURL} alt="drawing" style={{width:'100%', objectFit:'contain', pointerEvents:'none', userSelect:'none'}}/>
                  {activeCallouts.map(c=>(
                    <div key={c.id} style={{position:'absolute', left:`${c.x}%`, top:`${c.y}%`, transform:'translate(-50%,-100%)'}}>
                      <div style={{background:'rgba(0,0,0,0.8)', color:'#fff', fontSize:10, padding:'2px 4px', borderRadius:4}}>{c.text}</div>
                      <div style={{width:0, height:0, borderLeft:'4px solid transparent', borderRight:'4px solid transparent', borderTop:'8px solid rgba(0,0,0,0.8)', margin:'0 auto'}}/>
                    </div>
                  ))}
                </>
              ) : (
                <div style={{color:'#777'}}>Upload a drawing image and click to add callouts.</div>
              )}
            </div>
            {activeCallouts.length>0 && (
              <table style={{width:'100%', marginTop:8, borderCollapse:'collapse'}}>
                <thead><tr><th>#</th><th>Text</th><th>X%</th><th>Y%</th><th>Actions</th></tr></thead>
                <tbody>
                  {activeCallouts.map((c,i)=>(
                    <tr key={c.id} style={{borderTop:'1px solid #eee'}}>
                      <td>{i+1}</td><td>{c.text}</td><td>{c.x.toFixed(1)}</td><td>{c.y.toFixed(1)}</td>
                      <td align="right">{perms.annotateDrawings && <button onClick={()=>removeCallout(c.id)}>Delete</button>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Reports */}
          <div id="reports" style={{marginTop:24}}>
            <h4>Reports</h4>
            <div style={{display:'flex', gap:8}}>
              <button onClick={exportPDF} disabled={!perms.exportReports}>Export PDF</button>
              <button onClick={exportCSV} disabled={!perms.exportReports}>Export CSV</button>
            </div>
            <div style={{color:'#666', fontSize:12, marginTop:4}}>PDF περιλαμβάνει πίνακα punch + υπογραφές. CSV περιλαμβάνει όλα τα πεδία. Τα φίλτρα εφαρμόζονται και στα δύο.</div>
          </div>

          {/* Admin */}
          <div id="admin" style={{marginTop:24}}>
            <h4>Admin</h4>
            <table style={{width:'100%', borderCollapse:'collapse'}}>
              <thead><tr><th>Capability</th><th>Admin</th><th>Supervisor</th><th>Viewer</th></tr></thead>
              <tbody>
                {[
                  {cap:'Create/Delete Projects', a:'✔︎', s:'✖︎', v:'✖︎'},
                  {cap:'Upload/Delete Files', a:'✔︎', s:'✔︎', v:'✖︎'},
                  {cap:'Add/Edit/Delete Punch', a:'✔︎', s:'✔︎', v:'✖︎'},
                  {cap:'Toggle Status', a:'✔︎', s:'✔︎', v:'✖︎'},
                  {cap:'Export Reports', a:'✔︎', s:'✔︎', v:'✔︎'},
                  {cap:'Annotate Drawings', a:'✔︎', s:'✔︎', v:'✖︎'},
                ].map((r,i)=>(
                  <tr key={i} style={{borderTop:'1px solid #eee'}}>
                    <td>{r.cap}</td><td>{r.a}</td><td>{r.s}</td><td>{r.v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <footer style={{fontSize:12, color:'#666', textAlign:'center', marginTop:16}}>
        MLND • Vite React • jsPDF + autotable • No backend (mock storage)
      </footer>
    </div>
  );
}
