#!/usr/bin/env python3
"""
AI Offer Scraper with Google Sheets Integration
Modified version that reads from Google Sheets instead of CSV
"""

from ai_offer_scraper_webfetch import AIOfferScraperWebFetch
from google_sheets_public_reader import PublicGoogleSheetsReader
from typing import List, Dict


class AIOfferScraperGoogleSheets(AIOfferScraperWebFetch):
    """Extended scraper that reads from Google Sheets"""
    
    def read_offers_from_google_sheets(self, sheet_url: str, gid: str = "0") -> List[Dict]:
        """
        Read offers from Google Sheets instead of CSV
        
        Args:
            sheet_url: Google Sheets URL (must be publicly readable)
            gid: Sheet ID (default "0" for first sheet)
        
        Returns:
            List of offer dictionaries
        """
        return PublicGoogleSheetsReader.read_offers(sheet_url, gid)
    
    def process_google_sheet(self, sheet_url: str, limit: int = None):
        """
        Process offers directly from Google Sheets
        
        Args:
            sheet_url: Google Sheets URL
            limit: Maximum number of offers to process
        """
        print(f"📊 Reading from Google Sheets...")
        offers = self.read_offers_from_google_sheets(sheet_url)
        
        if limit:
            offers = offers[:limit]
            print(f"   Limited to first {limit} offers")
        
        return offers


# Example usage
if __name__ == "__main__":
    # Example: Process offers from Google Sheets
    scraper = AIOfferScraperGoogleSheets()
    
    # Replace with your actual Google Sheets URL
    # sheet_url = "https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit"
    
    print("\nTo use with Google Sheets:")
    print("1. Make your sheet publicly viewable")
    print("2. Run: python ai_offer_scraper_google_sheets.py")
    print("3. Provide your sheet URL when prompted")
    
    # If you have a sheet URL, uncomment and use:
    # offers = scraper.process_google_sheet(sheet_url, limit=3)
    # print(f"Ready to process {len(offers)} offers")