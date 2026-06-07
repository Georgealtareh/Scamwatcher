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
        
    print(f"Deduplicating {len(scams)} potential scams...")
    
    # Fetch all existing URLs at once to avoid multiple team-db calls
    try:
        result = subprocess.run(["team-db", "SELECT url FROM scams"], capture_output=True, text=True)
        if result.returncode == 0:
            existing_data = json.loads(result.stdout)
            existing_urls = {row['url'] for row in existing_data}
        else:
            print(f"Error fetching existing URLs: {result.stderr}")
            existing_urls = set()
    except Exception as e:
        print(f"Exception fetching existing URLs: {e}")
        existing_urls = set()
        
    new_scams = []
    for scam in scams:
        if scam['source_url'] not in existing_urls:
            new_scams.append(scam)
            existing_urls.add(scam['source_url']) # Avoid duplicates in the same batch
            
    if not new_scams:
        print("No new scams to save.")
        return

    print(f"Saving {len(new_scams)} new scams to database...")
    
    # Batch insertion
    batch_size = 20 # Increased batch size
    for i in range(0, len(new_scams), batch_size):
        batch = new_scams[i : i + batch_size]
        values = []
        for scam in batch:
            desc = scam['description'].replace("'", "''")[:1000] 
            title = scam['title'].replace("'", "''")
            source_url = scam['source_url'].replace("'", "''")
            source_name = scam['source_name'].replace("'", "''")
            
            values.append(f"('{scam['id']}', '{title}', '{desc}', '{source_url}', '{source_name}', '{scam['detected_at']}', '{scam['scam_type']}', '{scam['risk_level']}')")
        
        values_str = ", ".join(values)
        insert_query = f"""
        INSERT INTO scams (id, title, description, url, source, date_detected, category, risk_level)
        VALUES {values_str}
        """
        subprocess.run(["team-db", insert_query])
    
    print(f"Done saving {len(new_scams)} scams.")

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
