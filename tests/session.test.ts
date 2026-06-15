import { describe, it } from "node:test"
import assert from "node:assert/strict"

import { createSessionToken, hashSessionToken } from "@/lib/auth/session-token"

describe("session token security", () => {
  it("generates URL-safe random session tokens", () => {
    const token = createSessionToken()

    assert.match(token, /^[A-Za-z0-9_-]+$/)
    assert.ok(token.length >= 32)
  })

  it("stores a deterministic hash instead of the raw token", () => {
    const token = "sample-session-token"
    const hash = hashSessionToken(token)

    assert.equal(hash, hashSessionToken(token))
    assert.notEqual(hash, token)
    assert.match(hash, /^[a-f0-9]{64}$/)
  })
})
