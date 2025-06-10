#!/usr/bin/env python3
"""
Helper script to set APIFY_TOKEN for LinkedIn scraping
"""

import os
import sys
from pathlib import Path

print("🔐 APIFY Token Setup Helper")
print("=" * 40)

# Check current status
current_token = os.getenv('APIFY_TOKEN', '')
if current_token:
    print(f"✅ APIFY_TOKEN is already set: {current_token[:10]}...")
    print("\nYou can run: python scrape_my_linkedin.py")
    sys.exit(0)

print("❌ APIFY_TOKEN not found in environment")
print("\n📋 To set the token, use one of these methods:")
print("\n1. TEMPORARY (current session only):")
print("   export APIFY_TOKEN='your_apify_token_here'")
print("\n2. PERMANENT (.env file):")
print("   echo \"APIFY_TOKEN='your_apify_token_here'\" >> .env")
print("\n3. DIRECT RUN:")
print("   APIFY_TOKEN='your_token' python scrape_my_linkedin.py")

print("\n🔑 Get your token from:")
print("   https://console.apify.com/account#/integrations")

print("\n💡 If you have the token, paste this command with your token:")
print("   export APIFY_TOKEN='apify_api_YOUR_TOKEN_HERE'")
print("   python scrape_my_linkedin.py")