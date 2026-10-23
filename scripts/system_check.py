"""API system check. Run ONLY against an isolated backend (copy of the DB): it runs experiments and approves a remediation.
Usage: python scripts/system_check.py http://localhost:8020
"""
import json, sys, time, concurrent.futures as cf
import httpx

B = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8020"  # use an ISOLATED backend: this script approves a remediation
c = httpx.Client(base_url=B, timeout=120)
res = []


def check(name, ok, detail=""):
    res.append((name, ok))
    print(("PASS " if ok else "FAIL ") + name + (f"  [{detail}]" if detail and not ok else (f"  ({detail})" if detail else "")))


def J(r):
    try:
        return r.json()
    except Exception:
        return {}


# ---------------- Phase 2: functional workflow (isolated DB) ----------------
r = c.post("/api/v1/experiments/run-pair", json={"release_id": "rel-2026-001", "scenario": {"scenario_id": "lost-response-retry", "concurrency": 5, "retry_count": 2, "delay_ms": 50, "failure_rate": 0.1, "order_count": 10, "seed": 777}})
check("run-pair returns 200", r.status_code == 200, r.text[:200])
pair = J(r)
v = pair.get("vulnerable_experiment", {})
p = pair.get("repaired_experiment", {})
vid, pid = v.get("id"), p.get("id")
check("experiment ids present, distinct", bool(vid) and bool(pid) and vid != pid, f"{vid} {pid}")
check("same scenario+seed for both runs", v.get("scenario_id") == p.get("scenario_id") and v.get("reproducibility_seed") == p.get("reproducibility_seed") == 777)
vl = J(c.get(f"/api/v1/experiments/{vid}/ledger"))
pl = J(c.get(f"/api/v1/experiments/{pid}/ledger"))
v_dup = [t for t in vl if t["is_duplicate"] and t["has_anomaly"]]
p_dup = [t for t in pl if t["is_duplicate"] and t["has_anomaly"]]
check("vulnerable ledger contains duplicate charges", len(v_dup) > 0, f"{len(v_dup)} dup / {len(vl)} rows")
check("repaired ledger has zero duplicate charges", len(p_dup) == 0, f"{len(p_dup)}")
# Documented, persisted summary for live runs: Experiment.ledger_summary
# {orders_violating_invariant, financial_exposure_usd, ...}. (metrics_summary is only populated for seeded runs.)
vs = v.get("ledger_summary") or {}
dup_usd = sum(t["amount_cents"] for t in v_dup) / 100
check("ledger duplicate $ == ledger_summary.financial_exposure_usd", abs(dup_usd - float(vs.get("financial_exposure_usd", -1))) < 0.01, f"ledger {dup_usd} vs summary {vs.get('financial_exposure_usd')}")
check("distinct orders with duplicates == ledger_summary.orders_violating_invariant", len({t["order_id"] for t in v_dup}) == vs.get("orders_violating_invariant"), f"{len({t['order_id'] for t in v_dup})} vs {vs.get('orders_violating_invariant')}")
check("repaired ledger_summary reports zero violations/exposure", (p.get("ledger_summary") or {}).get("orders_violating_invariant") == 0 and (p.get("ledger_summary") or {}).get("financial_exposure_usd") == 0)
check("ledger rows reference their experiment", all(t["experiment_id"] == vid for t in vl) and all(t["experiment_id"] == pid for t in pl))
ev = J(c.get(f"/api/v1/experiments/{vid}/events"))
check("events recorded for vulnerable run", isinstance(ev, list) and len(ev) > 0, str(len(ev)))
cmp_ = J(c.get("/api/v1/time-machine/compare/rel-2026-001"))
check("time-machine compare returns the latest pair", cmp_.get("vulnerable_experiment", {}).get("id") == vid, f"{cmp_.get('vulnerable_experiment', {}).get('id')} vs {vid}")

g = J(c.get("/api/v1/investigation/rel-2026-001/causal-graph?variant=vulnerable"))
r = c.post("/api/v1/investigation/rel-2026-001/trace-path", json={"source_node_id": "cnode-code-a8f9c21b", "target_node_id": "cnode-cons-double-debit", "max_depth": 10})
tp = J(r)
check("causal graph loads", len(g.get("nodes", [])) > 0 and len(g.get("edges", [])) > 0, f"{len(g.get('nodes', []))}n/{len(g.get('edges', []))}e")
check("causal path trace found", r.status_code == 200 and tp.get("path_found") is True, r.text[:150])

