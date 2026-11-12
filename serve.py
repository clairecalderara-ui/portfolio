#!/usr/bin/env python3
"""
Simple local development server for Claire Calderara's Portfolio.
Run: python3 serve.py
Then open http://localhost:8000 in your browser.
"""

import http.server
import socketserver
import webbrowser
import os
import sys

PORT = 8000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        # Enable caching headers and correct MIME types
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()

if __name__ == '__main__':
    os.chdir(DIRECTORY)
    print(f"✨ Lancement du portfolio de Claire Calderara...")
    print(f"📁 Dossier racine : {DIRECTORY}")
    print(f"🌐 Serveur actif sur : http://localhost:{PORT}")
    print(f"Appuyez sur Ctrl+C pour arrêter le serveur.")

    # Try opening the browser automatically
    try:
        webbrowser.open(f"http://localhost:{PORT}")
    except Exception:
        pass

    socketserver.TCPServer.allow_reuse_address = True
    try:
        with socketserver.TCPServer(("", PORT), Handler) as httpd:
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n👋 Serveur arrêté.")
        sys.exit(0)
