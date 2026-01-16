#!/usr/bin/env python3
"""
addEvents.py
- Scrape events from sites stored in DB (table "Site", enabled=true)
- Insert scraped events into DB (table "Event")
- Only inserts events that have ALL required fields:
    eventName, eventDate, eventDescription, eventWebsiteOrigin, eventImage

IMPORTANT:
- NU mai citește city din tabela Site (coloana nu există).
- City se determină din eveniment (JSON-LD location/addressLocality) sau din URL.
"""

import os
import re
import json
import uuid
import sys
from datetime import datetime, timezone
from urllib.parse import urljoin
from pathlib import Path

import requests
from bs4 import BeautifulSoup
from dateutil import parser as dateparser
from dotenv import load_dotenv

# DB
import psycopg2
from psycopg2.extras import RealDictCursor


BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")  # ia .env din folderul backend

print("PYTHON:", sys.executable)
print("CWD:", os.getcwd())

HEADERS = {"User-Agent": "EventScraper/1.1 (+contact@example.com)"}

REQUIRED_FIELDS = [
    "eventName",
    "eventDate",
    "eventDescription",
    "eventWebsiteOrigin",
    "eventImage",
]

# Optional dynamic scraping (Playwright)
try:
    from playwright.sync_api import sync_playwright  # type: ignore

    HAS_PLAYWRIGHT = True
except Exception:
    HAS_PLAYWRIGHT = False


# =====================
# FETCH HTML
# =====================
def fetch_html(url: str, timeout: int = 20, dynamic: bool = False):
    """
    Obține HTML-ul unei pagini.
    Dacă dynamic=True, folosește Playwright pentru site-uri care încarcă conținut cu JavaScript.
    """
    if dynamic and HAS_PLAYWRIGHT:
        try:
            with sync_playwright() as p:
                browser = p.chromium.launch(headless=True)
                page = browser.new_page()
                page.goto(url, timeout=timeout * 1000)
                page.wait_for_load_state("networkidle")
                html = page.content()
                current_url = page.url
                browser.close()
                return html, current_url
        except Exception as ex:
            print(f"[Playwright] {ex} -> fallback la requests")

    resp = requests.get(url, headers=HEADERS, timeout=timeout)
    resp.raise_for_status()
    return resp.text, resp.url


# =====================
# UTIL
# =====================
def normalize_date(d):
    if not d:
        return None
    try:
        if isinstance(d, (list, tuple)):
            d = d[0]
        if isinstance(d, dict):
            d = d.get("startDate") or d.get("date")
        dt = dateparser.parse(str(d), fuzzy=True)
        return dt.isoformat()
    except Exception:
        return str(d).strip()


def has_required_fields(e: dict) -> bool:
    for k in REQUIRED_FIELDS:
        v = e.get(k)
        if v is None:
            return False
        if isinstance(v, str) and not v.strip():
            return False
    return True


def slug_to_city(slug: str) -> str:
    """
    Transformă un slug gen 'cluj-napoca' în 'Cluj-Napoca'
    (fără diacritice, păstrează cratima).
    """
    slug = slug.strip().strip("/")
    if not slug:
        return ""

    parts = [p for p in slug.split("-") if p]
    if not parts:
        return ""

    titled = [p.capitalize() for p in parts]
    if len(titled) >= 2:
        return "-".join(titled)
    return titled[0]


def city_from_url(url: str):
    """
    Încearcă să extragă orașul din URL.
    Exemple utile:
      - /bilete-in-sibiu/ -> Sibiu
      - /bilete-in-cluj-napoca/ -> Cluj-Napoca
      - /evenimente-in-iasi/ -> Iasi
    """
    if not url:
        return None

    patterns = [
        r"/bilete-in-([a-z0-9\-]+)/?",
        r"/evenimente-in-([a-z0-9\-]+)/?",
        r"/events-in-([a-z0-9\-]+)/?",
        r"[?&]city=([a-z0-9\-]+)",
    ]

    u = url.lower()
    for pat in patterns:
        m = re.search(pat, u)
        if m:
            c = slug_to_city(m.group(1))
            return c or None
    return None


