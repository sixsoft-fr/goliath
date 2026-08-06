import { useMemo, useRef } from "react"
import {
  addDays,
  addMinutes,
  setHours,
  startOfDay,
  startOfWeek,
} from "date-fns"
import { PlusSignIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { Button } from "@/components/ui/button"
import {
  EventCalendar,
  type EventCalendarApi,
} from "@/components/reui/event-calendar/event-calendar"
import { EventCalendarContent } from "@/components/reui/event-calendar/event-calendar-content"
import {
  EventCalendarNav,
  EventCalendarToolbar,
} from "@/components/reui/event-calendar/event-calendar-nav"
import type { CalendarEvent } from "@/components/reui/event-calendar/event-calendar-types"
import { Page } from "@/modules/core/Page"

/** Sample events across the current week so every view has content. */
function buildEvents(anchor: Date): CalendarEvent[] {
  const week = startOfWeek(startOfDay(anchor), { weekStartsOn: 1 })
  const at = (day: number, h: number, m = 0) =>
    addMinutes(setHours(addDays(week, day), h), m)
  return [
    { id: "sync", title: "Team sync", start: at(1, 9), end: at(1, 9, 30) },
    {
      id: "review",
      title: "Design review",
      start: at(2, 11),
      end: at(2, 12),
      color: "var(--color-violet-500)",
    },
    {
      id: "demo",
      title: "Product demo",
      start: at(3, 15),
      end: at(3, 16),
      color: "var(--color-emerald-500)",
    },
    {
      id: "1on1",
      title: "1:1",
      start: at(4, 14),
      end: at(4, 14, 30),
      color: "var(--color-amber-500)",
    },
    {
      id: "offsite",
      title: "Team offsite",
      start: addDays(week, 4),
      end: addDays(week, 6),
      allDay: true,
      color: "var(--color-rose-500)",
    },
  ]
}

export function Home() {
  const events = useMemo(() => buildEvents(new Date()), [])
  const apiRef = useRef<EventCalendarApi | null>(null)
  const newCount = useRef(0)

  const addEvent = () => {
    const api = apiRef.current
    if (!api) return
    const start = setHours(startOfDay(new Date()), 12)
    api.addEvent({
      id: `new-${newCount.current++}`,
      title: "New event",
      start,
      end: addMinutes(start, 60),
      color: "var(--color-blue-500)",
    })
    api.goTo(start)
  }

  return (
    <Page>
      <EventCalendar
        defaultEvents={events}
        defaultView="month"
        apiRef={apiRef}
        className="h-svh w-full p-4"
      >
        <div className="flex flex-wrap items-center gap-2 pe-2 pb-2">
          <EventCalendarNav className="min-w-0 flex-1" />
          <EventCalendarToolbar>
            <Button size="sm" onClick={addEvent}>
              <HugeiconsIcon
                icon={PlusSignIcon}
                strokeWidth={2}
                className="size-4"
                aria-hidden="true"
              />
              New event
            </Button>
          </EventCalendarToolbar>
        </div>
        <EventCalendarContent />
      </EventCalendar>
    </Page>
  )
}

export default Home
