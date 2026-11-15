import re, os

active_files = [
    'index.html',
    'js/components/App.js',
    'js/main.js'
]

used = set()
for rel_path in active_files:
    if os.path.exists(rel_path):
        raw_text = open(rel_path).read()
        text = re.sub(r'\$\{.*?\}', '', raw_text)
        # Find class="..." and className: "..."
        for m in re.findall(r'(?:class|className)\s*[:=]\s*["\']([^"\'<>`]+)["\']', text):
            for cls in m.split():
                cls = cls.strip()
                if re.match(r'^[a-zA-Z][a-zA-Z0-9_-]+$', cls):
                    used.add(cls)

defined = set()
for root, dirs, files in os.walk('css'):
    for f in files:
        if f.endswith('.css'):
            text = open(os.path.join(root, f)).read()
            for m in re.findall(r'\.([a-zA-Z][a-zA-Z0-9_-]+)', text):
                defined.add(m)

missing = sorted([c for c in used if c not in defined and len(c) > 1])
print(f"Used: {len(used)}, Defined: {len(defined)}, Missing: {len(missing)}")
if missing:
    print("Missing classes in active game:")
    for c in missing:
        print("  ?", c)
    exit(1)
else:
    print("All CSS classes in active game files are defined!")
