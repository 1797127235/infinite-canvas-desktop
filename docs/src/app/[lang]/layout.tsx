import { Provider } from '@/components/provider';
import '../global.css';
import { i18n } from '@/lib/i18n';

export default async function Layout({ children }: LayoutProps<'/[lang]'>) {
  return (
    <html lang={i18n.defaultLanguage} suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}

export function generateStaticParams() {
  return i18n.languages.map((lang) => ({ lang }));
}
