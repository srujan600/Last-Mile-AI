import sys
import time
import requests

if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

BASE_URL = "http://127.0.0.1:8000"

def test_endpoints():
    print("[*] Running Upgraded FastAPI Endpoint Verification Tests...")

    # 1. Health check
    t0 = time.time()
    res = requests.get(f"{BASE_URL}/")
    ms = (time.time() - t0) * 1000
    print(f"GET / -> Status: {res.status_code}, Time: {ms:.2f} ms")
    assert res.status_code == 200, "Health check failed"

    # 2. GET /orders
    t0 = time.time()
    res = requests.get(f"{BASE_URL}/orders")
    ms = (time.time() - t0) * 1000
    orders = res.json()
    print(f"GET /orders -> Count: {len(orders)}, Time: {ms:.2f} ms")
    assert res.status_code == 200, "GET /orders failed"
    assert len(orders) > 0, "No orders returned"
    assert ms < 300, f"GET /orders exceeded 300ms limit ({ms:.2f}ms)"

    # Verify risk factors in first order
    first_order = orders[0]
    print(f"   Order #{first_order['order_id']} Risk Factors: {len(first_order['risk_factors'])} XAI factors generated")
    assert "risk_factors" in first_order, "XAI risk_factors missing"

    # 3. POST /predict (Upgraded with 8 features)
    payload = {
        "parcel_weight": 16.5,
        "delivery_window": 2,
        "past_failures": 3,
        "weather": 2,
        "traffic": 2,
        "is_cod": 1,
        "gated_community": 1,
        "customer_response_rate": 0.35,
        "customer_confirmed": False
    }
    t0 = time.time()
    res = requests.post(f"{BASE_URL}/predict", json=payload)
    ms = (time.time() - t0) * 1000
    pred = res.json()
    print(f"POST /predict -> Risk: {pred.get('risk_score')}, Action: {pred.get('recommended_action')}, Time: {ms:.2f} ms")
    assert res.status_code == 200, "POST /predict failed"
    assert ms < 300, f"POST /predict exceeded 300ms limit ({ms:.2f}ms)"

    # 4. POST /reconfirm-customer/ORD-8901
    t0 = time.time()
    res = requests.post(f"{BASE_URL}/reconfirm-customer/ORD-8901")
    ms = (time.time() - t0) * 1000
    reconf = res.json()
    print(f"POST /reconfirm-customer/ORD-8901 -> New Risk: {reconf.get('risk_score')}, Time: {ms:.2f} ms")
    assert res.status_code == 200, "POST /reconfirm-customer failed"

    # 5. POST /simulate-scenario (Monsoon)
    t0 = time.time()
    res = requests.post(f"{BASE_URL}/simulate-scenario", json={"scenario": "monsoon"})
    ms = (time.time() - t0) * 1000
    sim = res.json()
    print(f"POST /simulate-scenario -> Scenario: {sim.get('scenario')}, High Risk Count: {sim.get('high_risk_count')}, Time: {ms:.2f} ms")
    assert res.status_code == 200, "POST /simulate-scenario failed"

    # 6. POST /api/send-whatsapp
    t0 = time.time()
    res = requests.post(f"{BASE_URL}/api/send-whatsapp", json={"order_id": "ORD-8901", "custom_phone": "+919876543210"})
    ms = (time.time() - t0) * 1000
    wa_resp = res.json()
    print(f"POST /api/send-whatsapp -> Status: {wa_resp.get('status')}, SID: {wa_resp.get('message_sid')}, Time: {ms:.2f} ms")
    assert res.status_code == 200, "POST /api/send-whatsapp failed"

    # 7. POST /api/whatsapp-webhook
    t0 = time.time()
    res = requests.post(f"{BASE_URL}/api/whatsapp-webhook", json={"order_id": "ORD-8901", "response_code": "1"})
    ms = (time.time() - t0) * 1000
    webhook_resp = res.json()
    print(f"POST /api/whatsapp-webhook -> Action: {webhook_resp.get('action')}, Time: {ms:.2f} ms")
    assert res.status_code == 200, "POST /api/whatsapp-webhook failed"

    # 8. POST /api/live-weather
    t0 = time.time()
    res = requests.post(f"{BASE_URL}/api/live-weather", json={"lat": 17.4435, "lng": 78.3772})
    ms = (time.time() - t0) * 1000
    weather_resp = res.json()
    print(f"POST /api/live-weather -> Label: {weather_resp.get('weather_label')}, Time: {ms:.2f} ms")
    assert res.status_code == 200, "POST /api/live-weather failed"

    # 9. POST /api/mitigate
    t0 = time.time()
    res = requests.post(f"{BASE_URL}/api/mitigate", json={"auto_apply_all": True})
    ms = (time.time() - t0) * 1000
    mit_resp = res.json()
    print(f"POST /api/mitigate -> Status: {mit_resp.get('status')}, High Risk Drops: {mit_resp.get('original_high_risk_count')} -> {mit_resp.get('new_high_risk_count')}, Time: {ms:.2f} ms")
    assert res.status_code == 200, "POST /api/mitigate failed"

    # 10. GET /api/financial-summary
    t0 = time.time()
    res = requests.get(f"{BASE_URL}/api/financial-summary")
    ms = (time.time() - t0) * 1000
    fin_resp = res.json()
    print(f"GET /api/financial-summary -> RTO Costs Saved: ₹{fin_resp.get('rto_costs_saved_inr')}, Deliveries Preserved: {fin_resp.get('deliveries_preserved')}, Time: {ms:.2f} ms")
    assert res.status_code == 200, "GET /api/financial-summary failed"

    # 11. POST /api/deliveries/ORD-8901/reschedule-recommendation (High Traffic + Rush Hour Test)
    t0 = time.time()
    requests.post(f"{BASE_URL}/simulate-scenario", json={"scenario": "gridlock"})
    res = requests.post(f"{BASE_URL}/api/deliveries/ORD-8901/reschedule-recommendation", json={"w1": 0.45, "w2": 0.35, "w3": 0.20})
    ms = (time.time() - t0) * 1000
    rec_resp = res.json()
    print(f"POST /api/deliveries/ORD-8901/reschedule-recommendation (Gridlock) -> Current: {rec_resp.get('current_scheduled_time')}, Suggested: {rec_resp.get('suggested_time_window')}, Risk Cut: {rec_resp.get('risk_reduction_pct')}%, Time: {ms:.2f} ms")
    assert res.status_code == 200, "Reschedule recommendation API failed"
    assert rec_resp.get("is_high_risk") == True, "Should flag gridlock delivery as high risk"
    assert any(win in rec_resp.get("suggested_time_window") for win in ["10:30 AM", "04:30 PM", "07:00 PM"]), "Should recommend off-peak window (10:30 AM or 04:30 PM)"

    # 12. Severe Weather Alert Reschedule Test Case
    t0 = time.time()
    requests.post(f"{BASE_URL}/simulate-scenario", json={"scenario": "monsoon"})
    res = requests.post(f"{BASE_URL}/api/deliveries/ORD-8901/reschedule-recommendation", json={"w1": 0.35, "w2": 0.50, "w3": 0.15})
    ms = (time.time() - t0) * 1000
    w_rec_resp = res.json()
    print(f"POST /api/deliveries/ORD-8901/reschedule-recommendation (Monsoon) -> Suggested: {w_rec_resp.get('suggested_time_window')}, Notes: {w_rec_resp.get('mitigation_notes')[:70]}..., Time: {ms:.2f} ms")
    assert res.status_code == 200, "Severe weather reschedule recommendation failed"
    assert "Severe weather alert" in w_rec_resp.get("mitigation_notes") or w_rec_resp.get("is_high_risk") == True, "Should detect severe weather alert"

    # 13. POST /api/deliveries/ORD-8901/accept-reschedule Test Case
    t0 = time.time()
    accept_payload = {
        "accepted_time_window": rec_resp.get("suggested_time_window"),
        "accepted_delivery_window_id": rec_resp.get("suggested_delivery_window_id"),
        "notify_customer": True
    }
    res = requests.post(f"{BASE_URL}/api/deliveries/ORD-8901/accept-reschedule", json=accept_payload)
    ms = (time.time() - t0) * 1000
    acc_resp = res.json()
    print(f"POST /api/deliveries/ORD-8901/accept-reschedule -> Status: {acc_resp.get('status')}, Msg: {acc_resp.get('message')}, Time: {ms:.2f} ms")
    assert res.status_code == 200, "Accept reschedule endpoint failed"
    assert acc_resp.get("order", {}).get("delivery_window") == rec_resp.get("suggested_delivery_window_id"), "Order delivery window did not update"

    # Reset scenario
    requests.post(f"{BASE_URL}/simulate-scenario", json={"scenario": "reset"})

    print("\n[+] All Upgraded FastAPI System & High-Risk Reschedule Recommendation Tests Passed Successfully!")

if __name__ == "__main__":
    test_endpoints()

