#!/usr/bin/env python3
"""
Test setup for AI Job Hunter
Verify that core modules are accessible and basic functionality works
"""

import sys
import os
from pathlib import Path

# Add core modules to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

def test_core_modules():
    """Test that existing core modules are accessible"""
    print("🧪 Testing AI Job Hunter Setup")
    print("=" * 40)
    
    try:
        # Test core utilities
        from core.utils import FileHelpers, DataHelpers
        print("✅ Core utilities imported successfully")
        
        # Test AI module
        from core.ai import GeminiClient
        print("✅ AI module imported successfully")
        
        # Test FileHelpers functionality
        files = FileHelpers()
        print(f"✅ FileHelpers working - methods available")
        
        # Test DataHelpers functionality
        data = DataHelpers()
        print(f"✅ DataHelpers working - class instantiated")
        
        # Test project modules (import only, don't instantiate)
        import src.job_scrapers as scrapers
        import src.ai_job_analyzer as analyzer
        print("✅ Project modules imported successfully")
        
        return True
        
    except ImportError as e:
        print(f"❌ Import error: {e}")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_environment():
    """Test environment variables"""
    print("\n🔧 Testing Environment Setup")
    print("-" * 30)
    
    apify_token = os.getenv('APIFY_TOKEN')
    google_key = os.getenv('GOOGLE_API_KEY')
    
    if apify_token:
        print("✅ APIFY_TOKEN is set")
    else:
        print("⚠️  APIFY_TOKEN not set - needed for job scraping")
    
    if google_key:
        print("✅ GOOGLE_API_KEY is set")
    else:
        print("⚠️  GOOGLE_API_KEY not set - needed for AI analysis")
    
    return bool(apify_token and google_key)

def test_project_structure():
    """Test project structure"""
    print("\n📁 Testing Project Structure")
    print("-" * 30)
    
    project_dir = Path(__file__).parent
    
    required_files = [
        'main.py',
        'config.py',
        'src/job_scrapers.py',
        'src/ai_job_analyzer.py',
        'README.md'
    ]
    
    all_exist = True
    for file_path in required_files:
        full_path = project_dir / file_path
        if full_path.exists():
            print(f"✅ {file_path}")
        else:
            print(f"❌ Missing: {file_path}")
            all_exist = False
    
    # Create data directory if it doesn't exist
    data_dir = project_dir / "data"
    data_dir.mkdir(exist_ok=True)
    print(f"✅ Data directory: {data_dir}")
    
    return all_exist

def main():
    """Run all tests"""
    print("🤖 AI Job Hunter - Setup Verification")
    print("=" * 50)
    
    core_ok = test_core_modules()
    env_ok = test_environment()
    structure_ok = test_project_structure()
    
    print("\n" + "=" * 50)
    print("📋 SETUP SUMMARY")
    print("=" * 50)
    
    if core_ok:
        print("✅ Core modules: READY")
    else:
        print("❌ Core modules: FAILED")
    
    if env_ok:
        print("✅ Environment: READY")
    else:
        print("⚠️  Environment: PARTIAL (set API keys)")
    
    if structure_ok:
        print("✅ Project structure: READY")
    else:
        print("❌ Project structure: INCOMPLETE")
    
    if core_ok and structure_ok:
        print("\n🎉 AI Job Hunter is ready to use!")
        if not env_ok:
            print("📝 Set API keys to enable full functionality:")
            print("   export APIFY_TOKEN='your-token'")
            print("   export GOOGLE_API_KEY='your-key'")
        print("\n🚀 Run: python main.py")
    else:
        print("\n❌ Setup incomplete - fix errors above")

if __name__ == "__main__":
    main()