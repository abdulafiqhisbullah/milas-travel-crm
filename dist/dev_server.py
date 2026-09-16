import json
import os
import tempfile
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent
STATE_FILE = ROOT / "data" / "crm-state.json"
DEFAULT_STATE = {
    "suppliers": [
        {"id": "SUP-001", "name": "Greenview Travel & Tours", "type": "Tour", "contact": "Mr. Rahman", "coverage": "Kinabatangan", "bookings": "8", "status": "Active", "code": "", "email": "", "notes": ""},
        {"id": "SUP-002", "name": "Sabah Transfer Co.", "type": "Transport", "contact": "+60 13-555 0192", "coverage": "Sabah", "bookings": "12", "status": "Active", "code": "", "email": "", "notes": ""},
        {"id": "SUP-003", "name": "Borneo Guide Network", "type": "Tour Guide", "contact": "hello@bguides.my", "coverage": "East Sabah", "bookings": "5", "status": "Active", "code": "", "email": "", "notes": ""},
        {"id": "SUP-004", "name": "STWA", "type": "Tour", "contact": "60172220447", "coverage": "sandakan", "bookings": "0", "status": "Active", "code": "", "email": "test@gmail.com", "notes": ""},
    ],
    "bookings": [
        {"status": "ON GOING", "name": "Sepilok Orangutan, Sun Bear & City Tour [Share Tour]", "bookingDate": "12/11/25", "startDate": "2 days ago", "assignee": "Farzana Milas Travel", "channel": "GYG", "supplier": "Pending", "type": "Day Tour", "customer": "", "package": "Sepilok", "adult": "", "children": "", "sales": "", "payment": "Paid", "email": "", "orderId": "GYG83XRZAA7N", "proof": "Attached", "invoice": "Attached", "commission": "7.32"},
        {"status": "CONFIRMED", "name": "2D1N Turtle Island (Fullboard)", "bookingDate": "1/29/26", "startDate": "Tomorrow", "assignee": "Azra", "channel": "Viator", "supplier": "Confirm", "type": "Multi Day", "customer": "", "package": "Turtle Island", "adult": "2", "children": "0", "sales": "RM 2,900", "payment": "Deposit paid", "email": "", "orderId": "MIL-260929-001", "proof": "Attached", "invoice": "Attached", "commission": "5%"},
        {"status": "CONFIRMED", "name": "Semporna Island Hopping [Package A]", "bookingDate": "12/19/25", "startDate": "9/23/26", "assignee": "Farzana Milas Travel", "channel": "GYG", "supplier": "Pending", "type": "Day Tour", "customer": "", "package": "Semporna", "adult": "2", "children": "0", "sales": "RM 2,240", "payment": "Deposit paid", "email": "", "orderId": "MIL-260923-002", "proof": "Attached", "invoice": "Attached", "commission": "5%"},
        {"status": "COMPLETE", "name": "Completed Kinabatangan River Tour", "bookingDate": "08/09/26", "startDate": "Completed", "assignee": "Sarah Ahmad", "channel": "Website", "supplier": "Confirm", "type": "Multi Day", "customer": "Sarah Lim", "package": "Kinabatangan", "adult": "2", "children": "0", "sales": "RM 3,640", "payment": "Paid", "email": "sarah@example.com", "orderId": "MIL-260908-002", "proof": "Attached", "invoice": "Attached", "commission": "5%"},
        {"status": "CANCEL", "name": "Cancelled Mabul Island Booking", "bookingDate": "02/09/26", "startDate": "Cancelled", "assignee": "Afiq Milas", "channel": "OTA", "supplier": "Pending", "type": "Day Tour", "customer": "Daniel Wong", "package": "Mabul Island", "adult": "2", "children": "0", "sales": "RM 2,240", "payment": "Refunded", "email": "daniel@example.com", "orderId": "MIL-260902-004", "proof": "Attached", "invoice": "Attached", "commission": "—"},
    ],
}


def ensure_state_file():
    STATE_FILE.parent.mkdir(exist_ok=True)
    if not STATE_FILE.exists():
        STATE_FILE.write_text(json.dumps(DEFAULT_STATE, ensure_ascii=False, indent=2), encoding="utf-8")


def read_state():
    ensure_state_file()
    try:
        state = json.loads(STATE_FILE.read_text(encoding="utf-8"))
        return {"suppliers": state.get("suppliers", []), "bookings": state.get("bookings", [])}
    except (OSError, ValueError, TypeError):
        return DEFAULT_STATE


def write_state(state):
    STATE_FILE.parent.mkdir(exist_ok=True)
    fd, temp_name = tempfile.mkstemp(prefix="crm-state-", suffix=".json", dir=STATE_FILE.parent)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as handle:
            json.dump(state, handle, ensure_ascii=False, indent=2)
        os.replace(temp_name, STATE_FILE)
    finally:
        if os.path.exists(temp_name):
            os.unlink(temp_name)


class CRMHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def do_GET(self):
        if self.path.split("?", 1)[0] == "/api/state":
            payload = json.dumps(read_state(), ensure_ascii=False).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)
            return
        super().do_GET()

    def do_PUT(self):
        if self.path.split("?", 1)[0] != "/api/state":
            self.send_error(404)
            return
        try:
            size = int(self.headers.get("Content-Length", "0"))
            payload = json.loads(self.rfile.read(size).decode("utf-8"))
            state = {"suppliers": payload.get("suppliers", []), "bookings": payload.get("bookings", [])}
            if not isinstance(state["suppliers"], list) or not isinstance(state["bookings"], list):
                raise ValueError("collections must be arrays")
            write_state(state)
            self.send_response(204)
            self.end_headers()
        except (ValueError, TypeError, OSError, json.JSONDecodeError):
            self.send_error(400, "Invalid CRM state")


if __name__ == "__main__":
    ensure_state_file()
    ThreadingHTTPServer(("127.0.0.1", 4173), CRMHandler).serve_forever()
