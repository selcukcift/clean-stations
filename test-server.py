#!/usr/bin/env python3
"""
Simple HTTP server for testing the CleanStation Sink Configuration Tool
"""
import http.server
import socketserver
import os
import sys

PORT = 8000

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache')
        super().end_headers()

    def translate_path(self, path):
        # Default translation (prepends CWD, which is d:\\Clean-stations)
        translated_path = super().translate_path(path)

        # If the default path doesn't exist, try looking in the 'resources' subdirectory
        if not os.path.exists(translated_path):
            # Remove leading '/' from the original URL path to make it relative for joining
            relative_path_from_url = path.lstrip('/')
            
            # Construct potential path within 'resources' directory
            # os.getcwd() is 'd:\\Clean-stations'
            path_in_resources = os.path.join(os.getcwd(), "resources", relative_path_from_url)
            
            if os.path.exists(path_in_resources):
                # If it exists in 'resources', serve it from there
                return path_in_resources
        
        # Otherwise, return the original translated path (which might lead to a 404 if it doesn't exist)
        return translated_path

def main():
    # Change to the script directory
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
        print(f"Serving CleanStation Sink Configuration Tool at http://localhost:{PORT}/")
        print("Press Ctrl+C to stop the server")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped.")
            sys.exit(0)

if __name__ == "__main__":
    main()