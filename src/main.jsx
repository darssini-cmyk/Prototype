import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { claimCase, metrics, regions, resetDemo, reviewErrors, saveReview, THRESHOLD } from './demo.js';
import './style.css';

// PUBLIC_INTERFACE
function App() {
  /** Render the synthetic, session-local operations walkthrough. */
  const [state, setState] = useState(resetDemo);
  const [screen, setScreen] = useState('Overview');
  const [selected, setSelected] = useState('SYN-001');
  const [active, setActive] = useState('name');
  const [team, setTeam] = useState('All');
  const [role, setRole] = useState('All');
  const [errors, setErrors] = useState([]);
  const [notice, setNotice] = useState('');
  const [resetPending, setResetPending] = useState(false);
  const item = state.cases.find(c => c.id === selected);
  const counts = metrics(state);
  const editable = item.status === 'In Review';

  function navigate(page) {
    setScreen(page);
    setErrors([]);
    setNotice('');
  }

  function updateItem(transform) {
    setState(previous => ({
      ...previous,
      cases: previous.cases.map(c => c.id === selected && c.status === 'In Review' ? transform(c) : c)
    }));
    setNotice('');
  }

  function updateField(id, value) {
    // Editing invalidates earlier human validation, including source population.
    updateItem(c => ({ ...c, fields: c.fields.map(f => f.id === id ? { ...f, value, validated: false } : f) }));
  }

  function confirmReview(e) {
    e.preventDefault();
    const problems = reviewErrors(item);
    setErrors(problems);
    if (problems.length) return;
    setState(previous => saveReview(previous, selected));
    setNotice(`Review confirmed locally for ${selected}. No banking action was executed.`);
  }

  return <div className="app">
    <header>
      <div className="brand"><span className="brand-mark">A</span><div>Automation workspace<small>Operations demonstration</small></div></div>
      <span className="operator">Demo operator · local session</span>
    </header>
    <div className="disclosure" role="note">Demonstration - synthetic data and simulated services</div>
    <div className="shell">
      <aside>
        <p className="eyebrow">WORKSPACE</p>
        <nav aria-label="Main navigation">{['Overview', 'Work Queue', 'Document Review', 'Activity'].map((page, i) =>
          <button key={page} aria-current={screen === page ? 'page' : undefined} onClick={() => navigate(page)}><span>0{i + 1}</span>{page}</button>
        )}</nav>
        <div className="scope"><strong>UI flow only</strong><p>No OCR/AI, bots, authentication or production services.</p><p>State is lost on reload.</p></div>
        <button className="secondary" onClick={() => setResetPending(true)}>Reset demonstration</button>
        {resetPending && <div className="reset" role="group" aria-label="Confirm reset"><p>Discard all session edits and events?</p><button onClick={() => {
          setState(resetDemo()); setTeam('All'); setRole('All'); setSelected('SYN-001'); setActive('name');
          navigate('Overview'); setResetPending(false);
        }}>Confirm reset</button><button className="secondary" onClick={() => setResetPending(false)}>Cancel reset</button></div>}
      </aside>
      <main>
        <div className="page-title"><div><p className="eyebrow">AUTOMATION OPERATIONS</p><h1>{screen}</h1></div><span className="pill">Synthetic workspace</span></div>
        {screen === 'Overview' && <>
          <p className="intro">A clear view of your demonstration queue. Follow a case from pickup to human validation.</p>
          <section className="metrics" aria-label="Queue metrics">{Object.entries(counts).map(([status, count]) =>
            <article className="card" key={status}><p>{status}</p><strong data-testid={`count-${status}`}>{count}</strong><small>Synthetic cases</small></article>
          )}</section>
          <section className="card hero"><div><p className="eyebrow">HUMAN IN THE LOOP</p><h2>Review with context</h2><p>Inspect a synthetic document, resolve flagged fields and record a local confirmation.</p><button onClick={() => navigate('Work Queue')}>Open work queue →</button></div><div className="steps">01 &nbsp; Pick up a case<hr />02 &nbsp; Validate document<hr />03 &nbsp; Confirm and inspect activity</div></section>
          <section className="card"><h2>Monitoring <span className="pill">Simulated</span></h2><p>No live bot or system telemetry is connected. Counts derive from local queue state.</p><button className="secondary" onClick={() => {
            setState(previous => ({ ...previous, refreshedAt: new Date().toISOString() }));
            setNotice('Simulated monitoring refreshed; no external service was contacted.');
          }}>Simulated refresh</button><p>Last simulated refresh: {state.refreshedAt ? new Date(state.refreshedAt).toLocaleString() : 'Not refreshed'}</p></section>
        </>}
        {screen === 'Work Queue' && <>
          <p className="intro">Prioritize and pick up synthetic work. Assignment applies only to this browser state.</p>
          <section className="card">
            <div className="filters"><label>Team<select aria-label="Team" value={team} onChange={e => setTeam(e.target.value)}>{['All', 'Operations', 'Finance'].map(v => <option key={v}>{v}</option>)}</select></label><label>Role filter<select aria-label="Role filter" value={role} onChange={e => setRole(e.target.value)}>{['All', 'Validator', 'Analyst'].map(v => <option key={v}>{v}</option>)}</select></label></div>
            <p className="muted">View filters only — not authentication or RBAC. Local pickup does not prevent another user from picking up a case.</p>
            <div className="table-wrap"><table><caption>Synthetic work queue</caption><thead><tr>{['Case', 'Team / role', 'Priority', 'Status', 'Assignment', 'Actions'].map(h => <th key={h}>{h}</th>)}</tr></thead>
              <tbody>{state.cases.filter(c => (team === 'All' || c.team === team) && (role === 'All' || c.role === role)).map(c => <tr key={c.id}><th scope="row">{c.id}</th><td>{c.team}<small>{c.role}</small></td><td><span className={`priority ${c.priority.toLowerCase()}`}>{c.priority}</span></td><td>{c.status}</td><td>{c.claimedBy || 'Unassigned'}</td><td><div className="actions"><button disabled={c.status !== 'Queued'} aria-label={`Pick up ${c.id}`} onClick={() => setState(previous => claimCase(previous, c.id))}>Pick up</button><button className="secondary" aria-label={`Review ${c.id}`} onClick={() => { setSelected(c.id); setActive('name'); navigate('Document Review'); }}>Review</button><button className="text" aria-label={`History ${c.id}`} onClick={() => { setSelected(c.id); navigate('Activity'); }}>History</button></div></td></tr>)}</tbody>
            </table></div>
            {!state.cases.some(c => (team === 'All' || c.team === team) && (role === 'All' || c.role === role)) && <p>No cases match these filters.</p>}
          </section>
        </>}
        {screen === 'Document Review' && <>
          <div className="review-toolbar"><label>Case<select value={selected} onChange={e => { setSelected(e.target.value); setErrors([]); setNotice(''); }}>{state.cases.map(c => <option key={c.id}>{c.id}</option>)}</select></label><span>{item.status} · {item.priority} priority</span><button disabled={item.status !== 'Queued'} onClick={() => setState(previous => claimCase(previous, selected))}>Pick up selected case</button></div>
          <p className="muted">Fixture values and confidence only — no extraction engine. Focus a field, then activate a source value to populate it.</p>
          <div className="review-grid">
            <section className="card document"><p className="eyebrow">SYNTHETIC DOCUMENT</p><h2>Sample invoice</h2><p>Training fixture · Not a real transaction</p><hr />{regions.map(r => <button key={r.id} className={`region ${item.fields.find(f => f.id === active)?.regionId === r.id ? 'region-active' : ''}`} aria-label={`Use source ${r.text}`} disabled={!editable} onClick={() => updateField(active, r.text)}>{r.text}<small>Activate to populate selected field</small></button>)}<p className="watermark">SYNTHETIC · DEMO ONLY</p></section>
            <section className="card"><h2>Validate fields</h2><p>Internal demo threshold: {THRESHOLD}. Only values below it are flagged.</p>
              <form onSubmit={confirmReview} noValidate>
                <fieldset disabled={!editable}><legend>Review data</legend>
                  {item.fields.map(f => <div key={f.id} className={`field ${f.confidence < THRESHOLD ? 'low-confidence' : ''}`} data-testid={`field-${f.id}`}>
                    <label htmlFor={f.id}>{f.label} <span className="confidence">{f.confidence.toFixed(2)}</span></label>
                    <input id={f.id} value={f.value} onFocus={() => setActive(f.id)} onChange={e => updateField(f.id, e.target.value)} />
                    {f.confidence < THRESHOLD && <><small>Low confidence — human validation required</small><label className="checkbox"><input type="checkbox" checked={f.validated} onChange={e => updateItem(c => ({ ...c, fields: c.fields.map(field => field.id === f.id ? { ...field, validated: e.target.checked } : field) }))} />Validate {f.label}</label></>}
                  </div>)}
                  <label>Document type<select aria-label="Document type" value={item.documentType} onChange={e => updateItem(c => ({ ...c, documentType: e.target.value }))}><option value="">Select manually</option><option>Invoice</option><option>Application</option></select></label>
                  {item.classificationFailed && <p className="classification">Simulated automatic classification failed. Select a type manually.</p>}
                </fieldset>
                {errors.length > 0 && <div role="alert" className="errors"><strong>Review not confirmed</strong><ul>{errors.map(error => <li key={error}>{error}</li>)}</ul></div>}
                <button type="submit" disabled={item.status === 'Reviewed'}>Confirm review</button>
              </form>
              {!editable && <p>{item.status === 'Reviewed' ? 'Completed locally. Duplicate confirmation is disabled.' : 'Pick up this case to edit its fields.'}</p>}
            </section>
          </div>
          {item.status === 'Reviewed' && <button onClick={() => navigate('Activity')}>View activity →</button>}
        </>}
        {screen === 'Activity' && <section className="card">
          <h2>Local case history</h2><p>In-memory, non-durable UI events with local timestamps. Not an immutable audit log or governance enforcement.</p>
          <label>Activity case<select value={selected} onChange={e => setSelected(e.target.value)}>{state.cases.map(c => <option key={c.id}>{c.id}</option>)}</select></label>
          <ol className="timeline">{state.events.filter(e => e.caseId === selected).map(e => <li key={e.id}><strong>{e.action}</strong><p>{e.caseId} · {e.actorLabel}</p><time dateTime={e.timestamp}>{new Date(e.timestamp).toLocaleString()}</time></li>)}</ol>
          {!state.events.some(e => e.caseId === selected) && <p>No local events for this case.</p>}
          <button className="secondary" onClick={() => navigate('Work Queue')}>Back to work queue</button>
        </section>}
        <p role="status" className="notice">{notice}</p>
        <footer>Demonstration only · Session-local state · No real approval, execution or submission</footer>
      </main>
    </div>
  </div>;
}

createRoot(document.getElementById('root')).render(<App />);