def city_from_jsonld_location(loc):
    """
    Extrage city din JSON-LD location/address, dacă există.
    Schema tipică:
      "location": {"@type":"Place","address":{"addressLocality":"Sibiu", ...}}
    """
    if not loc:
        return None

    # uneori e listă
    if isinstance(loc, (list, tuple)) and loc:
        loc = loc[0]

    # uneori e string direct
    if isinstance(loc, str):
        s = loc.strip()
        if not s:
            return None
        return s.split(",")[0].strip() or None

    if not isinstance(loc, dict):
        return None

    addr = loc.get("address")
    if isinstance(addr, str):
        s = addr.strip()
        if not s:
            return None
        return s.split(",")[0].strip() or None

    if isinstance(addr, dict):
        locality = addr.get("addressLocality") or addr.get("locality")
        if isinstance(locality, str) and locality.strip():
            return locality.strip()

    # fallback: uneori city apare în numele locului
    place_name = loc.get("name")
    if isinstance(place_name, str) and place_name.strip():
        parts = [p.strip() for p in place_name.split(",") if p.strip()]
        if len(parts) >= 2:
            return parts[-1]
    return None


def infer_city_for_event(e: dict):
    """
    1) dacă avem eventCity deja extras -> folosește-l
    2) încearcă din URL-ul evenimentului
    """
    c = e.get("eventCity")
    if isinstance(c, str) and c.strip():
        return c.strip()

    url = e.get("eventWebsiteOrigin") or ""
    c2 = city_from_url(url)
    if c2:
        return c2

    return None


# =====================
# JSON-LD extractor + city extraction
# =====================
def extract_jsonld_events(html: str, base_url: str):
    soup = BeautifulSoup(html, "html.parser")
    scripts = soup.find_all("script", {"type": "application/ld+json"})
    events = []

    for s in scripts:
        if not s.string:
            continue
        try:
            payload = json.loads(s.string)
        except Exception:
            continue

        objs = payload if isinstance(payload, list) else [payload]
        for obj in list(objs):
            if isinstance(obj, dict) and obj.get("@graph"):
                objs.extend(obj["@graph"])
                continue

            if not isinstance(obj, dict):
                continue

            typ = obj.get("@type") or obj.get("type")
            if isinstance(typ, list):
                types = [t.lower() for t in typ if isinstance(t, str)]
            elif isinstance(typ, str):
                types = [typ.lower()]
            else:
                types = []

            if any(k in types for k in ["event", "movie", "theaterevent", "screening"]):
                link = urljoin(base_url, obj.get("url") or base_url)

                image = obj.get("image")
                if isinstance(image, (list, tuple)):
                    image = image[0]
                elif isinstance(image, dict):
                    image = image.get("url")

                # city
                city = city_from_jsonld_location(obj.get("location"))
                if not city:
                    city = city_from_url(link) or city_from_url(base_url)

                events.append(
                    {
                        "eventName": obj.get("name") or obj.get("headline"),
                        "eventDate": normalize_date(obj.get("startDate")),
                        "eventDescription": obj.get("description"),
                        "eventWebsiteOrigin": link,
                        "eventImage": urljoin(base_url, image) if image else None,
                        "eventCity": city,
                    }
                )

    return events


# =====================
# Heuristic HTML parser + city from URL
# =====================
def heuristic_html_parse(html: str, base_url: str):
    soup = BeautifulSoup(html, "lxml")
    selectors = [
        "[class*='event']",
        "[class*='movie']",
        "[class*='film']",
        "[class*='screening']",
        "[class*='show']",
        "article",
        "li",
    ]
    elements = []
    for sel in selectors:
        elements.extend(soup.select(sel))

    seen = set()
    events = []

    for el in elements:
        txt = el.get_text(" ", strip=True)
        if not txt or txt in seen:
            continue
        seen.add(txt)

        # Title
        name = None
        for h in el.select("h1,h2,h3,h4,a,title"):
            t = h.get_text(strip=True)
            if t:
                name = t
                break
        if not name:
            name = txt.split(".")[0].strip()

        # Date
        date = None
        time_tag = el.find("time") or el.find(class_=re.compile("date"))
        if time_tag:
            date = time_tag.get("datetime") or time_tag.get_text(strip=True)

        if not date:
            match = re.search(
                r"\b\d{1,2}\s+[A-ZĂÂÎȘȚa-zăâîșț]+\s*(?:[-–]\s*\d{1,2}\s+[A-ZĂÂÎȘȚa-zăâîșț]+)?",
                txt,
            )
            if match:
                date = match.group(0)

        # Link
        a = el.find("a", href=True)
        link = urljoin(base_url, a["href"]) if a else base_url

        # Description
        desc = None
        p = el.find("p")
        if p:
            desc = p.get_text(strip=True)
        elif len(txt.split()) > 30:
            desc = " ".join(txt.split()[:40]) + "."

        # Image
        image = None
        img_tag = el.find("img")
        if img_tag and img_tag.get("src"):
            image = urljoin(base_url, img_tag["src"])
        else:
            style_tag = el.get("style") or ""
            m = re.search(r'url\(["\']?(.*?)["\']?\)', style_tag)
            if m:
                image = urljoin(base_url, m.group(1))

        city = city_from_url(link) or city_from_url(base_url)

        events.append(
            {
                "eventName": name,
                "eventDate": normalize_date(date),
                "eventDescription": desc,
                "eventWebsiteOrigin": link,
                "eventImage": image,
                "eventCity": city,
            }
        )

    return events


