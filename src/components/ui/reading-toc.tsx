import { useEffect, useState } from "react"

import { cn } from "@/lib/utils"

export type TocSection = { id: string; title: string, description: string }

// ponytail: IntersectionObserver scroll-spy. rootMargin picks the section
// crossing the top ~30% of the viewport as "active".
export function ReadingToc({
  sections,
  className,
}: {
  sections: TocSection[]
  className?: string
}) {
  const [activeId, setActiveId] = useState(sections[0]?.id)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting)
        if (visible.length) {
          setActiveId(visible[0].target.id)
        }
      },
      { rootMargin: "0px 0px -70% 0px", threshold: 0 },
    )

    for (const { id } of sections) {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    }
    return () => observer.disconnect()
  }, [sections])

  return (
    <nav className={cn("flex flex-col gap-1 text-sm", className)}>
      {sections.map(({ id, title, description }) => (
        <a
          key={id}
          href={`#${id}`}
          className={cn(
            "flex flex-col gap-0.5 border-l-2 py-1.5 pl-3 transition-colors",
            id === activeId
              ? "border-primary text-foreground"
              : "text-muted-foreground hover:text-foreground border-transparent",
          )}
        >
          <span className="font-medium">{title}</span>
          <span className="text-muted-foreground text-xs">{description}</span>
        </a>
      ))}
    </nav>
  )
}
