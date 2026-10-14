#!/usr/bin/env python3
"""
LinkedIn Connections Sync Script
Fetches 1st-degree connections using LinkedIn Voyager API and updates src/data/connections.json
"""

import json
import os
import sys
import re
from datetime import datetime, timezone
import urllib.request
import urllib.error

DATA_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "src", "data", "connections.json")

SEED_CONNECTIONS = [
    {"name": "Aarav Sharma", "headline": "AI & ML Researcher | LLM Evaluation", "company": "AI Dynamics", "zone": "AI & Machine Learning", "profileUrl": "https://www.linkedin.com/in/ashit-upadhyay/"},
    {"name": "Priya Patel", "headline": "Senior Machine Learning Engineer", "company": "NeuralTech Systems", "zone": "AI & Machine Learning", "profileUrl": "https://www.linkedin.com/in/ashit-upadhyay/"},
    {"name": "Rohan Gupta", "headline": "Full Stack Engineer (FastAPI & React)", "company": "CloudForge", "zone": "Software & Cloud", "profileUrl": "https://www.linkedin.com/in/ashit-upadhyay/"},
    {"name": "Sneha Verma", "headline": "Data Scientist | Time Series & Forecaster", "company": "RetailIQ", "zone": "AI & Machine Learning", "profileUrl": "https://www.linkedin.com/in/ashit-upadhyay/"},
    {"name": "Vikram Malhotra", "headline": "Founder & CEO", "company": "VentureScale Labs", "zone": "Founders & Leadership", "profileUrl": "https://www.linkedin.com/in/ashit-upadhyay/"},
    {"name": "Ananya Joshi", "headline": "Computer Vision Engineer | MediaPipe & PyTorch", "company": "VisionCraft", "zone": "AI & Machine Learning", "profileUrl": "https://www.linkedin.com/in/ashit-upadhyay/"},
    {"name": "Devansh Singh", "headline": "DevOps & Cloud Architect (AWS / Kubernetes)", "company": "NextGen Infotech", "zone": "Software & Cloud", "profileUrl": "https://www.linkedin.com/in/ashit-upadhyay/"},
    {"name": "Kavya Nair", "headline": "NLP Engineer | LangChain & RAG Workflows", "company": "LexiFlow AI", "zone": "AI & Machine Learning", "profileUrl": "https://www.linkedin.com/in/ashit-upadhyay/"},
    {"name": "Aditya Rao", "headline": "B.Tech AI & ML Scholar", "company": "Vishveshwarya Group", "zone": "Alumni & Scholars", "profileUrl": "https://www.linkedin.com/in/ashit-upadhyay/"},
    {"name": "Neha Kulkarni", "headline": "Product Lead | AI Tools & Infrastructure", "company": "Synthetix", "zone": "Founders & Leadership", "profileUrl": "https://www.linkedin.com/in/ashit-upadhyay/"},
    {"name": "Manish Tiwari", "headline": "Backend Engineer (Go, Python, Redis)", "company": "ScaleMatrix", "zone": "Software & Cloud", "profileUrl": "https://www.linkedin.com/in/ashit-upadhyay/"},
    {"name": "Isha Chawla", "headline": "Deep Learning Research Intern", "company": "Cognitive AI Lab", "zone": "Alumni & Scholars", "profileUrl": "https://www.linkedin.com/in/ashit-upadhyay/"},
    {"name": "Siddharth Mehta", "headline": "Co-Founder & CTO", "company": "Apex Dynamics", "zone": "Founders & Leadership", "profileUrl": "https://www.linkedin.com/in/ashit-upadhyay/"},
    {"name": "Riya Saxena", "headline": "Applied Scientist | LightGBM & Forecasting", "company": "Optima Analytics", "zone": "AI & Machine Learning", "profileUrl": "https://www.linkedin.com/in/ashit-upadhyay/"},
    {"name": "Aryan Rajput", "headline": "B.Tech Student & Open-Source Contributor", "company": "VGI Tech Club", "zone": "Alumni & Scholars", "profileUrl": "https://www.linkedin.com/in/ashit-upadhyay/"},
    {"name": "Meera Banerjee", "headline": "Distributed Systems Engineer", "company": "HyperFlow Data", "zone": "Software & Cloud", "profileUrl": "https://www.linkedin.com/in/ashit-upadhyay/"},
    {"name": "Harsh Vardhan", "headline": "Technical Lead & Engineering Manager", "company": "Vertex Global", "zone": "Founders & Leadership", "profileUrl": "https://www.linkedin.com/in/ashit-upadhyay/"},
    {"name": "Tanvi Kapoor", "headline": "AI Ethics & Model Alignment Specialist", "company": "SafeIntelligence", "zone": "AI & Machine Learning", "profileUrl": "https://www.linkedin.com/in/ashit-upadhyay/"},
    {"name": "Karan Singhal", "headline": "Frontend Architect | Three.js & Canvas", "company": "Studio Pixel", "zone": "Software & Cloud", "profileUrl": "https://www.linkedin.com/in/ashit-upadhyay/"},
    {"name": "Divya Reddy", "headline": "Database Engineer (MySQL, Vector DBs)", "company": "DataMesh Technologies", "zone": "Software & Cloud", "profileUrl": "https://www.linkedin.com/in/ashit-upadhyay/"},
    {"name": "Arjun Deshmukh", "headline": "Autonomous Agents Developer", "company": "HiveLogic AI", "zone": "AI & Machine Learning", "profileUrl": "https://www.linkedin.com/in/ashit-upadhyay/"},
    {"name": "Pooja Hegde", "headline": "AI & Data Science Student", "company": "Vishveshwarya Group", "zone": "Alumni & Scholars", "profileUrl": "https://www.linkedin.com/in/ashit-upadhyay/"},
    {"name": "Nikhil Agarwal", "headline": "Founding Engineer", "company": "Aura Labs", "zone": "Founders & Leadership", "profileUrl": "https://www.linkedin.com/in/ashit-upadhyay/"},
    {"name": "Simran Kaur", "headline": "Quantitative Analyst & ML Practitioner", "company": "QuantPulse", "zone": "AI & Machine Learning", "profileUrl": "https://www.linkedin.com/in/ashit-upadhyay/"},
    {"name": "Yash Dixit", "headline": "Cloud Infrastructure Engineer", "company": "SkyStream", "zone": "Software & Cloud", "profileUrl": "https://www.linkedin.com/in/ashit-upadhyay/"},
]

