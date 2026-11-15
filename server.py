#!/usr/bin/env python3
"""
PRISMA STREAM - Local Game Server
Zero-dependency, reliable HTTP server built on Python 3 standard library.
Handles correct JavaScript MIME types and port fallback.
"""

import sys
import os
import socket
from http.server import HTTPServer, SimpleHTTPRequestHandler

class PrismaStreamHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        # Prevent aggressive browser caching during development
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def guess_type(self, path):
        # Ensure correct JavaScript module MIME type
        if path.endswith('.js'):
            return 'application/javascript; charset=utf-8'
        elif path.endswith('.css'):
            return 'text/css; charset=utf-8'
        elif path.endswith('.svg'):
            return 'image/svg+xml'
        elif path.endswith('.json'):
            return 'application/json'
        return super().guess_type(path)

def find_available_port(start_port=8000, max_attempts=50):
    for port in range(start_port, start_port + max_attempts):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            try:
                s.bind(('0.0.0.0', port))
                return port
            except OSError:
                continue
    return start_port

def run_server(port=8000):
    # Change working directory to current script directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)

    actual_port = find_available_port(port)
    server_address = ('0.0.0.0', actual_port)

    print("=" * 64)
    print("   PRISMA STREAM: GEOMETRIC DECISION TREE SYNTHESIZER")
    print("   An Interactive Data Science Logic Puzzle Game")
    print("=" * 64)
    print(f"\n[+] Local Server running at: http://127.0.0.1:{actual_port}")
    print(f"[+] Access in your browser:   http://localhost:{actual_port}\n")
    print("[*] Press Ctrl+C in this terminal to shut down the server.")
    print("=" * 64 + "\n")

    httpd = HTTPServer(server_address, PrismaStreamHandler)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n[*] Prisma Stream server safely terminated.")
        httpd.server_close()
        sys.exit(0)

if __name__ == '__main__':
    target_port = 8000
    if len(sys.argv) > 1:
        try:
            target_port = int(sys.argv[1])
        except ValueError:
            target_port = 8000
    run_server(target_port)
