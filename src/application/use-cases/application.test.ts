import assert from "node:assert/strict"
import { test } from "node:test"
import { createCustomerHistory, type CustomerHistoryRepositories } from "./customer-history"
import { findBusinessBySlug, filterBusinesses } from "@/domain/services/business-directory"
import { normalizeTrPhone } from "@/domain/value-objects/phone"
import type { Business } from "@/domain/models/business"

test("customer history uses injected repositories and passes cancellation through", async () => {
  const controller = new AbortController()
  const calls: string[] = []
  const repositories: CustomerHistoryRepositories = {
    appointmentsApi: {
      async listByPhone(phone, status, signal) {
        assert.equal(phone, "5552223344")
        assert.equal(status, undefined)
        assert.equal(signal, controller.signal)
        calls.push("appointments")
        return []
      },
    },
    sessionsApi: {
      async list(params, signal) {
        assert.equal(params?.phone, "5552223344")
        assert.equal(signal, controller.signal)
        calls.push("sessions")
        return { content: [], page: 0, size: 50, totalElements: 0, totalPages: 1 }
      },
      async get() { throw new Error("No session details should be requested for an empty page") },
    },
  }
  assert.deepEqual(await createCustomerHistory(repositories)("5552223344", controller.signal), [])
  assert.deepEqual(calls.sort(), ["appointments", "sessions"])
})

test("repository failures reach the caller unchanged", async () => {
  const failure = new Error("repository unavailable")
  const repositories: CustomerHistoryRepositories = {
    appointmentsApi: { listByPhone: async () => { throw failure } },
    sessionsApi: {
      list: async () => ({ content: [], page: 0, size: 50, totalElements: 0, totalPages: 1 }),
      async get() { throw new Error("No session details should be requested") },
    },
  }
  await assert.rejects(createCustomerHistory(repositories)("5552223344"), (error) => error === failure)
})

test("business lookup preserves Turkish case folding and unknown-slug behavior", () => {
  const business: Business = { companyName: "IŞIK", location: "İstanbul", mapsDestination: "İstanbul", verified: true, initials: "I", slug: "isik" }
  assert.deepEqual(filterBusinesses([business], " ışık "), [business])
  assert.deepEqual(filterBusinesses([business], "istanbul"), [business])
  assert.equal(findBusinessBySlug([business], "missing"), null)
  assert.equal(findBusinessBySlug([business], "isik"), business)
})

test("phone normalization preserves local and country-code inputs", () => {
  assert.equal(normalizeTrPhone("+90 (555) 222 33 44"), "5552223344")
  assert.equal(normalizeTrPhone("0555 222 33 44"), "5552223344")
  assert.equal(normalizeTrPhone("5552223344"), "5552223344")
})
