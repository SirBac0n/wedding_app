// Formats a calendar-date-only value (wedding date, RSVP cutoff — stored as
// UTC midnight from an <input type="date">) without letting the viewer's
// local timezone shift it by a day. Plain `.toLocaleDateString()` on a UTC
// midnight Date displays the previous day for anyone west of UTC — exactly
// the timezone bug REQUIREMENTS.md section 5 calls out. Use this instead of
// `.toLocaleDateString()` for any date-only field; timestamps that are
// genuinely instants (sentAt, createdAt) should keep using local time.
export function formatCalendarDate(date: Date): string {
  return date.toLocaleDateString(undefined, { timeZone: "UTC" });
}