gates0 = J(c.get("/api/v1/release-control/rel-2026-001"))
r = c.post("/api/v1/remediations/trigger", json={"release_id": "rel-2026-001", "triggering_experiment_id": vid})
check("remediation trigger accepted", r.status_code in (200, 201), r.text[:200])
wf = J(r)
wid = wf.get("id")
check("workflow created in PATCH_PROPOSED", wf.get("status") == "PATCH_PROPOSED" and wf.get("approval_status") == "PENDING", f"{wf.get('status')}/{wf.get('approval_status')}")
d = J(c.get(f"/api/v1/remediations/workflows/{wid}/diff"))
diff = d.get("patch_diff") or d.get("diff") or wf.get("patch_diff") or ""
check("actual patch diff present (processor.py, +/- lines)", "processor.py" in diff and "\n+" in diff and "\n-" in diff, str(list(d))[:100])

r = c.post(f"/api/v1/remediations/workflows/{wid}/approve", json={"approver_name": "Test Approver", "approver_email": "t@example.com", "note": "premature"})
check("UNSAFE: approve before verification is rejected", r.status_code >= 400, f"status {r.status_code} {r.text[:120]}")
if r.status_code < 400:  # restore isolated state so later steps still test a pending workflow
    wf = J(c.post("/api/v1/remediations/trigger", json={"release_id": "rel-2026-001", "triggering_experiment_id": vid}))
    wid = wf.get("id")

r = c.post(f"/api/v1/remediations/workflows/{wid}/validate")
check("sandbox validation runs", r.status_code == 200, r.text[:200])
vr = J(r).get("validation_results", {})
pre, post = vr.get("pre_patch_run", {}), vr.get("post_patch_run", {})
check("pre-patch tests FAIL (exit!=0, failed>=1)", pre.get("exit_code") not in (0, None) and pre.get("failed", 0) >= 1, f"exit {pre.get('exit_code')} failed {pre.get('failed')}")
check("post-patch tests PASS (exit 0, failed 0)", post.get("exit_code") == 0 and post.get("failed") == 0 and post.get("passed", 0) >= 1, f"exit {post.get('exit_code')} passed {post.get('passed')} failed {post.get('failed')}")
check("validation output is real pytest", "pytest" in (pre.get("stdout", "") + post.get("stdout", "")).lower())

for body, name in [({"approver_name": "A", "approver_email": "x@y.z"}, "short name"), ({"approver_name": "Test Approver"}, "missing email"), ({"approver_name": "Test Approver", "approver_email": "nope"}, "malformed email")]:
    r = c.post(f"/api/v1/remediations/workflows/{wid}/approve", json=body)
    check(f"approve validation: {name} -> 4xx", r.status_code in (400, 422), f"status {r.status_code}")
st = J(c.get(f"/api/v1/remediations/workflows/{wid}"))
check("invalid approvals did not change state", st.get("approval_status") == "PENDING", st.get("approval_status"))

r = c.post(f"/api/v1/remediations/workflows/{wid}/approve", json={"approver_name": "<script>alert(1)</script>", "approver_email": "qa@example.com", "note": "isolated test approval"})
check("valid approval accepted", r.status_code == 200, r.text[:150])
st = J(c.get(f"/api/v1/remediations/workflows/{wid}"))
check("state transitions to APPROVED/COMPLETED", st.get("approval_status") == "APPROVED", f"{st.get('status')}/{st.get('approval_status')}")
check("approval record stores approver (verbatim, escaped by UI)", (st.get("approval_decision") or {}).get("approver_name", "").startswith("<script>"))
r = c.post(f"/api/v1/remediations/workflows/{wid}/approve", json={"approver_name": "Second Approver", "approver_email": "b@example.com"})
check("double approval rejected", r.status_code >= 400, f"status {r.status_code}")
r = c.post(f"/api/v1/remediations/workflows/{wid}/reject", json={"approver_name": "Rejecter", "approver_email": "r@example.com", "reason": "flip after approve"})
check("reject-after-approve rejected", r.status_code >= 400, f"status {r.status_code}")