def determine_zone(headline: str) -> str:
    h = (headline or "").lower()
    if any(k in h for k in ["ai", "ml", "machine learning", "deep learning", "nlp", "llm", "data scientist", "vision", "researcher", "scientist"]):
        return "AI & Machine Learning"
    if any(k in h for k in ["founder", "ceo", "cto", "lead", "director", "manager", "head"]):
        return "Founders & Leadership"
    if any(k in h for k in ["student", "scholar", "intern", "vgi", "vishveshwarya", "alumni", "college"]):
        return "Alumni & Scholars"
    return "Software & Cloud"

def fetch_linkedin_connections(li_at: str):
    csrf_token = "ajax:1234567890123456789"
    headers = {
        "Cookie": f'li_at={li_at.strip()}; JSESSIONID="{csrf_token}"',
        "Csrf-Token": csrf_token,
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "application/vnd.linkedin.normalized+json+2.1",
        "x-restli-protocol-version": "2.0.0",
    }
    
    url = "https://www.linkedin.com/voyager/api/relationships/dash/connections?decorationId=com.linkedin.voyager.dash.deco.web.mynetwork.ConnectionListWithProfile-15&count=100&q=search&sortType=RECENTLY_ADDED"
    req = urllib.request.Request(url, headers=headers)
    
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            connections = []
            
            # Voyager Dash format parser
            elements = data.get("elements", [])
            included = {item.get("entityUrn"): item for item in data.get("included", []) if "entityUrn" in item}
            
            for el in elements:
                conn_urn = el.get("*connectedMember") or el.get("entityUrn")
                profile = included.get(conn_urn, el)
                
                first = profile.get("firstName", "")
                last = profile.get("lastName", "")
                name = f"{first} {last}".strip()
                headline = profile.get("headline") or profile.get("occupation", "Professional Connection")
                public_id = profile.get("publicIdentifier") or profile.get("navigationUrl", "")
                
                profile_url = f"https://www.linkedin.com/in/{public_id}/" if public_id and not public_id.startswith("http") else (public_id or "https://www.linkedin.com")
                
                if name:
                    connections.append({
                        "name": name,
                        "headline": headline,
                        "company": headline.split(" at ")[-1] if " at " in headline else "Industry",
                        "zone": determine_zone(headline),
                        "profileUrl": profile_url,
                    })
                    
            if connections:
                return connections
    except Exception as e:
        print(f"[!] Voyager Dash query failed: {e}. Trying legacy endpoint...", file=sys.stderr)
        
    # Fallback to standard Voyager relationships/connections
    legacy_url = "https://www.linkedin.com/voyager/api/relationships/connections?count=100&start=0"
    req2 = urllib.request.Request(legacy_url, headers=headers)
    try:
        with urllib.request.urlopen(req2, timeout=15) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            connections = []
            for item in data.get("elements", []):
                mini = item.get("miniProfile", {})
                first = mini.get("firstName", "")
                last = mini.get("lastName", "")
                name = f"{first} {last}".strip()
                headline = mini.get("occupation") or "Professional Connection"
                public_id = mini.get("publicIdentifier", "")
                profile_url = f"https://www.linkedin.com/in/{public_id}/" if public_id else "https://www.linkedin.com"
                
                if name:
                    connections.append({
                        "name": name,
                        "headline": headline,
                        "company": headline.split(" at ")[-1] if " at " in headline else "Industry",
                        "zone": determine_zone(headline),
                        "profileUrl": profile_url,
                    })
            if connections:
                return connections
    except Exception as e2:
        print(f"[!] Legacy endpoint query failed: {e2}", file=sys.stderr)

    return None

