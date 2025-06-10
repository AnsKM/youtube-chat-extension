"""
Data Processing and Storage for Meta Ads
Handles saving, loading, and analyzing scraped ad data
"""

import json
import os
import pandas as pd
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Tuple
from collections import Counter
import re


class MetaAdDataProcessor:
    """Process and analyze Meta ad data"""
    
    def __init__(self, data_dir: str = "data"):
        self.data_dir = data_dir
        os.makedirs(data_dir, exist_ok=True)
        
        # File paths
        self.ads_file = os.path.join(data_dir, "ads.json")
        self.pages_file = os.path.join(data_dir, "pages.json")
        self.analytics_file = os.path.join(data_dir, "analytics.json")
        
        # Initialize files if they don't exist
        for file_path in [self.ads_file, self.pages_file, self.analytics_file]:
            if not os.path.exists(file_path):
                with open(file_path, 'w') as f:
                    json.dump([], f)
    
    def save_ads(self, ads: List[Dict], source: str = "unknown") -> Dict:
        """
        Save scraped ads to storage
        
        Args:
            ads: List of ad dictionaries
            source: Source identifier (page URL or search query)
            
        Returns:
            Summary of saved ads
        """
        # Load existing ads
        existing_ads = self._load_json(self.ads_file)
        existing_ids = {ad['ad_id'] for ad in existing_ads if ad.get('ad_id')}
        
        # Process new ads
        new_ads = []
        updated_ads = 0
        
        for ad in ads:
            ad['source'] = source
            ad['last_updated'] = datetime.now().isoformat()
            
            if ad.get('ad_id') in existing_ids:
                # Update existing ad
                for i, existing_ad in enumerate(existing_ads):
                    if existing_ad.get('ad_id') == ad.get('ad_id'):
                        existing_ads[i] = ad
                        updated_ads += 1
                        break
            else:
                # New ad
                new_ads.append(ad)
        
        # Combine and save
        all_ads = existing_ads + new_ads
        self._save_json(self.ads_file, all_ads)
        
        # Update pages data
        self._update_pages_data(ads)
        
        return {
            'total_processed': len(ads),
            'new_ads': len(new_ads),
            'updated_ads': updated_ads,
            'total_ads_stored': len(all_ads)
        }
    
    def get_ads(self, 
                filters: Optional[Dict] = None,
                sort_by: str = 'scraped_at',
                limit: Optional[int] = None) -> List[Dict]:
        """
        Get ads with optional filtering and sorting
        
        Args:
            filters: Dictionary of filters (e.g., {'page_name': 'Nike', 'is_active': True})
            sort_by: Field to sort by
            limit: Maximum number of ads to return
            
        Returns:
            Filtered and sorted list of ads
        """
        ads = self._load_json(self.ads_file)
        
        # Apply filters
        if filters:
            for key, value in filters.items():
                if isinstance(value, list):
                    # Filter by list of values
                    ads = [ad for ad in ads if ad.get(key) in value]
                else:
                    # Filter by single value
                    ads = [ad for ad in ads if ad.get(key) == value]
        
        # Sort
        try:
            ads.sort(key=lambda x: x.get(sort_by, ''), reverse=True)
        except:
            pass
        
        # Limit
        if limit:
            ads = ads[:limit]
        
        return ads
    
    def analyze_ads(self, ads: Optional[List[Dict]] = None) -> Dict:
        """
        Analyze ad data for insights
        
        Args:
            ads: List of ads to analyze (uses all stored ads if None)
            
        Returns:
            Analysis results dictionary
        """
        if ads is None:
            ads = self._load_json(self.ads_file)
        
        if not ads:
            return {'error': 'No ads to analyze'}
        
        analysis = {
            'total_ads': len(ads),
            'active_ads': sum(1 for ad in ads if ad.get('is_active')),
            'unique_pages': len(set(ad.get('page_name', '') for ad in ads)),
            'date_range': self._get_date_range(ads),
            'top_pages': self._get_top_pages(ads, limit=10),
            'cta_distribution': self._get_cta_distribution(ads),
            'platform_distribution': self._get_platform_distribution(ads),
            'keyword_analysis': self._analyze_keywords(ads),
            'temporal_patterns': self._analyze_temporal_patterns(ads),
            'media_analysis': self._analyze_media(ads)
        }
        
        # Save analytics
        self._save_json(self.analytics_file, analysis)
        
        return analysis
    
    def export_to_csv(self, filename: str = None, ads: Optional[List[Dict]] = None):
        """Export ads to CSV file"""
        if ads is None:
            ads = self._load_json(self.ads_file)
        
        if not filename:
            filename = os.path.join(self.data_dir, f"ads_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv")
        
        # Flatten ad data for CSV
        flattened_ads = []
        for ad in ads:
            flat_ad = {
                'ad_id': ad.get('ad_id', ''),
                'page_name': ad.get('page_name', ''),
                'ad_text': ad.get('ad_text', ''),
                'cta_text': ad.get('cta_text', ''),
                'start_date': ad.get('start_date', ''),
                'end_date': ad.get('end_date', ''),
                'is_active': ad.get('is_active', False),
                'platforms': ', '.join(ad.get('platforms', [])),
                'has_video': bool(ad.get('video_url')),
                'num_images': len(ad.get('images', [])),
                'scraped_at': ad.get('scraped_at', '')
            }
            flattened_ads.append(flat_ad)
        
        df = pd.DataFrame(flattened_ads)
        df.to_csv(filename, index=False)
        
        return filename
    
    def _update_pages_data(self, ads: List[Dict]):
        """Update pages data with latest information"""
        pages = self._load_json(self.pages_file)
        page_dict = {p['page_id']: p for p in pages}
        
        for ad in ads:
            page_id = ad.get('page_id')
            if page_id:
                if page_id not in page_dict:
                    page_dict[page_id] = {
                        'page_id': page_id,
                        'page_name': ad.get('page_name', ''),
                        'first_seen': ad.get('scraped_at', ''),
                        'last_seen': ad.get('scraped_at', ''),
                        'total_ads': 0
                    }
                
                # Update page info
                page = page_dict[page_id]
                page['page_name'] = ad.get('page_name', page.get('page_name', ''))
                page['last_seen'] = ad.get('scraped_at', '')
                page['total_ads'] = page.get('total_ads', 0) + 1
        
        self._save_json(self.pages_file, list(page_dict.values()))
    
    def _get_date_range(self, ads: List[Dict]) -> Dict:
        """Get date range of ads"""
        dates = []
        for ad in ads:
            if ad.get('start_date'):
                dates.append(ad['start_date'])
            if ad.get('scraped_at'):
                dates.append(ad['scraped_at'])
        
        if dates:
            return {
                'earliest': min(dates),
                'latest': max(dates)
            }
        return {}
    
    def _get_top_pages(self, ads: List[Dict], limit: int = 10) -> List[Dict]:
        """Get top pages by ad count"""
        page_counts = Counter(ad.get('page_name', 'Unknown') for ad in ads)
        
        return [
            {'page_name': page, 'ad_count': count}
            for page, count in page_counts.most_common(limit)
        ]
    
    def _get_cta_distribution(self, ads: List[Dict]) -> Dict:
        """Analyze CTA button distribution"""
        cta_counts = Counter(ad.get('cta_text', 'No CTA') for ad in ads if ad.get('cta_text'))
        return dict(cta_counts.most_common(20))
    
    def _get_platform_distribution(self, ads: List[Dict]) -> Dict:
        """Analyze platform distribution"""
        platform_counts = Counter()
        for ad in ads:
            for platform in ad.get('platforms', []):
                platform_counts[platform] += 1
        return dict(platform_counts)
    
    def _analyze_keywords(self, ads: List[Dict], top_n: int = 20) -> Dict:
        """Analyze most common keywords in ad text"""
        # Combine all ad text
        all_text = ' '.join(ad.get('ad_text', '') for ad in ads)
        
        # Simple keyword extraction (words > 4 chars)
        words = re.findall(r'\b\w{5,}\b', all_text.lower())
        
        # Filter common words
        stop_words = {'about', 'after', 'being', 'before', 'could', 'every', 'first', 
                     'found', 'great', 'being', 'might', 'never', 'these', 'those',
                     'through', 'under', 'where', 'which', 'while', 'would'}
        
        keywords = [w for w in words if w not in stop_words]
        keyword_counts = Counter(keywords)
        
        return {
            'top_keywords': dict(keyword_counts.most_common(top_n)),
            'total_unique_keywords': len(set(keywords))
        }
    
    def _analyze_temporal_patterns(self, ads: List[Dict]) -> Dict:
        """Analyze when ads are posted"""
        # This is simplified - would need actual date parsing in production
        active_by_month = Counter()
        
        for ad in ads:
            if ad.get('start_date'):
                try:
                    # Extract month from date string
                    month = ad['start_date'][:7]  # YYYY-MM
                    active_by_month[month] += 1
                except:
                    pass
        
        return {
            'ads_by_month': dict(active_by_month.most_common())
        }
    
    def _analyze_media(self, ads: List[Dict]) -> Dict:
        """Analyze media usage in ads"""
        total_ads = len(ads)
        video_ads = sum(1 for ad in ads if ad.get('video_url'))
        image_ads = sum(1 for ad in ads if ad.get('images'))
        
        total_images = sum(len(ad.get('images', [])) for ad in ads)
        
        return {
            'video_ads': video_ads,
            'video_percentage': round(video_ads / total_ads * 100, 1) if total_ads > 0 else 0,
            'image_ads': image_ads,
            'image_percentage': round(image_ads / total_ads * 100, 1) if total_ads > 0 else 0,
            'total_images': total_images,
            'avg_images_per_ad': round(total_images / total_ads, 1) if total_ads > 0 else 0
        }
    
    def _load_json(self, file_path: str) -> List[Dict]:
        """Load JSON data from file"""
        try:
            with open(file_path, 'r') as f:
                return json.load(f)
        except:
            return []
    
    def _save_json(self, file_path: str, data):
        """Save data to JSON file"""
        with open(file_path, 'w') as f:
            json.dump(data, f, indent=2, default=str)


# Example usage
if __name__ == "__main__":
    processor = MetaAdDataProcessor()
    
    # Example: Analyze stored ads
    analysis = processor.analyze_ads()
    print(f"📊 Total ads: {analysis.get('total_ads', 0)}")
    print(f"📊 Active ads: {analysis.get('active_ads', 0)}")
    print(f"📊 Unique pages: {analysis.get('unique_pages', 0)}")