from http.server import HTTPServer, SimpleHTTPRequestHandler

class COIHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cross-Origin-Opener-Policy", "same-origin")
        self.send_header("Cross-Origin-Embedder-Policy", "require-corp")
        super().end_headers()

PORT = 9000
httpd = HTTPServer(("0.0.0.0", PORT), COIHandler)
print(f"🚀 Server is running: http://localhost:{PORT}")
httpd.serve_forever()
# python3 ./builder/server.py