gates1 = J(c.get("/api/v1/release-control/rel-2026-001"))
print("INFO release gating before:", gates0.get("overall_status"), gates0.get("gates_passed"), "/", gates0.get("gates_total"), "can_promote", gates0.get("can_promote"),
      "| after:", gates1.get("overall_status"), gates1.get("gates_passed"), "/", gates1.get("gates_total"), "can_promote", gates1.get("can_promote"))
human = [x for x in gates1.get("gates", []) if x.get("gate_type") != "automated"]
print("INFO non-automated gates:", [(x["gate_name"][:40], x["status"]) for x in human])
check("release cannot promote while a required human gate is unsigned", not (gates1.get("can_promote") and any(x["required"] and x["status"] != "approved" for x in gates1.get("gates", []))))
ag = J(c.get("/api/v1/agent-activity"))
check("agent-activity reports duo_connected false (no fake Duo)", ag.get("duo_connected") is False)

# ---------------- Phase 3: validation / reliability ----------------
def st_(method, path, **kw):
    try:
        return c.request(method, path, **kw).status_code
    except Exception as e:
        return f"EXC {type(e).__name__}"

for path in ["/api/v1/time-machine/compare/nope", "/api/v1/investigation/nope/causal-graph", "/api/v1/investigation/nope/blast-radius", "/api/v1/release-control/nope", "/api/v1/experiments/nope", "/api/v1/experiments/nope/ledger", "/api/v1/remediations/workflows/nope", "/api/v1/remediations/workflows/nope/diff"]:
    s = st_("GET", path)
    check(f"invalid id GET {path.split('/api/v1/')[1]} -> 404 (not 500)", s in (404, 422), s)
for path in ["validate", "approve", "reject"]:
    s = st_("POST", f"/api/v1/remediations/workflows/nope/{path}", json={"approver_name": "Test Approver", "approver_email": "t@example.com", "reason": "reason text"})
    check(f"invalid workflow id POST {path} -> 404", s in (404, 422), s)
check("SQL-injection-style id handled", st_("GET", "/api/v1/experiments/x'%20OR%20'1'='1") in (404, 422))
base = {"release_id": "rel-2026-001", "scenario": {"scenario_id": "lost-response-retry", "seed": 1}}
for patch, name in [({"concurrency": 51}, "concurrency>50"), ({"concurrency": 0}, "concurrency=0"), ({"order_count": 101}, "order_count>100"), ({"failure_rate": 2}, "failure_rate>1"), ({"delay_ms": -5}, "negative delay"), ({"seed": "abc"}, "seed string")]:
    b = json.loads(json.dumps(base)); b["scenario"].update(patch)
    check(f"run-pair rejects {name}", st_("POST", "/api/v1/experiments/run-pair", json=b) == 422)
b = json.loads(json.dumps(base)); b["scenario"]["scenario_id"] = "../../etc/passwd"
s = st_("POST", "/api/v1/experiments/run-pair", json=b); check("unknown scenario_id handled (4xx, not 500/accepted)", isinstance(s, int) and 400 <= s < 500, s)
b["scenario"]["scenario_id"] = "A" * 100000
s = st_("POST", "/api/v1/experiments/run-pair", json=b); check("100KB scenario_id rejected/handled", isinstance(s, int) and s < 500 and s != 200, s)
check("unknown release_id on run-pair -> 4xx", (lambda s: isinstance(s, int) and 400 <= s < 500)(st_("POST", "/api/v1/experiments/run-pair", json={"release_id": "nope", "scenario": {"scenario_id": "lost-response-retry"}})))
check("malformed JSON -> 422", st_("POST", "/api/v1/experiments/run-pair", content="{bad", headers={"Content-Type": "application/json"}) == 422)

# concurrent experiment execution
def run(i):
    t = time.time()
    r = httpx.post(B + "/api/v1/experiments/run-pair", json={"release_id": "rel-2026-001", "scenario": {"scenario_id": "concurrent-checkouts", "concurrency": 5, "order_count": 10, "seed": 900 + i}}, timeout=120)
    return r.status_code, (r.json().get("vulnerable_experiment") or {}).get("id"), round(time.time() - t, 1)
