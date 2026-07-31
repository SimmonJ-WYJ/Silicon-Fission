import assert from "node:assert/strict";
import test from "node:test";

import {
  parseNewUser,
  parseUserSearchQuery,
  toNewApiCreateUserRequest,
  toNewApiUserPath,
  USER_ROLE_ADMIN,
  USER_ROLE_COMMON,
} from "./user-admin.ts";

test("parses a valid new user and defaults the display name", () => {
  const result = parseNewUser({ username: "  alice  ", password: "hunter2hunter" });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.deepEqual(result.value, {
    username: "alice",
    password: "hunter2hunter",
    displayName: "alice",
    role: USER_ROLE_COMMON,
  });
});

test("keeps an explicit display name and admin role", () => {
  const result = parseNewUser({
    username: "bob",
    password: "password123",
    displayName: "  Bob Smith  ",
    role: USER_ROLE_ADMIN,
  });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.value.displayName, "Bob Smith");
  assert.equal(result.value.role, USER_ROLE_ADMIN);
});

test("rejects a malformed payload", () => {
  for (const input of [null, undefined, "x", [], 1]) {
    const result = parseNewUser(input);
    assert.equal(result.ok, false);
  }
});

test("rejects a blank or overlong username", () => {
  assert.equal(parseNewUser({ username: "  ", password: "password123" }).ok, false);
  assert.equal(parseNewUser({ username: "a".repeat(21), password: "password123" }).ok, false);
});

test("rejects a username with unsupported characters", () => {
  const result = parseNewUser({ username: "bad name!", password: "password123" });
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.match(result.message, /字母、数字/);
});

test("enforces the password length window", () => {
  assert.equal(parseNewUser({ username: "a", password: "short" }).ok, false);
  assert.equal(parseNewUser({ username: "a", password: "a".repeat(21) }).ok, false);
  assert.equal(parseNewUser({ username: "a", password: "a".repeat(8) }).ok, true);
});

test("preserves padded passwords verbatim", () => {
  const result = parseNewUser({ username: "a", password: "  pad123  " });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.value.password, "  pad123  ");
});

test("rejects an overlong display name", () => {
  assert.equal(
    parseNewUser({ username: "a", password: "password123", displayName: "b".repeat(21) }).ok,
    false,
  );
});

test("refuses to create root or unknown roles", () => {
  for (const role of [100, 0, 5, "10"]) {
    const result = parseNewUser({ username: "a", password: "password123", role });
    assert.equal(result.ok, false);
  }
});

test("maps a new user onto the new-api payload", () => {
  assert.deepEqual(
    toNewApiCreateUserRequest({
      username: "alice",
      password: "password123",
      displayName: "Alice",
      role: USER_ROLE_ADMIN,
    }),
    { username: "alice", password: "password123", display_name: "Alice", role: USER_ROLE_ADMIN },
  );
});

test("defaults the search query when nothing is supplied", () => {
  assert.deepEqual(parseUserSearchQuery(new URLSearchParams()), {
    keyword: "",
    role: null,
    status: null,
    page: 1,
    pageSize: 100,
  });
});

test("keeps supported filters and clamps the page size", () => {
  const query = parseUserSearchQuery(
    new URLSearchParams({ keyword: " bob ", role: "10", status: "2", page: "3", pageSize: "500" }),
  );
  assert.deepEqual(query, { keyword: "bob", role: 10, status: 2, page: 3, pageSize: 100 });
});

test("drops unsupported filter values instead of forwarding them", () => {
  const query = parseUserSearchQuery(
    new URLSearchParams({ role: "7", status: "9", page: "-1", pageSize: "0" }),
  );
  assert.deepEqual(query, { keyword: "", role: null, status: null, page: 1, pageSize: 100 });
});

test("uses the list endpoint when no filter is active", () => {
  const path = toNewApiUserPath({ keyword: "", role: null, status: null, page: 2, pageSize: 50 });
  assert.equal(path, "/api/user/?p=2&page_size=50");
});

test("switches to the search endpoint once a filter is active", () => {
  const path = toNewApiUserPath({ keyword: "bob", role: 10, status: 1, page: 1, pageSize: 20 });
  assert.match(path, /^\/api\/user\/search\?/);
  const params = new URLSearchParams(path.split("?")[1]);
  assert.equal(params.get("keyword"), "bob");
  assert.equal(params.get("role"), "10");
  assert.equal(params.get("status"), "1");
  assert.equal(params.get("p"), "1");
  assert.equal(params.get("page_size"), "20");
});

test("treats a role-only filter as a search", () => {
  const path = toNewApiUserPath({ keyword: "", role: 1, status: null, page: 1, pageSize: 100 });
  assert.match(path, /^\/api\/user\/search\?/);
  assert.equal(new URLSearchParams(path.split("?")[1]).get("status"), null);
});
