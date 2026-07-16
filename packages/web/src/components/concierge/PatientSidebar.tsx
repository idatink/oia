interface PatientSidebarProps {
  name: string;
  patientId: string;
  intents: string[];
  conciergeStatus: string;
}

export default function PatientSidebar({ name, patientId, intents, conciergeStatus }: PatientSidebarProps) {
  return (
    <aside className="w-[320px] shrink-0 border-r border-white/40 bg-surface-container-low/50 backdrop-blur-md flex flex-col h-full overflow-y-auto">
      <div className="p-6 space-y-6">
        {/* Profile */}
        <div>
          <h2 className="font-body text-label-caps text-primary uppercase tracking-[0.15em] font-semibold mb-4">Patient Profile</h2>
          <div className="flex items-center gap-3 glass-soft rounded-card p-4">
            <div className="w-12 h-12 rounded-full bg-secondary-container flex items-center justify-center shrink-0">
              <span className="font-display text-display-sm text-on-secondary-container">
                {name.charAt(0)}
              </span>
            </div>
            <div>
              <p className="font-body text-body-md font-semibold text-on-surface">{name}</p>
              <p className="font-body text-body-sm text-on-surface-variant">{patientId}</p>
            </div>
          </div>
        </div>

        {/* Clinical Intent */}
        <div>
          <p className="font-body text-label-caps text-on-surface-variant uppercase tracking-widest mb-3">Clinical Intent</p>
          <div className="flex flex-wrap gap-2">
            {intents.map(intent => (
              <span
                key={intent}
                className="bg-primary-fixed text-primary px-3 py-1 rounded-full font-body text-[11px] font-semibold uppercase tracking-wider"
              >
                {intent}
              </span>
            ))}
          </div>
        </div>

        {/* Health Records */}
        <div>
          <p className="font-body text-label-caps text-on-surface-variant uppercase tracking-widest mb-3">Health Records</p>
          <div className="space-y-2">
            {[
              { name: 'Medical_History.pdf', type: 'pdf' },
              { name: 'Front_Profile_Views.zip', type: 'zip' },
            ].map(file => (
              <div key={file.name} className="flex items-center justify-between glass-soft rounded-lg px-4 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <svg className="w-4 h-4 text-primary shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/>
                  </svg>
                  <span className="font-body text-body-sm text-on-surface truncate">{file.name}</span>
                </div>
                <button className="text-on-surface-variant hover:text-primary transition-colors shrink-0 ml-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Concierge Status */}
        <div className="bg-primary-fixed/50 border border-primary/10 rounded-card p-4">
          <p className="font-body text-label-caps text-primary uppercase tracking-widest mb-2">Concierge Status</p>
          <p className="font-body text-body-sm text-on-surface leading-relaxed">{conciergeStatus}</p>
        </div>
      </div>

      {/* Update CTA */}
      <div className="p-6 mt-auto border-t border-outline-variant/20">
        <button className="w-full flex items-center justify-center gap-2 border border-primary text-primary px-4 py-3 rounded-lg font-body text-label-caps uppercase tracking-wider font-semibold hover:bg-primary-fixed transition-all">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"/>
          </svg>
          Update Medical Details
        </button>
      </div>
    </aside>
  );
}
