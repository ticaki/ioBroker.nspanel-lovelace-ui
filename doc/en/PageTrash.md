# Page Trash (waste collection)

The **waste page** shows the next collection dates: one line each with an icon in the colour of the bin,
the name of the waste type and the day on the right. It is configured **in the admin only** — the
configuration script does not know this card type.

➡️ **[Waste page – configuration in the admin](PageTrash-Admin)**

## What arrives on the panel

The page has **four or six lines** — and that choice also decides which card the adapter builds from it:
four dates give a `cardEntities`, six a `cardSchedule`, both through the template
`entities.waste-calendar` (`admin.ts`). A value outside 1 to 6 is forced to 6.

Each line is made of:

| Part | Where it comes from |
|---|---|
| Icon and colour | From the waste type's fields in the admin; without one the adapter uses `calendar-month`. |
| Text | The **optional name** if it is set — otherwise the search term of the waste type. |
| Day on the right | `today`, `tomorrow`, the weekday (within the coming week) or the date. |

> **The two words `today` and `tomorrow` stay English.** The adapter writes them literally and never
> translates them (`pageTrash.ts`). Weekdays and dates, on the other hand, are formatted **hard-wired in
> German** (`de-DE`), regardless of the adapter's language. With four dates the weekday is written out in
> full and the year has four digits, with six it is abbreviated and the year has two — the narrower line
> leaves less room.

## Where the dates come from

Two sources are available, both set in the admin:

- **A state of a calendar adapter** — typically `ical.0.data.table`. The adapter expects a list of entries
  carrying `_date` and `event`.
- **An `.ics` file in the ioBroker file storage** — the adapter reads it, takes every `VEVENT` and sorts
  them by date. If the file is missing, the log says so (*does not exist in ioBroker files*).

The same sieve applies to both:

1. **Everything before today is dropped** (compared from midnight).
2. The event text must **contain the search term of a waste type** — a fragment is enough, and case
   matters. The **first matching** of the six lines wins, so the order in the admin decides whenever terms
   overlap („Papier" and „Papiertonne").
3. A date that matches no waste type **does not appear** — it is discarded silently.
4. After **six** entries the adapter stops, even if the source offers more.

## When it is refreshed

At adapter start and then **every six hours** (on the full hour at 0, 6, 12 and 18, `controller.ts`). A new
date in the calendar therefore does not show up on the panel right away. If you need it sooner, restart the
instance.
