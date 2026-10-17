"""يبني assets/data.js من data/channel.json (قائمة القناة المسحوبة بـ yt-dlp)."""
import json, re, math, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
src = json.loads((ROOT / "data/channel.json").read_text(encoding="utf-8"))

# السلاسل بترتيب الأولوية: المقطع ينسب لأول سلسلة يوجد فيها
SERIES = [
    ("waqafat", "وقفات", "حلقات أسبوعية في التربية والإيمان", ["وقفات 2020", "وقفات 2015", "وقفات 2012", "وقفات 2010"]),
    ("majalis", "مجالس الذكر", "مجالس تُحيي القلوب بذكر الله", ["برنامج مجالس الذكر"]),
    ("manabir", "قالت المنابر", "خطب الجمعة", ["قالت المنابر"]),
    ("jawami", "جوامع الكلم", "شرح أحاديث جامعة من كلام النبي ﷺ", ["جوامع الكلم"]),
    ("wasaya", "وصايا عمرية", "وصايا الفاروق عمر بن الخطاب رضي الله عنه", ["وصايا عمرية"]),
    ("mawaez", "مواعظ", "مواعظ وعبر", ["مواعظ"]),
    ("akhira", "رحلة إلى الدار الآخرة", "من الموت إلى الجنة", ["#رحلة_إلى_الدار_الآخرة"]),
    ("usra", "هموم أسرية", "قضايا البيت والأسرة", ["هموم أسرية"]),
    ("siyam", "مع الصائمين", "زاد رمضان", ["مع الصائمين"]),
    ("ard", "قصة أرض", "قصص وعبر", ["قصة أرض"]),
    ("wadhakkir", "وذكّر", "تذكرة للمؤمنين", ["وذكر"]),
    ("taghrida", "تغريدة وتعليق", "خواطر قصيرة", ["تغريدة وتعليق"]),
    ("liqaat", "لقاءات", "لقاءات منوعة", ["لقاءات منوعة"]),
    ("tarjama", "بلغات أخرى", "مجالس الذكر مترجمة (أردو – English)", ["مجالس الذكر أوردو", "Gatherings of Dhikr"]),
]
HASHTAG = {"مجالس": "majalis", "وصايا_عمرية": "wasaya", "وقفات": "waqafat", "قالت_المنابر": "manabir", "جوامع_الكلم": "jawami"}

pl_ids = {p["title"]: p["ids"] for p in src["playlists"]}
order, owner = {}, {}
for key, _, _, pls in SERIES:
    for pl in pls:
        for i, vid in enumerate(pl_ids.get(pl, [])):
            if vid not in owner:
                owner[vid] = key
                order[vid] = (pls.index(pl), i)


def clean(t, key):
    t = re.sub(r"\s*I\s*د\.?\s*راشد الهاجري\s*I.*$", "", t)
    m = re.match(r"^\s*(\d+)\s*#\s*جوامع[_\-\s]الكلم", t)
    if m:
        return f"الحلقة {int(m.group(1))}"
    m = re.search(r"\((.+)\)", t)
    if m:
        return m.group(1).strip()
    parts = [p.strip() for p in re.split(r"\s+I\s+|\|", t)]
    skip = ("راشد الهاجري", "خطبة جمعة", "الشيخ")
    keep = [p for p in parts if p and not p.startswith("#") and not any(s in p for s in skip)
            and p.replace("ّ", "") != "وذكر"]
    t = keep[0] if keep else parts[0]
    t = re.sub(r"#\S+", "", t)
    t = re.split(r"\s+الشيخ", t)[0]
    t = re.sub(r"^I|I$", "", t.strip()).strip(" -")
    return re.sub(r"\s{2,}", " ", t) or "مقطع"


PART = 480  # طول الجزء المستهدف بالثواني (8 دقائق)
videos = []
for v in src["videos"]:
    key = owner.get(v["id"])
    if not key:
        tag = (re.findall(r"#(\S+)", v["title"]) or [""])[0]
        key = HASHTAG.get(tag, "mawaez")
    d = int(v["duration"] or 0)
    n = max(2, round(d / PART)) if d >= 15 * 60 else 1
    videos.append({"id": v["id"], "t": clean(v["title"], key), "raw": v["title"], "d": d, "s": key, "n": n,
                   "o": order.get(v["id"], (9, 999))})

videos.sort(key=lambda x: (x["s"], x["o"]))
for x in videos:
    del x["o"]

series = [{"k": k, "name": n, "desc": ds, "count": sum(1 for v in videos if v["s"] == k)} for k, n, ds, _ in SERIES]
series = [s for s in series if s["count"]]
out = {"channel": "https://www.youtube.com/@Rashdalhajri", "series": series, "videos": videos,
       "total_hours": round(sum(v["d"] for v in videos) / 3600), "parts": sum(v["n"] for v in videos)}
(ROOT / "assets").mkdir(exist_ok=True)
(ROOT / "assets/data.js").write_text("window.DATA=" + json.dumps(out, ensure_ascii=False, separators=(",", ":")) + ";", encoding="utf-8")
print(len(videos), "videos,", out["parts"], "parts,", out["total_hours"], "hours")
for s in series:
    print(s["count"], s["name"])