with cf.ThreadPoolExecutor(6) as ex:
    out = list(ex.map(run, range(6)))
codes = [o[0] for o in out]
check("6 concurrent run-pair calls all succeed", all(x == 200 for x in codes), str(codes))
check("concurrent runs got unique experiment ids", len({o[1] for o in out}) == 6, str(out))
print("INFO concurrent timings(s):", [o[2] for o in out])

# idempotency of the synthetic payment endpoint
key = "idem-test-" + str(int(time.time()))
pay = {"customer_id": "cust_test", "amount_cents": 5000, "idempotency_key": key, "release_variant": "repaired"}
r1 = c.post("/api/v1/synthetic-payment/execute", json=pay); r2 = c.post("/api/v1/synthetic-payment/execute", json=pay)
j1, j2 = J(r1), J(r2)
check("repaired payment: same key twice -> one charge", r1.status_code == 200 and r2.status_code == 200 and (j1.get("transaction_id") or j1.get("id")) == (j2.get("transaction_id") or j2.get("id")), f"{str(j1)[:90]} | {str(j2)[:90]}")
def pay_conc(_):
    return httpx.post(B + "/api/v1/synthetic-payment/execute", json={**pay, "idempotency_key": key + "-c"}, timeout=60).json()
with cf.ThreadPoolExecutor(8) as ex:
    outs = list(ex.map(pay_conc, range(8)))
ids = {(o.get("transaction_id") or o.get("id")) for o in outs}
check("repaired payment: 8 concurrent same-key requests -> exactly one transaction", len(ids) == 1, f"{len(ids)} distinct")
check("payment validation: negative amount rejected", st_("POST", "/api/v1/synthetic-payment/execute", json={**pay, "amount_cents": -5, "idempotency_key": "neg"}) in (400, 422), st_("POST", "/api/v1/synthetic-payment/execute", json={**pay, "amount_cents": -5, "idempotency_key": "neg2"}))

# sensitive information / transport
r = c.get("/api/v1/agent-activity"); txt = r.text
check("no token-like secrets in agent-activity", "glpat-" not in txt and "ACCESS_TOKEN=" not in txt.replace("GITLAB_ACCESS_TOKEN=glpat", ""))
for path in ["/healthz", "/readyz", "/api/v1/healthz", "/api/v1/readyz"]:
    t = c.get(path).text
    if any(k in t.lower() for k in ["password", "secret", "token\":", "database_url", "sqlite:///"]):
        check(f"{path} leaks config", False, t[:150])
o = c.options("/api/v1/overview", headers={"Origin": "https://evil.example", "Access-Control-Request-Method": "POST"})
check("CORS does not allow arbitrary origins", o.headers.get("access-control-allow-origin") not in ("*", "https://evil.example"), o.headers.get("access-control-allow-origin"))
r = c.get("/api/v1/overview"); hdr = {k.lower() for k in r.headers}
print("INFO security headers present:", sorted(h for h in hdr if h in ("x-content-type-options", "x-frame-options", "content-security-policy", "strict-transport-security", "referrer-policy")))
print("INFO /docs publicly served:", c.get("/docs").status_code, "| /openapi.json:", c.get("/openapi.json").status_code)
print("INFO unauthenticated approve worked above => no authN/authZ on state-changing endpoints:", "Authorization" not in str(c.headers))
r = c.get("/api/v1/remediations/workflows/" + wid)
print("INFO approver email exposed to unauthenticated GET:", "qa@example.com" in r.text)
r = c.post("/api/v1/experiments/run-pair", content=b"x" * 5_000_000, headers={"Content-Type": "application/json"})
print("INFO 5MB body ->", r.status_code)
r = c.post("/api/v1/agent-activity/trigger", json={"release_id": "rel-2026-001", "goal": "x" * 200000})
print("INFO 200KB goal on agent trigger ->", r.status_code)

print("\nSUMMARY: %d passed, %d failed" % (sum(1 for _, o in res if o), sum(1 for _, o in res if not o)))
