import { describe, expect, it } from "vitest"
import { notificationLabel } from "./NavNotifications"
import type { Notification } from "../notifications.type"

const notification = (data: Notification["data"]): Notification => ({
  id: "1",
  type: "test",
  notifiable_type: "user",
  notifiable_id: "1",
  data,
  read_at: null,
  created_at: 0,
  updated_at: 0,
})

describe("notificationLabel", () => {
  it("extracts message from JSON data", () => {
    expect(notificationLabel(notification('{"message":"Hello"}'))).toBe("Hello")
  })

  it("falls back to title", () => {
    expect(notificationLabel(notification('{"title":"Titre"}'))).toBe("Titre")
  })

  it("returns raw data when not JSON", () => {
    expect(notificationLabel(notification("plain text"))).toBe("plain text")
  })

  it("handles data already parsed as object", () => {
    expect(notificationLabel(notification({ title: "T", message: "M" }))).toBe("M")
  })
})
