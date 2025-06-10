#!/usr/bin/env python3
"""
Test script to verify web interface is working
"""

import requests
import json
import time

def test_web_interface():
    """Test the web interface endpoints"""
    base_url = "http://localhost:8001"
    
    print("🌐 Testing YouTube Trend Detector Web Interface")
    print("=" * 50)
    
    try:
        # Test 1: Dashboard page
        print("🏠 Testing Dashboard...")
        response = requests.get(f"{base_url}/")
        if response.status_code == 200 and "YouTube Trend Detector" in response.text:
            print("✅ Dashboard: WORKING")
        else:
            print(f"❌ Dashboard: FAILED ({response.status_code})")
        
        # Test 2: Channels page  
        print("📺 Testing Channels page...")
        response = requests.get(f"{base_url}/channels")
        if response.status_code == 200:
            print("✅ Channels page: WORKING")
        else:
            print(f"❌ Channels page: FAILED ({response.status_code})")
        
        # Test 3: Add channel API
        print("➕ Testing Add Channel API...")
        channel_data = {
            "url": "https://youtube.com/@test",
            "name": "Test API Channel"
        }
        response = requests.post(f"{base_url}/api/channels", json=channel_data)
        if response.status_code == 200:
            result = response.json()
            if result.get("success"):
                print("✅ Add Channel API: WORKING")
            else:
                print(f"❌ Add Channel API: FAILED - {result}")
        else:
            print(f"❌ Add Channel API: FAILED ({response.status_code})")
        
        # Test 4: Update API
        print("🔄 Testing Update API...")
        response = requests.post(f"{base_url}/api/update")
        if response.status_code == 200:
            result = response.json()
            if result.get("success"):
                print(f"✅ Update API: WORKING - {result['message']}")
            else:
                print(f"❌ Update API: FAILED - {result}")
        else:
            print(f"❌ Update API: FAILED ({response.status_code})")
        
        # Test 5: API Documentation
        print("📚 Testing API Docs...")
        response = requests.get(f"{base_url}/docs")
        if response.status_code == 200 and "swagger" in response.text.lower():
            print("✅ API Docs: WORKING")
        else:
            print(f"❌ API Docs: FAILED ({response.status_code})")
        
        print("\n" + "=" * 50)
        print("🎉 Web interface tests completed!")
        print(f"🌐 Visit: {base_url}")
        print(f"📱 Dashboard: {base_url}/")
        print(f"⚙️ Channels: {base_url}/channels") 
        print(f"📖 API Docs: {base_url}/docs")
        
    except requests.exceptions.ConnectionError:
        print("❌ Connection failed! Is the web server running?")
        print("   Start it with: python simple_app.py")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False
    
    return True

if __name__ == "__main__":
    test_web_interface()