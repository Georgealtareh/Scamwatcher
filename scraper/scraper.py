import feedparser
import requests
from bs4 import BeautifulSoup
import uuid
import datetime
import json
import time
import os
import signal
import sys
import argparse

# Use a realistic browser user agent to avoid bot detection
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
}

BACKEND_API_URL = os.environ.get("BACKEND_API_URL", "http://localhost:3001/api/scams")

def classify_scam(title, description):
    text = (title + " " + description).lower()
    category = "Other"
    
    # Category mapping
    keywords = {
        "Phishing": ["phishing", "email", "link", "credential", "login", "spoof", "hijack", "access token", "sms", "text message"],
        "Investment": ["crypto", "investment", "bitcoin", "trading", "profit", "return", "ponzi", "kiosk", "stock", "forex"],
        "Impersonation": ["call", "phone", "support", "impersonating", "spoofing", "personnel", "agency", "official", "government", "police", "family", "friend"],
        "Refund Scam": ["refund", "gift card", "overpayment", "payment", "invoice", "bill"],
        "Ransomware": ["ransomware", "ransom", "encrypt", "extortion"],
        "Healthcare": ["hospice", "medicare", "health", "medical", "insurance"],
        "Employment": ["job", "hiring", "work from home", "recruitment", "internship", "salary"],
        "Relationship": ["romance", "dating", "relationship", "lover", "bumble", "tinder"]
    }
    
    for cat, kws in keywords.items():
        if any(kw in text for kw in kws):
            category = cat
            break
            
    risk_level = "Medium"
    high_risk_keywords = ["urgent", "money", "loss", "bank", "critical", "immediate", "vip", "targets", "World Cup", "FIFA", "unauthorised", "access", "compromised"]
    if any(kw.lower() in text for kw in high_risk_keywords):
        risk_level = "High"
    
    return category, risk_level

def clean_html(html):
    if not html:
        return ""
    soup = BeautifulSoup(html, "html.parser")
    return soup.get_text(separator=' ').strip()

def fetch_rss_source(url, source_name, filter_keywords=None):
    print(f"[{datetime.datetime.now()}] Fetching {source_name}...")
    try:
        response = requests.get(url, headers=HEADERS, timeout=20)
        if response.status_code != 200:
            print(f"Failed to fetch {source_name}: HTTP {response.status_code}")
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

    print(f"[{datetime.datetime.now()}] Sending {len(scams)} scams to backend API...")

    success_count = 0
    duplicate_count = 0
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
            response = requests.post(BACKEND_API_URL, json=payload, timeout=10)
            if response.status_code == 201:
                success_count += 1
            elif response.status_code == 409:
                duplicate_count += 1
            else:
                print(f"Failed to save scam {scam['id']}: {response.status_code} - {response.text}")
        except Exception as e:
            print(f"Error calling backend API for scam {scam['id']}: {e}")

    print(f"Done. Successfully saved {success_count} new scams. ({duplicate_count} duplicates ignored)")

def run_once():
    all_scams = []
    
    sources = [
        ("https://www.reddit.com/r/scams/.rss", "Reddit r/scams", None),
        ("https://www.infosecurity-magazine.com/rss/news/", "Infosecurity Magazine", ["scam", "phishing", "fraud", "ransomware"]),
        ("https://feeds.feedburner.com/TheHackersNews", "The Hacker News", ["scam", "phishing", "fraud"]),
        ("https://www.bleepingcomputer.com/feed/", "BleepingComputer", ["scam", "phishing", "fraud"]),
        ("https://www.ic3.gov/PSA/RSS", "IC3 Public Service Announcements", None),
        ("https://www.ic3.gov/CSA/RSS", "IC3 Cyber Service Announcements", None),
        ("https://www.ftc.gov/feeds/press-release-consumer-protection.xml", "FTC Consumer Protection Press Releases", None),
        ("https://consumer.ftc.gov/blog/gd-rss.xml", "FTC Consumer Blog", None),
        ("https://www.europol.europa.eu/cms/api/rss/news", "Europol Newsroom", ["scam", "fraud", "cyber", "ransomware", "phishing"]),
        ("https://www.europol.europa.eu/cms/api/rss/news?f%5B0%5D=crime_area:40", "Europol EC3", ["scam", "fraud", "cyber", "ransomware", "phishing"]),
        ("https://www.fca.org.uk/news/rss.xml", "FCA UK News", ["scam", "fraud", "unauthorised", "clone"]),
        ("https://www.scamwatch.gov.au/rss/news-feed.xml", "Scamwatch Australia", None),
        ("https://news.google.com/rss/search?q=Action+Fraud+UK+scam&hl=en-GB&gl=GB&ceid=GB:en", "Action Fraud UK (via Google News)", None),
        ("https://krebsonsecurity.com/feed/", "Krebs on Security", ["scam", "fraud", "phishing"]),
        ("https://www.malwarebytes.com/blog/feed", "Malwarebytes Blog", ["scam", "phishing", "fraud"]),
    ]
    
    for url, name, filter_kws in sources:
        all_scams.extend(fetch_rss_source(url, name, filter_kws))
    
    save_to_db(all_scams)

def signal_handler(sig, frame):
    print('\nScraper stopping gracefully...')
    sys.exit(0)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='ScamWatch Detection Pipeline')
    parser.add_argument('--loop', action='store_true', help='Run in a continuous loop')
    parser.add_argument('--interval', type=int, default=3600, help='Loop interval in seconds (default: 3600)')
    args = parser.parse_args()

    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    if args.loop:
        print(f"Starting scraper in loop mode (interval: {args.interval}s)...")
        while True:
            try:
                run_once()
                print(f"[{datetime.datetime.now()}] Sleeping for {args.interval}s...")
                time.sleep(args.interval)
            except Exception as e:
                print(f"Error in loop: {e}")
                time.sleep(60) 
    else:
        run_once()
        print("Pipeline execution complete.")
