// `template.tsx` remonta a cada navegação (diferente de layout.tsx), então
// a animação toca de novo em cada troca de página, sem afetar o Sidebar e o
// Header (que ficam no layout.tsx, um nível acima, e continuam fixos).
export default function DashboardTemplate({ children }: { children: React.ReactNode }) {
  return <div className="animate-fade-in-up">{children}</div>;
}
