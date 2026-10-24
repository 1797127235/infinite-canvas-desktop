'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';
import { SidebarTabsDropdown } from 'fumadocs-ui/components/sidebar/tabs/dropdown';
import type { LayoutTab } from 'fumadocs-ui/layouts/shared';
import { BookOpen, Code2, HeartHandshake, ListChecks, MousePointer2, type LucideIcon } from 'lucide-react';

type DocsSection = {
  title: string;
  description: string;
  href: string;
  prefix: string;
  pages: readonly string[];
  icon: LucideIcon;
};

const tabs: DocsSection[] = [
  { title: '项目介绍', description: '快速开始与功能介绍', href: '/docs/overview/quick-start', prefix: '/docs/overview', pages: ['quick-start', 'codex-app-plugin', 'features', 'render', 'docker', 'third-party-prompt-repositories'], icon: BookOpen },
  { title: '操作手册', description: '画布节点与快捷键', href: '/docs/canvas/canvas-node-manual', prefix: '/docs/canvas', pages: ['canvas-node-manual', 'canvas-shortcuts'], icon: MousePointer2 },
  { title: '开发文档', description: '本地开发与内部结构', href: '/docs/development/local-development', prefix: '/docs/development', pages: ['local-development', 'local-codex-canvas', 'canvas-data-structure', 'electron-packaging'], icon: Code2 },
  { title: '项目进度', description: '变更记录与待测试项', href: '/docs/progress/changelog', prefix: '/docs/progress', pages: ['changelog', 'pending-test'], icon: ListChecks },
  { title: '赞助支持', description: '赞助项目与安全说明', href: '/docs/support/sponsor', prefix: '/docs/support', pages: ['sponsor', 'security'], icon: HeartHandshake },
];

export function DocsSidebarTabs() {
  const options: LayoutTab[] = tabs.map((tab) => {
    const Icon = tab.icon;

    return {
      title: tab.title,
      description: tab.description,
      url: tab.href,
      urls: new Set(tab.pages.map((page) => `${tab.prefix}/${page}`)),
      icon: (
        <span className="flex size-full items-center justify-center rounded-md bg-fd-primary/10 text-fd-primary">
          <Icon className="size-4" />
        </span>
      ),
    };
  });

  return <SidebarTabsDropdown className="md:hidden" options={options} />;
}

export function DocsTopTabs() {
  const pathname = usePathname();

  return (
    <nav aria-label="文档分类" className="sticky top-0 z-30 hidden h-12 self-start overflow-x-auto border-b bg-fd-background/95 px-6 pt-3 backdrop-blur [grid-area:main] md:flex xl:px-8">
      <div className="flex flex-row items-end gap-6">
        {tabs.map((tab) => {
          const active = pathname === tab.href || pathname.startsWith(`${tab.prefix}/`);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'inline-flex border-b-2 border-transparent pb-1.5 text-sm font-medium text-nowrap text-fd-muted-foreground transition-colors hover:text-fd-accent-foreground',
                active && 'border-fd-primary text-fd-primary',
              )}
            >
              {tab.title}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
