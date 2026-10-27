import type { ServiceAgreementDocument } from "../types"

export function ServiceAgreement({ document }: { document: ServiceAgreementDocument }) {
  return (
    <article className="space-y-6 text-sm leading-7 text-slate-700 [overflow-wrap:anywhere]">
      <p className="text-xs text-slate-600">Versi {document.version} · {document.app_name}</p>
      {document.sections.map((section, index) => (
        <section key={index} className="space-y-2">
          <h2 className="font-semibold leading-6 text-slate-900">{section.title}</h2>
          {section.paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
        </section>
      ))}
      <p className="border-t border-slate-200 pt-4 font-medium text-slate-900">
        {document.closing_text}
      </p>
    </article>
  )
}
