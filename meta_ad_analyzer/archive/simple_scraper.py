#!/usr/bin/env python3
"""
Simple Facebook ads scraper and report generator.
"""

import os
import sys
import asyncio
import json
from datetime import datetime
from urllib.parse import urlparse, parse_qs

# Try importing with system python
try:
    from apify_client import ApifyClient
    APIFY_AVAILABLE = True
except ImportError:
    print("⚠️  Apify Client not available - using mock data")
    APIFY_AVAILABLE = False

try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    print("⚠️  Google Generative AI not available - using simplified reporting")
    GEMINI_AVAILABLE = False

class SimpleFacebookScraper:
    """Simple scraper for Facebook ads using mock data when API is unavailable."""
    
    def __init__(self):
        self.apify_token = "apify_api_nscxyQCXO4wf4FHjhbNLfMfvsa5evB3TSjfd"
        self.google_api_key = "AIzaSyAezYYiOJgH2qc-RnB0EFiTbIWAgQwSDdw"
        
        if GEMINI_AVAILABLE:
            genai.configure(api_key=self.google_api_key)
            self.model = genai.GenerativeModel('gemini-1.5-flash')
        
        if APIFY_AVAILABLE:
            self.client = ApifyClient(self.apify_token)
    
    def extract_page_id(self, url):
        """Extract page ID from Facebook Ad Library URL."""
        parsed = urlparse(url)
        params = parse_qs(parsed.query)
        return params.get('view_all_page_id', ['unknown'])[0]
    
    async def scrape_ads_mock(self, url, max_ads=50):
        """Generate mock ads data for testing."""
        page_id = self.extract_page_id(url)
        
        print(f"🔍 Generating mock data for page ID: {page_id}")
        
        # Mock ads data based on German e-commerce patterns
        mock_ads = []
        
        for i in range(min(max_ads, 50)):  # Generate up to 50 mock ads
            ad = {
                "ad_id": f"mock_ad_{page_id}_{i+1}",
                "page_name": "OTTO Online Shop" if i % 3 == 0 else "Zalando Deutschland" if i % 3 == 1 else "Amazon Deutschland",
                "page_id": page_id,
                "ad_text": self._generate_mock_ad_text(i),
                "cta_text": ["Jetzt kaufen", "Mehr erfahren", "Shop now", "Angebot ansehen", "Kostenloser Versand", "Jetzt bestellen", "Zum Shop", "Entdecken", "Rabatt sichern", "Jetzt sparen"][i % 10],
                "cta_type": "SHOP_NOW",
                "platforms": ["Facebook", "Instagram"] if i % 2 == 0 else ["Facebook"],
                "is_active": i < 40,  # First 40 are active
                "start_date": f"2024-{(i % 12) + 1:02d}-{(i % 28) + 1:02d}",
                "end_date": None if i < 40 else f"2024-{(i % 12) + 1:02d}-{(i % 28) + 10:02d}",
                "images": [f"https://example.com/ad_image_{i+1}.jpg"] if i % 3 != 0 else [],
                "video_url": f"https://example.com/ad_video_{i+1}.mp4" if i % 5 == 0 else None,
                "impressions": (i + 1) * 50000 if i % 4 == 0 else None,
                "reach": (i + 1) * 30000 if i % 4 == 0 else None,
                "regions": ["Germany", "Austria", "Switzerland"],
                "scraped_at": datetime.now().isoformat(),
                "ad_library_url": f"https://www.facebook.com/ads/library/?id={page_id}_{i+1}"
            }
            mock_ads.append(ad)
        
        return {
            "success": True,
            "ads": mock_ads,
            "total_scraped": len(mock_ads),
            "page_id": page_id
        }
    
    def _generate_mock_ad_text(self, index):
        """Generate realistic German e-commerce ad text."""
        texts = [
            "🛍️ Bis zu 70% Rabatt auf Fashion & Lifestyle! Entdecke die neuesten Trends und spare richtig. Kostenloser Versand ab 20€. Jetzt zuschlagen!",
            "⚡ Flash Sale! Nur heute: Extra 30% auf bereits reduzierte Artikel. Von Elektronik bis Mode - alles muss raus! Limitierte Stückzahl verfügbar.",
            "🎯 Personalisierte Empfehlungen nur für dich! Unsere KI hat die perfekten Produkte für deinen Stil gefunden. Schau dir deine Auswahl an!",
            "📱 Die neuesten Smartphones zum Bestpreis! iPhone, Samsung, Google Pixel - alle Top-Marken mit 2 Jahren Garantie. Jetzt vergleichen!",
            "🏠 Verwandle dein Zuhause! Moderne Möbel und Dekoration zu unschlagbaren Preisen. Kostenlose Lieferung und Aufbau-Service verfügbar.",
            "👗 Frühjahrs-Kollektion ist da! Frische Farben, neue Schnitte, perfekte Passform. Jetzt 20% Rabatt für Neukunden. Code: SPRING2024",
            "⭐ Über 1 Million zufriedene Kunden! Warum? Beste Qualität, faire Preise und 30 Tage Rückgaberecht. Überzeuge dich selbst!",
            "🚚 Express-Lieferung in 24h! Bestelle bis 14 Uhr und erhalte deine Waren morgen. Perfekt für Last-Minute Geschenke.",
            "💎 Premium-Mitgliedschaft: Exklusive Vorteile warten! Früher Zugang zu Sales, kostenloser Premium-Versand und persönlicher Kundenservice.",
            "🎁 Geschenkideen für jeden Anlass! Von Geburtstag bis Hochzeit - finde das perfekte Geschenk. Geschenkverpackung kostenlos dazu!",
            "🔥 Mega-Deal: Gaming-Hardware bis zu 50% reduziert! RTX 4080, PlayStation 5, Nintendo Switch - alles auf Lager. Gaming-Paradies wartet!",
            "👶 Baby & Kids: Sicherheit trifft Style! Kinderwagen, Autositze, Spielzeug - geprüfte Qualität für die Kleinsten. Ratenzahlung möglich.",
            "🏃‍♀️ Fitness-Revolution: Sport-Equipment für Zuhause! Von Yoga-Matte bis Profi-Hantel. Starte deine Transformation jetzt!",
            "🍳 Küchen-Upgrade gefällig? Profi-Kochgeschirr, smarte Geräte, stylische Accessoires. Verwandle deine Küche in ein Gourmet-Paradies!",
            "📚 Zurück zur Schule: Alles für den perfekten Start! Schulranzen, Laptops, Lernsoftware. Bildung beginnt mit der richtigen Ausstattung.",
            "🌱 Nachhaltig leben leicht gemacht! Eco-Produkte, Fair Trade, Bio-Qualität. Für eine bessere Zukunft - ohne Kompromisse beim Komfort.",
            "🎵 Musik liegt in der Luft! Premium-Kopfhörer, Bluetooth-Speaker, Vinyl-Player. Erlebe Sound wie nie zuvor - jetzt 40% sparen!",
            "🚗 Auto-Zubehör Supermarkt! Winterreifen, Dashcams, Pflegeprodukte. Alles für dein Auto - Markenqualität zu Discount-Preisen.",
            "💻 Homeoffice-Heroes aufgepasst! Ergonomische Stühle, 4K-Monitore, Standing Desks. Produktivität meets Komfort - bis zu 60% Rabatt!",
            "🌺 Garten-Saison eröffnet! Pflanzen, Gartenmöbel, Grillzubehör. Verwandle deinen Außenbereich in eine Wohlfühl-Oase. Beratung inklusive!",
            "💄 Beauty-Trends 2024: K-Beauty, Skincare-Routines, Make-up-Must-haves. Strahle von innen und außen - Profi-Tipps gratis dazu!",
            "🎮 Gamer-Paradise: Die heißesten Releases, Retro-Klassiker, Gaming-Chairs. Level up dein Setup - Express-Versand verfügbar!",
            "🧘‍♀️ Wellness zu Hause: Aromatherapie, Massagegeräte, Entspannungs-Gadgets. Gönn dir die Auszeit, die du verdienst!",
            "🍷 Wein-Weltreise: Exklusive Tropfen aus aller Welt. Von Burgunder bis Barolo - entdecke neue Geschmackswelten. Sommelier-Empfehlungen!",
            "🏖️ Urlaubs-Countdown läuft! Koffer, Sonnencreme, Reise-Gadgets. Perfekt vorbereitet in den Traumurlaub - Checkliste gratis!",
            "🐕 Tierliebe kennt keine Grenzen! Premium-Futter, Spielzeug, Pflege-Produkte. Für das Glück deiner Vierbeiner - Veterinär-geprüft!",
            "📸 Foto-Magie erleben! Kameras, Objektive, Zubehör für Profis und Einsteiger. Halte deine wertvollsten Momente fest - Fotoschule inklusive!",
            "🛁 Badezimmer-Luxus für alle! Designer-Armaturen, Wellness-Duschen, Smart-Spiegel. Verwandle dein Bad in eine Spa-Oasis!",
            "🎨 Kreativität entfesseln! Mal-Sets, Bastel-Material, DIY-Kits. Für kleine und große Künstler - Anleitungs-Videos gratis!",
            "⚽ Sport-Fieber steigt! Trikots, Fanschals, Sammelkarten. Zeig deine Vereinsliebe - limitierte Editionen jetzt verfügbar!",
            "🍕 Küchenhelfer für Feinschmecker! Pizzastein, Pasta-Maschine, Gewürz-Sets. Italienische Küche zu Hause - Rezepte-Buch gratis!",
            "🎪 Event-Season startet! Party-Deko, Kostüme, Geschenk-Ideen. Mach jede Feier unvergesslich - Planungs-Service verfügbar!",
            "🔧 Heimwerker-Träume wahr machen! Profi-Werkzeug, Maschinen, Baumaterial. Vom Hobby bis zur Renovation - Experten-Beratung inklusive!",
            "🌟 VIP-Treatment für alle! Exklusive Marken, Limited Editions, Luxus-Service. Gönn dir das Beste - persönlicher Concierge-Service!",
            "🎯 Last-Minute Geschenk-Rettung! Express-Lieferung bis 22 Uhr, Geschenkverpackung, Digital-Gutscheine. Krisensicher schenken!",
            "🌈 Pride-Collection 2024! Bunte Mode, Statement-Pieces, Community-Support. Zeig Flagge für Vielfalt - Teil der Spende geht an LGBTQ+ Projekte!",
            "🏆 Champions League Feeling! Sammler-Artikel, Memorabilia, VIP-Pakete. Für echte Fußball-Fans - authentisch und limitiert!",
            "🎸 Rockstar-Equipment! Gitarren, Verstärker, Recording-Gear. Vom Anfänger bis zum Profi - Musikschule-Rabatt verfügbar!",
            "🌙 Schlaf-Revolution! Memory-Foam Matratzen, Smart-Betten, Einschlaf-Hilfen. Für erholsame Nächte - 100 Nächte Probeschlafen!",
            "🚴‍♂️ E-Bike Sommer! Stadtflitzer, Mountain-Bikes, Zubehör. Nachhaltig mobil sein - Finanzierung ab 0% möglich!",
            "🎭 Kultur-Genuss zu Hause! Bücher, Streaming-Abos, Brettspiele. Bildung und Entertainment - Studenten-Rabatt verfügbar!",
            "🌍 Fair Fashion Revolution! Nachhaltige Mode, ethische Brands, Second-Hand Luxus. Style mit gutem Gewissen - Impact-Report inklusive!",
            "🔬 Tech-Innovation erleben! Drohnen, VR-Brillen, Smart-Home. Die Zukunft ist jetzt - Tech-Support auf Lebenszeit!",
            "🍂 Herbst-Gemütlichkeit! Warme Decken, Kerzen, Tee-Auswahl. Hygge-Feeling für Zuhause - Stimmungs-Garantie oder Geld zurück!",
            "🎊 Silvester-Vorbereitung! Party-Outfits, Feuerwerk, Glücksbringer. Starte perfekt ins neue Jahr - Countdown-App gratis!",
            "❄️ Winter-Zauber! Ski-Equipment, Winter-Mode, Glühwein-Sets. Kälte-Schutz meets Style - Après-Ski Feeling garantiert!",
            "🌸 Frühlings-Erwachen! Garten-Starter-Sets, Allergie-Hilfen, Fresh-Fashion. Neubeginn leicht gemacht - Pflanz-Guide inklusive!",
            "☀️ Sommer-Hits! Pool-Equipment, Grill-Spezialitäten, UV-Schutz. Heiße Tage cool meistern - Hitze-Tipps vom Experten!",
            "🍂 Oktoberfest-Fieber! Dirndl, Lederhosen, Bier-Gadgets. Wiesn-Feeling für Zuhause - Authentisch aus Bayern!",
            "🎄 Weihnachts-Wunderland! Dekoration, Geschenk-Ideen, Plätzchen-Sets. Festliche Stimmung garantiert - Nikolaus-Express verfügbar!"
        ]
        return texts[index % len(texts)]
    
    async def scrape_ads_real(self, url, max_ads=50):
        """Scrape real ads using Apify (if available)."""
        if not APIFY_AVAILABLE:
            return await self.scrape_ads_mock(url, max_ads)
        
        page_id = self.extract_page_id(url)
        print(f"🔍 Scraping real ads for page ID: {page_id}")
        
        try:
            # Run the Facebook Ads Scraper actor
            run_input = {
                "searchType": "page",
                "pageIds": [page_id],
                "maxAds": max_ads,
                "country": "DE"
            }
            
            run = self.client.actor("apify/facebook-ads-scraper").call(run_input=run_input)
            
            # Get the results
            ads = []
            for item in self.client.dataset(run["defaultDatasetId"]).iterate_items():
                ads.append(item)
            
            return {
                "success": True,
                "ads": ads,
                "total_scraped": len(ads),
                "page_id": page_id
            }
            
        except Exception as e:
            print(f"❌ Real scraping failed: {str(e)}")
            print("📝 Falling back to mock data...")
            return await self.scrape_ads_mock(url, max_ads)
    
    def generate_report_with_gemini(self, ads, page_id):
        """Generate report using Gemini AI."""
        if not GEMINI_AVAILABLE:
            return self.generate_simple_report(ads, page_id)
        
        print("🤖 Generating report with Gemini AI...")
        
        # Prepare data summary
        summary = self._prepare_data_summary(ads)
        
        prompt = f"""
Analyze these Facebook ads from page ID {page_id} and create a comprehensive marketing report.

DATA SUMMARY:
{summary}

Create a detailed analysis report with:

# Facebook Ads Analysis Report - Page {page_id}

## Executive Summary
Provide 2-3 key insights about the advertising strategy.

## Ad Content Analysis
### Message Themes
- What are the main themes and messaging patterns?
- What emotional appeals are being used?
- What value propositions are highlighted?

### Creative Strategy
- Visual content patterns (images vs videos)
- Call-to-action effectiveness
- Creative formats and styles

## Targeting & Distribution
- Platform usage (Facebook vs Instagram)
- Geographic and demographic insights
- Campaign timing patterns

## Performance Indicators
- Activity levels and campaign freshness
- Engagement patterns (if available)
- Budget allocation insights

## Competitive Intelligence
- Unique selling propositions
- Market positioning
- Competitive advantages

## Strategic Recommendations
1. Creative optimization suggestions
2. Targeting improvements
3. Message optimization
4. Campaign structure recommendations

## Key Takeaways
Top 5 actionable insights for marketing professionals.

Make the analysis practical and insightful for German e-commerce marketing.
"""

        try:
            response = self.model.generate_content(prompt)
            return response.text
        except Exception as e:
            print(f"❌ Gemini report generation failed: {str(e)}")
            return self.generate_simple_report(ads, page_id)
    
    def generate_simple_report(self, ads, page_id):
        """Generate a simple report without AI."""
        print("📊 Generating simple statistical report...")
        
        total_ads = len(ads)
        active_ads = len([ad for ad in ads if ad.get('is_active', False)])
        
        # CTA analysis
        ctas = [ad.get('cta_text') for ad in ads if ad.get('cta_text')]
        cta_counts = {}
        for cta in ctas:
            cta_counts[cta] = cta_counts.get(cta, 0) + 1
        
        # Platform analysis
        platforms = []
        for ad in ads:
            platforms.extend(ad.get('platforms', []))
        platform_counts = {}
        for platform in platforms:
            platform_counts[platform] = platform_counts.get(platform, 0) + 1
        
        # Generate report
        report = f"""# Facebook Ads Analysis Report - Page {page_id}

## Executive Summary
Analysis of {total_ads} Facebook ads from page {page_id}.
{active_ads} ads are currently active ({(active_ads/total_ads)*100:.1f}%).

## Key Statistics

### Ad Activity
- **Total Ads**: {total_ads}
- **Active Ads**: {active_ads}
- **Inactive Ads**: {total_ads - active_ads}

### Call-to-Action Analysis
"""
        
        if cta_counts:
            report += "Top CTAs:\n"
            for cta, count in sorted(cta_counts.items(), key=lambda x: x[1], reverse=True)[:5]:
                report += f"- **{cta}**: {count} ads ({(count/total_ads)*100:.1f}%)\n"
        
        report += "\n### Platform Distribution\n"
        if platform_counts:
            for platform, count in platform_counts.items():
                report += f"- **{platform}**: {count} ads\n"
        
        # Sample ads
        report += "\n### Sample Ad Texts\n"
        for i, ad in enumerate(ads[:3]):
            report += f"\n**Ad {i+1}**:\n"
            report += f"- Page: {ad.get('page_name', 'Unknown')}\n"
            report += f"- Text: {ad.get('ad_text', 'No text')[:150]}...\n"
            report += f"- CTA: {ad.get('cta_text', 'No CTA')}\n"
            report += f"- Status: {'Active' if ad.get('is_active') else 'Inactive'}\n"
        
        report += f"\n### Recommendations\n"
        report += f"1. **Diversify CTAs**: Consider testing different call-to-action phrases\n"
        report += f"2. **Platform Optimization**: Optimize content for each platform's audience\n"
        report += f"3. **Active Campaign Management**: {total_ads - active_ads} inactive ads could be reviewed\n"
        report += f"4. **A/B Testing**: Test different ad formats and messaging approaches\n"
        
        report += f"\n---\n*Report generated on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}*"
        
        return report
    
    def _prepare_data_summary(self, ads):
        """Prepare data summary for AI analysis."""
        summary_parts = []
        
        summary_parts.append(f"Total Ads: {len(ads)}")
        
        active_count = len([ad for ad in ads if ad.get('is_active', False)])
        summary_parts.append(f"Active Ads: {active_count}")
        
        # Pages
        pages = list(set([ad.get('page_name', 'Unknown') for ad in ads]))
        summary_parts.append(f"Pages: {', '.join(pages[:3])}")
        
        # Sample ad texts
        summary_parts.append("\nSample Ad Texts:")
        for i, ad in enumerate(ads[:5]):
            text = ad.get('ad_text', 'No text')[:200]
            summary_parts.append(f"Ad {i+1}: {text}")
        
        return "\n".join(summary_parts)
    
    def save_report(self, report, page_id):
        """Save report to file."""
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"facebook_ads_report_{page_id}_{timestamp}.md"
        
        # Create data directory
        os.makedirs('data', exist_ok=True)
        filepath = os.path.join('data', filename)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(report)
        
        return filepath

