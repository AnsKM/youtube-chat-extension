#!/usr/bin/env python3
"""
LinkedIn Personal Branding - Main Entry Point
Provides a unified interface for all LinkedIn profile analysis tools
"""

import sys
import os
from pathlib import Path

def print_menu():
    """Display the main menu"""
    print("\n🔗 LinkedIn Personal Branding Tools")
    print("=" * 50)
    print("\n1. Scrape LinkedIn Profile (requires APIFY_TOKEN)")
    print("2. View Demo (see what data will be extracted)")
    print("3. Setup Apify Token")
    print("4. View Setup Guide")
    print("5. Exit")
    print("\nYour profile: https://www.linkedin.com/in/anskhalid/")
    
def main():
    """Main program loop"""
    
    while True:
        print_menu()
        
        try:
            choice = input("\nSelect an option (1-5): ").strip()
            
            if choice == '1':
                # Check if token exists
                if os.getenv('APIFY_TOKEN'):
                    print("\n✅ APIFY_TOKEN found, starting scraper...")
                    os.system('python scrape_my_linkedin.py')
                else:
                    print("\n❌ APIFY_TOKEN not found in environment")
                    token = input("Enter your Apify token (or press Enter to skip): ").strip()
                    if token:
                        print(f"\n🚀 Running scraper with provided token...")
                        os.system(f'python scrape_linkedin_with_token.py {token}')
                    else:
                        print("Skipped. Set APIFY_TOKEN environment variable first.")
                        
            elif choice == '2':
                print("\n📊 Running demo to show data structure...")
                os.system('python linkedin_profile_demo.py')
                
            elif choice == '3':
                print("\n🔐 Token setup helper...")
                os.system('python set_apify_token.py')
                
            elif choice == '4':
                print("\n📚 Opening setup guide...")
                setup_file = Path(__file__).parent / 'LINKEDIN_SCRAPER_SETUP.md'
                if setup_file.exists():
                    with open(setup_file, 'r') as f:
                        content = f.read()
                    print(content[:2000] + "\n...\n[Full guide in LINKEDIN_SCRAPER_SETUP.md]")
                else:
                    print("Setup guide not found!")
                    
            elif choice == '5':
                print("\n👋 Goodbye! Ready to build your LinkedIn brand!")
                break
                
            else:
                print("\n⚠️  Invalid option. Please select 1-5.")
                
        except KeyboardInterrupt:
            print("\n\n👋 Interrupted. Goodbye!")
            break
        except Exception as e:
            print(f"\n❌ Error: {str(e)}")
            
        input("\nPress Enter to continue...")

if __name__ == "__main__":
    print("🚀 LinkedIn Personal Branding Toolkit")
    print("Analyze and optimize your LinkedIn presence for 2025")
    main()