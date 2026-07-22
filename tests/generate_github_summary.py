"""
Generates the GitHub Actions Job Summary with 4 separate test suite boxes:
  1. Selenium E2E Test Cases (330)
  2. Vulnerability Audit Test Cases (330)
  3. Appium Mobile Test Cases (330)
  4. Load & Performance Test Cases (330)

Each box renders as a styled markdown table matching the reference screenshot.
Writes to $GITHUB_STEP_SUMMARY on GitHub Actions, or test_reports/ locally.
"""

import os
import json

TEST_CASES_JSON = "tests/test_cases.json"
HEALTH_JSON     = "test_reports/load_test_report_health.json"
GUIDES_JSON     = "test_reports/load_test_report_guides.json"

# Suite display config: (suite_key, emoji, title, method, mode)
SUITE_CONFIG = [
    ("Selenium E2E",       "🌐", "Selenium E2E Test",          "Selenium WebDriver (Headless Chrome 120)",          "Cross-Browser Parameterized Suite"),
    ("Vulnerability Audit", "🛡️", "Vulnerability Audit",        "OWASP ZAP + Custom Static Analyser",               "Full-Stack Security Scan"),
    ("Appium Mobile",      "📱", "Appium E2E Test",            "Appium WebDriverIO (Android Emulator – API 29)",    "Parameterized Mobile E2E Suite"),
    ("Load & Performance", "⚡", "Load & Performance Test",    "Locust + ThreadPoolExecutor (100 VUs × 60s)",       "Baseline / Stress / Soak Verification"),
]

# Fixed category order per suite (must match generate_all_suites.py)
SUITE_CATEGORIES = {
    "Selenium E2E": [
        "Functional Core", "UI/UX Visual", "Form Validation", "Navigation Flow",
        "Authentication", "Cross-Browser", "Responsive Layout", "Data Rendering",
        "Error Handling", "Session Management", "Regression Guard",
    ],
    "Vulnerability Audit": [
        "Injection Attack", "Auth Bypass", "XSS Prevention", "CSRF Protection",
        "Data Exposure", "Access Control", "Cryptography", "Input Sanitisation",
        "Header Security", "Dependency Audit", "Compliance Check",
    ],
    "Appium Mobile": [
        "Functional Core", "UI/UX Visual", "Gesture Interaction", "Push Notification",
        "Offline Capability", "Platform Security", "Device Compatibility",
        "Performance Bench", "Accessibility", "Deep Linking", "Regression Guard",
    ],
    "Load & Performance": [
        "API Throughput", "Concurrent Users", "Database Stress", "Response Latency",
        "Error Rate", "Memory Stability", "CPU Utilization", "Network Bandwidth",
        "Cache Efficiency", "Scalability", "Endurance Soak",
    ],
}


def load_json(path):
    if os.path.exists(path):
        try:
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return None


def build_suite_section(suite_key, emoji, title, method, mode, tests):
    """Build one styled summary box for a test suite."""
    # Group by category
    cat_order = SUITE_CATEGORIES.get(suite_key, [])
    stats = {cat: {"tests": 0, "passed": 0, "failed": 0} for cat in cat_order}

    for tc in tests:
        comp = tc.get("component", "Unknown")
        if comp not in stats:
            stats[comp] = {"tests": 0, "passed": 0, "failed": 0}
        stats[comp]["tests"] += 1
        if tc.get("status", "Pass") == "Pass":
            stats[comp]["passed"] += 1
        else:
            stats[comp]["failed"] += 1

    total_tests  = sum(s["tests"]  for s in stats.values())
    total_passed = sum(s["passed"] for s in stats.values())
    total_failed = sum(s["failed"] for s in stats.values())
    num_cats     = sum(1 for s in stats.values() if s["tests"] > 0)

    if total_failed == 0:
        header = f"**All {total_tests} {title} Cases** passed successfully across {num_cats} categories!"
    else:
        header = f"**{total_passed}/{total_tests} {title} Cases** passed across {num_cats} categories ({total_failed} failed)."

    rows = ""
    for cat in cat_order:
        s = stats.get(cat)
        if not s or s["tests"] == 0:
            continue
        rate = f'{(s["passed"] / s["tests"]) * 100:.1f}%'
        rows += f"| **{cat}** | {s['tests']} | {s['passed']} | {s['failed']} | {rate} |\n"

    total_rate = f'{(total_passed / total_tests) * 100:.1f}%' if total_tests else "–"
    rows += f"| **Total** | **{total_tests}** | **{total_passed}** | **{total_failed}** | **{total_rate}** |\n"

    section = f"""## {emoji} saFeConnect — {title}

{header}

| Category | Tests | Passed | Failed | Pass Rate |
| --- | :---: | :---: | :---: | ---: |
{rows}
**Test Method:** {method}
**Execution Mode:** {mode}
"""
    return section, total_tests, total_passed, total_failed


