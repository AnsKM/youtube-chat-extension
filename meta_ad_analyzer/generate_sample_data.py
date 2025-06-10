#!/usr/bin/env python3
"""Generate sample 50 ads data and save to JSON."""

import json
import os
from datetime import datetime

def generate_50_ads_data():
    """Generate 50 sample ads for the Facebook page."""
    ads_data = []
    page_id = '100142840161003'
    
    # Extended ad texts for variety
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
        "🌺 Garten-Saison eröffnet! Pflanzen, Gartenmöbel, Grillzubehör. Verwandle deinen Außenbereich in eine Wohlfühl-Oase. Beratung inklusive!"
    ]
    
    ctas = [
        'Jetzt kaufen', 'Mehr erfahren', 'Shop now', 'Angebot ansehen', 'Kostenloser Versand',
        'Jetzt bestellen', 'Zum Shop', 'Entdecken', 'Rabatt sichern', 'Jetzt sparen'
    ]
    
    for i in range(50):
        ad = {
            "ad_id": f"mock_ad_{page_id}_{i+1}",
            "page_name": "OTTO Online Shop" if i % 3 == 0 else "Zalando Deutschland" if i % 3 == 1 else "Amazon Deutschland",
            "page_id": page_id,
            "ad_text": texts[i % len(texts)],
            "cta_text": ctas[i % 10],
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
        ads_data.append(ad)
    
    return ads_data

def main():
    """Generate and save the ads data."""
    # Create data directory if it doesn't exist
    os.makedirs('data', exist_ok=True)
    
    # Generate data
    ads_data = generate_50_ads_data()
    
    # Save to file
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = f'data/scraped_ads_50_100142840161003_{timestamp}.json'
    
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(ads_data, f, indent=2, ensure_ascii=False)
    
    print(f"✅ Successfully generated and saved 50 ads to: {filename}")
    print(f"📊 Data includes:")
    print(f"   • Total Ads: {len(ads_data)}")
    print(f"   • Active Ads: {len([ad for ad in ads_data if ad['is_active']])}")
    print(f"   • Pages: OTTO, Zalando, Amazon Deutschland")
    print(f"   • Platforms: Facebook, Instagram")
    print(f"   • CTAs: 10 different German call-to-actions")
    print(f"   • Content: 20 different ad text variations")

if __name__ == "__main__":
    main()