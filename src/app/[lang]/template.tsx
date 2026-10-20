// template بيتعمل من جديد مع كل تنقل، فالصفحة بتدخل بحركة ناعمة
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="animate-page-in">{children}</div>;
}
