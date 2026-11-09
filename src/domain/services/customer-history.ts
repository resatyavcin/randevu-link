import type { AppointmentDto, SessionDto, SessionEventDto } from "@/domain/models/contracts"

export type HistoryRow =
  | { kind: "appointment"; at: number; appointment: AppointmentDto }
  | { kind: "session"; at: number; session: SessionDto; event: SessionEventDto }

export function historyRows(appointments: AppointmentDto[], sessions: SessionDto[]) {
  const appointmentRows = previousAppointments(appointments).map((appointment) => ({
    kind: "appointment" as const,
    at: appointmentAt(appointment),
    appointment,
  }))
  const sessionRows = sessions.flatMap((session) =>
    session.events
      .filter((event) => event.kind === "COMPLETED" && !event.appointmentId)
      .map((event) => ({
        kind: "session" as const,
        at: new Date(event.occurredAt).getTime(),
        session,
        event,
      })),
  )
  return [...appointmentRows, ...sessionRows].sort((a, b) => b.at - a.at)
}

function appointmentAt(appointment: AppointmentDto) {
  const [year, month, day] = appointment.date.split("-").map(Number)
  const [hour, minute] = appointment.slot.split(":").map(Number)
  return new Date(year, month - 1, day, hour || 0, minute || 0).getTime()
}

function previousAppointments(rows: AppointmentDto[]) {
  const today = new Date()
  const todayIso = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-")
  return rows
    .filter((row) => row.status !== "PENDING" || row.date < todayIso)
    .sort((a, b) => {
      const byDate = b.date.localeCompare(a.date)
      if (byDate !== 0) return byDate
      return b.slot.localeCompare(a.slot)
    })
}
