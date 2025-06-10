"""
ML-based Viral Content Prediction for YouTube Trend Detector
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Tuple
import re
import pickle
import os
from dataclasses import dataclass
from sklearn.ensemble import RandomForestRegressor, GradientBoostingClassifier
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, classification_report
import joblib


@dataclass
class PredictionResult:
    """Result of viral prediction"""
    video_id: str
    predicted_views: int
    viral_probability: float
    confidence_score: float
    key_factors: List[str]
    recommendation: str


class ViralContentPredictor:
    """ML-based predictor for viral YouTube content"""
    
    def __init__(self, model_dir: str = "models"):
        self.model_dir = model_dir
        self.views_model = None
        self.viral_model = None
        self.text_vectorizer = None
        self.feature_scaler = None
        self.is_trained = False
        
        # Create models directory
        os.makedirs(model_dir, exist_ok=True)
        
        # Load existing models if available
        self._load_models()
    
    def extract_text_features(self, text: str) -> Dict[str, float]:
        """Extract features from video title and description"""
        if not text:
            text = ""
        
        text = text.lower()
        
        # Basic text metrics
        features = {
            'text_length': len(text),
            'word_count': len(text.split()),
            'exclamation_count': text.count('!'),
            'question_count': text.count('?'),
            'caps_ratio': sum(1 for c in text if c.isupper()) / max(len(text), 1),
            'number_count': len(re.findall(r'\d+', text))
        }
        
        # Viral keywords (based on common trending patterns)
        viral_keywords = [
            'viral', 'trending', 'shocking', 'amazing', 'incredible', 'unbelievable',
            'must see', 'breaking', 'exclusive', 'secret', 'exposed', 'revealed',
            'reaction', 'challenge', 'vs', 'ultimate', 'epic', 'insane',
            'you wont believe', 'this will', 'what happens', 'goes wrong'
        ]
        
        features['viral_keywords'] = sum(1 for keyword in viral_keywords if keyword in text)
        
        # Emotional words
        emotional_words = [
            'love', 'hate', 'amazing', 'terrible', 'awesome', 'horrible',
            'fantastic', 'awful', 'incredible', 'shocking', 'beautiful', 'ugly'
        ]
        
        features['emotional_words'] = sum(1 for word in emotional_words if word in text)
        
        # Title patterns
        features['has_numbers'] = 1 if re.search(r'\d+', text) else 0
        features['has_brackets'] = 1 if '[' in text or '(' in text else 0
        features['starts_with_how'] = 1 if text.strip().startswith('how') else 0
        features['starts_with_why'] = 1 if text.strip().startswith('why') else 0
        features['starts_with_what'] = 1 if text.strip().startswith('what') else 0
        
        return features
    
    def extract_temporal_features(self, published_at: datetime) -> Dict[str, float]:
        """Extract time-based features"""
        now = datetime.utcnow()
        
        features = {
            'days_since_publish': (now - published_at).days,
            'hour_of_day': published_at.hour,
            'day_of_week': published_at.weekday(),
            'is_weekend': 1 if published_at.weekday() >= 5 else 0,
            'is_evening': 1 if 18 <= published_at.hour <= 22 else 0,
            'is_prime_time': 1 if 19 <= published_at.hour <= 21 else 0
        }
        
        return features
    
    def extract_channel_features(self, channel_data: Dict) -> Dict[str, float]:
        """Extract channel-specific features"""
        features = {
            'subscriber_count': channel_data.get('subscriber_count', 0),
            'video_count': channel_data.get('video_count', 0),
            'channel_age_days': channel_data.get('channel_age_days', 0),
            'avg_views_per_video': channel_data.get('avg_views', 0),
            'upload_frequency': channel_data.get('upload_frequency', 0)  # videos per week
        }
        
        return features
    
    def create_feature_vector(self, video_data: Dict) -> np.ndarray:
        """Create complete feature vector for a video"""
        features = {}
        
        # Text features
        title_text = video_data.get('title', '') + ' ' + video_data.get('description', '')
        features.update(self.extract_text_features(title_text))
        
        # Temporal features
        if 'published_at' in video_data:
            features.update(self.extract_temporal_features(video_data['published_at']))
        
        # Channel features
        if 'channel_data' in video_data:
            features.update(self.extract_channel_features(video_data['channel_data']))
        
        # Video-specific features
        features.update({
            'duration_seconds': video_data.get('duration_seconds', 0),
            'is_shorts': 1 if video_data.get('duration_seconds', 0) <= 60 else 0,
            'has_thumbnail': 1 if video_data.get('thumbnail_url') else 0
        })
        
        # Convert to sorted array for consistency
        feature_names = sorted(features.keys())
        return np.array([features[name] for name in feature_names])
    
    def prepare_training_data(self, videos_data: List[Dict]) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        """Prepare training data from historical videos"""
        X = []
        y_views = []
        y_viral = []
        
        for video in videos_data:
            if 'views' not in video:
                continue
                
            # Create feature vector
            features = self.create_feature_vector(video)
            X.append(features)
            
            # Target variables
            views = video['views']
            y_views.append(views)
            
            # Define viral threshold (e.g., 10x channel average or 100k+ views)
            channel_avg = video.get('channel_data', {}).get('avg_views', 10000)
            viral_threshold = max(channel_avg * 10, 100000)
            y_viral.append(1 if views >= viral_threshold else 0)
        
        return np.array(X), np.array(y_views), np.array(y_viral)
    
    def train_models(self, videos_data: List[Dict]) -> Dict[str, float]:
        """Train ML models on historical data"""
        print("🧠 Training viral prediction models...")
        
        # Prepare data
        X, y_views, y_viral = self.prepare_training_data(videos_data)
        
        if len(X) < 10:
            raise ValueError("Need at least 10 videos for training")
        
        # Split data
        X_train, X_test, y_views_train, y_views_test, y_viral_train, y_viral_test = train_test_split(
            X, y_views, y_viral, test_size=0.2, random_state=42
        )
        
        # Scale features
        self.feature_scaler = StandardScaler()
        X_train_scaled = self.feature_scaler.fit_transform(X_train)
        X_test_scaled = self.feature_scaler.transform(X_test)
        
        # Train views prediction model (regression)
        self.views_model = RandomForestRegressor(
            n_estimators=100,
            max_depth=10,
            random_state=42
        )
        self.views_model.fit(X_train_scaled, y_views_train)
        
        # Train viral classification model
        self.viral_model = GradientBoostingClassifier(
            n_estimators=100,
            max_depth=6,
            random_state=42
        )
        self.viral_model.fit(X_train_scaled, y_viral_train)
        
        # Evaluate models
        views_pred = self.views_model.predict(X_test_scaled)
        viral_pred = self.viral_model.predict(X_test_scaled)
        viral_proba = self.viral_model.predict_proba(X_test_scaled)[:, 1]
        
        # Calculate metrics
        views_rmse = np.sqrt(mean_squared_error(y_views_test, views_pred))
        viral_accuracy = np.mean(y_viral_test == viral_pred)
        
        metrics = {
            'views_rmse': views_rmse,
            'viral_accuracy': viral_accuracy,
            'training_samples': len(X_train),
            'test_samples': len(X_test)
        }
        
        self.is_trained = True
        self._save_models()
        
        print(f"✅ Models trained successfully!")
        print(f"📊 Views RMSE: {views_rmse:,.0f}")
        print(f"🎯 Viral Accuracy: {viral_accuracy:.2%}")
        
        return metrics
    
    def predict_viral_potential(self, video_data: Dict) -> PredictionResult:
        """Predict viral potential for a single video"""
        if not self.is_trained:
            raise ValueError("Models not trained. Call train_models() first.")
        
        # Create feature vector
        features = self.create_feature_vector(video_data).reshape(1, -1)
        features_scaled = self.feature_scaler.transform(features)
        
        # Make predictions
        predicted_views = int(self.views_model.predict(features_scaled)[0])
        viral_probability = self.viral_model.predict_proba(features_scaled)[0, 1]
        
        # Calculate confidence (based on tree variance in Random Forest)
        views_predictions = [tree.predict(features_scaled)[0] for tree in self.views_model.estimators_]
        confidence_score = 1.0 - (np.std(views_predictions) / np.mean(views_predictions))
        confidence_score = max(0.0, min(1.0, confidence_score))
        
        # Get feature importance for key factors
        feature_importance = self.views_model.feature_importances_
        top_features_idx = np.argsort(feature_importance)[-5:]  # Top 5 features
        
        # Map to feature names (simplified)
        feature_names = [
            'text_features', 'temporal_features', 'channel_features', 
            'video_features', 'engagement_features'
        ]
        key_factors = [feature_names[min(i, len(feature_names)-1)] for i in top_features_idx]
        
        # Generate recommendation
        if viral_probability > 0.7:
            recommendation = "🔥 High viral potential! Consider promoting this content."
        elif viral_probability > 0.4:
            recommendation = "⚡ Moderate viral potential. Monitor closely."
        elif viral_probability > 0.2:
            recommendation = "📈 Some viral indicators. Optimize title/thumbnail."
        else:
            recommendation = "📊 Low viral potential. Focus on niche audience."
        
        return PredictionResult(
            video_id=video_data.get('video_id', 'unknown'),
            predicted_views=predicted_views,
            viral_probability=viral_probability,
            confidence_score=confidence_score,
            key_factors=key_factors,
            recommendation=recommendation
        )
    
    def batch_predict(self, videos_data: List[Dict]) -> List[PredictionResult]:
        """Predict viral potential for multiple videos"""
        return [self.predict_viral_potential(video) for video in videos_data]
    
    def analyze_viral_factors(self, videos_data: List[Dict]) -> Dict:
        """Analyze what factors contribute to viral content"""
        if not self.is_trained:
            raise ValueError("Models not trained. Call train_models() first.")
        
        # Get feature importance
        feature_importance = self.views_model.feature_importances_
        
        # Analyze viral vs non-viral content
        viral_videos = [v for v in videos_data if v.get('views', 0) > 100000]
        regular_videos = [v for v in videos_data if v.get('views', 0) <= 100000]
        
        analysis = {
            'top_features': {
                'feature_importance': feature_importance.tolist(),
                'most_important': np.argsort(feature_importance)[-10:].tolist()
            },
            'viral_patterns': {
                'avg_viral_length': np.mean([len(v.get('title', '')) for v in viral_videos]),
                'avg_regular_length': np.mean([len(v.get('title', '')) for v in regular_videos]),
                'viral_keywords_freq': np.mean([
                    self.extract_text_features(v.get('title', ''))['viral_keywords'] 
                    for v in viral_videos
                ]),
                'regular_keywords_freq': np.mean([
                    self.extract_text_features(v.get('title', ''))['viral_keywords'] 
                    for v in regular_videos
                ])
            }
        }
        
        return analysis
    
    def _save_models(self):
        """Save trained models to disk"""
        if not self.is_trained:
            return
            
        joblib.dump(self.views_model, os.path.join(self.model_dir, 'views_model.pkl'))
        joblib.dump(self.viral_model, os.path.join(self.model_dir, 'viral_model.pkl'))
        joblib.dump(self.feature_scaler, os.path.join(self.model_dir, 'scaler.pkl'))
        
        # Save metadata
        metadata = {
            'trained_at': datetime.now().isoformat(),
            'is_trained': True
        }
        
        with open(os.path.join(self.model_dir, 'metadata.pkl'), 'wb') as f:
            pickle.dump(metadata, f)
    
    def _load_models(self):
        """Load trained models from disk"""
        try:
            metadata_path = os.path.join(self.model_dir, 'metadata.pkl')
            if os.path.exists(metadata_path):
                with open(metadata_path, 'rb') as f:
                    metadata = pickle.load(f)
                
                if metadata.get('is_trained'):
                    self.views_model = joblib.load(os.path.join(self.model_dir, 'views_model.pkl'))
                    self.viral_model = joblib.load(os.path.join(self.model_dir, 'viral_model.pkl'))
                    self.feature_scaler = joblib.load(os.path.join(self.model_dir, 'scaler.pkl'))
                    self.is_trained = True
                    print("✅ Loaded existing ML models")
        except Exception as e:
            print(f"⚠️ Could not load existing models: {e}")
            self.is_trained = False
    
    def retrain_if_needed(self, videos_data: List[Dict], min_new_samples: int = 50):
        """Retrain models if enough new data is available"""
        if len(videos_data) >= min_new_samples:
            print(f"🔄 Retraining models with {len(videos_data)} new samples...")
            return self.train_models(videos_data)
        return None


# Integration with main trend detector
def integrate_ml_predictions(detector, predictor: ViralContentPredictor):
    """Integrate ML predictions into the main trend detector"""
    
    async def enhanced_update_videos(original_method):
        """Enhanced video update with ML predictions"""
        # Call original method
        await original_method()
        
        # Get recent videos for prediction
        with detector.SessionLocal() as session:
            from trend_detector import Video, VideoMetrics
            
            # Get videos from last 24 hours without predictions
            cutoff = datetime.utcnow() - timedelta(hours=24)
            recent_videos = session.query(Video).filter(
                Video.created_at >= cutoff
            ).limit(100).all()
            
            if predictor.is_trained and recent_videos:
                # Prepare video data for prediction
                videos_data = []
                for video in recent_videos:
                    video_data = {
                        'video_id': video.video_id,
                        'title': video.title,
                        'description': video.description,
                        'published_at': video.published_at,
                        'duration_seconds': video.duration_seconds,
                        'thumbnail_url': video.thumbnail_url,
                        # Add channel data if available
                        'channel_data': {
                            'avg_views': 10000,  # This would come from channel stats
                            'subscriber_count': 100000,  # This would come from channel stats
                        }
                    }
                    videos_data.append(video_data)
                
                # Make predictions
                predictions = predictor.batch_predict(videos_data)
                
                # Store predictions (you'd need to add a predictions table)
                print(f"🤖 Generated ML predictions for {len(predictions)} videos")
                for pred in predictions[:5]:  # Show top 5
                    print(f"  📹 {pred.video_id}: {pred.viral_probability:.1%} viral chance")
    
    return enhanced_update_videos


if __name__ == "__main__":
    # Example usage
    predictor = ViralContentPredictor()
    
    # Example training data (in practice, this would come from your database)
    sample_data = [
        {
            'video_id': 'v1',
            'title': 'SHOCKING! You Won\'t Believe What Happened Next!',
            'description': 'Amazing viral content that will blow your mind',
            'published_at': datetime.now() - timedelta(days=1),
            'duration_seconds': 300,
            'views': 500000,
            'channel_data': {'avg_views': 50000, 'subscriber_count': 100000}
        },
        {
            'video_id': 'v2', 
            'title': 'How to Fix Your Computer',
            'description': 'Simple tutorial for computer repair',
            'published_at': datetime.now() - timedelta(days=2),
            'duration_seconds': 600,
            'views': 15000,
            'channel_data': {'avg_views': 20000, 'subscriber_count': 50000}
        }
    ]
    
    if len(sample_data) >= 2:  # Minimum for demo
        # Train models
        metrics = predictor.train_models(sample_data)
        print(f"Training metrics: {metrics}")
        
        # Make prediction on new video
        new_video = {
            'video_id': 'new1',
            'title': 'EPIC Gaming Challenge - MUST WATCH!',
            'description': 'Incredible gaming moments you need to see',
            'published_at': datetime.now(),
            'duration_seconds': 420,
            'channel_data': {'avg_views': 30000, 'subscriber_count': 75000}
        }
        
        prediction = predictor.predict_viral_potential(new_video)
        print(f"\n🔮 Prediction for new video:")
        print(f"  📊 Predicted views: {prediction.predicted_views:,}")
        print(f"  🔥 Viral probability: {prediction.viral_probability:.1%}")
        print(f"  💡 Recommendation: {prediction.recommendation}")