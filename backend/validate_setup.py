"""
Setup Validation Script
========================
Checks all prerequisites before running the data pipeline and Firestore loader.

Validates:
- Python version
- Required packages installed
- Firebase credentials present
- Directory structure
"""

import sys
import os
from pathlib import Path
import subprocess

def check_python_version():
    """Check Python version >= 3.8"""
    print("\n📌 Checking Python version...")
    version = sys.version_info
    required = (3, 8)
    
    if version >= required:
        print(f"   ✅ Python {version.major}.{version.minor}.{version.micro} (required >= 3.8)")
        return True
    else:
        print(f"   ❌ Python {version.major}.{version.minor} is too old (required >= 3.8)")
        return False

def check_packages():
    """Check if all required packages are installed"""
    print("\n📌 Checking installed packages...")
    
    required_packages = {
        'pandas': '2.0.3',
        'numpy': '1.24.3',
        'scikit-learn': '1.3.0',
        'firebase_admin': '6.1.0',
        'requests': '2.31.0',
        'flask': '2.3.2',
        'dotenv': '1.0.0'
    }
    
    missing_packages = []
    
    for package, version in required_packages.items():
        try:
            __import__(package)
            print(f"   ✅ {package}")
        except ImportError:
            print(f"   ❌ {package} - NOT INSTALLED")
            missing_packages.append(package)
    
    if missing_packages:
        print(f"\n   📦 Missing packages detected!")
        print(f"   Run: pip install -r requirements.txt")
        return False
    
    return True

def check_firebase_credentials():
    """Check if Firebase service account key exists"""
    print("\n📌 Checking Firebase credentials...")
    
    backend_dir = Path(__file__).parent
    cred_path = backend_dir / "serviceAccountKey.json"
    
    if cred_path.exists():
        print(f"   ✅ Found: {cred_path}")
        
        # Check if it's valid JSON
        try:
            import json
            with open(cred_path, 'r') as f:
                data = json.load(f)
            
            required_fields = ['type', 'project_id', 'private_key', 'client_email']
            missing_fields = [f for f in required_fields if f not in data]
            
            if missing_fields:
                print(f"   ⚠️  Missing fields in serviceAccountKey.json: {missing_fields}")
                return False
            else:
                print(f"   ✅ Valid Firebase service account key")
                return True
        except json.JSONDecodeError:
            print(f"   ❌ Invalid JSON in serviceAccountKey.json")
            return False
    else:
        print(f"   ❌ NOT FOUND: {cred_path}")
        print(f"\n   📝 How to get Firebase credentials:")
        print(f"      1. Go to https://console.firebase.google.com/")
        print(f"      2. Select your project")
        print(f"      3. Click Project Settings (gear icon)")
        print(f"      4. Go to 'Service Accounts' tab")
        print(f"      5. Click 'Generate New Private Key'")
        print(f"      6. Save as 'serviceAccountKey.json' in {backend_dir}")
        return False

def check_directories():
    """Check if required directories exist/can be created"""
    print("\n📌 Checking directory structure...")
    
    backend_dir = Path(__file__).parent
    dirs_to_check = [
        backend_dir / "data",
        backend_dir / "data" / "raw",
        backend_dir / "data" / "processed"
    ]
    
    all_ok = True
    for dir_path in dirs_to_check:
        try:
            dir_path.mkdir(parents=True, exist_ok=True)
            print(f"   ✅ {dir_path.relative_to(backend_dir)}/")
        except Exception as e:
            print(f"   ❌ Cannot create {dir_path}: {str(e)}")
            all_ok = False
    
    return all_ok

def main():
    """Run all checks"""
    print("=" * 60)
    print("🔍 SETUP VALIDATION")
    print("=" * 60)
    
    checks = [
        ("Python Version", check_python_version),
        ("Package Installation", check_packages),
        ("Firebase Credentials", check_firebase_credentials),
        ("Directory Structure", check_directories)
    ]
    
    results = {}
    for name, check_func in checks:
        try:
            results[name] = check_func()
        except Exception as e:
            print(f"   ❌ Error: {str(e)}")
            results[name] = False
    
    print("\n" + "=" * 60)
    print("📊 VALIDATION SUMMARY")
    print("=" * 60)
    
    for name, passed in results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status}: {name}")
    
    all_passed = all(results.values())
    
    print("=" * 60)
    if all_passed:
        print("✅ ALL CHECKS PASSED!")
        print("\n🚀 You're ready to run:")
        print("   1. python data_pipeline.py")
        print("   2. python firestore_loader.py")
    else:
        print("❌ SOME CHECKS FAILED")
        print("\n📝 Please fix the issues above and run this script again")
    print("=" * 60)
    
    return 0 if all_passed else 1

if __name__ == "__main__":
    sys.exit(main())
