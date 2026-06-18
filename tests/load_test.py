import os
import sys
import time
import json
import argparse
import threading
import requests
from concurrent.futures import ThreadPoolExecutor

# Thread-safe results container
results = []
results_lock = threading.Lock()

# Flag to signal workers to stop
stop_flag = False

def run_worker(url, headers=None):
    global stop_flag
    session = requests.Session()
    
    while not stop_flag:
        start_time = time.perf_counter()
        success = False
        status_code = None
        error_msg = None
        
        try:
            # Send GET request
            response = session.get(url, headers=headers, timeout=10)
            status_code = response.status_code
            if response.status_code == 200:
                success = True
        except Exception as e:
            error_msg = str(e)
            
        end_time = time.perf_counter()
        latency_ms = (end_time - start_time) * 1000.0
        
        with results_lock:
            results.append({
                "latency_ms": latency_ms,
                "success": success,
                "status_code": status_code,
                "error": error_msg
            })

def main():
    parser = argparse.ArgumentParser(description="saFeConnect Baseline/Load Testing Script")
    parser.add_argument("--url", default="http://127.0.0.1:8000/api/", help="Target URL to load test")
    parser.add_argument("--users", type=int, default=100, help="Number of virtual users (concurrent threads)")
    parser.add_argument("--duration", type=int, default=60, help="Duration of the test in seconds")
    parser.add_argument("--token", default=None, help="Optional auth token to send in headers")
    parser.add_argument("--name", default=None, help="Optional name to suffix output report files")
    args = parser.parse_args()

    print("==========================================================")
    print("                saFeConnect Load Testing                  ")
    print("==========================================================")
    print(f"Target URL:       {args.url}")
    print(f"Virtual Users:    {args.users}")
    print(f"Duration:         {args.duration} seconds")
    print("==========================================================")
    
    headers = {}
    if args.token:
        headers["Authorization"] = f"Bearer {args.token}"
        
    print(f"Starting {args.users} concurrent workers...")
    start_time = time.time()
    
    global stop_flag
    stop_flag = False
    
    # Start workers in a thread pool
    with ThreadPoolExecutor(max_workers=args.users) as executor:
        futures = [executor.submit(run_worker, args.url, headers) for _ in range(args.users)]
        
        # Monitor progress
        elapsed = 0
        while elapsed < args.duration:
            time.sleep(1)
            elapsed = int(time.time() - start_time)
            if elapsed % 10 == 0:
                with results_lock:
                    req_count = len(results)
                print(f"Progress: {elapsed}/{args.duration}s elapsed. Sent {req_count} requests so far...")
        
        # Stop workers
        print("Stopping workers and aggregating results...")
        stop_flag = True
        
    actual_duration = time.time() - start_time
    print("All workers stopped.")
    
    # Process results
    with results_lock:
        total_requests = len(results)
        successful_requests = sum(1 for r in results if r["success"])
        failed_requests = total_requests - successful_requests
        latencies = [r["latency_ms"] for r in results]
        
    if total_requests == 0:
        print("Error: No requests were sent.")
        return
        
    avg_latency = sum(latencies) / total_requests
    min_latency = min(latencies)
    max_latency = max(latencies)
    rps = total_requests / actual_duration
    
    # Sort latencies for percentiles if needed
    latencies.sort()
    p95 = latencies[int(len(latencies) * 0.95)]
    p99 = latencies[int(len(latencies) * 0.99)]
    
    report_output = f"""==========================================================
                     LOAD TEST REPORT
==========================================================
Target Endpoint:      {args.url}
Concurrent Users:     {args.users}
Total Time Elapsed:   {actual_duration:.2f} seconds

Total Requests:       {total_requests}
Successful Requests:  {successful_requests} ({(successful_requests/total_requests)*100:.1f}%)
Failed Requests:      {failed_requests} ({(failed_requests/total_requests)*100:.1f}%)

----------------------------------------------------------
Requests per second (RPS)
{rps:.2f} req/sec
Meaning your API is handling about {rps:.1f} requests every second.

----------------------------------------------------------
Response Time
Average: {avg_latency:.1f}ms
Min:     {min_latency:.1f}ms
Max:     {max_latency:.1f}ms
95th Percentile: {p95:.1f}ms
99th Percentile: {p99:.1f}ms
==========================================================
"""

    print(report_output)
    
    # Save text report
    os.makedirs("test_reports", exist_ok=True)
    suffix = f"_{args.name}" if args.name else ""
    report_path_txt = f"test_reports/load_test_report{suffix}.txt"
    with open(report_path_txt, "w") as f:
        f.write(report_output)
    print(f"Saved text report to: {report_path_txt}")
    
    # Save JSON report
    report_path_json = f"test_reports/load_test_report{suffix}.json"
    report_json = {
        "target_url": args.url,
        "concurrent_users": args.users,
        "actual_duration_sec": actual_duration,
        "total_requests": total_requests,
        "successful_requests": successful_requests,
        "failed_requests": failed_requests,
        "rps": rps,
        "response_time_ms": {
            "average": avg_latency,
            "min": min_latency,
            "max": max_latency,
            "p95": p95,
            "p99": p99
        }
    }
    with open(report_path_json, "w") as f:
        json.dump(report_json, f, indent=2)
    print(f"Saved JSON report to: {report_path_json}")

if __name__ == "__main__":
    main()