def scrape_events_from_page(url: str, dynamic: bool = False):
    html, origin = fetch_html(url, dynamic=dynamic)
    events = extract_jsonld_events(html, origin)
    if not events:
        events = heuristic_html_parse(html, origin)

    # de-dup local
    unique = {}
    for e in events:
        key = (e.get("eventName") or "").lower().strip() + "|" + str(e.get("eventDate") or "")
        if key not in unique and e.get("eventName"):
            unique[key] = e
    return list(unique.values())


# =====================
# DB
# =====================
def get_conn():
    db_url = os.getenv("DATABASE_URL_PY")
    if not db_url:
        raise RuntimeError("Missing DATABASE_URL_PY in backend/.env")
    return psycopg2.connect(db_url)


def list_enabled_sites(conn):
    # FIX: fără coloana city (nu există în DB)
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            """
            SELECT id, name, url, "jsonUrl"
            FROM "Site"
            WHERE enabled = true
            ORDER BY "createdAt" ASC
        """
        )
        return cur.fetchall()


def already_exists(conn, source_site_id: str, title: str, start_dt: datetime) -> bool:
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT 1
            FROM "Event"
            WHERE "sourceSiteId" = %s
              AND lower(title) = lower(%s)
              AND "startDate" = %s
            LIMIT 1
        """,
            (source_site_id, title, start_dt),
        )
        return cur.fetchone() is not None


def insert_event(conn, source_site_id: str, e: dict) -> str:
    """
    Returns: inserted | duplicate | incomplete | bad_date | no_city
    """
    if not has_required_fields(e):
        return "incomplete"

    city = infer_city_for_event(e)
    if not city:
        return "no_city"

    title = (e.get("eventName") or "").strip()
    desc = (e.get("eventDescription") or "").strip()
    url = (e.get("eventWebsiteOrigin") or "").strip()
    img = (e.get("eventImage") or "").strip()

    try:
        start_dt = dateparser.parse(str(e["eventDate"]), fuzzy=True)
        if start_dt is None:
            return "bad_date"
    except Exception:
        return "bad_date"

    if already_exists(conn, source_site_id, title, start_dt):
        return "duplicate"

    now = datetime.now(timezone.utc)

    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO "Event" (
                "id", "title", "description", "category", "city", "venue",
                "startDate", "endDate", "url", "imageUrl",
                "createdAt", "updatedAt", "sourceSiteId"
            )
            VALUES (
                %s, %s, %s, NULL, %s, NULL,
                %s, NULL, %s, %s,
                %s, %s, %s
            )
        """,
            (
                str(uuid.uuid4()),
                title,
                desc,
                city,
                start_dt,
                url,
                img,
                now,
                now,
                source_site_id,
            ),
        )

    return "inserted"


def main():
    dynamic = os.getenv("SCRAPE_DYNAMIC", "0").lower() in ("1", "true", "yes")

    summary = {
        "dynamic": dynamic,
        "sites": 0,
        "events_found": 0,
        "inserted": 0,
        "duplicate": 0,
        "incomplete": 0,
        "bad_date": 0,
        "no_city": 0,
        "errors": 0,
    }

    conn = get_conn()
    conn.autocommit = False

    try:
        sites = list_enabled_sites(conn)
        summary["sites"] = len(sites)

        if not sites:
            print("No enabled sites found. Nothing to do.")
            print(json.dumps(summary, ensure_ascii=False))
            return 0

        for s in sites:
            site_id = s["id"]
            site_name = s["name"]
            entry_url = s.get("jsonUrl") or s.get("url")
            if not entry_url:
                continue

            print(f"\n=== {site_name} ===\n{entry_url}")

            try:
                events = scrape_events_from_page(entry_url, dynamic=dynamic)
                print(f"found={len(events)}")
                summary["events_found"] += len(events)

                for e in events:
                    st = insert_event(conn, site_id, e)
                    summary[st] += 1

                conn.commit()
            except Exception as ex:
                conn.rollback()
                summary["errors"] += 1
                print(f"ERROR site={site_name}: {ex}")

        print("\n=== SUMMARY ===")
        print(json.dumps(summary, ensure_ascii=False, indent=2))
        return 0

    finally:
        conn.close()


if __name__ == "__main__":
    raise SystemExit(main())
