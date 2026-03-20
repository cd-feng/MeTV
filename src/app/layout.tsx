import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import SearchBox from "@/components/SearchBox";
import MobileNav from "@/components/MobileNav";
import ThemeToggle from "@/components/ThemeToggle";
import { ThemeProvider } from "@/components/ThemeProvider";
import PasswordGate from "@/components/PasswordGate";
import DisclaimerModal from "@/components/DisclaimerModal";
import { fetchCategories } from "@/lib/api";
import { buildCategoryTree } from "@/lib/categories";

export const metadata: Metadata = {
  title: "MeTV - 在线影视",
  description: "聚合最新最全的电影、电视剧、动漫、综艺资源，支持高清 M3U8 在线播放。",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const rawCats = await fetchCategories();
  const tree = buildCategoryTree(rawCats);
  const topNavItems = tree.map(c => ({ id: c.id, name: c.name }));

  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>
        {/* ThemeProvider 负责在 JS 加载后立即同步 data-theme 至 html */}
        <ThemeProvider>
          <PasswordGate />
          <DisclaimerModal />
          <nav className="navbar">
            <MobileNav items={topNavItems} />
            <Link href="/" className="navbar-brand">MeTV</Link>
            <div className="nav-links">
              <Link href="/" className="nav-link">首页</Link>
              {tree.map((cat) => (
                <Link key={cat.id} href={`/category/${cat.id}`} className="nav-link">
                  {cat.name}
                </Link>
              ))}
            </div>
            <div className="navbar-right">
              <ThemeToggle />
              <SearchBox />
            </div>
          </nav>
          <main>{children}</main>
          <footer className="footer">
            &copy; {new Date().getFullYear()} MeTV &nbsp;·&nbsp; 数据来源：全站多源聚合
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