def main():
    os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
    li_at = os.environ.get("LINKEDIN_LI_AT", "").strip()
    
    connections = None
    if li_at:
        print("[*] LINKEDIN_LI_AT detected. Fetching live connections from LinkedIn Voyager API...")
        connections = fetch_linkedin_connections(li_at)
        if connections:
            print(f"[+] Successfully fetched {len(connections)} live connections from LinkedIn!")
        else:
            print("[!] Could not parse live connections (session may need re-auth or rate-limited). Using seed connections.")
    else:
        print("[*] No LINKEDIN_LI_AT environment variable found. Initializing seed connections.")

    if not connections:
        connections = SEED_CONNECTIONS

    payload = {
        "lastUpdated": datetime.now(timezone.utc).isoformat(),
        "totalCount": len(connections),
        "source": "live" if (li_at and connections != SEED_CONNECTIONS) else "seed",
        "zones": [
            {"id": "all", "label": "All Synapses", "color": "#38bdf8"},
            {"id": "ai", "label": "AI & Machine Learning", "color": "#c084fc"},
            {"id": "cloud", "label": "Software & Cloud", "color": "#38bdf8"},
            {"id": "leaders", "label": "Founders & Leadership", "color": "#fbbf24"},
            {"id": "scholars", "label": "Alumni & Scholars", "color": "#4ade80"},
        ],
        "connections": connections
    }

    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2, ensure_ascii=False)

    print(f"[+] Written {len(connections)} connections to {DATA_FILE}")

if __name__ == "__main__":
    main()