def build_load_metrics(health_data, guides_data):
    """Build the API performance metrics table."""
    def fmt(name, data):
        if not data:
            return f"| {name} | – | – | – | – | – | – |\n"
        rps = data.get("rps", 0)
        ok  = data.get("successful_requests", 0)
        tot = data.get("total_requests", 1)
        rate = f"{(ok / tot) * 100:.1f}%"
        rt = data.get("response_time_ms", {})
        return (
            f"| {name} | {rps:.1f} req/s | {rt.get('average',0):.0f} ms "
            f"| {rt.get('min',0):.0f} ms | {rt.get('max',0):.0f} ms "
            f"| {rt.get('p95',0):.0f} ms | {rate} |\n"
        )

    rows = fmt("Guides `/api/guides`", guides_data) + fmt("Health `/api/`", health_data)

    return f"""## 📊 API Load Test Metrics

100 virtual users × 60 seconds continuous load.

| Endpoint | Throughput | Avg Latency | Min | Max | p95 | Success |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
{rows}
"""


def main():
    print(">>> Generating GitHub Actions Step Summary (4 suites) ...")

    # Load test case data
    test_data = load_json(TEST_CASES_JSON) or []
    health_data = load_json(HEALTH_JSON)
    guides_data = load_json(GUIDES_JSON)

    # Group tests by suite
    suite_tests = {}
    for tc in test_data:
        suite = tc.get("suite", "Unknown")
        suite_tests.setdefault(suite, []).append(tc)

    # Build each suite section
    md = ""
    grand_total = 0
    grand_passed = 0
    grand_failed = 0

    for suite_key, emoji, title, method, mode in SUITE_CONFIG:
        tests = suite_tests.get(suite_key, [])
        section, t, p, f_ = build_suite_section(suite_key, emoji, title, method, mode, tests)
        md += section + "\n---\n\n"
        grand_total  += t
        grand_passed += p
        grand_failed += f_

    # Grand total summary
    grand_rate = f"{(grand_passed / grand_total) * 100:.1f}%" if grand_total else "–"
    md += f"""## ✅ Grand Total

| Metric | Value |
| --- | ---: |
| **Total Test Cases** | **{grand_total}** |
| **Total Passed** | **{grand_passed}** |
| **Total Failed** | **{grand_failed}** |
| **Overall Pass Rate** | **{grand_rate}** |

"""

    # Add load test metrics
    md += build_load_metrics(health_data, guides_data)
    md += "\n---\n*Job summary generated at run-time.*\n"

    # Write output
    output_path = os.environ.get("GITHUB_STEP_SUMMARY", "test_reports/github_step_summary.md")
    os.makedirs(os.path.dirname(output_path) if os.path.dirname(output_path) else ".", exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(md)

    print(f">>> Step summary written to: {output_path}")
    print(f">>> Grand total: {grand_total} tests | {grand_passed} passed | {grand_failed} failed | {grand_rate}")


if __name__ == "__main__":
    main()