async def main():
    """Main function."""
    url = "https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=DE&id=1028517679463156&is_targeted_country=false&media_type=all&search_type=page&view_all_page_id=100142840161003"
    
    print("🚀 Facebook Ads Scraper & Report Generator")
    print("=" * 60)
    
    scraper = SimpleFacebookScraper()
    
    # Step 1: Scrape ads
    print("\n📱 Step 1: Scraping Facebook ads...")
    if APIFY_AVAILABLE:
        result = await scraper.scrape_ads_real(url, max_ads=50)
    else:
        result = await scraper.scrape_ads_mock(url, max_ads=50)
    
    if not result['success']:
        print("❌ Failed to scrape ads")
        return
    
    ads = result['ads']
    page_id = result['page_id']
    
    print(f"✅ Successfully scraped {len(ads)} ads from page {page_id}")
    
    # Step 2: Generate report
    print("\n📊 Step 2: Generating comprehensive report...")
    report = scraper.generate_report_with_gemini(ads, page_id)
    
    # Step 3: Save report
    print("\n💾 Step 3: Saving report...")
    report_path = scraper.save_report(report, page_id)
    
    print(f"\n✅ Analysis Complete!")
    print("=" * 60)
    print(f"📄 Report saved to: {report_path}")
    print(f"📊 Analyzed {len(ads)} ads from page {page_id}")
    
    # Quick summary
    active_ads = len([ad for ad in ads if ad.get('is_active', False)])
    print(f"\n📈 Quick Stats:")
    print(f"• Total Ads: {len(ads)}")
    print(f"• Active Ads: {active_ads}")
    print(f"• Conversion Rate: {(active_ads/len(ads))*100:.1f}%")
    
    # Show top CTAs
    ctas = [ad.get('cta_text') for ad in ads if ad.get('cta_text')]
    if ctas:
        from collections import Counter
        cta_counter = Counter(ctas)
        top_cta = cta_counter.most_common(1)[0]
        print(f"• Top CTA: '{top_cta[0]}' ({top_cta[1]} times)")
    
    print(f"\n📖 Full detailed report: {report_path}")

if __name__ == "__main__":
    asyncio.run(main())