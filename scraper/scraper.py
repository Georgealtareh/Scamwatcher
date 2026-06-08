import feedparser
import requests
from bs4 import BeautifulSoup
import uuid
import datetime
import json
import subprocess
import time

# Use a realistic browser user agent to avoid bot detection
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
}

def classify_scam(title, description):
    text = (title + " " + description).lower()
    category = "Other"
    
    # Category mapping
    keywords = {
        "Phishing": ["phishing", "email", "link", "credential", "login", "spoof", "hijack", "access token"],
        "Investment": ["crypto", "investment", "bitcoin", "trading", "profit", "return", "ponzi", "kiosk"],
        "Impersonation": ["call", "phone", "support", "impersonating", "spoofing", "personnel", "agency", "official"],
        "Refund Scam": ["refund", "gift card", "overpayment", "payment"],
        "Ransomware": ["ransomware", "ransom", "encrypt", "extortion"],
        "Healthcare": ["hospice", "medicare", "health", "medical"],
        "Employment": ["job", "hiring", "work from home", "recruitment"]
    }
    
    for cat, kws in keywords.items():
        if any(kw in text for kw in kws):
            category = cat
            break
            
    risk_level = "Medium"
    high_risk_keywords = ["urgent", "money", "loss", "bank", "critical", "immediate", "vip", "targets", "World Cup", "FIFA"]
    if any(kw.lower() in text for kw in high_risk_keywords):
        risk_level = "High"
    
    return category, risk_level

def clean_html(html):
    if not html:
        return ""
    soup = BeautifulSoup(html, "html.parser")
    return soup.get_text(separator=' ').strip()

def fetch_rss_source(url, source_name, filter_keywords=None):
    print(f"Fetching {source_name}...")
    try:
        response = requests.get(url, headers=HEADERS, timeout=15)
        if response.status_code != 200:
            print(f"Failed to fetch {source_name}: {response.status_code}")
            return []
        
        feed = feedparser.parse(response.content)
        scams = []
        for entry in feed.entries:
            title = entry.title
            description = clean_html(entry.get("summary", entry.get("description", "")))
            
            # Optional filtering
            if filter_keywords:
                if not any(kw.lower() in (title + " " + description).lower() for kw in filter_keywords):
                    continue
            
            category, risk_level = classify_scam(title, description)
            
            # Format date
            detected_at = entry.get("published", entry.get("updated", datetime.datetime.now().isoformat()))
            
            scams.append({
                "id": str(uuid.uuid4()),
                "title": title,
                "description": description,
                "source_url": entry.link,
                "source_name": source_name,
                "detected_at": detected_at,
                "scam_type": category,
                "risk_level": risk_level
            })
        return scams
    except Exception as e:
        print(f"Error fetching {source_name}: {e}")
        return []

def save_to_db(scams):
    if not scams:
        return

    print(f"Sending {len(scams)} scams to backend API...")

    success_count = 0
    for scam in scams:
        payload = {
            "id": scam['id'],
            "title": scam['title'],
            "description": scam['description'],
            "source": scam['source_name'],
            "risk_level": scam['risk_level'].lower(),
            "category": scam['scam_type'],
            "url": scam['source_url']
        }

        try:
            # Note: 0.0.0.0 is the bind address, but from within the same machine,
            # we can use localhost or the sandbox hostname.
            # Port 3001 is where the backend is listening.
            response = requests.post("http://localhost:3001/api/scams", json=payload, timeout=10)
            if response.status_code == 201:
                success_count += 1
            elif response.status_code == 409:
                # Already exists, ignore
                pass
            else:
                print(f"Failed to save scam {scam['id']}: {response.status_code} - {response.text}")
        except Exception as e:
            print(f"Error calling backend API for scam {scam['id']}: {e}")

    print(f"Done. Successfully saved {success_count} new scams via API.")

if __name__ == "__main__":
    all_scams = []
    
    sources = [
        ("https://www.reddit.com/r/scams/.rss", "Reddit r/scams", None),
        ("https://www.infosecurity-magazine.com/rss/news/", "Infosecurity Magazine", ["scam", "phishing", "fraud", "ransomware"]),
        ("https://feeds.feedburner.com/TheHackersNews", "The Hacker News", ["scam", "phishing", "fraud"]),
        ("https://www.bleepingcomputer.com/feed/", "BleepingComputer", ["scam", "phishing", "fraud"]),
        ("https://www.ic3.gov/PSA/RSS", "IC3 Public Service Announcements", None),
        ("https://www.ic3.gov/CSA/RSS", "IC3 Cyber Service Announcements", None),
    ]
    
    for url, name, filter_kws in sources:
        all_scams.extend(fetch_rss_source(url, name, filter_kws))
    
    save_to_db(all_scams)
    print("Pipeline execution complete.")
