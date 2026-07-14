const dayMs = 1000 * 60 * 60 * 24

function calendarDayTime(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime()
}

export function inclusiveCalendarDaysBetween(start: Date, end: Date) {
  const diff = Math.floor((calendarDayTime(end) - calendarDayTime(start)) / dayMs)

  return Math.max(1, diff + 1)
}

export function formatLengthOfStay(start: Date, end: Date | null | undefined) {
  if (!end) {
    return "-"
  }

  return `${inclusiveCalendarDaysBetween(start, end)} hari`
}
